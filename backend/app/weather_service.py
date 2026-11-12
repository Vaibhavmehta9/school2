"""Live campus weather and temperature service using Open-Meteo API.

Features:
- Campus Coordinates: Sherwood College, Ayarpatta, Nainital (Lat 29.3803, Lon 79.4534, ~2,084m elevation)
- Fetches on the server (never in the browser)
- 3-second strict timeout
- 10-minute in-memory cache
- Translates WMO weather codes to plain English words (clear, cloudy, rain, snow, fog...)
- Formats live context block with timestamp for prompt injection
- Graceful failure fallback (never guesses or invents temperatures)
"""

from __future__ import annotations

import logging
import re
import time
from datetime import datetime
from threading import Lock
from typing import Any
import zoneinfo
import httpx

logger = logging.getLogger("campus_weather")

CAMPUS_LATITUDE = 29.3803
CAMPUS_LONGITUDE = 79.4534
CACHE_TTL_SECONDS = 600  # 10 minutes cache

_cache_lock = Lock()
_cached_weather: dict[str, Any] | None = None
_cached_timestamp: float = 0.0

WMO_CODE_DESCRIPTIONS: dict[int, str] = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snowfall",
    73: "Moderate snowfall",
    75: "Heavy snowfall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}

WEATHER_KEYWORDS = [
    "weather", "temperature", "temp", "climate", "forecast",
    "mausam", "thand", "garmi", "sardi", "barish", "baarish",
    "cold", "hot", "rain", "rainy", "snow", "snowing", "sunny",
    "is it cold", "is it raining", "kitni thand", "kitna garam",
]


def is_weather_query(text: str) -> bool:
    """Detect whether a visitor query is asking about campus weather or temperature."""
    clean = re.sub(r"[^\w\s]", "", text.strip().lower())
    words = set(clean.split())
    if words.intersection({"weather", "temperature", "temp", "climate", "forecast", "mausam", "thand", "garmi", "sardi", "barish", "baarish"}):
        return True

    return any(keyword in clean for keyword in WEATHER_KEYWORDS)


def fetch_live_weather(force_refresh: bool = False) -> dict[str, Any] | None:
    """Fetch live weather for Sherwood College campus with 10-minute caching."""
    global _cached_weather, _cached_timestamp

    now = time.time()
    with _cache_lock:
        if not force_refresh and _cached_weather and (now - _cached_timestamp < CACHE_TTL_SECONDS):
            return _cached_weather

    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={CAMPUS_LATITUDE}&longitude={CAMPUS_LONGITUDE}"
        f"&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m"
        f"&daily=temperature_2m_max,temperature_2m_min"
        f"&timezone=Asia%2FKolkata"
    )

    try:
        with httpx.Client(timeout=3.0) as client:
            resp = client.get(url)
            if resp.status_code != 200:
                logger.error("Open-Meteo returned status %d", resp.status_code)
                return _cached_weather  # Return stale cache if available

            data = resp.json()
            current = data.get("current", {})
            daily = data.get("daily", {})

            temp_c = current.get("temperature_2m")
            apparent_c = current.get("apparent_temperature")
            weather_code = current.get("weather_code", 0)
            wind_kmh = current.get("wind_speed_10m")

            max_temps = daily.get("temperature_2m_max", [])
            min_temps = daily.get("temperature_2m_min", [])
            today_max = max_temps[0] if max_temps else None
            today_min = min_temps[0] if min_temps else None

            condition = WMO_CODE_DESCRIPTIONS.get(weather_code, "Partly cloudy")

            # Local Indian Standard Time
            ist_now = datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata")).strftime("%I:%M %p, %d %b %Y")

            weather_info = {
                "location": "Sherwood College, Ayarpatta, Nainital (~6,837 ft altitude)",
                "ist_time": ist_now,
                "temperature_c": temp_c,
                "apparent_temperature_c": apparent_c,
                "condition": condition,
                "wind_speed_kmh": wind_kmh,
                "today_min_c": today_min,
                "today_max_c": today_max,
            }

            with _cache_lock:
                _cached_weather = weather_info
                _cached_timestamp = now

            logger.info("Fetched live weather for Nainital: %s°C, %s", temp_c, condition)
            return weather_info
    except Exception as exc:
        logger.warning("Failed to fetch live weather from Open-Meteo: %s", exc)
        return _cached_weather


def format_weather_context_for_prompt() -> str:
    """Format live weather data for inclusion in the AI prompt instructions."""
    weather = fetch_live_weather()
    if not weather or weather.get("temperature_c") is None:
        return "LIVE CAMPUS WEATHER STATUS: Live weather data is currently unavailable. State that you cannot fetch live weather right now and offer to help with admissions questions. Never invent or guess temperatures."

    return (
        f"LIVE CAMPUS WEATHER DATA (Verified at {weather.get('ist_time')} IST):\n"
        f"- Location: {weather.get('location')}\n"
        f"- Current Temperature: {weather.get('temperature_c')}°C\n"
        f"- Feels Like (Apparent): {weather.get('apparent_temperature_c')}°C\n"
        f"- Current Condition: {weather.get('condition')}\n"
        f"- Wind Speed: {weather.get('wind_speed_kmh')} km/h\n"
        f"- Today's Expected Range: {weather.get('today_min_c')}°C (Min) to {weather.get('today_max_c')}°C (Max)\n\n"
        f"INSTRUCTION FOR WEATHER INQUIRIES:\n"
        f"Answer the visitor directly using these exact verified numbers in °C. "
        f"Mention that Sherwood College is situated at an elevation of 6,837 feet in the hills of Nainital. "
        f"If temperatures are cool (below 16°C), you may suggest visiting parents carry a light jacket or woolen layer."
    )
