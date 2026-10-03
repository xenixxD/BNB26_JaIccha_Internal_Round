from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional

from .checksum_utils import sha256_file
from .metadata import StorageMetadata
from .path_builder import StoragePathBuilder
from .provider_adapter import StorageProviderAdapter


class StorageService:
    def __init__(self, root_dir: str, provider: Optional[StorageProviderAdapter] = None):
        self.root_dir = root_dir
        self.path_builder = StoragePathBuilder(root_dir)
        self.provider = provider or StorageProviderAdapter()

    def ensure_directories(self) -> None:
        for relative_dir in ("sources", "derived", "outputs", "tmp"):
            Path(self.root_dir, relative_dir).mkdir(parents=True, exist_ok=True)

    def store_source(self, project_id: str, asset_id: str, source_file: str, filename: str) -> Dict[str, Any]:
        destination = self.path_builder.source_path(project_id, asset_id, filename)
        Path(destination).parent.mkdir(parents=True, exist_ok=True)
        Path(source_file).replace(destination)
        checksum = sha256_file(destination)
        metadata = StorageMetadata(
            content_type="application/octet-stream",
            byte_size=Path(destination).stat().st_size,
            sha256=checksum,
            original_name=filename,
            source_path=destination,
        )
        return {"path": destination, "checksum": checksum, "metadata": metadata.to_dict()}

    def store_derived(self, project_id: str, asset_id: str, artifact_name: str, source_file: str) -> Dict[str, Any]:
        destination = self.path_builder.derived_path(project_id, asset_id, artifact_name)
        Path(destination).parent.mkdir(parents=True, exist_ok=True)
        Path(source_file).replace(destination)
        checksum = sha256_file(destination)
        return {"path": destination, "checksum": checksum}

    def write_output(self, project_id: str, job_id: str, filename: str, payload: bytes) -> Dict[str, Any]:
        destination = self.path_builder.output_path(project_id, job_id, filename)
        Path(destination).parent.mkdir(parents=True, exist_ok=True)
        Path(destination).write_bytes(payload)
        checksum = sha256_file(destination)
        return {"path": destination, "checksum": checksum}

    def temp_file(self, project_id: str, job_id: str, filename: str, payload: bytes) -> Dict[str, Any]:
        destination = self.path_builder.temp_path(project_id, job_id, filename)
        Path(destination).parent.mkdir(parents=True, exist_ok=True)
        Path(destination).write_bytes(payload)
        return {"path": destination}
