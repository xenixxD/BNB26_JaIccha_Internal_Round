from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Optional

try:
    from google.cloud import storage as google_storage
except Exception:  # pragma: no cover
    google_storage = None


class StorageProviderAdapter:
    """Provider-neutral adapter interface for storage backends."""

    def __init__(self, bucket_name: Optional[str] = None, backend: Optional[Any] = None):
        self.bucket_name = bucket_name or os.getenv("GCS_BUCKET_NAME") or os.getenv("GOOGLE_CLOUD_STORAGE_BUCKET")
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        self.backend = backend
        self.client = self._build_client()
        self.bucket = self.client.bucket(self.bucket_name) if self.client is not None and self.bucket_name else None

    def _build_client(self) -> Optional[Any]:
        if self.backend is not None:
            return self.backend
        if google_storage is None:
            return None

        try:
            return google_storage.Client(project=self.project_id)
        except Exception:
            return None

    def upload(self, source_path: str, destination_key: str, *, metadata: Optional[dict] = None) -> str:
        if self.backend is not None and hasattr(self.backend, "upload"):
            return self.backend.upload(source_path, destination_key, metadata=metadata or {})

        if self.bucket is not None and Path(source_path).exists():
            blob = self.bucket.blob(destination_key)
            blob.upload_from_filename(
                source_path,
                content_type=(metadata or {}).get("content_type", "application/octet-stream"),
            )
            return f"gs://{self.bucket_name}/{destination_key}"

        return destination_key

    def download(self, key: str, destination_path: str) -> str:
        if self.backend is not None and hasattr(self.backend, "download"):
            return self.backend.download(key, destination_path)

        if self.bucket is not None:
            blob = self.bucket.blob(key)
            if blob.exists():
                blob.download_to_filename(destination_path)
                return destination_path
        return destination_path

    def delete(self, key: str) -> bool:
        if self.backend is not None and hasattr(self.backend, "delete"):
            return bool(self.backend.delete(key))

        if self.bucket is not None:
            blob = self.bucket.blob(key)
            if blob.exists():
                blob.delete()
                return True
        return True
