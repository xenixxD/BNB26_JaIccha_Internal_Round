from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass
class StorageMetadata:
    content_type: Optional[str] = None
    byte_size: int = 0
    sha256: Optional[str] = None
    original_name: Optional[str] = None
    source_path: Optional[str] = None
    extra: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "content_type": self.content_type,
            "byte_size": self.byte_size,
            "sha256": self.sha256,
            "original_name": self.original_name,
            "source_path": self.source_path,
            "extra": self.extra,
        }
