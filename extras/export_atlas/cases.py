import glob, os
IXO  = "/home/claude/ixo/out"
EDS  = "/home/claude/eds/out"
RDML = "/home/claude/rdml/out"

def _dir(root, code):
    d = [p for p in glob.glob(f"{root}/{code}_*") if os.path.isdir(p)]
    return d[0] if d else None

def series(root, code, lo, hi, ext):
    d = _dir(root, code)
    if not d: return []
    return sorted(f for f in glob.glob(f"{d}/*{ext}")
                  if lo <= int(f.split("run")[-1].split(".")[0]) <= hi)

def single(root, code, which):
    d = _dir(root, code)
    return sorted(glob.glob(f"{d}/*_{which}.ixo")) if d else []

CASES = {}
for n in range(1, 9):
    c = f"S{n}"
    CASES[c] = dict(kind="single", family="IXO",
                    good=single(IXO, c, "normal"), bad=single(IXO, c, "abnormal"))
for n in list(range(9, 17)):
    c = f"S{n}"
    CASES[c] = dict(kind="series", family="IXO",
                    good=series(IXO, c, 1, 8, ".ixo"), bad=series(IXO, c, 1, 20, ".ixo"))
for n in range(19, 31):
    c = f"S{n}"
    CASES[c] = dict(kind="series", family="QuantStudio",
                    good=series(EDS, c, 1, 8, ".eds"), bad=series(EDS, c, 1, 20, ".eds"))
for n in range(31, 51):
    c = f"S{n}"
    CASES[c] = dict(kind="series", family="RDML",
                    good=series(RDML, c, 1, 8, ".rdml"), bad=series(RDML, c, 1, 20, ".rdml"))
CASES = {k: v for k, v in CASES.items() if v["good"] and v["bad"]}
