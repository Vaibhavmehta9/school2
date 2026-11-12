"""Polite crawler to snapshot official public pages from Sherwood College.

Adheres strictly to the research rules:
- 1 request at a time
- At least 2.5s delay between requests
- 10s timeout per page
- Public pages only (no forms submitted, no logins)
- Saves readable text with metadata header to backend/data/source_snapshot/
"""

import os
import re
import time
from datetime import datetime
from pathlib import Path
from bs4 import BeautifulSoup
import httpx

SNAPSHOT_DIR = Path(__file__).resolve().parents[1] / "data" / "source_snapshot"
SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SherwoodAdmissionsAssistantResearch/1.0; +https://sheerwoodadmission.com)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

TARGET_PAGES = [
    ("home", "https://sherwood.edu.in/"),
    ("about_us", "https://sherwood.edu.in/Home/AboutUs"),
    ("admission_process", "https://sherwood.edu.in/Home/AdmissionProcess"),
    ("campus_facility", "https://sherwood.edu.in/Home/CampusFacility"),
    ("infrastructure", "https://sherwood.edu.in/Home/Infrastructure"),
    ("contact_us", "https://sherwood.edu.in/Home/ContactUs"),
    ("event_calendar", "https://sherwood.edu.in/Home/EventCalender"),
    ("alumni", "https://sherwood.edu.in/Home/Alumni"),
    ("leadership_principal", "https://sherwood.edu.in/Home/UserDesc"),
    ("registration_form", "https://sherwood.edu.in/AdmissionRegistration/RegistrationForm"),
    ("registration_portal", "https://sherwood-edu.com/AdmissionRegistration/RegistrationForm"),
]


def clean_html_to_text(html_content: str) -> tuple[str, str]:
    """Parse HTML and extract page title and clean, readable structured text."""
    soup = BeautifulSoup(html_content, "html.parser")

    # Remove script, style, nav, and iframe tags
    for tag in soup(["script", "style", "noscript", "svg", "iframe"]):
        tag.decompose()

    title = soup.title.string.strip() if soup.title and soup.title.string else "Untitled Page"

    # Extract clean text with newline separation
    text = soup.get_text(separator="\n")
    # Normalize multiple blank lines
    clean_lines = [line.strip() for line in text.splitlines() if line.strip()]
    cleaned_body = "\n".join(clean_lines)

    return title, cleaned_body


def fetch_and_snapshot() -> None:
    client = httpx.Client(headers=HEADERS, timeout=10.0, follow_redirects=True, verify=False)
    fetched_count = 0

    print("=== Starting Official Page Snapshot ===")
    for slug, url in TARGET_PAGES:
        print(f"\nFetching: {url} ...")
        try:
            start_time = time.time()
            response = client.get(url)
            elapsed = time.time() - start_time

            if response.status_code == 200:
                title, body_text = clean_html_to_text(response.text)
                fetched_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                snapshot_path = SNAPSHOT_DIR / f"{slug}.txt"
                with open(snapshot_path, "w", encoding="utf-8") as f:
                    f.write(f"URL: {url}\n")
                    f.write(f"FETCHED_ON: {fetched_date}\n")
                    f.write(f"PAGE_TITLE: {title}\n")
                    f.write(f"HTTP_STATUS: {response.status_code}\n")
                    f.write(f"BYTE_LENGTH: {len(response.text)}\n")
                    f.write("=" * 70 + "\n\n")
                    f.write(body_text)

                print(f"-> Saved: {snapshot_path.name} ({len(body_text)} chars, title: '{title}', time: {elapsed:.2f}s)")
                fetched_count += 1
            else:
                print(f"-> Non-200 status: {response.status_code} for {url}")
        except Exception as exc:
            print(f"-> Error fetching {url}: {exc}")

        # Polite delay of 2.5 seconds between requests
        time.sleep(2.5)

    print(f"\n=== Completed Snapshotting: {fetched_count}/{len(TARGET_PAGES)} pages fetched ===")


if __name__ == "__main__":
    fetch_and_snapshot()

