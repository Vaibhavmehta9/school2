from datetime import datetime
import re
from typing import Any, Literal
from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator, model_validator


class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=5, max_length=254)
    phone: str = Field(min_length=8, max_length=30)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=1, max_length=128)
    role: Literal["parent", "teacher", "student", "admin", "admission", "vendor"]


class CognitoTokenExchangeRequest(BaseModel):
    code: str = Field(min_length=1, max_length=4096)
    redirect_uri: str = Field(min_length=1, max_length=2048)
    code_verifier: str = Field(min_length=43, max_length=128)


class AdmissionDecisionRequest(BaseModel):
    decision: Literal["approved", "approve_with_exception", "rejected", "needs_information", "remark"]
    class_section: str | None = Field(default=None, max_length=30)
    section_allocation: str | None = Field(default=None, max_length=30)
    admin_remark: str = Field(default="", max_length=1000)


class DocumentReviewRequest(BaseModel):
    decision: Literal["under_verification", "verified", "reupload_required", "rejected"]
    reason: str = Field(default="", max_length=500)


class CreateApplicationRequest(BaseModel):
    student_name: str = Field(min_length=2, max_length=120)
    desired_class: str = Field(min_length=2, max_length=40)


class SaveApplicationDraftRequest(BaseModel):
    application_number: str = Field(min_length=5, max_length=60)
    data: dict[str, Any] = Field(default_factory=dict)
    documents: list[dict[str, Any]] = Field(default_factory=list)
    status: Literal["draft", "submitted"] = "draft"
    lead_source: str = Field(default="", max_length=80)
    vendor_id: str = Field(default="", max_length=40)
    campaign_id: str = Field(default="", max_length=120)
    referral_code: str = Field(default="", max_length=40)
    first_visit: str = Field(default="", max_length=40)


class RegistrationFeeSettingsRequest(BaseModel):
    amount: int = Field(ge=0, le=10_000_000)


class SyllabusRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=120)
    details: str = Field(min_length=1, max_length=5000)
    sort_order: int = Field(default=0, ge=0, le=10_000)
    active: bool = True


class VendorCreateRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=5, max_length=254)
    vendor_id: str = Field(min_length=3, max_length=40, pattern=r"^[A-Za-z0-9_-]+$")


class ParentalConsentRequest(BaseModel):
    parent_name: str = Field(min_length=2, max_length=120)
    relationship_to_child: str = Field(min_length=2, max_length=80)
    parent_mobile: str = Field(min_length=8, max_length=20)
    parent_email: str = Field(min_length=5, max_length=254)
    child_name: str = Field(min_length=2, max_length=120)
    child_dob: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")


class ParentalConsentWithdrawalRequest(BaseModel):
    parent_mobile: str = Field(min_length=8, max_length=20)
    otp: str = Field(pattern=r"^\d{6}$")


class CreateUserRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=5, max_length=254)
    role: Literal["parent", "teacher", "student", "admin", "admission", "vendor"]
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserRoleUpdate(BaseModel):
    role: Literal["parent", "teacher", "student", "admin", "admission", "vendor"]
    full_name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=5, max_length=254)


class AttendanceRecord(BaseModel):
    student_name: str = Field(min_length=2, max_length=120)
    status: Literal["Present", "Late", "Absent"]


class AttendanceRequest(BaseModel):
    class_section: str = Field(min_length=2, max_length=20)
    date: str = Field(min_length=10, max_length=10)
    records: list[AttendanceRecord] = Field(min_length=1)


class AssignmentRequest(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    class_section: str = Field(min_length=2, max_length=20)
    due_date: str = Field(min_length=10, max_length=10)
    instructions: str = Field(default="", max_length=3000)


class AnnouncementRequest(BaseModel):
    audience: str = Field(min_length=2, max_length=120)
    message: str = Field(min_length=3, max_length=3000)
    channels: list[Literal["app", "email", "sms"]] = Field(default=["app"])


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class AIRequest(BaseModel):
    message: str | None = Field(default=None, min_length=1, max_length=1000)
    prompt: str | None = Field(default=None, min_length=1, max_length=3000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=6)
    audience: Literal["guest", "parent", "teacher", "admin", "student"] = "guest"

    @model_validator(mode="after")
    def validate_content(self) -> "AIRequest":
        resolved = (self.message if self.message is not None else self.prompt) or ""
        if not resolved.strip():
            raise ValueError("Either 'message' or 'prompt' must contain non-empty text.")
        return self

    def get_user_text(self) -> str:
        return ((self.message if self.message is not None else self.prompt) or "").strip()


class OTPRequest(BaseModel):
    phone_number: str = Field(min_length=8, max_length=20)


class OTPVerifyRequest(OTPRequest):
    otp: str = Field(pattern=r"^\d{6}$")


class EmailOTPRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)


