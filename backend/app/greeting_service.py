"""Fast-path handler for greetings, small talk, and pleasantries.

Detects conversational greetings without invoking external OpenAI API calls,
preserving rate limits and returning instant, dignified responses with suggestion chips.
Substantive questions (e.g. "Hi, what are the fees?") are explicitly exempted and
routed to the canonical FAQ / AI pipeline.
"""

from __future__ import annotations

import re
from typing import Any

DEFAULT_SUGGESTION_CHIPS = [
    "Fee Structure",
    "How to Apply",
    "Required Documents",
]

# Substantive keywords indicating the query is an actual school question, not just small talk
SUBSTANTIVE_KEYWORDS = {
    "fee", "fees", "cost", "charge", "charges", "rupee", "rupees", "lakh", "lakhs",
    "admission", "admissions", "apply", "applying", "registration", "register",
    "class", "classes", "grade", "grades", "seat", "seats", "age", "birth", "cutoff",
    "document", "documents", "aadhaar", "marksheet", "transfer", "certificate", "tc",
    "test", "exam", "syllabus", "paper", "principal", "interview", "interaction",
    "hostel", "boarding", "dorm", "dormitory", "mess", "food", "meal", "meals", "tuck",
    "phone", "mobile", "gadget", "laptop", "smartwatch", "calling", "leave", "exeat",
    "doctor", "hospital", "infirmary", "medical", "sport", "sports", "coach", "coaching",
    "uniform", "book", "books", "weather", "temperature", "mausam", "thand", "garmi",
    "schedule", "timing", "timings", "transport", "bus", "visit", "campus", "location",
    "where", "when", "how much", "kitna", "kya", "kab", "kaise", "kahan", "kaun",
}

GREETING_WORDS = {
    "hi", "hello", "hey", "helo", "hii", "hiii", "heyy", "heya",
    "namaste", "namaskar", "pranam", "greetings",
    "good morning", "good afternoon", "good evening", "good day",
}

HOW_ARE_YOU_PHRASES = [
    "how are you", "how are you doing", "how r u", "how do you do",
    "kya haal hai", "kaise ho", "kaise hain aap", "sab theek",
]

WHO_ARE_YOU_PHRASES = [
    "who are you", "what are you", "what can you do", "who made you",
    "help", "what do you do", "aap kaun ho", "kya kar sakte ho", "intro",
]

THANKS_PHRASES = [
    "thanks", "thank you", "thank u", "thx", "many thanks", "thank you so much",
    "dhanyawad", "shukriya", "appreciate it", "great thanks",
]

ACK_PHRASES = [
    "ok", "okay", "okk", "k", "theek hai", "thik hai", "got it", "understood", "sure", "alright",
]

FAREWELL_PHRASES = [
    "bye", "goodbye", "good bye", "see you", "alvida", "good night", "tata",
]


def clean_text_for_matching(text: str) -> str:
    """Strip leading/trailing whitespace and punctuation."""
    return re.sub(r"[^\w\s]", "", text.strip().lower())


def contains_substantive_inquiry(clean_text: str) -> bool:
    """Check if the text contains any substantive keywords requiring FAQ/AI resolution."""
    words = set(clean_text.split())
    if words.intersection(SUBSTANTIVE_KEYWORDS):
        return True

    # Check for combined phrases like "how much", "kitni fees", etc.
    phrases = ["how much", "how to apply", "kitni fees", "kya rules", "admission date"]
    return any(p in clean_text for p in phrases)


def get_canned_greeting_reply(
    message: str,
    history: list[dict[str, Any]] | None = None,
) -> tuple[str, list[str]] | None:
    """Analyze visitor input.
    
    If it is a greeting, pleasantry, or small-talk query, returns (reply_text, chips).
    If it contains any substantive question or is not small talk, returns None.
    """
    if not message or not isinstance(message, str):
        return None

    raw = message.strip()
    clean = clean_text_for_matching(raw)
    if not clean:
        return None

    # Strict guard: If there are substantive topic keywords, route to FAQ/AI
    if contains_substantive_inquiry(clean):
        return None

    has_history = bool(history and len(history) > 0)

    # 1. Greetings
    if clean in GREETING_WORDS:
        if not has_history:
            reply = (
                "Hello! Welcome to Sherwood College, Nainital. I am **Sherwood AI**, your official "
                "virtual admissions assistant.\n\n"
                "I am here to assist prospective parents with **2027–28 admissions**, fee structures, "
                "age criteria, required documents, online entrance tests, and residential campus life.\n\n"
                "How may I assist your family today?"
            )
        else:
            reply = (
                "Hello again! How can I assist you with Sherwood College admissions or campus life? "
                "Feel free to ask any question or select a topic below."
            )
        return reply, DEFAULT_SUGGESTION_CHIPS

    # 2. How are you
    if any(phrase in clean for phrase in HOW_ARE_YOU_PHRASES):
        reply = (
            "I am doing very well, thank you for asking! I'm ready to help you explore everything "
            "about Sherwood College admissions, academic programs, and boarding facilities.\n\n"
            "What would you like to know today?"
        )
        return reply, DEFAULT_SUGGESTION_CHIPS

    # 3. Who are you / What can you do
    if any(phrase in clean for phrase in WHO_ARE_YOU_PHRASES):
        reply = (
            "I am **Sherwood AI**, the official virtual admissions desk for **Sherwood College, Nainital**.\n\n"
            "I can assist you with:\n"
            "- **Admissions & Eligibility**: Classes offered (Classes 3 to 9 and 11) and birth-year cutoffs\n"
            "- **Fee Structure**: Annual charges (~₹7.5 Lakh to ₹8.0 Lakh) and term payment schedules\n"
            "- **Entrance Examinations**: Online test format (English & Math) and Principal's interaction\n"
            "- **Residential Life**: Dormitories, pastoral supervision, dining, healthcare, and discipline\n"
            "- **Policies**: Strict gadget ban, calling hours, and local guardian requirements\n\n"
            "How can I help you today?"
        )
        return reply, ["Fee Structure", "Age Criteria", "How to Apply"]

    # 4. Thank you
    if any(phrase in clean for phrase in THANKS_PHRASES):
        reply = (
            "You are most welcome! Please feel free to ask whenever you need further details about "
            "Sherwood College. Wishing your child the very best in their educational journey!"
        )
        return reply, ["Fee Structure", "Boarding Facilities", "Campus Visit"]

    # 5. Acknowledgments (ok, sure, alright)
    if clean in ACK_PHRASES:
        reply = (
            "Understood! Please let me know whenever you'd like more information on admissions, "
            "curriculum, or life at Sherwood College."
        )
        return reply, DEFAULT_SUGGESTION_CHIPS

    # 6. Farewells
    if any(phrase in clean for phrase in FAREWELL_PHRASES):
        reply = (
            "Goodbye! Thank you for connecting with Sherwood College, Nainital. "
            "Please visit our admissions portal anytime or contact the admissions office if you need further guidance. Have a wonderful day!"
        )
        return reply, ["Admissions Desk", "Homepage"]

    return None

