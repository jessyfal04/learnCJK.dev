#!/usr/bin/env python3
"""
Build detailed, ordered JSON lists from CJK_learn.json and HanjaLevels.tsv.

Sources:
- CJKLearn (JSON map) → RTK/RTH/RSH lists with index and keyword.
- HanjaLevels (TSV) → Hanja list with full index, Korean sound and meaning.

Output structure (lists.json):
{
  "rtk": [ {"char": "一", "index": 1, "keyword": "one"}, ... ],
  "rth": [ {"char": "一", "index": 1, "keyword": "one"}, ... ],
  "rsh": [ {"char": "一", "index": 1, "keyword": "one"}, ... ],
  "hanja": [
    {"char": "外", "index": "80_夕_外", "ko_sound": "외", "ko_meaning": "바깥 외"},
    ...
  ]
}

Ordering:
- rtk/rth/rsh by numeric index ascending.
- hanja by the full index string (e.g., '80_夕_外').
"""
from __future__ import annotations

import json
import os
from typing import Dict, Any, List, Tuple, Optional


def _load_cjk_learn(path: str) -> Dict[str, Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
        if not isinstance(data, dict):
            raise ValueError("CJK_learn.json must be a JSON object map")
        # ensure values are dicts
        out: Dict[str, Dict[str, Any]] = {}
        for ch, meta in data.items():
            if isinstance(ch, str) and isinstance(meta, dict):
                out[ch] = meta
        return out


def _build_indexed_list(
    entries: Dict[str, Dict[str, Any]], index_field: str, keyword_field: str
) -> List[Dict[str, Any]]:
    pairs: List[Tuple[int, str, Optional[str]]] = []
    for ch, meta in entries.items():
        idx = meta.get(index_field)
        kw = meta.get(keyword_field)
        if isinstance(idx, int):
            pairs.append((idx, ch, kw if isinstance(kw, str) else None))
        elif isinstance(idx, str) and idx.isdigit():
            # tolerate stringified numbers
            pairs.append((int(idx), ch, kw if isinstance(kw, str) else None))
    pairs.sort(key=lambda x: x[0])
    return [{"char": ch, "index": idx, "keyword": kw} for idx, ch, kw in pairs]


def _load_hanja_levels(tsv_path: str) -> Dict[str, Dict[str, Any]]:
    """Parse HanjaLevels.tsv into a map keyed by char.

    Expected columns (tab-separated):
    0 char, 1 full index (e.g., 80_夕_外), 2 ko_sound, 3 ko_meaning,
    other columns ignored.
    """
    out: Dict[str, Dict[str, Any]] = {}
    with open(tsv_path, "r", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 4:
                continue
            ch = parts[0]
            idx_full = parts[1]
            ko_sound = parts[2] or None
            ko_meaning = parts[3] or None
            if isinstance(ch, str) and ch and isinstance(idx_full, str) and idx_full:
                out[ch] = {
                    "index": idx_full,
                    "ko_sound": ko_sound,
                    "ko_meaning": ko_meaning,
                }
    return out


def _build_hanja_list(hanja_map: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    pairs: List[Tuple[str, str]] = []  # (index_full, char)
    for ch, meta in hanja_map.items():
        idx = meta.get("index")
        if isinstance(idx, str) and idx:
            pairs.append((idx, ch))
    pairs.sort(key=lambda x: x[0])
    out: List[Dict[str, Any]] = []
    for idx, ch in pairs:
        meta = hanja_map[ch]
        out.append(
            {
                "char": ch,
                "index": idx,
                "ko_sound": meta.get("ko_sound"),
                "ko_meaning": meta.get("ko_meaning"),
            }
        )
    return out


def main() -> None:
    base = os.path.dirname(__file__)
    cjk_path = os.path.join(base, "../CJK_learn.json")
    hanja_tsv = os.path.join(base, "../in/HanjaLevels.tsv")
    out_path = os.path.join(base, "../lists.json")

    if not os.path.exists(cjk_path):
        print(f"Input not found: {cjk_path}")
        return

    cjk_map = _load_cjk_learn(cjk_path)

    # Build RTK/RTH/RSH lists from CJKLearn
    rtk = _build_indexed_list(cjk_map, "index_rtk", "keyword_rtk")
    rth = _build_indexed_list(cjk_map, "index_rth", "keyword_rth")
    rsh = _build_indexed_list(cjk_map, "index_rsh", "keyword_rsh")

    # Hanja: prefer HanjaLevels.tsv if present; otherwise fall back to CJKLearn
    if os.path.exists(hanja_tsv):
        hanja_map = _load_hanja_levels(hanja_tsv)
        hanja = _build_hanja_list(hanja_map)
    else:
        # Fallback: include only index_hanja sorted by full string; no Korean fields
        temp: Dict[str, Dict[str, Any]] = {}
        for ch, meta in cjk_map.items():
            idx = meta.get("index_hanja")
            if isinstance(idx, str) and idx:
                temp[ch] = {"index": idx, "ko_sound": None, "ko_meaning": None}
        hanja = _build_hanja_list(temp)

    def to_group(objs: List[Dict[str, Any]], fields: List[str]) -> Dict[str, Any]:
        chars = [o["char"] for o in objs]
        fmap: Dict[str, Any] = {}
        for o in objs:
            c = o["char"]
            fmap[c] = {k: o.get(k) for k in fields}
        return {"chars": chars, "fields": fmap}

    lists = {
        "rtk": to_group(rtk, ["index", "keyword"]),
        "rth": to_group(rth, ["index", "keyword"]),
        "rsh": to_group(rsh, ["index", "keyword"]),
        "hanja": to_group(hanja, ["index", "ko_sound", "ko_meaning"]),
    }

    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(lists, fh, ensure_ascii=False, indent=2)
    print(
        "Wrote lists to {path} (rtk={rtk}, rth={rth}, rsh={rsh}, hanja={hanja})".format(
            path=out_path,
            rtk=len(lists["rtk"]["chars"]),
            rth=len(lists["rth"]["chars"]),
            rsh=len(lists["rsh"]["chars"]),
            hanja=len(lists["hanja"]["chars"]),
        )
    )


if __name__ == "__main__":
    main()
