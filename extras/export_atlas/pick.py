import os, json, glob, csv, io
import numpy as np
from PIL import Image

ROOT = "/home/claude/atlas/shots"
import cases as _c
CASES = list(_c.CASES)

def imgdiff(a, b):
    """How much of what was drawn actually moved, as a share of the ink on the page."""
    ia, ib = Image.open(a).convert("L"), Image.open(b).convert("L")
    if ia.size != ib.size:
        ib = ib.resize(ia.size)
    A, B = np.asarray(ia, float), np.asarray(ib, float)
    d = np.abs(A - B) > 18
    ink = (A < 235) | (B < 235)
    n = int(ink.sum())
    if n < 200:
        return 0.0, 0.0
    return float(np.abs(A - B).mean()), float(100.0 * (d & ink).sum() / n)

def csvdiff(a, b):
    ra = list(csv.reader(open(a))); rb = list(csv.reader(open(b)))
    if not ra or not rb: return 0.0, 0.0
    ha, hb = ra[0], rb[0]
    rows = abs(len(ra) - len(rb))
    n = min(len(ra), len(rb)); cells = 0; tot = 0
    for i in range(1, n):
        for j in range(min(len(ra[i]), len(rb[i]))):
            tot += 1
            if ra[i][j] != rb[i][j]: cells += 1
    pct = 100.0 * cells / tot if tot else 0.0
    return float(rows), pct

out = {}
cat = {}
def pairs_for(c):
    k = _c.CASES[c]["kind"]
    return ([("good", "bad", "single")] if k == "single"
            else [("good", "late", "series"), ("first", "last", "run")])
for c in CASES:
  for ga_, ba_, mode in pairs_for(c):
    if not (os.path.exists(f"{ROOT}/{c}/{ga_}/manifest.json")
            and os.path.exists(f"{ROOT}/{c}/{ba_}/manifest.json")): continue
    mg = json.load(open(f"{ROOT}/{c}/{ga_}/manifest.json"))
    mb = json.load(open(f"{ROOT}/{c}/{ba_}/manifest.json"))
    bad = {i["id"]: i for i in mb["items"]}
    for it in mg["items"]:
        i = it["id"]
        if i not in bad: continue
        cat.setdefault(i, it)
        ga = f"{ROOT}/{c}/{ga_}/{it['file']}"; ba = f"{ROOT}/{c}/{ba_}/{bad[i]['file']}"
        if not (os.path.exists(ga) and os.path.exists(ba)): continue
        if it["kind"] == "image":
            m, pct = imgdiff(ga, ba)
            score = pct
        else:
            rows, pct = csvdiff(ga, ba)
            m, score = rows, pct
        out.setdefault(i, []).append(dict(case=c, mode=mode, score=round(score, 3),
                                          metric=round(m, 3), good=ga, bad=ba,
                                          goodFiles=mg["files"], badFiles=mb["files"]))
best = {}
for i, lst in out.items():
    lst.sort(key=lambda x: -x["score"])
    best[i] = dict(item=cat[i], best=lst[0], all=lst)
json.dump(best, open("/home/claude/atlas/best.json", "w"), indent=1)

import collections
print("items compared:", len(best))
print("with a visible difference (>0.3):", sum(1 for v in best.values() if v["best"]["score"] > 0.3))
print("case chosen:", collections.Counter(v["best"]["case"] for v in best.values()))
print("\nweakest 12:")
for i, v in sorted(best.items(), key=lambda kv: kv[1]["best"]["score"])[:12]:
    print(f"  {v['best']['score']:7.3f}  {i:34s} {v['item']['title'][:40]}")
print("\nstrongest 10:")
for i, v in sorted(best.items(), key=lambda kv: -kv[1]["best"]["score"])[:10]:
    print(f"  {v['best']['score']:7.3f}  {v['best']['case']:4s} {i:30s} {v['item']['title'][:40]}")
