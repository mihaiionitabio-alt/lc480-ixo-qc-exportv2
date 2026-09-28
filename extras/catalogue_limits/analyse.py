"""Per catalogue entry: what the real and vendor files actually contain, and the
limit that follows from it. Where nothing in the corpus feeds an entry, the limit
is the theoretical one and the data set is invented inside it."""
import json, os, re, csv, math, random, statistics as st
import datetime as dt

SRC = {"laboratory files (pseudonymised)": "real",
       "vendor demo, .ixo format": "roche",
       "vendor demo, .eds format": "thermo"}
FAMILY = {"laboratory files (pseudonymised)": "LightCycler-format (.ixo)",
          "vendor demo, .ixo format": "LightCycler-format (.ixo)",
          "vendor demo, .eds format": "QuantStudio-format (.eds)"}
PLUMBING = {"x", "plotted", "i", "idx", "index", "_source", "order"}
defs = json.load(open("defs.json"))
CC = {("cc:" + c["id"]): c for c in defs["cc"]}
GR = {("img:" + g["id"]): g for g in defs["graphs"]}

# ------------------------------------------------------------ pseudonyms ----
ID_FIELDS = re.compile(r"^(sample|sampleid|sample name|name|experiment|run|file|series|"
                       r"notes|subset|plate|barcode|operator|technician|analyst|instrument|"
                       r"target|target name|assay|study|group|well group)$", re.I)
_map, _n = {}, {"SAMPLE": 0, "RUN": 0, "TARGET": 0, "PERSON": 0, "PLATE": 0, "OTHER": 0}
def pseudo(field, value):
    v = str(value)
    if v == "" or re.fullmatch(r"[-+0-9.eE ,:/]*", v): return value
    f = field.lower()
    kind = ("RUN" if f in ("experiment", "run", "file") else
            "TARGET" if "target" in f or f == "assay" else
            "PERSON" if f in ("operator", "technician", "analyst") else
            "PLATE" if f in ("plate", "barcode", "instrument") else
            "SAMPLE" if f in ("sample", "sampleid", "sample name", "name") else "OTHER")
    key = (kind, v)
    if key not in _map:
        _n[kind] += 1
        _map[key] = f"{kind}-{_n[kind]:03d}"
    return _map[key]

LAB_PAT = re.compile(r"SC[ _-]?\d|GM\d{2}|_VV\b|EURL|Seminte|\.ixo|\.eds|\.edt|"
                     r"\bDemo\b|SYBR|HybProbe|TaqMan|QuantStudio|LightCycler|Roche|Thermo|"
                     r"Applied\s*Biosystems|RNaseP|GTxpress|MMx", re.I)

def clean_rows(rows):
    """Anything that names a file, a run, a sample, a person or a product is replaced."""
    out = []
    for r in rows:
        o = {}
        for k, v in r.items():
            key = str(k).strip()
            if ID_FIELDS.match(key):
                o[k] = pseudo(k, v)
            elif isinstance(v, str) and LAB_PAT.search(v):
                o[k] = pseudo(key if ID_FIELDS.match(key) else "other", v)
            else:
                o[k] = v
        out.append(o)
    return out

# ------------------------------------------------------------- statistics ---
def numeric(vals):
    out = []
    for v in vals:
        if isinstance(v, bool): continue
        if isinstance(v, (int, float)) and math.isfinite(v): out.append(float(v)); continue
        if isinstance(v, str):
            s = v.strip().replace(",", "")
            if re.fullmatch(r"[-+]?\d*\.?\d+([eE][-+]?\d+)?", s):
                f = float(s)
                if math.isfinite(f): out.append(f)
    return out

def pct(a, q):
    if not a: return None
    a = sorted(a); k = (len(a) - 1) * q
    lo, hi = math.floor(k), math.ceil(k)
    return a[lo] if lo == hi else a[lo] + (a[hi] - a[lo]) * (k - lo)

def describe(a):
    if not a: return None
    med = st.median(a)
    mad = st.median([abs(x - med) for x in a]) or 0.0
    return dict(n=len(a), min=min(a), p01=pct(a, .01), p05=pct(a, .05), p25=pct(a, .25),
                median=med, p75=pct(a, .75), p95=pct(a, .95), p99=pct(a, .99), max=max(a),
                mean=st.fmean(a), sd=(st.pstdev(a) if len(a) > 1 else 0.0), mad=mad)

