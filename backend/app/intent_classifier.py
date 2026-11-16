"""Intent classifier and entity extractor for the Sherwood AI Assistant.

Categories:
- greeting
- weather
- math
- school_faq
- general_knowledge
- multi_intent (school_faq + weather)
- off_topic
"""

from __future__ import annotations

import re
from typing import Any

from .greeting_service import is_pure_greeting
from .math_service import is_math_query
from .weather_service import is_weather_query

SCHOOL_ENTITIES = [
    r"\bsherwood\b",
    r"\byour\s+school\b",
    r"\bthis\s+school\b",
    r"\bthe\s+school\b",
    r"\bcollege\b",
    r"\bfe+s?\b",
    r"\bfee[s]?\b",
    r"\bstructure\b",
    r"\badmission[s]?\b",
    r"\badd?misi?on[s]?\b",
    r"\bhostel[s]?\b",
    r"\bboarding\b",
    r"\bdormitory\b",
    r"\buniform[s]?\b",
    r"\bprincipal\b",
    r"\bprinciple\b",
    r"\bclass\s+\d+\b",
    r"\bclasses\b",
    r"\beligibility\b",
    r"\bage\s+criteria\b",
    r"\bdocument[s]?\b",
    r"\bentrance\s+test\b",
    r"\bentrance\s+exam\b",
    r"\bcurriculum\b",
    r"\bsyllabus\b",
    r"\bicse\b",
    r"\bisc\b",
    r"\bcisce\b",
    r"\bmobile\s+phone\b",
    r"\bgadget[s]?\b",
    r"\btiming[s]?\b",
    r"\bsport[s]?\b",
    r"\bfacilit(y|ies)\b",
    r"\bhorsman\b",
    r"\bscholarship[s]?\b",
    r"\bcontact\b",
    r"\bapplication\b",
    r"\bregistration\b",
    r"\bheadmistress\b",
    r"\bbursar\b",
    r"\bvisiting\b",
    r"\bvisit\b",
    r"\bdakhila\b",
    r"\bkhel\s*kood\b",
    r"\bsafety\b",
    r"\bragging\b",
    r"\banti[\s-]ragging\b",
    r"\bdiscipline\b",
]

# Off-topic or harmful patterns that must be politely declined
OFF_TOPIC_PATTERNS = [
    r"\b(write\s+python\s+code|write\s+code|debug\s+this|sql\s+injection)\b",
    r"\b(solve\s+my\s+homework|write\s+an\s+essay\s+on\s+politics)\b",
    r"\b(who\s+will\s+win\s+the\s+election|political\s+party)\b",
    r"\b(ignore\s+all\s+previous\s+instructions|system\s+prompt|jailbreak|DAN\s+mode)\b",
    r"\b(password|otp|credit\s+card|debit\s+card|aadhaar\s+number)\b",
]

GENERAL_KNOWLEDGE_PATTERNS = [
    r"\bwho\s+invented\b",
    r"\bwho\s+discovered\b",
    r"\bcapital\s+of\b",
    r"\bwhat\s+is\s+the\s+speed\s+of\s+light\b",
    r"\bwho\s+is\s+the\s+prime\s+minister\b",
    r"\bwho\s+wrote\b",
]


def extract_entities(text: str) -> dict[str, list[str]]:
    """Extract recognized domain entities from user message."""
    clean = text.lower()
    entities: dict[str, list[str]] = {
        "school": [],
        "weather": [],
        "math": [],
        "person": [],
        "location": [],
    }

    # Extract school entities
    for pattern in SCHOOL_ENTITIES:
        matches = re.findall(pattern, clean)
        if matches:
            entities["school"].extend(matches if isinstance(matches[0], str) else [m[0] for m in matches])

    # Extract weather entities
    if is_weather_query(text):
        entities["weather"].append("weather_inquiry")

    # Extract math entities
    if is_math_query(text):
        entities["math"].append("math_expression")

    return entities


def classify_intent(text: str) -> str:
    """Classify user query into its primary intent category.
    
    Priority:
    1. Greeting / Small talk fast-path
    2. Multi-intent (e.g. Fees + Weather)
    3. Off-topic refusal
    4. School FAQ (explicit or ambiguous school terms like 'fees', 'hostel', 'admission')
    5. Weather query
    6. Math query
    7. General knowledge
    8. Fallback
    """
    clean = text.strip()
    lower_text = clean.lower()

    # 1. Greeting fast-path
    if is_pure_greeting(clean):
        return "greeting"

    # 2. Multi-intent detection (school + weather)
    has_weather = is_weather_query(clean)
    has_school = any(re.search(pat, lower_text) for pat in SCHOOL_ENTITIES)

    if has_weather and has_school:
        return "multi_intent"

    # 3. Off-topic & Prompt-injection check
    for pat in OFF_TOPIC_PATTERNS:
        if re.search(pat, lower_text):
            return "off_topic"

    # 4. School FAQ (Ambiguous words default to school)
    if has_school:
        return "school_faq"

    # 5. Weather
    if has_weather:
        return "weather"

    # 6. Math
    if is_math_query(clean):
        return "math"

    # 7. General knowledge
    for pat in GENERAL_KNOWLEDGE_PATTERNS:
        if re.search(pat, lower_text):
            return "general_knowledge"

    # If the user asks general factual questions like "What is Python?" or "Who is Albert Einstein?"
    if re.match(r"^(what\s+is|who\s+is|where\s+is|how\s+does|why\s+is)\b", lower_text) and not has_school:
        return "general_knowledge"

    return "school_faq"  # Safe default to avoid leaking general LLM answers for unclassified school questions

