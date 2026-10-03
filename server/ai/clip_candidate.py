from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class ClipCandidate:
    candidate_id: str
    asset_id: str
    project_id: str
    start_time: float
    end_time: float
    score: float
    summary: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "candidate_id": self.candidate_id,
            "asset_id": self.asset_id,
            "project_id": self.project_id,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "score": self.score,
            "summary": self.summary,
            "metadata": self.metadata,
        }


def build_candidates(transcript_segments: List[Dict[str, Any]]) -> List[ClipCandidate]:
    result: List[ClipCandidate] = []
    for index, segment in enumerate(transcript_segments):
        result.append(
            ClipCandidate(
                candidate_id=f"candidate_{index + 1}",
                asset_id=segment.get("asset_id", "asset_1"),
                project_id=segment.get("project_id", "project_1"),
                start_time=float(segment.get("start", 0.0)),
                end_time=float(segment.get("end", 5.0)),
                score=0.9 - 0.1 * index,
                summary=segment.get("text", "Candidate summary"),
            )
        )
    return result
