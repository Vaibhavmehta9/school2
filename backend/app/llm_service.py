"""Google Gemini API integration service for Sherwood College AI Assistant.

Configured via environment variables:
- GEMINI_API_KEY
- GEMINI_MODEL (defaults to 'gemini-flash-lite-latest')
- GEMINI_FALLBACK_MODEL (defaults to 'gemini-flash-lite-latest')

Strict Prompt Guidelines for School Inquiries:
- Answer ONLY from retrieved canonical FAQ entries
- Quote numbers, dates, and tables exactly without calculations or hallucinations
- Never guess or calculate unstated totals or discounts
- If entries lack detail, provide the official admissions contact fallback
- Mirror user language (English, Hindi, Hinglish)
- Always end with ONE helpful follow-up suggestion
- Strict prompt injection and privacy defense
"""

from __future__ import annotations

import logging
import os
from collections.abc import Generator
from functools import lru_cache
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

# Load backend/.env for local development without overriding production server variables
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

logger = logging.getLogger("gemini_service")

# Do not hard-code older models like gemini-1.5-flash as they may be retired
DEFAULT_PRIMARY_MODEL = "gemini-flash-lite-latest"
DEFAULT_FALLBACK_MODEL = "gemini-flash-latest"

_validated_active_model: str | None = None
_model_validation_lock_performed = False

CONTACT_FALLBACK_TEXT = (
    "For official confirmation or specific queries, please contact the Sherwood College Admissions Office:\n"
    "- **Helpline**: +91 94583 07729 / +91 94563 16655\n"
    "- **Front Office**: +91-5942-236361\n"
    "- **Email**: contact@sherwood.edu.in\n"
    "- **Campus**: Ayarpatta, Nainital – 263002, Uttarakhand"
)


def get_gemini_api_key() -> str:
    """Return GEMINI_API_KEY from environment."""
    return os.getenv("GEMINI_API_KEY", "").strip()


def get_gemini_model_name() -> str:
    """Return configured GEMINI_MODEL name or validated active model."""
    global _validated_active_model
    if _validated_active_model:
        return _validated_active_model
    return os.getenv("GEMINI_MODEL", DEFAULT_PRIMARY_MODEL).strip() or DEFAULT_PRIMARY_MODEL


def get_gemini_fallback_model() -> str:
    """Return GEMINI_FALLBACK_MODEL name from environment."""
    return os.getenv("GEMINI_FALLBACK_MODEL", DEFAULT_FALLBACK_MODEL).strip() or DEFAULT_FALLBACK_MODEL


def is_gemini_configured() -> bool:
    """Check if Gemini API key is configured."""
    return bool(get_gemini_api_key())


@lru_cache(maxsize=1)
def _get_configured_client():
    """Lazily configure and cache google.generativeai client."""
    api_key = get_gemini_api_key()
    if not api_key:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        return genai
    except Exception as exc:
        logger.error("Failed to initialize Google Gemini client: %s", exc.__class__.__name__)
        return None


def validate_gemini_model() -> str | None:
    """Validate configured Gemini model at startup using genai.list_models() per Google API specs.
    
    References:
    - Official Google GenAI SDK: genai.list_models()
    - Documentation: https://ai.google.dev/api/models
    """
    global _validated_active_model, _model_validation_lock_performed
    if _model_validation_lock_performed and _validated_active_model:
        return _validated_active_model

    _model_validation_lock_performed = True
    genai = _get_configured_client()
    if not genai:
        logger.info("Gemini API key is not configured; skipping startup model validation.")
        return None

    configured_name = os.getenv("GEMINI_MODEL", DEFAULT_PRIMARY_MODEL).strip() or DEFAULT_PRIMARY_MODEL
    fallback_name = get_gemini_fallback_model()

    try:
        # SDK list_models call per official documentation
        available_models = [
            m.name.replace("models/", "")
            for m in genai.list_models()
            if hasattr(m, "supported_generation_methods") and "generateContent" in m.supported_generation_methods
        ]
        logger.info("Gemini SDK list_models discovered %d content generation models.", len(available_models))

        # Check if configured model is in available models
        target_model = configured_name.replace("models/", "")
        if target_model in available_models:
            _validated_active_model = target_model
            logger.info("Validated Gemini model '%s' is accessible.", _validated_active_model)
            return _validated_active_model

        # Configured model is unavailable or unrecognized
        logger.warning(
            "Configured GEMINI_MODEL '%s' is not in available models list (%s). Attempting fallback to '%s'...",
            configured_name,
            available_models[:5],
            fallback_name,
        )

        target_fallback = fallback_name.replace("models/", "")
        if target_fallback in available_models:
            _validated_active_model = target_fallback
            logger.info("Using validated GEMINI_FALLBACK_MODEL '%s'.", _validated_active_model)
            return _validated_active_model

        # Fallback to the first available content generation model
        if available_models:
            _validated_active_model = available_models[0]
            logger.warning(
                "Fallback model '%s' also unavailable. Selected first available model: '%s'.",
                fallback_name,
                _validated_active_model,
            )
            return _validated_active_model

    except Exception as exc:
        logger.warning("Could not query genai.list_models() during startup: %s. Using configured name.", exc.__class__.__name__)

    _validated_active_model = configured_name
    return _validated_active_model


