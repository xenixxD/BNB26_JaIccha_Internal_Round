from __future__ import annotations

from typing import Any, Dict


def require_non_empty(value: Any, field_name: str) -> None:
    if value is None or str(value).strip() == "":
        raise ValueError(f"{field_name} is required")


def validate_record(data: Dict[str, Any], required_fields: list[str]) -> None:
    for field_name in required_fields:
        require_non_empty(data.get(field_name), field_name)


def validate_checksum(checksum: str | None) -> str | None:
    if checksum is None:
        return None
    if len(checksum) != 64:
        raise ValueError("checksum_sha256 must be a SHA-256 hex string")
    return checksum
