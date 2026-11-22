import abc
import hashlib
import io
import os
import secrets
from pathlib import Path
from PIL import Image
from fastapi import HTTPException, status

MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_DIMENSION = 4000
MIN_DIMENSION = 50

# Base upload directory
_raw_db = os.getenv("DATABASE_PATH", "")
if _raw_db.startswith("/data"):
    BASE_UPLOAD_DIR = Path("/data/uploads/media")
else:
    BASE_UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads" / "media"


def is_allowed_magic_bytes(content: bytes) -> str | None:
    """Verify image magic bytes for JPEG, PNG, or WebP."""
    if len(content) < 12:
        return None
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        return "image/webp"
    return None


class StorageDriver(abc.ABC):
    @abc.abstractmethod
    def save_image(self, file_bytes: bytes, original_filename: str) -> dict[str, str | int]:
        """Validate, strip metadata, optimize to WebP and persist image."""
        pass

    @abc.abstractmethod
    def delete_image(self, stored_path: str) -> bool:
        """Remove a stored image file."""
        pass


class LocalDiskDriver(StorageDriver):
    def __init__(self, upload_dir: Path = BASE_UPLOAD_DIR):
        self.upload_dir = upload_dir
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def save_image(self, file_bytes: bytes, original_filename: str) -> dict[str, str | int]:
        if len(file_bytes) > MAX_IMAGE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail=f"Image must be smaller than {MAX_IMAGE_BYTES // (1024 * 1024)} MB."
            )

        mime = is_allowed_magic_bytes(file_bytes)
        if not mime:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only JPG, PNG, and WebP images are permitted."
            )

        try:
            im = Image.open(io.BytesIO(file_bytes))
            im.verify()
            # Reopen for processing as verify() alters stream
            im = Image.open(io.BytesIO(file_bytes))
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Corrupt or invalid image file."
            ) from exc

        orig_w, orig_h = im.size
        if orig_w < MIN_DIMENSION or orig_h < MIN_DIMENSION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image dimensions must be at least {MIN_DIMENSION}x{MIN_DIMENSION}px."
            )
        if orig_w > MAX_DIMENSION or orig_h > MAX_DIMENSION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image dimensions cannot exceed {MAX_DIMENSION}x{MAX_DIMENSION}px."
            )

        # Convert to RGB (strips EXIF and handles alpha channels cleanly)
        if im.mode in ("RGBA", "LA", "P"):
            rgb_im = Image.new("RGB", im.size, (255, 255, 255))
            if im.mode == "P":
                im = im.convert("RGBA")
            rgb_im.paste(im, mask=im.split()[-1] if len(im.split()) > 3 else None)
            im = rgb_im
        elif im.mode != "RGB":
            im = im.convert("RGB")

        # Generate unique random filename
        random_name = f"{secrets.token_hex(16)}.webp"
        dest_path = self.upload_dir / random_name

        # Save as WebP without EXIF/metadata
        im.save(dest_path, format="WEBP", quality=85, method=6)
        file_hash = hashlib.sha256(file_bytes).hexdigest()

        return {
            "path": f"/api/uploads/media/{random_name}",
            "filename": random_name,
            "width": orig_w,
            "height": orig_h,
            "sha256": file_hash
        }

    def delete_image(self, stored_path: str) -> bool:
        if not stored_path:
            return False
        # Extract filename only to prevent path traversal
        fname = Path(stored_path).name
        target = self.upload_dir / fname
        if target.exists() and target.is_file():
            try:
                target.unlink()
                return True
            except OSError:
                return False
        return False


def get_storage_driver() -> StorageDriver:
    return LocalDiskDriver()