class EmailOTPVerifyRequest(EmailOTPRequest):
    otp: str = Field(pattern=r"^\d{6}$")


MediaKind = Literal["tour", "event"]
MediaStatus = Literal["draft", "published", "archived"]


def parse_video_url(url: str | None) -> tuple[str, str, str, str]:
    """Parse, sanitize and normalize video URLs to provider, video_id, embed_url, and poster_url.

    Accepts only HTTPS URLs from youtube.com, youtu.be, youtube-nocookie.com, and vimeo.com.
    Returns: (provider, video_id, embed_url, poster_url).
    """
    if not url or not url.strip():
        return "none", "", "", ""
    clean = url.strip()
    parsed = urlparse(clean)
    if parsed.scheme.lower() != "https":
        raise ValueError("Video URL must use HTTPS.")

    hostname = (parsed.hostname or "").lower()
    path = parsed.path

    if hostname in ("youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"):
        if path == "/watch":
            import urllib.parse
            query_params = urllib.parse.parse_qs(parsed.query)
            v_id = query_params.get("v", [""])[0]
        elif path.startswith(("/embed/", "/v/", "/shorts/")):
            parts = [p for p in path.split("/") if p]
            v_id = parts[1] if len(parts) > 1 else ""
        else:
            raise ValueError("Unrecognized YouTube URL format.")

        if not re.match(r"^[A-Za-z0-9_-]{11}$", v_id):
            raise ValueError("Invalid YouTube Video ID format.")

        embed_url = f"https://www.youtube-nocookie.com/embed/{v_id}"
        poster_url = f"https://i.ytimg.com/vi/{v_id}/hqdefault.jpg"
        return "youtube", v_id, embed_url, poster_url

    elif hostname == "youtu.be":
        v_id = path.strip("/").split("/")[0] if path.strip("/") else ""
        if not re.match(r"^[A-Za-z0-9_-]{11}$", v_id):
            raise ValueError("Invalid YouTube Video ID format.")
        embed_url = f"https://www.youtube-nocookie.com/embed/{v_id}"
        poster_url = f"https://i.ytimg.com/vi/{v_id}/hqdefault.jpg"
        return "youtube", v_id, embed_url, poster_url

    elif hostname in ("vimeo.com", "www.vimeo.com", "player.vimeo.com"):
        match = re.search(r"(\d{6,12})", path)
        if not match:
            raise ValueError("Could not find valid Vimeo Video ID.")
        v_id = match.group(1)
        embed_url = f"https://player.vimeo.com/video/{v_id}"
        return "vimeo", v_id, embed_url, ""

    else:
        raise ValueError("Only YouTube and Vimeo video URLs are permitted.")


def sanitize_plain_text(text: str | None) -> str:
    """Strip control characters, null bytes, and leading/trailing whitespace."""
    if not text:
        return ""
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    return cleaned.strip()


def validate_https_link(url: str | None) -> str | None:
    """Validate external link URLs, enforcing HTTPS and blocking javascript/data URIs."""
    if not url or not url.strip():
        return None
    clean = url.strip()
    parsed = urlparse(clean)
    if parsed.scheme.lower() != "https":
        raise ValueError("Link URL must use HTTPS.")
    lower = clean.lower()
    if any(lower.startswith(scheme) for scheme in ("javascript:", "data:", "vbscript:", "file:")):
        raise ValueError("Dangerous URL scheme not permitted.")
    return clean


class ValidateVideoRequest(BaseModel):
    video_url: str = Field(min_length=5, max_length=500)


