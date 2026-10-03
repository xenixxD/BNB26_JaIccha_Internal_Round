from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class AIConfig:
    provider_name: str = "demo"
    api_key: Optional[str] = None
    model_name: str = "gemini-1.5-flash"
    timeout_seconds: int = 30
    max_retries: int = 2
    temperature: float = 0.2
    enable_visual_analysis: bool = False
    extra: dict = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.provider_name == "demo":
            env_provider = os.getenv("AI_PROVIDER") or os.getenv("DEFAULT_AI_PROVIDER")
            if env_provider:
                self.provider_name = env_provider

        if not self.api_key:
            self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

        if not self.model_name or self.model_name == "gemini-1.5-flash":
            env_model = os.getenv("GEMINI_MODEL_NAME") or os.getenv("AI_MODEL_NAME")
            if env_model:
                self.model_name = env_model

        if os.getenv("AI_ENABLE_VISUAL_ANALYSIS", "false").lower() == "true":
            self.enable_visual_analysis = True
