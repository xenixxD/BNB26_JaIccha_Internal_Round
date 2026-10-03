from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class ProjectRecord:
    project_id: str
    name: str
    description: Optional[str] = None
    status: str = "draft"
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AssetRecord:
    asset_id: str
    project_id: str
    filename: str
    media_type: str = "video"
    storage_key: str = ""
    checksum_sha256: Optional[str] = None
    status: str = "uploaded"
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TranscriptSegmentRecord:
    segment_id: str
    asset_id: str
    start_time: float = 0.0
    end_time: float = 0.0
    text: str = ""
    speaker: Optional[str] = None
    created_at: datetime = field(default_factory=utc_now)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ClipCandidateRecord:
    candidate_id: str
    asset_id: str
    project_id: str
    start_time: float = 0.0
    end_time: float = 0.0
    score: float = 0.0
    source: str = "transcript_match"
    created_at: datetime = field(default_factory=utc_now)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class EditPlanRecord:
    plan_id: str
    project_id: str
    asset_id: str
    version: int = 1
    status: str = "draft"
    summary: str = ""
    segments: List[Dict[str, Any]] = field(default_factory=list)
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)
    metadata: Dict[str, Any] = field(default_factory=dict)
