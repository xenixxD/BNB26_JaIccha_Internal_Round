from __future__ import annotations

from typing import Dict, List


def get_required_indexes() -> Dict[str, List[str]]:
    return {
        "assets": ["project_id", "status", "created_at"],
        "transcript_segments": ["asset_id", "start_time"],
        "clip_candidates": ["asset_id", "score", "created_at"],
        "edit_plans": ["project_id", "version", "status"],
    }


def create_index_spec(collection_name: str, fields: List[str]) -> Dict[str, object]:
    return {"collection": collection_name, "fields": fields}