def build_school_phrasing_prompt(faq_context: str, user_query: str, history_text: str = "") -> str:
    """Construct safe prompt instructing Gemini to phrase strictly from retrieved FAQ entries."""
    return f"""You are Sherwood AI, the official admissions assistant for Sherwood College, Nainital (Est. 1869).
Your role is to assist visitors, parents, and students with warm, honest, and accurate information about Sherwood College.

CANONICAL SCHOOL FACTS (SINGLE SOURCE OF TRUTH):
{faq_context}

{history_text}

USER INQUIRY:
{user_query}

STRICT TRUTHFULNESS & PHRASING INSTRUCTIONS:
1. Grounding: Answer ONLY from the canonical school facts provided above. Never use external memory or third-party sites for school facts.
2. No Superlatives or Guarantees: Never claim the school is "best", "no. 1", or "top". Never make guarantees like "100% results" or "guaranteed marks/placement".
3. School Comparisons: If asked "Is Sherwood better than X?" or compared to named schools (e.g. Doon, Welham, Woodstock), state politely that you do not rank schools, explain what Sherwood offers based on official facts, and suggest a campus visit.
4. Accuracy: Quote numbers, fee figures, and dates EXACTLY as written in the facts. Do not calculate unstated totals or discounts.
5. Alumni Mentions: Attribute notable people as "according to the school's official information".
6. Demo Data Note: If any retrieved fact contains a Demo data notice, include the existing demo disclaimer note: *(Demo data: please confirm details with the admissions office).*
7. Structure & Style:
   - Provide 3-5 short, factual bullet points.
   - Include one honest sentence of context (e.g. adaptation to boarding life, homesickness settling period).
   - End with a gentle next step (book a campus visit, contact admissions, or start application).
   - Tone: Warm, thoughtful, persuasive-yet-truthful. No walls of text.
8. Language: Reply in the language the visitor used — English, Hindi (Devanagari), or conversational Hinglish.
""".strip()


def build_general_education_prompt(user_query: str, history_text: str = "") -> str:
    """Construct prompt for general educational or parenting guidance not specific to Sherwood."""
    return f"""You are Sherwood AI, the admissions assistant for Sherwood College, Nainital.
The user is asking an objective general education or parenting question (e.g. how to choose a boarding school, how to prepare a child for entrance tests, or board curriculum differences like ICSE vs CBSE).

{history_text}

USER INQUIRY:
{user_query}

INSTRUCTIONS:
1. Provide objective, balanced, and practical general guidance (3-4 concise points).
2. Clearly frame this as general educational/parenting advice. Never mix it with unverified claims about Sherwood.
3. No pressure or superlatives.
4. Conclude by gently offering to explain Sherwood College's own process or campus environment if helpful.
5. Maintain a warm, scholarly, and supportive tone.
""".strip()


def build_general_knowledge_prompt(user_query: str, history_text: str = "") -> str:
    """Construct prompt for general knowledge or technical queries while maintaining Sherwood persona."""
    return f"""You are Sherwood AI, the virtual assistant for Sherwood College, Nainital.
While your primary specialty is Sherwood College admissions, you also assist students and visitors with general knowledge and academic inquiries.

{history_text}

USER INQUIRY:
{user_query}

INSTRUCTIONS:
1. Provide a concise, accurate, and educational answer.
2. Maintain a polite, scholarly, and supportive tone.
3. Never generate harmful, dangerous, or sensitive content.
4. If appropriate, gently remind the user that you are also available for any Sherwood College admission or campus questions.
""".strip()


def generate_gemini_reply(
    prompt: str,
    stream: bool = False,
    timeout_seconds: float = 25.0,
) -> str | Generator[str, None, None]:
    """Generate reply using Google Gemini API with timeout and sanitized error handling."""
    genai = _get_configured_client()
    if not genai:
        raise RuntimeError("AI service is not configured yet.")

    model_name = get_gemini_model_name()
    model = genai.GenerativeModel(model_name=model_name)

    if stream:
        def stream_gen() -> Generator[str, None, None]:
            try:
                response = model.generate_content(
                    prompt,
                    stream=True,
                    request_options={"timeout": timeout_seconds},
                )
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
            except Exception as exc:
                logger.error("Gemini stream generation error: %s", exc.__class__.__name__)
                raise RuntimeError("AI generation temporarily unavailable.") from None
        return stream_gen()

    try:
        response = model.generate_content(
            prompt,
            request_options={"timeout": timeout_seconds},
        )
        return (response.text or "").strip()
    except Exception as exc:
        logger.error("Gemini generate_content error: %s", exc.__class__.__name__)
        # Attempt fallback model if configured and different
        fallback_name = get_gemini_fallback_model()
        if fallback_name and fallback_name != model_name:
            try:
                logger.info("Attempting fallback Gemini model '%s'...", fallback_name)
                fallback_model = genai.GenerativeModel(model_name=fallback_name)
                response = fallback_model.generate_content(
                    prompt,
                    request_options={"timeout": timeout_seconds},
                )
                return (response.text or "").strip()
            except Exception as fb_exc:
                logger.error("Fallback Gemini generation also failed: %s", fb_exc.__class__.__name__)

        raise RuntimeError("AI generation temporarily unavailable.") from None
