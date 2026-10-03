from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class ContentUnderstandingResult:
    summary: str
    insights: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


def understand_content(transcript: str, *, context: Optional[Dict[str, Any]] = None) -> ContentUnderstandingResult:
    normalized = transcript.strip()
    if not normalized:
        raise ValueError("transcript must not be empty")
    return ContentUnderstandingResult(
        summary=f"Summary of transcript with {len(normalized.split())} words.",
        insights=["Clear creator-focused narrative", "Script aligns with short form video structure"],
        metadata={"context": context or {}, "word_count": len(normalized.split())},
    )
