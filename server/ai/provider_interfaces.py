from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class AIProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str, *, schema: Optional[Dict[str, Any]] = None, **kwargs) -> Dict[str, Any]:
        raise NotImplementedError


class TranscriptionProvider(ABC):
    @abstractmethod
    def transcribe(self, audio_path: str, *, language: Optional[str] = None) -> List[Dict[str, Any]]:
        raise NotImplementedError


class ContentAnalyzer(ABC):
    @abstractmethod
    def analyze(self, transcript: str, *, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        raise NotImplementedError
