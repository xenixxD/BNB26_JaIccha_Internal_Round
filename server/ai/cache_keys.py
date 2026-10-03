from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, Iterable


def stable_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def build_cache_key(parts: Iterable[Any]) -> str:
    payload = stable_json(list(parts))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def build_transcript_cache_key(asset_id: str, transcript_hash: str, strategy: str, config: Dict[str, Any]) -> str:
    return build_cache_key(["transcript", asset_id, transcript_hash, strategy, config])
