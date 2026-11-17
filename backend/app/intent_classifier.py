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
    r"\bphone\s+call[s]?\b",
    r"\bcalling\b",
    r"\bparents\b",
    r"\bhomesick(ness)?\b",
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
    r"\bteacher[s]?\b",
    r"\bfaculty\b",
    r"\bclass\s+size\b",
    r"\bstudent[s]?\b",
    r"\bpastoral\b",
]

SCHOOL_COMPARE_PATTERNS = [
    r"\b(is\s+sherwood\s+)?better\s+than\b",
    r"\b(sherwood|college)\s+vs\s+[a-z0-9_-]+\b",
    r"\bvs\s+(doon|welham|woodstock|mayo|scindia|sanawar|dps|gd\s*goenka)\b",
    r"\b(doon|welham|woodstock|mayo|scindia|sanawar)\s+school\b",
    r"\b(best|no\.?\s*1|top)\s+boarding\s+school\b",
    r"\brank\s+(sherwood|schools?)\b",
    r"\bwhich\s+is\s+better\s+sherwood\b",
]

SCHOOL_VALUE_PATTERNS = [
    r"\bwhy\s+(should\s+i\s+|to\s+)?(join|choose|pick)\s+(sherwood|this\s+school|your\s+school)\b",
    r"\bwhat\s+makes\s+(sherwood|this\s+school)\s+(different|unique|special)\b",
    r"\bbenefits\s+of\s+(studying\s+at\s+)?sherwood\b",
    r"\bwhy\s+sherwood(\s+college)?\b",
    r"\bsherwood\s+(college\s+)?kyu\s+(choose|join|le)\b",
    r"\bsherwood\s+mein\s+admission\s+lene\s+ke\s+(fayde|kya\s+fayde)\b",
    r"\bwhy\s+should\s+we\s+send\s+our\s+child\s+to\s+sherwood\b",
]

SCHOOL_FIT_PATTERNS = [
    r"\b(is\s+sherwood\s+)?right\s+for\s+my\s+child\b",
    r"\bwho\s+thrives\s+(here|at\s+sherwood)\b",
    r"\bwhat\s+kind\s+of\s+student\s+(fits|thrives)\b",
    r"\b(shy|introvert|quiet|sensitive)\s+child\b",
    r"\b(kya\s+mera\s+baccha|mera\s+baccha)\s+(yaha\s+)?adjust\s+ho\s+payega\b",
    r"\bsuitable\s+for\s+(a\s+)?(shy|quiet|my)\s+child\b",
    r"\bwill\s+my\s+child\s+(adjust|fit\s+in)\b",
]

PARENT_CONCERNS_PATTERNS = [
    r"\b(homesick|homesickness|miss\s+home|ghar\s+ki\s+yaad)\b",
    r"\b(phone\s+calls?|call\s+my\s+child|calling\s+rules|calling\s+slots|schedule\s+for\s+(phone\s+)?calls|talk\s+to\s+parents|parent\s+communication)\b",
    r"\b(visiting\s+rules|visit\s+my\s+child|when\s+can\s+parents\s+visit)\b",
    r"\b(how\s+safe|safety\s+of|medical\s+care|emergency\s+doctor|hospital\s+on\s+campus)\b",
    r"\b(mess\s+food|dining\s+hall|vegetarian\s+food|what\s+food\s+is\s+served|cater\s+to\s+dietary)\b",
    r"\b(will\s+my\s+child\s+get\s+100%|guarantee\s+marks|100%\s+marks)\b",
]

GENERAL_EDUCATION_PATTERNS = [
    r"\bhow\s+(do\s+i|to)\s+choose\s+a\s+boarding\s+school\b",
    r"\bchecklist\s+for\s+(choosing\s+a\s+)?boarding\s+school\b",
    r"\bhow\s+(can\s+my\s+child\s+|to\s+)?prepare\s+for\s+(the\s+|an\s+)?entrance\s+test\b",
    r"\bhow\s+to\s+prepare\s+for\s+entrance\s+exam\b",
    r"\bwhat\s+is\s+icse(\s+board|\s+curriculum)?\b",
    r"\bicse\s+vs\s+cbse\b",
    r"\bwhy\s+(choose\s+a\s+)?boarding\s+school\b",
    r"\bat\s+what\s+age\s+should\s+a\s+child\s+go\s+to\s+boarding\b",
]

# Off-topic or harmful patterns that must be politely declined
OFF_TOPIC_PATTERNS = [
    r"\b(write\s+python\s+code|write\s+code|debug\s+this|sql\s+injection|web\s+scraping)\b",
    r"\b(solve\s+my\s+homework|write\s+an\s+essay|write\s+a\s+poem|write\s+a\s+story)\b",
    r"\b(who\s+will\s+win\s+the\s+election|political\s+party)\b",
    r"\b(ignore\s+.*instructions|system\s+prompt|jailbreak|\bdan\b)\b",
    r"\b(password|otp|credit\s+card|debit\s+card|aadhaar\s+number|personal\s+phone\s+number|private\s+home\s+address)\b",
]

GENERAL_KNOWLEDGE_PATTERNS = [
    r"\bwho\s+invented\b",
    r"\bwho\s+discovered\b",
    r"\bwho\s+won\b",
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

    # 4. Specialized School Intents (Value, Fit, Comparison, Concerns, General Education)
    for pat in SCHOOL_COMPARE_PATTERNS:
        if re.search(pat, lower_text):
            return "school_compare"

    for pat in SCHOOL_VALUE_PATTERNS:
        if re.search(pat, lower_text):
            return "school_value"

    for pat in SCHOOL_FIT_PATTERNS:
        if re.search(pat, lower_text):
            return "school_fit"

    for pat in PARENT_CONCERNS_PATTERNS:
        if re.search(pat, lower_text):
            return "parent_concerns"

    for pat in GENERAL_EDUCATION_PATTERNS:
        if re.search(pat, lower_text):
            return "general_education"

    # 4. Explicit General Knowledge patterns (e.g. 'who invented', 'who won', 'capital of')
    if not re.search(r"\bsherwood\b", lower_text):
        for pat in GENERAL_KNOWLEDGE_PATTERNS:
            if re.search(pat, lower_text):
                return "general_knowledge"

    # 5. Standard School FAQ (Ambiguous words default to school)
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

