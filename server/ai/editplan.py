from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class EditPlanSegment:
    clip_id: str
    start_time: float
    end_time: float
    platform: str = "instagram_reels"
    hook: Optional[str] = None
    caption: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class EditPlan:
    plan_id: str
    project_id: str
    asset_id: str
    version: int = 1
    status: str = "draft"
    segments: List[EditPlanSegment] = field(default_factory=list)
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def add_segment(self, segment: EditPlanSegment) -> None:
        self.segments.append(segment)
        self.updated_at = utc_now()

    def validate(self) -> bool:
        if not self.plan_id or not self.project_id or not self.asset_id:
            return False
        if any(segment.start_time >= segment.end_time for segment in self.segments):
            return False
        return True
