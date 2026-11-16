"""Central Query Router for Sherwood College AI Assistant.

Implements the 6-tier routing table:
1. Greetings / Small talk fast-path (0 tokens, <5ms)
2. Multi-intent resolution (School FAQ + Live Weather)
3. School Admissions FAQ (High -> Canonical Answer; Medium -> Answer + Clarification; Low -> Admissions fallback)
4. Live Campus / City Weather (Open-Meteo with 10-minute cache)
5. Math calculation (Deterministic AST evaluator)
6. General knowledge / Fallback (via Google Gemini API or structured fallback)
"""

from __future__ import annotations

import logging
import re
from typing import Any

from .conversation_manager import (
    CAMPUS_LOCATION,
    extract_city_from_text,
    resolve_active_city_from_history,
    resolve_contextual_query,
    sanitize_history,
)
from .faq_service import get_safe_answer
from .greeting_service import get_canned_greeting_reply
from .intent_classifier import classify_intent, extract_entities
from .llm_service import (
    CONTACT_FALLBACK_TEXT,
    build_general_knowledge_prompt,
    build_school_phrasing_prompt,
    generate_gemini_reply,
    is_gemini_configured,
)
from .math_service import format_math_reply, is_math_query
from .nlp_engine import get_best_faq_match, retrieve_faq_candidates
from .weather_service import (
    fetch_live_weather,
    get_live_weather_answer,
    get_weather_answer,
    is_weather_query,
)

logger = logging.getLogger("query_router")

DEFAULT_SUGGESTED_CHIPS = [
    "What are the fees?",
    "How do I apply?",
    "Documents required",
    "Boarding routine",
    "Weather at campus",
]


def _format_clarifying_followup(category: str) -> str:
    """Generate helpful follow-up prompt for medium-confidence matches."""
    cat_lower = category.lower()
    if "fee" in cat_lower:
        return "\n\n*Would you like more details regarding the boarding charges, caution deposit, or term payment schedule?*"
    if "admission" in cat_lower or "eligibility" in cat_lower:
        return "\n\n*Would you like to know the exact age criteria or documents required for your child's class?*"
    if "boarding" in cat_lower or "hostel" in cat_lower:
        return "\n\n*Would you like details on dormitory facilities, medical care, or dining arrangements?*"
    return "\n\n*Would you like more information about the admission process or campus facilities?*"


