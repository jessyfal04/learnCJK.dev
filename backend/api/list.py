from __future__ import annotations

import json
import os
from typing import Any, Dict


def _load_lists() -> Dict[str, Any]:
    base = os.path.dirname(__file__)
    data_dir = os.path.normpath(os.path.join(base, os.pardir, "data"))
    lists_path = os.path.join(data_dir, "lists.json")
    if not os.path.exists(lists_path):
        raise FileNotFoundError(lists_path)
    with open(lists_path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, dict):
        raise ValueError("lists.json malformed: expected top-level object")
    return data


def get_list(*, type: str, field: str) -> Any:
    """Return the requested list view.

    - type: one of 'rtk', 'rth', 'rsh', 'hanja'
    - field: 'chars' | 'fields'
    """
    data = _load_lists()
    if type not in data:
        raise ValueError(f"Invalid type '{type}'. Expected one of {sorted(data.keys())}")
    if field not in {"chars", "fields"}:
        raise ValueError("Invalid field. Expected 'chars' or 'fields'")
    bucket = data[type]
    if not isinstance(bucket, dict) or field not in bucket:
        raise ValueError(f"Field '{field}' not available for type '{type}'")
    return bucket[field]
