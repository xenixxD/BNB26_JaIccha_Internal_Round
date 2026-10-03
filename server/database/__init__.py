"""Database foundation package for CreatorAI."""

from .firestore_client import FirestoreClient
from .models import AssetRecord, ClipCandidateRecord, EditPlanRecord, ProjectRecord, TranscriptSegmentRecord
from .repositories import AssetRepository, ClipCandidateRepository, EditPlanRepository, ProjectRepository, TranscriptRepository

__all__ = [
    "FirestoreClient",
    "AssetRecord",
    "ClipCandidateRecord",
    "EditPlanRecord",
    "ProjectRecord",
    "TranscriptSegmentRecord",
    "AssetRepository",
    "ClipCandidateRepository",
    "EditPlanRepository",
    "ProjectRepository",
    "TranscriptRepository",
]
