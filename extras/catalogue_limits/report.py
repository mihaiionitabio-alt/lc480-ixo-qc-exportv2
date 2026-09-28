import csv, json, collections, datetime as dt, textwrap
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

INK, TEAL, AMBER, RED, GREY = "#102f4d", "#0d8790", "#e7a12c", "#b03a2e", "#64757f"
MONO = ["DejaVu Sans Mono"]; W, H = 11.69, 8.27
L = list(csv.DictReader(open("catalogue_limits.csv")))
S = list(csv.DictReader(open("catalogue_datasets_summary.csv")))
num = [r for r in L if r["limit_low"] not in ("", "None")]
cat = [r for r in L if r["limit_low"] in ("", "None")]
defs = json.load(open("defs.json"))

def mark(fig, x=0.028, y=0.972):
    fig.text(x, y, "MISSY", family=MONO, fontsize=12.5, color=INK, weight="bold", va="top")
    fig.text(x, y - 0.033, "RUO", family=MONO, fontsize=7.4, color=TEAL, weight="bold", va="top")
    fig.text(x + 0.029, y - 0.033, "NOT VALIDATED", family=MONO, fontsize=7.4, color=AMBER,
             weight="bold", va="top")

def page(title, sub, n):
    fig = plt.figure(figsize=(W, H), facecolor="white"); mark(fig)
    fig.text(0.175, 0.972, title, fontsize=14.5, color=INK, va="top", weight="bold")
    fig.text(0.175, 0.932, sub, fontsize=9.2, color=GREY, va="top")
    fig.text(0.975, 0.972, str(n), family=MONO, fontsize=9, color=GREY, ha="right", va="top")
    return fig

def wrap(t, n): return "\n".join(textwrap.wrap(t, n))

COLS = [("entry", 0.030, 0.105), ("column", 0.140, 0.085), ("family", 0.228, 0.052),
        ("n", 0.285, 0.030), ("min", 0.320, 0.062), ("median", 0.385, 0.062),
        ("max", 0.450, 0.062), ("limit low", 0.520, 0.062), ("limit high", 0.588, 0.062),
        ("unit", 0.656, 0.060), ("basis", 0.720, 0.255)]

def fnum(v):
    try:
        f = float(v)
    except Exception:
        return str(v)[:11]
    if f == 0: return "0"
    a = abs(f)
    return f"{f:.4g}" if 1e-3 <= a < 1e6 else f"{f:.2e}"

