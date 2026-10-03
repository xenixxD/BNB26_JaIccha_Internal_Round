from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass(frozen=True)
class StoragePathBuilder:
    root_dir: str

    def source_path(self, project_id: str, asset_id: str, filename: str) -> str:
        return str(Path(self.root_dir) / "sources" / project_id / asset_id / filename)

    def derived_path(self, project_id: str, asset_id: str, artifact_name: str) -> str:
        return str(Path(self.root_dir) / "derived" / project_id / asset_id / artifact_name)

    def output_path(self, project_id: str, job_id: str, filename: str) -> str:
        return str(Path(self.root_dir) / "outputs" / project_id / job_id / filename)

    def temp_path(self, project_id: str, job_id: str, filename: str) -> str:
        return str(Path(self.root_dir) / "tmp" / project_id / job_id / filename)

    def from_uri(self, uri: str) -> Optional[str]:
        if not uri:
            return None
        return uri
