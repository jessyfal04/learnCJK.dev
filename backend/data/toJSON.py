with open("kDefinition.tsv", "r", encoding="utf-8") as f:
    for line in f:
        parts = line.strip().split("\t")
        if len(parts) >= 4:
            codepoint, char, key, definition = parts[0], parts[1], parts[2], parts[3]
            kdef_cache[char] = definition
