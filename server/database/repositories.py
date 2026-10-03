from __future__ import annotations

from typing import Any, Dict, List, Optional

from .firestore_client import FirestoreClient


class BaseRepository:
    def __init__(self, firestore: FirestoreClient, collection_name: str):
        self.firestore = firestore
        self.collection_name = collection_name

    def collection(self):
        return self.firestore.collection(self.collection_name)


class ProjectRepository(BaseRepository):
    def __init__(self, firestore: FirestoreClient):
        super().__init__(firestore, "projects")

    def create(self, project_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        document = self.collection().document(project_id)
        document.set(payload)
        return payload

    def get(self, project_id: str) -> Optional[Dict[str, Any]]:
        return self.collection().document(project_id).get()


class AssetRepository(BaseRepository):
    def __init__(self, firestore: FirestoreClient):
        super().__init__(firestore, "assets")

    def create(self, asset_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        document = self.collection().document(asset_id)
        document.set(payload)
        return payload

    def list_for_project(self, project_id: str) -> List[Dict[str, Any]]:
        return [item for item in self.collection().get() if item.get("project_id") == project_id]


class TranscriptRepository(BaseRepository):
    def __init__(self, firestore: FirestoreClient):
        super().__init__(firestore, "transcript_segments")

    def create(self, segment_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        document = self.collection().document(segment_id)
        document.set(payload)
        return payload


class ClipCandidateRepository(BaseRepository):
    def __init__(self, firestore: FirestoreClient):
        super().__init__(firestore, "clip_candidates")

    def create(self, candidate_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        document = self.collection().document(candidate_id)
        document.set(payload)
        return payload


class EditPlanRepository(BaseRepository):
    def __init__(self, firestore: FirestoreClient):
        super().__init__(firestore, "edit_plans")

    def create(self, plan_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        document = self.collection().document(plan_id)
        document.set(payload)
        return payload
