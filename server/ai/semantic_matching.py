from __future__ import annotations

from typing import Any, Dict, List


class SemanticMatcher:
    def __init__(self, transcript_segments: List[Dict[str, Any]] | None = None):
        self.transcript_segments = transcript_segments or []

    def find_best_match(self, script_text: str) -> Dict[str, Any]:
        normalized = script_text.strip()
        if not normalized:
            raise ValueError("script_text is required")
        best_match = self.transcript_segments[0] if self.transcript_segments else {"start": 0.0, "end": 0.0, "text": normalized}
        return {
            "matched_text": best_match.get("text", normalized),
            "start_time": best_match.get("start", 0.0),
            "end_time": best_match.get("end", 0.0),
            "confidence": 0.85,
        }
