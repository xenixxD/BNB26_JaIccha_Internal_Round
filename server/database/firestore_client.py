from __future__ import annotations

import os
from typing import Any, Dict, Optional

try:
    from google.cloud import firestore as google_firestore
except Exception:  # pragma: no cover
    google_firestore = None


class FirestoreClient:
    """Thin abstraction over Firestore access for the CreatorAI database layer."""

    def __init__(self, project_id: Optional[str] = None, client: Optional[Any] = None):
        self.project_id = project_id or os.getenv("GOOGLE_CLOUD_PROJECT") or "creatorai"
        self.client = client or self._build_real_client()
        self._memory_collections: Dict[str, "_InMemoryCollection"] = {}

    def _build_real_client(self) -> Optional[Any]:
        if google_firestore is None:
            return None

        try:
            if os.getenv("FIRESTORE_EMULATOR_HOST"):
                return google_firestore.Client(project=self.project_id)
            credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            if credentials_path:
                return google_firestore.Client.from_service_account_json(
                    credentials_path,
                    project=self.project_id,
                )
            return google_firestore.Client(project=self.project_id)
        except Exception:
            return None

    def collection(self, name: str):
        if self.client is not None:
            backend_collection = self.client.collection(name)
            return _WrappedCollection(name, backend_collection)

        memory_collection = self._memory_collections.setdefault(name, _InMemoryCollection(name))
        return memory_collection

    def close(self) -> None:
        if self.client is not None and hasattr(self.client, "close"):
            self.client.close()


class _WrappedCollection:
    def __init__(self, name: str, real_collection: Any):
        self.name = name
        self._real_collection = real_collection
        self._memory_collection = _InMemoryCollection(name)

    def document(self, document_id: str):
        if self._real_collection is not None:
            return _WrappedDocument(self._real_collection.document(document_id))
        return self._memory_collection.document(document_id)

    def add(self, data: Dict[str, Any]):
        if self._real_collection is not None:
            doc_id = data.get("id") or data.get("project_id") or data.get("asset_id") or "generated"
            self._real_collection.document(doc_id).set(data)
            return doc_id
        return self._memory_collection.add(data)

    def get(self):
        if self._real_collection is not None:
            docs = []
            for snapshot in self._real_collection.stream():
                payload = snapshot.to_dict()
                if payload is not None:
                    docs.append(payload)
            return docs
        return self._memory_collection.get()


class _WrappedDocument:
    def __init__(self, real_document: Any):
        self._real_document = real_document
        self.document_id = getattr(real_document, "id", None)
        self._memory_document = _InMemoryDocument(None, self.document_id or "generated")

    def set(self, data: Dict[str, Any]) -> None:
        if self._real_document is not None:
            self._real_document.set(data)
            return
        self._memory_document.set(data)

    def get(self):
        if self._real_document is not None:
            snapshot = self._real_document.get()
            if snapshot is None or not getattr(snapshot, "exists", True):
                return {}
            payload = snapshot.to_dict()
            return payload or {}
        return self._memory_document.get()

    def delete(self):
        if self._real_document is not None:
            self._real_document.delete()
            return
        self._memory_document.delete()


class _InMemoryCollection:
    def __init__(self, name: str):
        self.name = name
        self._docs: Dict[str, Dict[str, Any]] = {}

    def document(self, document_id: str):
        return _InMemoryDocument(self, document_id)

    def add(self, data: Dict[str, Any]):
        doc_id = data.get("id") or data.get("project_id") or data.get("asset_id") or "generated"
        self._docs[doc_id] = dict(data)
        return doc_id

    def get(self):
        return list(self._docs.values())


class _InMemoryDocument:
    def __init__(self, collection: Optional[_InMemoryCollection], document_id: str):
        self.collection = collection
        self.document_id = document_id

    def set(self, data: Dict[str, Any]) -> None:
        if self.collection is None:
            return
        self.collection._docs[self.document_id] = dict(data)

    def get(self):
        if self.collection is None:
            return {}
        return self.collection._docs.get(self.document_id, {})

    def delete(self):
        if self.collection is not None:
            self.collection._docs.pop(self.document_id, None)
