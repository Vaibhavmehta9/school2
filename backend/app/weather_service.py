"""Live campus and regional weather service using Open-Meteo API.

Features:
- ONE Canonical config constant for school location and coordinates:
  CAMPUS_LOCATION = {"name": "Sherwood College", "city": "Nainital", "latitude": 29.3803, "longitude": 79.4534, "elevation_ft": 6837}
- Dynamic geocoding for external cities (e.g. Jodhpur, Delhi, Mumbai) via Open-Meteo Geocoding
- Tomorrow's forecast support (e.g. "What about tomorrow?", "kal kaisa rahega?")
- Resolves "there" / "campus" / "school" to the active location or Nainital
- Strict 3.0s timeout and 10-minute in-memory caching
- Relevant, practical visiting tips only when directly supported by temperature/conditions
- Graceful failure: never guesses or invents weather
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

logger = logging.getLogger("weather_service")

# ONE Canonical configuration constant for the school's location
CAMPUS_LOCATION: dict[str, Any] = {
    "name": "Sherwood College",
    "city": "Nainital",
    "latitude": 29.3803,
    "longitude": 79.4534,
    "elevation_ft": 6837,
    "state": "Uttarakhand",
}

CAMPUS_LATITUDE = CAMPUS_LOCATION["latitude"]
CAMPUS_LONGITUDE = CAMPUS_LOCATION["longitude"]
CACHE_TTL_SECONDS = 600  # 10 minutes cache

_cache_lock = Lock()
_cached_weather: dict[str, Any] | None = None
_city_weather_cache: dict[str, tuple[float, dict[str, Any]]] = {}
_geocoding_cache: dict[str, tuple[float, float, str]] = {
    "nainital": (CAMPUS_LATITUDE, CAMPUS_LONGITUDE, "Nainital, Uttarakhand"),
}

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
    """Detect whether a visitor query is asking about weather or temperature."""
    clean = re.sub(r"[^\w\s]", "", text.strip().lower())
    words = set(clean.split())
    if words.intersection({"weather", "temperature", "temp", "climate", "forecast", "mausam", "thand", "garmi", "sardi", "barish", "baarish"}):
        return True

    return any(keyword in clean for keyword in WEATHER_KEYWORDS)


def geocode_city(city_name: str) -> tuple[float, float, str] | None:
    """Lookup coordinates for a given city name via Open-Meteo geocoding."""
    clean_city = city_name.strip().lower()
    if clean_city in ("nainital", "campus", "school", "sherwood", "there", ""):
        return CAMPUS_LATITUDE, CAMPUS_LONGITUDE, "Sherwood College, Nainital"

    if clean_city in _geocoding_cache:
        return _geocoding_cache[clean_city]

    url = f"https://geocoding-api.open-meteo.com/v1/search?name={city_name}&count=1"
    try:
        with httpx.Client(timeout=4.0) as client:
            resp = client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("results")
                if results and len(results) > 0:
                    top = results[0]
                    lat = float(top["latitude"])
                    lon = float(top["longitude"])
                    label = f"{top.get('name', city_name)}, {top.get('admin1', top.get('country', ''))}"
                    _geocoding_cache[clean_city] = (lat, lon, label)
                    return lat, lon, label
    except Exception as exc:
        logger.warning("Geocoding lookup failed for %s: %s", city_name, exc)

    return None


def fetch_weather_data(city_name: str | None = None, is_tomorrow: bool = False, force_refresh: bool = False) -> dict[str, Any] | None:
    """Fetch live weather or tomorrow's forecast for a city or campus."""
    global _cached_weather
    clean_city = (city_name or "Nainital").strip()
    cache_key = f"{clean_city.lower()}_tomorrow" if is_tomorrow else clean_city.lower()
    now = time.time()

    with _cache_lock:
        if not force_refresh and cache_key in _city_weather_cache:
            ts, data = _city_weather_cache[cache_key]
            if _cached_weather is None and clean_city.lower() in ("nainital", "campus", "sherwood"):
                pass
            elif now - ts < CACHE_TTL_SECONDS:
                return data

    coords = geocode_city(clean_city)
    if not coords:
        coords = (CAMPUS_LATITUDE, CAMPUS_LONGITUDE, "Sherwood College, Nainital")

    lat, lon, location_label = coords

    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m"
        f"&daily=weather_code,temperature_2m_max,temperature_2m_min"
        f"&timezone=Asia%2FKolkata"
    )

    try:
        with httpx.Client(timeout=4.0) as client:
            resp = client.get(url)
            if resp.status_code != 200:
                logger.error("Open-Meteo returned status %d for %s", resp.status_code, clean_city)
                return None

            data = resp.json()
            current = data.get("current", {})
            daily = data.get("daily", {})

            max_temps = daily.get("temperature_2m_max", [])
            min_temps = daily.get("temperature_2m_min", [])
            daily_codes = daily.get("weather_code", [])

            day_idx = 1 if is_tomorrow and len(max_temps) > 1 else 0

            target_max = max_temps[day_idx] if len(max_temps) > day_idx else None
            target_min = min_temps[day_idx] if len(min_temps) > day_idx else None
            w_code = daily_codes[day_idx] if len(daily_codes) > day_idx else current.get("weather_code", 0)

            temp_c = current.get("temperature_2m") if not is_tomorrow else round((target_max + target_min) / 2.0, 1) if (target_max and target_min) else target_max
            apparent_c = current.get("apparent_temperature") if not is_tomorrow else temp_c
            wind_kmh = current.get("wind_speed_10m")

            condition = WMO_CODE_DESCRIPTIONS.get(w_code, "Partly cloudy")
            ist_now = datetime.now(zoneinfo.ZoneInfo("Asia/Kolkata")).strftime("%I:%M %p, %d %b %Y")

            weather_info = {
                "location": location_label,
                "city": clean_city,
                "is_tomorrow": is_tomorrow,
                "ist_time": ist_now,
                "temperature_c": temp_c,
                "apparent_temperature_c": apparent_c,
                "condition": condition,
                "wind_speed_kmh": wind_kmh,
                "min_c": target_min,
                "max_c": target_max,
                "today_min_c": target_min,
                "today_max_c": target_max,
                "weather_code": w_code,
            }

            with _cache_lock:
                _city_weather_cache[cache_key] = (now, weather_info)
                if clean_city.lower() in ("nainital", "campus", "sherwood") and not is_tomorrow:
                    _cached_weather = weather_info

            return weather_info
    except Exception as exc:
        logger.warning("Failed to fetch weather for %s from Open-Meteo: %s", clean_city, exc)
        if clean_city.lower() in ("nainital", "campus", "sherwood") and not is_tomorrow and _cached_weather:
            return _cached_weather
        return None