# --------------------------------------------------------- theory fallback --
def theory_for(entry, col, unit):
    u = (unit or "").lower(); c = (col or "").lower()
    T = [(r"°c/s", (0.5, 6.0)), (r"°c from setpoint", (-1.0, 1.0)), (r"^°c$", (20.0, 110.0)),
         (r"\bms\b", (0.0, 2000.0)), (r"^s$|second", (0.0, 120.0)), (r"^%$|percent|rate", (0.0, 100.0)),
         (r"^h$|hour", (0.0, 168.0)), (r"count|n$", (0.0, 400.0)), (r"^ma$", (0.0, 500.0)),
         (r"cq|ct\b|cycle", (5.0, 45.0)), (r"efficien", (0.70, 1.30)), (r"^r2$|r²", (0.90, 1.00)),
         (r"slope", (-4.5, -2.8)), (r"fluor|rn\b|signal", (0.0, 1e7)), (r"sd$|spread", (0.0, 1.0))]
    for pat, rng in T:
        if re.search(pat, u) or re.search(pat, c): return rng, f"theoretical range for {unit or col}"
    return (0.0, 100.0), "theoretical range, generic"

def spec_limit(entry, family=None):
    """The manufacturer figure the chart definition carries, for the matching instrument."""
    d = CC.get(entry)
    if not d or not d.get("spec"): return None
    key = ("LC" if (family or "").startswith("Light") else
           "QS" if (family or "").startswith("Quant") else None)
    s = d["spec"].get(key) if key else None
    if not isinstance(s, dict) or (s.get("lo") is None and s.get("hi") is None): return None
    return s.get("lo"), s.get("hi")

# ------------------------------------------------------------------ build ---
data = {name: json.load(open(f"{d}/rows.json")) for name, d in SRC.items()}
entries = {}
for name, blob in data.items():
    for eid, e in blob["entries"].items():
        entries.setdefault(eid, {})[name] = e

limit_rows, sets, summary = [], {}, []
os.makedirs("datasets", exist_ok=True)
rng = random.Random(20260925)

