from __future__ import annotations

from typing import Any, Dict, List, Optional

from .firestore_client import FirestoreClient


class AssetRepository:
    def __init__(self, firestore: FirestoreClient):
        self.firestore = firestore
        self.collection_name = "assets"

    def collection(self):
        return self.firestore.collection(self.collection_name)

    def create(self, asset_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        self.collection().document(asset_id).set(payload)
        return payload

    def get(self, asset_id: str) -> Optional[Dict[str, Any]]:
        return self.collection().document(asset_id).get()

    def list_for_project(self, project_id: str) -> List[Dict[str, Any]]:
        return [item for item in self.collection().get() if item.get("project_id") == project_id]