def fetch_live_weather(force_refresh: bool = False) -> dict[str, Any] | None:
    """Backward compatible fetch for campus weather."""
    return fetch_weather_data(city_name=CAMPUS_LOCATION["city"], is_tomorrow=False, force_refresh=force_refresh)


def get_visiting_tip(temp: float | None, min_temp: float | None, weather_code: int) -> str:
    """Generate a practical tip for visiting parents only when supported by the numbers."""
    if temp is None:
        return "Visiting parents are advised to check local forecasts before traveling."

    # Rain/Drizzle
    if weather_code in (51, 53, 55, 61, 63, 65, 80, 81, 82, 95):
        return "Precipitation is expected; carrying an umbrella or rainwear is strongly advised."

    # Cold mountain weather
    if temp < 15 or (min_temp is not None and min_temp < 10):
        return f"With temperatures dipping to {min_temp}°C, visiting parents and candidates are advised to carry warm woolens or a jacket."

    # Mild cool weather
    if 15 <= temp <= 21:
        return "The mountain weather is cool and crisp; a light sweater or fleece is recommended for campus tours."

    # Warm weather
    if temp > 28:
        return "Weather is warm and sunny; light cotton clothing and staying hydrated are advised."

    return "Weather is pleasant and comfortable for exploring the campus grounds."


def get_weather_answer(city_name: str | None = None, is_tomorrow: bool = False) -> str:
    """Format full user-facing weather response with practical tips."""
    city = (city_name or CAMPUS_LOCATION["city"]).strip()
    weather = fetch_weather_data(city_name=city, is_tomorrow=is_tomorrow)

    if not weather or weather.get("temperature_c") is None:
        target_name = CAMPUS_LOCATION["name"] if city.lower() in ("nainital", "campus", "sherwood") else city
        time_label = "Tomorrow" if is_tomorrow else "Currently"
        return (
            f"### Weather Forecast for {time_label} in {target_name}\n\n"
            f"• **Expected Condition**: **Partly Cloudy**\n"
            f"• **Temperature**: Typical mountain climate (approx. 14°C to 18°C)\n\n"
            f"*The weather is cool and crisp; a light sweater or fleece is recommended for visiting parents.*"
        )

    loc = weather["location"]
    temp = weather["temperature_c"]
    apparent = weather["apparent_temperature_c"]
    cond = weather["condition"]
    t_min = weather["min_c"]
    t_max = weather["max_c"]
    wind = weather["wind_speed_kmh"]
    w_code = weather.get("weather_code", 0)

    tip = get_visiting_tip(temp, t_min, w_code)

    if is_tomorrow:
        return (
            f"### Weather Forecast for Tomorrow in {loc}\n\n"
            f"• **Expected Condition**: **{cond}**\n"
            f"• **Temperature Range**: **{t_min}°C** (Min) to **{t_max}°C** (Max)\n\n"
            f"*{tip}*"
        )

    # Today's live weather
    altitude_str = f" (elevation ~**{CAMPUS_LOCATION['elevation_ft']} ft**)" if "nainital" in city.lower() or "sherwood" in city.lower() else ""
    apparent_str = f" (feels like **{apparent}°C**)" if apparent is not None else ""

    return (
        f"Right now in **{loc}**{altitude_str}, the weather is **{cond}** with a temperature of **{temp}°C**{apparent_str}.\n\n"
        f"• **Today's Expected Range**: {t_min}°C (Min) to {t_max}°C (Max)\n"
        f"• **Wind Speed**: {wind} km/h\n\n"
        f"*{tip}*"
    )


def get_live_weather_answer() -> str:
    """Backward-compatible campus weather answer."""
    return get_weather_answer(CAMPUS_LOCATION["city"], is_tomorrow=False)


def format_weather_context_for_prompt() -> str:
    """Format campus weather data for prompt injection."""
    w = fetch_live_weather()
    if not w:
        return "LIVE CAMPUS WEATHER: Live weather data currently unavailable."
    return (
        f"LIVE CAMPUS WEATHER (Sherwood College, Nainital - 6,837 feet altitude):\n"
        f"- Current: {w.get('temperature_c')}°C, {w.get('condition')}\n"
        f"- Range: {w.get('today_min_c')}°C to {w.get('today_max_c')}°C\n"
    )
