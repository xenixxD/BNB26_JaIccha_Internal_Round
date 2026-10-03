from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class ProcessingJob:
    job_id: str
    project_id: str
    asset_id: str
    job_type: str = "transcription"
    status: str = "queued"
    progress: float = 0.0
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RenderJob:
    job_id: str
    project_id: str
    plan_id: str
    status: str = "queued"
    progress: float = 0.0
    output_key: Optional[str] = None
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)
    metadata: Dict[str, Any] = field(default_factory=dict)
