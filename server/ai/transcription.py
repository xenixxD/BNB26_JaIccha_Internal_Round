from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass
class TranscriptSegment:
    start: float
    end: float
    text: str
    speaker: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "start": self.start,
            "end": self.end,
            "text": self.text,
            "speaker": self.speaker,
        }


def transcribe_audio(audio_path: str, *, language: Optional[str] = None) -> List[Dict[str, Any]]:
    """Starter implementation that preserves the contract without depending on a live provider."""
    return [{
        "start": 0.0,
        "end": 5.0,
        "text": f"Demo transcription for {audio_path}",
        "speaker": "speaker_1",
    }]
