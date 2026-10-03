from __future__ import annotations

from pathlib import Path
from typing import Iterable, Optional


VALID_VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v", ".webm"}
VALID_AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".aac"}
VALID_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def detect_media_kind(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix in VALID_VIDEO_EXTENSIONS:
        return "video"
    if suffix in VALID_AUDIO_EXTENSIONS:
        return "audio"
    if suffix in VALID_IMAGE_EXTENSIONS:
        return "image"
    return "unknown"


def validate_media_file(path: str, *, allowed_kinds: Optional[Iterable[str]] = None) -> bool:
    candidate = Path(path)
    if not candidate.exists() or not candidate.is_file():
        return False

    kind = detect_media_kind(candidate.name)
    if allowed_kinds is None:
        allowed_kinds = {"video", "audio", "image"}
    return kind in set(allowed_kinds)
