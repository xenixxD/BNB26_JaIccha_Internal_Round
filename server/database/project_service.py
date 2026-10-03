from __future__ import annotations

from typing import Any, Dict, Optional

from .firestore_client import FirestoreClient
from .models import ProjectRecord
from .serialization import to_payload
from .validation import validate_record


class ProjectService:
    def __init__(self, firestore: Optional[FirestoreClient] = None):
        self.firestore = firestore or FirestoreClient(project_id="creatorai")

    def create_project(self, project_id: str, name: str, description: Optional[str] = None) -> Dict[str, Any]:
        validate_record({"project_id": project_id, "name": name}, ["project_id", "name"])
        record = ProjectRecord(project_id=project_id, name=name, description=description)
        payload = to_payload(record)
        self.firestore.collection("projects").document(project_id).set(payload)
        return payload

    def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        return self.firestore.collection("projects").document(project_id).get()
