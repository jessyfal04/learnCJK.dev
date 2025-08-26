#!/usr/bin/env python3
"""
Convert kDefinition.tsv into kDefinition.json in the same folder.
Produces a JSON object map: { "㐀": { "definition": "..." }, ... }
"""
import json
import os

base = os.path.dirname(__file__)
tsv_path = os.path.join(base, "../in/kDefinition.tsv")
json_path = os.path.join(base, "kDefinition.json")

out_map = {}
if os.path.exists(tsv_path):
    with open(tsv_path, "r", encoding="utf-8") as fh:
        for line in fh:
            parts = line.rstrip("\n").split("\t")
            if len(parts) >= 4:
                # parts: codepoint, char, key, definition
                ch = parts[1]
                definition = parts[3]
                if isinstance(ch, str) and ch:
                    out_map[ch] = {"definition": definition}

    with open(json_path, "w", encoding="utf-8") as outfh:
        json.dump(out_map, outfh, ensure_ascii=False, indent=2)
    print(f"Wrote {len(out_map)} entries to {json_path}")
else:
    print(f"TSV file not found at {tsv_path}")
