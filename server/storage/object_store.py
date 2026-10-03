from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional


@dataclass
class ObjectStore:
    root_dir: str

    def upload(self, source_path: str, destination_key: str, *, metadata: Optional[Dict[str, Any]] = None) -> str:
        source = Path(source_path)
        destination = Path(self.root_dir) / destination_key
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(source.read_bytes())
        return str(destination)

    def download(self, key: str, destination_path: str) -> str:
        source = Path(self.root_dir) / key
        destination = Path(destination_path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(source.read_bytes())
        return str(destination)

    def delete(self, key: str) -> bool:
        target = Path(self.root_dir) / key
        if target.exists():
            target.unlink()
            return True
        return False
