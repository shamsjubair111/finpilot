"""Appends Bengali translations to src/lib/i18n/bn.ts, skipping keys that already exist.

Usage: python3 scripts/add-bn.py "Section comment" < translations.json   (JSON object: English -> Bengali)
"""
import json, re, sys

tr = json.load(sys.stdin)
path = "src/lib/i18n/bn.ts"
src = open(path, encoding="utf-8").read().rstrip()
existing = {m.group(1) for m in re.finditer(r'^\s*"((?:[^"\\]|\\.)*)"\s*:', src, re.M)} | {m.group(1) for m in re.finditer(r"^\s*([A-Za-z]\w*)\s*:", src, re.M)}
new = {k: v for k, v in tr.items() if json.dumps(k, ensure_ascii=False)[1:-1] not in existing}
assert src.endswith("};"), "bn.ts must end with '};'"
body = f"  // {sys.argv[1] if len(sys.argv) > 1 else 'Added'}\n" + "".join(f"  {json.dumps(k, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False)},\n" for k, v in new.items())
open(path, "w", encoding="utf-8").write(src[:-2].rstrip() + "\n" + body + "};\n")
print("added", len(new))