class MediaCreateRequest(BaseModel):
    kind: MediaKind
    title: str = Field(min_length=3, max_length=120)
    slug: str | None = Field(default=None, max_length=150)
    summary: str = Field(default="", max_length=200)
    description: str = Field(default="", max_length=1500)
    category: str = Field(default="", max_length=80)
    chapter_order: int | None = Field(default=None, ge=1, le=100)
    start_at: str | None = None
    end_at: str | None = None
    all_day: bool = False
    location: str = Field(default="", max_length=120)
    video_url: str | None = Field(default=None, max_length=500)
    cover_image_path: str | None = Field(default=None, max_length=500)
    poster_url: str | None = Field(default=None, max_length=500)
    duration_seconds: int | None = Field(default=None, ge=1, le=86400)
    link_url: str | None = Field(default=None, max_length=500)
    link_label: str | None = Field(default=None, max_length=50)
    status: MediaStatus = "draft"
    featured: bool = False
    sort_order: int = Field(default=0, ge=0, le=10000)
    demo: bool = False
    source_credit: str = Field(default="", max_length=200)
    has_students: bool = False
    consent_confirmed: bool = False

    @field_validator("title", "summary", "description", "location", "link_label", "source_credit", "category")
    @classmethod
    def sanitize_text(cls, v: str | None) -> str:
        return sanitize_plain_text(v)

    @field_validator("video_url")
    @classmethod
    def check_video(cls, v: str | None) -> str | None:
        if v:
            parse_video_url(v)
        return v.strip() if v else None

    @field_validator("link_url")
    @classmethod
    def check_link(cls, v: str | None) -> str | None:
        return validate_https_link(v)

    @model_validator(mode="after")
    def validate_media_rules(self) -> "MediaCreateRequest":
        if self.kind == "event":
            if not self.start_at:
                raise ValueError("start_at is required for event items.")
            try:
                start_dt = datetime.fromisoformat(self.start_at.replace("Z", "+00:00"))
            except ValueError as exc:
                raise ValueError("start_at must be a valid ISO 8601 date string.") from exc

            if self.end_at:
                try:
                    end_dt = datetime.fromisoformat(self.end_at.replace("Z", "+00:00"))
                except ValueError as exc:
                    raise ValueError("end_at must be a valid ISO 8601 date string.") from exc
                if end_dt < start_dt:
                    raise ValueError("End date must be after or equal to start date.")
        elif self.kind == "tour":
            if not self.video_url:
                raise ValueError("Virtual Tour chapters require a valid YouTube or Vimeo video URL.")

        if self.status == "published" and self.has_students and not self.consent_confirmed:
            raise ValueError("Cannot publish media showing students without confirmed parental/guardian consent.")

        return self


class MediaUpdateRequest(BaseModel):
    kind: MediaKind | None = None
    title: str | None = Field(default=None, min_length=3, max_length=120)
    slug: str | None = Field(default=None, max_length=150)
    summary: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=1500)
    category: str | None = Field(default=None, max_length=80)
    chapter_order: int | None = Field(default=None, ge=1, le=100)
    start_at: str | None = None
    end_at: str | None = None
    all_day: bool | None = None
    location: str | None = Field(default=None, max_length=120)
    video_url: str | None = Field(default=None, max_length=500)
    cover_image_path: str | None = Field(default=None, max_length=500)
    poster_url: str | None = Field(default=None, max_length=500)
    duration_seconds: int | None = Field(default=None, ge=1, le=86400)
    link_url: str | None = Field(default=None, max_length=500)
    link_label: str | None = Field(default=None, max_length=50)
    status: MediaStatus | None = None
    featured: bool | None = None
    sort_order: int | None = Field(default=None, ge=0, le=10000)
    demo: bool | None = None
    source_credit: str | None = Field(default=None, max_length=200)
    has_students: bool | None = None
    consent_confirmed: bool | None = None

    @field_validator("title", "summary", "description", "location", "link_label", "source_credit", "category")
    @classmethod
    def sanitize_text(cls, v: str | None) -> str | None:
        return sanitize_plain_text(v) if v is not None else None

    @field_validator("video_url")
    @classmethod
    def check_video(cls, v: str | None) -> str | None:
        if v:
            parse_video_url(v)
        return v.strip() if v else None

    @field_validator("link_url")
    @classmethod
    def check_link(cls, v: str | None) -> str | None:
        return validate_https_link(v)


class MediaReorderItem(BaseModel):
    id: int
    sort_order: int = Field(ge=0, le=10000)
    chapter_order: int | None = Field(default=None, ge=1, le=100)


class MediaReorderRequest(BaseModel):
    items: list[MediaReorderItem] = Field(min_length=1, max_length=200)
