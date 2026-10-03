from __future__ import annotations

from typing import Any, Dict


def validate_structured_output(payload: Dict[str, Any], required_fields: list[str]) -> bool:
    if not isinstance(payload, dict):
        return False
    return all(field in payload for field in required_fields)
