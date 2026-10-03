from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass
class SourceAsset:
    asset_id: str
    project_id: str
    source_path: str
    filename: str
    checksum_sha256: str
    mime_type: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "asset_id": self.asset_id,
            "project_id": self.project_id,
            "source_path": self.source_path,
            "filename": self.filename,
            "checksum_sha256": self.checksum_sha256,
            "mime_type": self.mime_type,
            "metadata": self.metadata,
        }
