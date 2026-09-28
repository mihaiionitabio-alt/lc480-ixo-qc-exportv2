import os, json, sys, time
sys.path.insert(0, "/home/claude/atlas")
from cases import CASES
from extract import extract

root = "/home/claude/atlas/shots"
todo = sys.argv[1:] or list(CASES)
for code in todo:
    for side in ("good", "bad"):
        out = f"{root}/{code}/{side}"
        if os.path.exists(out + "/manifest.json"):
            print("skip", code, side); continue
        t = time.time()
        m = extract(CASES[code][side], out, timeout_s=420)
        print(code, side, "runs", m.get("runs"), "exported", len(m["items"]),
              "errors", len(m["errors"]), f"{time.time()-t:.0f}s", flush=True)
        if m["errors"][:2]: print("   ", m["errors"][:2], flush=True)