for eid in sorted(entries):
    per = entries[eid]
    title = (CC.get(eid) or GR.get(eid) or {}).get("title", "")
    unit = (CC.get(eid) or {}).get("unit", "")
    group = (CC.get(eid) or GR.get(eid) or {}).get("group", "")
    merged, cover = [], {}
    for name, e in per.items():
        rws = e.get("rows") or []
        cover[name] = len(rws)
        for r in clean_rows(rws):
            rr = dict(r); rr["_source"] = name; merged.append(rr)
    cols = []
    for r in merged[:4000]:
        for k in r:
            if k != "_source" and k not in cols: cols.append(k)
    invented = not merged
    if invented:
        # nothing in the corpus feeds this entry: invent inside the theoretical limit
        sp = spec_limit(eid, None)
        rngv, basis = theory_for(eid, "value", unit)
        lo, hi = (sp[0] if sp and sp[0] is not None else rngv[0],
                  sp[1] if sp and sp[1] is not None else rngv[1])
        if sp: basis = "manufacturer specification in the chart definition"
        centre = (lo + hi) / 2 if hi > lo else lo
        spread = (hi - lo) / 8 if hi > lo else 1.0
        day = dt.date(2026, 1, 9)
        rows = []
        for i in range(1, 21):
            v = centre + rng.gauss(0, spread)
            v = min(hi, max(lo, v))
            rows.append(dict(run=f"RUN-{i:02d}", date=(day + dt.timedelta(days=12 * (i - 1))).isoformat(),
                             instrument="INSTRUMENT-1", value=round(v, 4),
                             limit_low=lo, limit_high=hi, origin="invented within the theoretical limit"))
        merged = rows; cols = list(rows[0]); cover = {k: 0 for k in SRC}
        limit_rows.append(dict(entry=eid, title=title, group=group, column="value", unit=unit, family="both",
                               n_real=0, n_vendor_ixo=0, n_vendor_eds=0, n_total=0,
                               observed_min="", observed_p05="", observed_median="",
                               observed_p95="", observed_max="", observed_sd="",
                               limit_low=lo, limit_high=hi, basis=basis,
                               data_origin="invented within the theoretical limit"))
    else:
        for col in cols:
            if col in PLUMBING: continue
            vals_by_src = {n: numeric([r.get(col) for r in merged if r["_source"] == n]) for n in SRC}
            for fam in sorted(set(FAMILY.values())):
              allv = [v for n, a in vals_by_src.items() for v in a if FAMILY[n] == fam]
              d = describe(allv)
              if not d or d["n"] < 3:
                census = {}
                for r in merged:
                    v = str(r.get(col, ""))
                    if v: census[v] = census.get(v, 0) + 1
                top = sorted(census.items(), key=lambda kv: -kv[1])[:6]
                if fam != sorted(set(FAMILY.values()))[0]: continue
                limit_rows.append(dict(entry=eid, title=title, group=group, column=col, unit="",
                    family="all sources",
                    n_real=cover.get("laboratory files (pseudonymised)", 0),
                    n_vendor_ixo=cover.get("vendor demo, .ixo format", 0),
                    n_vendor_eds=cover.get("vendor demo, .eds format", 0),
                    n_total=len(merged), observed_min="", observed_p05="", observed_median="",
                    observed_p95="", observed_max="", observed_sd="",
                    limit_low="", limit_high="",
                    basis="categorical — allowed values: " + "; ".join(f"{k} ({n})" for k, n in top),
                    data_origin="measured in the corpus"))
                continue
              k = 1.4826 * d["mad"]
              lo = d["median"] - 3 * k if k > 0 else d["min"]
              hi = d["median"] + 3 * k if k > 0 else d["max"]
              lo, hi = min(lo, d["p01"]), max(hi, d["p99"])
              basis = ("measured: median ± 3 robust SD, widened to the 1st–99th percentile"
                     if d["n"] >= 20 else f"measured on only {d['n']} values: observed range")
              if d["n"] < 20: lo, hi = d["min"], d["max"]
              trng, tbasis = theory_for(eid, col, unit)
              lo = max(lo, trng[0]); hi = min(hi, trng[1])
              if hi <= lo: lo, hi = d["min"], d["max"]
              if d["mad"] == 0 and d["n"] >= 3:
                  lo, hi = d["min"], d["max"]
                  basis = f"measured, every value identical across {d['n']} readings"
              sp = spec_limit(eid, fam)
              if sp:
                if sp[0] is not None: lo = sp[0]; 
                if sp[1] is not None: hi = sp[1]
                basis = "manufacturer specification in the chart definition, observed values beside it"
              limit_rows.append(dict(entry=eid, title=title, group=group, column=col, unit=unit,
                family=fam,
                n_real=len([v for v in vals_by_src["laboratory files (pseudonymised)"]]) if fam.startswith("Light") else 0,
                n_vendor_ixo=len(vals_by_src["vendor demo, .ixo format"]) if fam.startswith("Light") else 0,
                n_vendor_eds=len(vals_by_src["vendor demo, .eds format"]) if fam.startswith("Quant") else 0,
                n_total=d["n"], observed_min=round(d["min"], 5), observed_p05=round(d["p05"], 5),
                observed_median=round(d["median"], 5), observed_p95=round(d["p95"], 5),
                observed_max=round(d["max"], 5), observed_sd=round(d["sd"], 5),
                limit_low=round(lo, 5), limit_high=round(hi, 5), basis=basis,
                data_origin="measured in the corpus"))
    safe = eid.replace(":", "_")
    with open(f"datasets/{safe}.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols + (["_source"] if not invented else []),
                           extrasaction="ignore")
        w.writeheader(); w.writerows(merged[:2000])
    summary.append(dict(entry=eid, title=title, group=group, rows=len(merged),
                        columns=len(cols), invented=invented,
                        n_real=cover.get("laboratory files (pseudonymised)", 0),
                        n_vendor_ixo=cover.get("vendor demo, .ixo format", 0),
                        n_vendor_eds=cover.get("vendor demo, .eds format", 0)))

fields = []
for r in limit_rows:
    for k in r:
        if k not in fields: fields.append(k)
order = ["entry", "title", "group", "column", "unit", "family"]
fields = order + [f for f in fields if f not in order]
with open("catalogue_limits.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=fields, restval=""); w.writeheader(); w.writerows(limit_rows)
with open("catalogue_datasets_summary.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(summary[0])); w.writeheader(); w.writerows(summary)
json.dump(limit_rows, open("catalogue_limits.json", "w"), indent=1)
json.dump({"pseudonyms": len(_map), "by_kind": _n}, open("pseudonym_counts.json", "w"), indent=1)
print("entries", len(summary), "limit rows", len(limit_rows),
      "invented entries", sum(1 for s in summary if s["invented"]),
      "pseudonyms", len(_map), _n)