out = "MISSY_catalogue_limits.pdf"
with PdfPages(out) as pdf:
    fig = plt.figure(figsize=(W, H), facecolor="white"); mark(fig, 0.06, 0.93)
    fig.text(0.06, 0.74, "Catalogue limits", fontsize=32, color=INK, weight="bold")
    fig.text(0.06, 0.665, "what every downloadable image and table actually contains,\n"
                          "and the limit that follows from it", fontsize=13, color=GREY, linespacing=1.6)
    fig.text(0.06, 0.45,
             f"{len(S)} catalogue entries · {len(num)} numeric limits · {len(cat)} categorical fields\n"
             f"{sum(1 for s in S if int(s['n_real'])>0)} entries fed by the laboratory files, "
             f"{sum(1 for s in S if int(s['n_vendor_ixo'])>0)} by the .ixo vendor demonstrations, "
             f"{sum(1 for s in S if int(s['n_vendor_eds'])>0)} by the .eds vendor demonstrations\n"
             f"{sum(1 for s in S if s['invented']=='True')} entries reach nothing in the corpus: their limit is "
             f"theoretical and their data set is invented inside it\n\n"
             f"Sample, run, target, operator and plate identifiers from the laboratory files are replaced by "
             f"pseudonyms\nbefore anything leaves the analysis. No laboratory identifier appears in this document "
             f"or in the data sets beside it.",
             fontsize=10.3, color=INK, linespacing=1.75)
    fig.text(0.06, 0.12, dt.date.today().isoformat(), family=MONO, fontsize=10, color=GREY)
    pdf.savefig(fig); plt.close(fig)
    n = 1

    # method
    fig = page("How the limits were obtained", "measured first, theoretical only where the corpus is silent", n)
    y = 0.85
    for head, body in (
        ("THE CORPUS",
         "Six laboratory .ixo experiments, ten vendor demonstration .ixo experiments and eight vendor "
         "demonstration .eds experiments were loaded into the page itself, and every catalogue entry was "
         "asked for the rows behind it — the numbers the figure plots or the table hands out, not the picture."),
        ("SEPARATION BY INSTRUMENT FAMILY",
         "Limits are derived separately for the .ixo family and the .eds family. Background fluorescence, "
         "passive reference level and timing are on different scales in the two, and a pooled limit would "
         "describe neither."),
        ("FROM MEASUREMENT",
         "With twenty or more values: the median plus and minus three robust standard deviations "
         "(1.4826 x the median absolute deviation), widened to the first and ninety-ninth percentile, then "
         "clamped to what is physically possible for that quantity. With fewer than twenty values the observed "
         "range is given as it stands and the count is stated, because three runs cannot define a limit."),
        ("FROM SPECIFICATION",
         "Where the chart definition carries a manufacturer figure for that instrument, that figure is the "
         "limit and the observed values are reported beside it."),
        ("INVENTED",
         "Where no file in the corpus feeds an entry, the limit is the theoretical range for the quantity and "
         "twenty points are generated inside it. Those rows carry the word invented in an origin column, and "
         "the entries are listed on their own page."),
        ("PSEUDONYMS",
         "852 distinct identifiers were replaced: 670 sample names, 72 run names, 26 targets, 18 plates and "
         "4 operator names. Vendor demonstration names are replaced on the same rule, so no product name "
         "appears either.")):
        fig.text(0.030, y, head, family=MONO, fontsize=8.2, color=TEAL, weight="bold", va="top")
        fig.text(0.030, y - 0.028, wrap(body, 150), fontsize=9.0, color=INK, va="top", linespacing=1.5)
        y -= 0.135
    pdf.savefig(fig); plt.close(fig); n += 1

    # coverage
    fig = page("What each source reaches", "entries fed by each kind of file", n)
    rows = sorted(S, key=lambda s: (-int(s["n_real"]), -int(s["n_vendor_eds"]), s["entry"]))
    y = 0.86
    fig.text(0.030, y + 0.035, "ENTRY", family=MONO, fontsize=7.4, color=TEAL, weight="bold")
    fig.text(0.300, y + 0.035, "ROWS FROM LABORATORY", family=MONO, fontsize=7.4, color=TEAL, weight="bold")
    fig.text(0.470, y + 0.035, "FROM .IXO DEMOS", family=MONO, fontsize=7.4, color=TEAL, weight="bold")
    fig.text(0.620, y + 0.035, "FROM .EDS DEMOS", family=MONO, fontsize=7.4, color=TEAL, weight="bold")
    fig.text(0.770, y + 0.035, "COLUMNS", family=MONO, fontsize=7.4, color=TEAL, weight="bold")
    per = 27
    def cov_head(fig, y):
        fig.text(0.030, y + 0.035, "ENTRY", family=MONO, fontsize=7.4, color=TEAL, weight="bold")
        fig.text(0.300, y + 0.035, "ROWS FROM LABORATORY", family=MONO, fontsize=7.4, color=TEAL, weight="bold")
        fig.text(0.470, y + 0.035, "FROM .IXO DEMOS", family=MONO, fontsize=7.4, color=TEAL, weight="bold")
        fig.text(0.620, y + 0.035, "FROM .EDS DEMOS", family=MONO, fontsize=7.4, color=TEAL, weight="bold")
        fig.text(0.770, y + 0.035, "COLUMNS", family=MONO, fontsize=7.4, color=TEAL, weight="bold")
    for k in range(0, len(rows), per):
        if k:
            pdf.savefig(fig); plt.close(fig); n += 1
            fig = page("What each source reaches", "continued", n); y = 0.86
            cov_head(fig, y)
        yy = y
        for s in rows[k:k + per]:
            col = RED if s["invented"] == "True" else INK
            fig.text(0.030, yy, s["entry"][:34], family=MONO, fontsize=6.6, color=col, va="top")
            fig.text(0.300, yy, s["n_real"], family=MONO, fontsize=6.6, color=GREY, va="top")
            fig.text(0.470, yy, s["n_vendor_ixo"], family=MONO, fontsize=6.6, color=GREY, va="top")
            fig.text(0.620, yy, s["n_vendor_eds"], family=MONO, fontsize=6.6, color=GREY, va="top")
            fig.text(0.770, yy, s["columns"] + ("   invented" if s["invented"] == "True" else ""),
                     family=MONO, fontsize=6.6, color=col, va="top")
            yy -= 0.0295
    pdf.savefig(fig); plt.close(fig); n += 1

    # numeric limits
    order = sorted(num, key=lambda r: (r["entry"], r["column"], r["family"]))
    per = 26
    for k in range(0, len(order), per):
        fig = page("Limits from the data", "one row per entry, column and instrument family", n)
        y = 0.855
        for head, x, _ in COLS:
            fig.text(x, y + 0.035, head.upper(), family=MONO, fontsize=6.6, color=TEAL, weight="bold")
        for r in order[k:k + per]:
            vals = [r["entry"][:26], r["column"][:20], ("LC" if r["family"].startswith("Light")
                    else "QS" if r["family"].startswith("Quant") else "both"),
                    r["n_total"], fnum(r["observed_min"]), fnum(r["observed_median"]),
                    fnum(r["observed_max"]), fnum(r["limit_low"]), fnum(r["limit_high"]),
                    (r["unit"] or "")[:10], r["basis"][:62]]
            col = RED if "invented" in r.get("data_origin", "") else INK
            for (h, x, _), v in zip(COLS, vals):
                fig.text(x, y, str(v), family=MONO, fontsize=6.2,
                         color=(GREY if h in ("basis", "unit") else col), va="top")
            y -= 0.0305
        pdf.savefig(fig); plt.close(fig); n += 1

    # invented entries
    inv = [r for r in num if "invented" in r.get("data_origin", "")]
    fig = page("Entries the corpus does not reach", "theoretical limit, data set generated inside it", n)
    y = 0.85
    fig.text(0.030, y + 0.04, "ENTRY", family=MONO, fontsize=7.4, color=TEAL, weight="bold")
    fig.text(0.230, y + 0.04, "LIMIT", family=MONO, fontsize=7.4, color=TEAL, weight="bold")
    fig.text(0.380, y + 0.04, "BASIS", family=MONO, fontsize=7.4, color=TEAL, weight="bold")
    for r in inv:
        fig.text(0.030, y, r["entry"], family=MONO, fontsize=7.4, color=RED, va="top")
        fig.text(0.230, y, f"{fnum(r['limit_low'])} .. {fnum(r['limit_high'])} {r['unit']}",
                 family=MONO, fontsize=7.4, color=INK, va="top")
        fig.text(0.380, y, r["basis"][:76], fontsize=7.4, color=GREY, va="top")
        y -= 0.036
    fig.text(0.030, y - 0.03, wrap(
        "Twenty points were generated for each of these, evenly spaced over a year, normally distributed about "
        "the middle of the range and clipped to it. Every row carries an origin column saying so. They exist to "
        "exercise the chart, not to describe an instrument.", 150),
        fontsize=9, color=INK, va="top", linespacing=1.5)
    pdf.savefig(fig); plt.close(fig); n += 1

    # categorical summary
    bycat = collections.defaultdict(list)
    for r in cat: bycat[r["entry"]].append(r)
    fig = page("Fields that are not numbers", "the values seen in the corpus define what is allowed", n)
    y = 0.855
    fig.text(0.030, y + 0.035, "ENTRY", family=MONO, fontsize=7.0, color=TEAL, weight="bold")
    fig.text(0.230, y + 0.035, "FIELD", family=MONO, fontsize=7.0, color=TEAL, weight="bold")
    fig.text(0.380, y + 0.035, "VALUES SEEN", family=MONO, fontsize=7.0, color=TEAL, weight="bold")
    per = 26; shown = 0
    for eid in sorted(bycat):
        for r in bycat[eid][:3]:
            if shown and shown % per == 0:
                pdf.savefig(fig); plt.close(fig); n += 1
                fig = page("Fields that are not numbers", "continued", n); y = 0.855
            fig.text(0.030, y, eid[:30], family=MONO, fontsize=6.3, color=INK, va="top")
            fig.text(0.230, y, r["column"][:24], family=MONO, fontsize=6.3, color=INK, va="top")
            fig.text(0.380, y, r["basis"].replace("categorical — allowed values: ", "")[:104],
                     fontsize=6.3, color=GREY, va="top")
            y -= 0.0305; shown += 1
    pdf.savefig(fig); plt.close(fig); n += 1
print("pages", n, out)
