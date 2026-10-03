from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional


@dataclass
class ArtifactStore:
    root_dir: str
    artifacts: Dict[str, str] = field(default_factory=dict)

    def save(self, name: str, payload: bytes) -> str:
        path = Path(self.root_dir) / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(payload)
        self.artifacts[name] = str(path)
        return str(path)

    def get(self, name: str) -> Optional[str]:
        return self.artifacts.get(name)

    def delete(self, name: str) -> bool:
        path = Path(self.artifacts.get(name, self.root_dir))
        if path.exists():
            path.unlink()
            self.artifacts.pop(name, None)
            return True
        return False
