import os, sys
sys.path.insert(0, "/home/claude/atlas")
from cases import CASES, series, IXO, EDS, RDML
from extract import extract
root = "/home/claude/atlas/shots"
for code, c in CASES.items():
    if c["kind"] != "series": continue
    out = f"{root}/{code}/late"
    if os.path.exists(out + "/manifest.json"): continue
    files = c["bad"][-8:]
    m = extract(files, out, timeout_s=240)
    print(code, "late", len(files), "exported", len(m["items"]), flush=True)
