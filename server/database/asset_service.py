from __future__ import annotations

from typing import Any, Dict, Optional

from .asset_repository import AssetRepository
from .firestore_client import FirestoreClient
from .models import AssetRecord
from .serialization import to_payload
from .validation import validate_record, validate_checksum


class AssetService:
    def __init__(self, firestore: Optional[FirestoreClient] = None):
        self.firestore = firestore or FirestoreClient(project_id="creatorai")
        self.repository = AssetRepository(self.firestore)

    def create_asset(
        self,
        asset_id: str,
        project_id: str,
        filename: str,
        *,
        media_type: str = "video",
        storage_key: str = "",
        checksum_sha256: Optional[str] = None,
    ) -> Dict[str, Any]:
        validate_record({"asset_id": asset_id, "project_id": project_id, "filename": filename}, ["asset_id", "project_id", "filename"])
        checksum = validate_checksum(checksum_sha256)
        record = AssetRecord(
            asset_id=asset_id,
            project_id=project_id,
            filename=filename,
            media_type=media_type,
            storage_key=storage_key,
            checksum_sha256=checksum,
        )
        payload = to_payload(record)
        self.repository.create(asset_id, payload)
        return payload

    def get_asset(self, asset_id: str) -> Optional[Dict[str, Any]]:
        return self.repository.get(asset_id)
