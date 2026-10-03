from __future__ import annotations

from datetime import datetime
from typing import Any, Dict


def to_utc_iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.astimezone().isoformat()


def from_payload(data: Dict[str, Any]) -> Dict[str, Any]:
    normalized = dict(data)
    for key, value in list(normalized.items()):
        if isinstance(value, datetime):
            normalized[key] = to_utc_iso(value)
    return normalized


def to_payload(data: Any) -> Dict[str, Any]:
    if hasattr(data, "__dict__"):
        payload = dict(data.__dict__)
        for key, value in list(payload.items()):
            if isinstance(value, datetime):
                payload[key] = to_utc_iso(value)
        return payload
    return dict(data)
