from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

try:
    from google import genai as google_genai
except Exception:  # pragma: no cover
    google_genai = None

try:
    import google.generativeai as google_generative_ai
except Exception:  # pragma: no cover
    google_generative_ai = None

from .config import AIConfig
from .provider_interfaces import AIProvider, ContentAnalyzer, TranscriptionProvider


class AIProviderAdapter(AIProvider, ContentAnalyzer, TranscriptionProvider):
    def __init__(self, config: Optional[AIConfig] = None, backend: Optional[Any] = None):
        self.config = config or AIConfig()
        self.backend = backend or self._resolve_live_backend()

    def _resolve_live_backend(self) -> Optional[Dict[str, Any]]:
        api_key = self.config.api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return None

        if google_generative_ai is not None:
            try:
                google_generative_ai.configure(api_key=api_key)
                return {
                    "kind": "google-generativeai",
                    "model_name": self.config.model_name,
                    "client": google_generative_ai,
                }
            except Exception:
                pass

        if google_genai is not None:
            try:
                return {
                    "kind": "google-genai",
                    "model_name": self.config.model_name,
                    "client": google_genai.Client(api_key=api_key),
                }
            except Exception:
                pass

        return None

    def generate(self, prompt: str, *, schema: Optional[Dict[str, Any]] = None, **kwargs) -> Dict[str, Any]:
        if self.backend is not None:
            try:
                if self.backend["kind"] == "google-generativeai":
                    model = self.backend["client"].GenerativeModel(self.backend["model_name"])
                    generation_config = {"temperature": self.config.temperature}
                    response = model.generate_content(
                        prompt,
                        generation_config=generation_config,
                    )
                    reply = getattr(response, "text", None) or str(response)
                    return {
                        "response": reply,
                        "schema": schema,
                        "provider": "gemini",
                        "mode": "live",
                    }

                if self.backend["kind"] == "google-genai":
                    response = self.backend["client"].models.generate_content(
                        model=self.backend["model_name"],
                        contents=prompt,
                    )
                    reply = getattr(response, "text", None) or str(response)
                    return {
                        "response": reply,
                        "schema": schema,
                        "provider": "gemini",
                        "mode": "live",
                    }
            except Exception:
                pass

        return {"response": prompt, "schema": schema, "mode": "demo"}

    def transcribe(self, audio_path: str, *, language: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.backend is not None:
            return [{
                "start": 0.0,
                "end": 1.0,
                "text": f"Provider-backed transcription pending for {audio_path}",
                "provider": "gemini",
                "language": language,
            }]
        return [{"start": 0.0, "end": 1.0, "text": "Demo transcription"}]

    def analyze(self, transcript: str, *, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if self.backend is not None:
            prompt = (
                "Summarize the transcript and identify likely hooks, structure, and retention opportunities.\n\n"
                f"Transcript: {transcript}"
            )
            response = self.generate(prompt, schema={"kind": "summary"}, context=context)
            return {
                "transcript_length": len(transcript),
                "segments": [],
                "summary": response.get("response"),
                "provider": "gemini",
                "mode": "live",
            }
        return {"transcript_length": len(transcript), "segments": [], "mode": "demo"}
