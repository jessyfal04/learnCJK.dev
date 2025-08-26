#!/usr/bin/env python3
"""
Convert CJK_learn.tsv into CJK_learn.json in the same folder.
Produces a JSON object map: { "一": {"keyword_rtk": "...", "keyword_rth": "...", ... }, ... }
Fields extracted (0-based indices):
  0 char
  6 Keyword-RTK
  7 Keyword-RTH
  8 Keyword-RSH
 12 Index-Hanja
 13 Index-RTK
 14 Index-RTH
 15 Index-RSH
"""
import json
import os

base = os.path.dirname(__file__)
tsv_path = os.path.join(base, "../in/CJK_learn.tsv")
json_path = os.path.join(base, "../CJK_learn.json")

out_map = {}
if os.path.exists(tsv_path):
    with open(tsv_path, "r", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            parts = line.rstrip("\n").split("\t")
            if len(parts) >= 16:
                ch = parts[0]
                keyword_rtk = parts[6] or None
                keyword_rth = parts[7] or None
                keyword_rsh = parts[8] or None
                index_hanja = parts[12] or None
                index_rtk = int(parts[13]) if parts[13] else None
                index_rth = int(parts[14]) if parts[14] else None
                index_rsh = int(parts[15]) if parts[15] else None
                if isinstance(ch, str) and ch:
                    out_map[ch] = {
                        "keyword_rtk": keyword_rtk,
                        "keyword_rth": keyword_rth,
                        "keyword_rsh": keyword_rsh,
                        "index_hanja": index_hanja,
                        "index_rtk": index_rtk,
                        "index_rth": index_rth,
                        "index_rsh": index_rsh,
                    }

    with open(json_path, "w", encoding="utf-8") as outfh:
        json.dump(out_map, outfh, ensure_ascii=False, indent=2)
    print(f"Wrote {len(out_map)} entries to {json_path}")
else:
    print(f"TSV file not found at {tsv_path}")