def route_and_resolve_query(
    user_query: str,
    history: list[dict[str, Any]] | None = None,
    audience: str = "guest",
) -> dict[str, Any]:
    """Execute prioritized routing table and return comprehensive response payload.
    
    Returns:
    {
        "answer": str,
        "model": str,
        "intent": str,
        "matched_faq_id": str | None,
        "confidence_level": "HIGH" | "MEDIUM" | "LOW",
        "is_demo": bool,
        "chips": list[str],
    }
    """
    clean_raw = user_query.strip()
    sanitized_history = sanitize_history(history)

    # 1. Contextual pronoun and follow-up resolution ("and for boarding?", "how is it paid?", "there")
    contextual_query, context_meta = resolve_contextual_query(clean_raw, sanitized_history)

    # 2. Intent Classification
    intent = classify_intent(contextual_query)

    # Fast-Path 1: Greetings & Small Talk
    if intent == "greeting":
        greeting_res = get_canned_greeting_reply(clean_raw, history=sanitized_history)
        if greeting_res:
            answer, chips = greeting_res
            return {
                "answer": answer,
                "model": "canned-greeting",
                "intent": "greeting",
                "matched_faq_id": "greeting_fast_path",
                "confidence_level": "HIGH",
                "is_demo": False,
                "chips": chips,
            }

    # Fast-Path 2: Math Calculator
    if intent == "math":
        math_reply = format_math_reply(clean_raw)
        if math_reply:
            return {
                "answer": math_reply,
                "model": "math-evaluator",
                "intent": "math",
                "matched_faq_id": "math_engine",
                "confidence_level": "HIGH",
                "is_demo": False,
                "chips": DEFAULT_SUGGESTED_CHIPS[:3],
            }

    # Fast-Path 3: Multi-Intent (School FAQ + Weather)
    if intent == "multi_intent":
        matched_entry, score, level = get_best_faq_match(contextual_query)
        faq_text = get_safe_answer(matched_entry) if matched_entry else "Please contact admissions for details."
        is_demo = bool(matched_entry and (matched_entry.get("demo") or matched_entry.get("source") == "demo"))
        weather_text = get_live_weather_answer()

        combined_answer = (
            f"### Admissions & School Information\n{faq_text}\n\n"
            f"---\n\n"
            f"### Live Campus Weather\n{weather_text}"
        )
        return {
            "answer": combined_answer,
            "model": "multi-intent-router",
            "intent": "multi_intent",
            "matched_faq_id": matched_entry.get("id") if matched_entry else "multi_intent",
            "confidence_level": level,
            "is_demo": is_demo,
            "chips": ["What documents are required?", "How do I apply?"],
        }

    # Fast-Path 4: Live Weather
    if intent == "weather":
        city = extract_city_from_text(contextual_query) or context_meta.get("resolved_city") or CAMPUS_LOCATION["city"]
        is_tomorrow = bool(re.search(r"\b(tomorrow|kal)\b", contextual_query.lower()))
        weather_answer = get_weather_answer(city_name=city, is_tomorrow=is_tomorrow)
        return {
            "answer": weather_answer,
            "model": "open-meteo-live",
            "intent": "weather",
            "matched_faq_id": "live_weather_service",
            "confidence_level": "HIGH",
            "is_demo": False,
            "chips": ["What are the fees?", "How do I apply?", "Campus tour"],
        }

    # Path 5: School FAQ Retrieval
    if intent == "school_faq":
        matched_entry, score, level = get_best_faq_match(contextual_query)

        # Check if match was found
        if matched_entry and level in ("HIGH", "MEDIUM"):
            is_demo = bool(matched_entry.get("demo", False) or matched_entry.get("source") == "demo")
            raw_answer = get_safe_answer(matched_entry)

            # If Gemini is configured, use it for phrasing while strictly grounded in the FAQ
            if is_gemini_configured():
                try:
                    candidates = retrieve_faq_candidates(contextual_query, top_k=3)
                    faq_block = "\n\n".join(
                        f"### [{c['entry'].get('category')}] ({c['entry'].get('id')})\n{get_safe_answer(c['entry'])}"
                        for c in candidates
                    )
                    prompt = build_school_phrasing_prompt(faq_block, clean_raw)
                    phrased = generate_gemini_reply(prompt, stream=False)
                    if isinstance(phrased, str) and phrased.strip():
                        return {
                            "answer": phrased,
                            "model": "gemini-phrased",
                            "intent": "school_faq",
                            "matched_faq_id": matched_entry["id"],
                            "confidence_level": level,
                            "is_demo": is_demo,
                            "chips": DEFAULT_SUGGESTED_CHIPS[:4],
                        }
                except Exception as exc:
                    logger.warning("Gemini phrasing fallback to canonical FAQ: %s", exc)

            # Direct Canonical FAQ reply (Deterministic, ultra-fast)
            final_answer = raw_answer
            if level == "MEDIUM":
                final_answer += _format_clarifying_followup(matched_entry.get("category", ""))

            return {
                "answer": final_answer,
                "model": "faq-canonical",
                "intent": "school_faq",
                "matched_faq_id": matched_entry["id"],
                "confidence_level": level,
                "is_demo": is_demo,
                "chips": DEFAULT_SUGGESTED_CHIPS[:4],
            }

        # LOW confidence: Never hallucinate or answer school inquiries from external LLM weights
        fallback_msg = (
            "I do not have specific details for that in our current admissions documentation. "
            "The Sherwood College Admissions Office will confirm that detail directly:\n\n"
            f"{CONTACT_FALLBACK_TEXT}"
        )
        return {
            "answer": fallback_msg,
            "model": "faq-fallback",
            "intent": "school_faq",
            "matched_faq_id": None,
            "confidence_level": "LOW",
            "is_demo": False,
            "chips": ["What are the fees?", "How do I apply?", "Documents required"],
        }

    # Path 6: General Knowledge (via Gemini if configured, or polite educational decline)
    if intent == "general_knowledge":
        if is_gemini_configured():
            try:
                gk_prompt = build_general_knowledge_prompt(clean_raw)
                gk_reply = generate_gemini_reply(gk_prompt, stream=False)
                if isinstance(gk_reply, str) and gk_reply.strip():
                    return {
                        "answer": gk_reply,
                        "model": "gemini-general-knowledge",
                        "intent": "general_knowledge",
                        "matched_faq_id": None,
                        "confidence_level": "HIGH",
                        "is_demo": False,
                        "chips": ["What are the fees?", "How do I apply?"],
                    }
            except Exception as exc:
                logger.warning("Gemini GK call failed: %s", exc)

        return {
            "answer": (
                "I am Sherwood AI, the dedicated virtual assistant for Sherwood College, Nainital. "
                "I specialize in answering questions about admissions, fees, boarding life, and campus facilities. "
                "How may I assist you with your school inquiry?"
            ),
            "model": "sherwood-persona-guard",
            "intent": "general_knowledge",
            "matched_faq_id": None,
            "confidence_level": "MEDIUM",
            "is_demo": False,
            "chips": DEFAULT_SUGGESTED_CHIPS[:4],
        }

    # Off-topic / Guardrail refusal
    return {
        "answer": (
            "I am Sherwood AI, dedicated exclusively to assisting parents, visitors, and students with "
            "Sherwood College admissions, school procedures, and campus information. "
            "I cannot assist with external coding tasks, sensitive personal data, or unrelated queries. "
            "Please feel free to ask about fees, eligibility, or life at Sherwood!"
        ),
        "model": "guardrail-refusal",
        "intent": "off_topic",
        "matched_faq_id": None,
        "confidence_level": "HIGH",
        "is_demo": False,
        "chips": DEFAULT_SUGGESTED_CHIPS[:3],
    }

