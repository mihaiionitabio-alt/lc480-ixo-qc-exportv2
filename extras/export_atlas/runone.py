import os, sys, time
sys.path.insert(0, "/home/claude/atlas")
from cases import CASES
from extract import extract
root = "/home/claude/atlas/shots"
for code, c in CASES.items():
    if c["kind"] != "series": continue
    for side, files in (("first", [c["good"][0]]), ("last", [c["bad"][-1]])):
        out = f"{root}/{code}/{side}"
        if os.path.exists(out + "/manifest.json"): continue
        m = extract(files, out, timeout_s=120)
        print(code, side, os.path.basename(files[0]), "exported", len(m["items"]), flush=True)
