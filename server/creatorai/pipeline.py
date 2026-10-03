from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from server.ai.clip_candidate import build_candidates
from server.ai.content_understanding import understand_content
from server.database.asset_service import AssetService
from server.database.project_service import ProjectService
from server.storage.storage_service import StorageService


@dataclass
class ProcessingRequest:
    project_id: str
    asset_id: str
    filename: str
    transcript: str
    project_name: str = "CreatorAI Project"
    project_description: Optional[str] = None
    source_path: Optional[str] = None
    storage_root: str = "./runtime_storage"
    media_type: str = "video"
    checksum_sha256: Optional[str] = None


@dataclass
class ProcessingResult:
    project_id: str
    asset_id: str
    asset_path: str
    summary: str
    insights: List[str]
    candidates: List[Dict[str, Any]]
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "project_id": self.project_id,
            "asset_id": self.asset_id,
            "asset_path": self.asset_path,
            "summary": self.summary,
            "insights": self.insights,
            "candidates": self.candidates,
            "metadata": self.metadata,
        }


class CreatorAIPipeline:
    def __init__(
        self,
        *,
        project_service: Optional[ProjectService] = None,
        asset_service: Optional[AssetService] = None,
        storage_service: Optional[StorageService] = None,
    ):
        self.project_service = project_service or ProjectService()
        self.asset_service = asset_service or AssetService()
        self.storage_service = storage_service or StorageService("./runtime_storage")

    def process(self, request: ProcessingRequest) -> ProcessingResult:
        project = self.project_service.create_project(
            request.project_id,
            request.project_name,
            request.project_description,
        )
        if not request.transcript.strip():
            raise ValueError("transcript must not be empty")

        source_result = self._store_asset(request)
        asset_payload = self.asset_service.create_asset(
            request.asset_id,
            request.project_id,
            request.filename,
            media_type=request.media_type,
            storage_key=source_result["path"],
            checksum_sha256=request.checksum_sha256 or source_result.get("checksum"),
        )

        analysis = understand_content(request.transcript, context={"project_id": request.project_id, "asset_id": request.asset_id})
        segments = [
            {
                "start": 0.0,
                "end": max(5.0, len(request.transcript.split()) / 8.0),
                "text": request.transcript,
                "asset_id": request.asset_id,
                "project_id": request.project_id,
            }
        ]
        candidates = [
            candidate.to_dict()
            for candidate in build_candidates(segments)
        ]

        return ProcessingResult(
            project_id=request.project_id,
            asset_id=request.asset_id,
            asset_path=source_result["path"],
            summary=analysis.summary,
            insights=analysis.insights,
            candidates=candidates,
            metadata={
                "project": project,
                "asset": asset_payload,
                "word_count": len(request.transcript.split()),
            },
        )

    def _store_asset(self, request: ProcessingRequest) -> Dict[str, Any]:
        self.storage_service.ensure_directories()
        if request.source_path and Path(request.source_path).exists():
            return self.storage_service.store_source(
                request.project_id,
                request.asset_id,
                request.source_path,
                request.filename,
            )

        target_dir = Path(self.storage_service.root_dir) / "sources" / request.project_id / request.asset_id
        target_dir.mkdir(parents=True, exist_ok=True)
        target_file = target_dir / request.filename
        target_file.write_bytes(b"starter-source-asset")
        return {"path": str(target_file), "checksum": ""}
