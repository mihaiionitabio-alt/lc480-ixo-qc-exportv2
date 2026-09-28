"""Landscape atlas: every downloadable image and table, good beside error."""
import json, os, csv, textwrap, datetime as dt
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from PIL import Image

INK, TEAL, AMBER, RED, GREY = "#102f4d", "#0d8790", "#e7a12c", "#b03a2e", "#64757f"
MONO = ["DejaVu Sans Mono"]
W, H = 11.69, 8.27                                   # A4 landscape

best = json.load(open("best.json"))
dev = {s["code"]: s for s in json.load(open(
    "/mnt/user-data/uploads/IXO/release_unified_2026-09-21_r2/demo_data/scenario_deviations.json"
))["scenarios"]}
reasons = {r["id"]: r for r in json.load(open("reasons.json"))}

def mark(fig, x=0.028, y=0.972):
    fig.text(x, y, "MISSY", family=MONO, fontsize=13, color=INK, weight="bold", va="top")
    fig.text(x, y - 0.033, "RUO", family=MONO, fontsize=7.6, color=TEAL, weight="bold", va="top")
    fig.text(x + 0.030, y - 0.033, "NOT VALIDATED", family=MONO, fontsize=7.6, color=AMBER,
             weight="bold", va="top")

def page(pdf, title, subtitle, n=None):
    fig = plt.figure(figsize=(W, H), facecolor="white")
    mark(fig)
    fig.text(0.175, 0.972, title, fontsize=15, color=INK, va="top", weight="bold")
    fig.text(0.175, 0.930, subtitle, fontsize=9.5, color=GREY, va="top")
    if n is not None:
        fig.text(0.975, 0.972, str(n), family=MONO, fontsize=9.5, color=GREY, ha="right", va="top")
    fig.text(0.975, 0.020, "generated data — nothing measured", family=MONO, fontsize=7.2,
             color="#9aa7b1", ha="right")
    return fig

def trim(im, pad=6):
    g = im.convert("L")
    a = 255 - np.asarray(g)
    ys, xs = np.where(a > 12)
    if not len(xs): return im
    x0, x1 = max(0, xs.min() - pad), min(im.width, xs.max() + pad)
    y0, y1 = max(0, ys.min() - pad), min(im.height, ys.max() + pad)
    return im.crop((x0, y0, x1, y1))

def put_image(fig, rect, path, label, colour):
    """Fit the image to the rect keeping its aspect, anchored to the top."""
    im = trim(Image.open(path))
    x, y, w, h = rect
    page_ar = W / H
    ar = im.width / im.height
    hh = min(h, w * page_ar / ar)
    ww = min(w, h * ar / page_ar)
    ax = fig.add_axes([x + (w - ww) / 2, y + (h - hh), ww, hh]); ax.axis("off")
    ax.imshow(np.asarray(im))
    fig.text(x, y + h + 0.014, label, family=MONO, fontsize=8.6, color=colour, weight="bold")
    return y + (h - hh)

def read_csv(path, nrow=10, ncol=7):
    rows = list(csv.reader(open(path)))[:nrow + 1]
    if not rows: return [], []
    head = rows[0][:ncol]
    body = [r[:ncol] for r in rows[1:]]
    return head, body

def put_table(fig, rect, path, other, label, colour):
    head, body = read_csv(path)
    ohead, obody = read_csv(other)
    ax = fig.add_axes(rect); ax.axis("off")
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    if not head:
        ax.text(0.5, 0.5, "no rows", ha="center", color=GREY); return
    ncol = len(head)
    colw = 1.0 / ncol
    for j, h in enumerate(head):
        ax.text(j * colw + 0.004, 0.965, str(h)[:24], family=MONO, fontsize=6.0,
                color=INK, weight="bold", va="top")
    ax.plot([0, 1], [0.945, 0.945], color="#cfd8de", lw=0.8)
    for i, r in enumerate(body):
        y = 0.90 - i * 0.086
        for j in range(ncol):
            v = r[j] if j < len(r) else ""
            changed = (i < len(obody) and j < len(obody[i]) and obody[i][j] != v)
            ax.text(j * colw + 0.004, y, str(v)[:24], family=MONO, fontsize=5.9,
                    color=(RED if changed else "#34495e"), va="top",
                    weight="bold" if changed else "normal")
    fig.text(rect[0], rect[1] + rect[3] + 0.012, label, family=MONO, fontsize=9,
             color=colour, weight="bold")

def wrap(t, n=150):
    return "\n".join(textwrap.wrap(t, n)) if t else ""

def block(fig, x, y, head, text, wchars=96, colour=INK):
    fig.text(x, y, head, family=MONO, fontsize=8.2, color=TEAL, weight="bold", va="top")
    fig.text(x, y - 0.026, wrap(text, wchars), fontsize=8.6, color=colour, va="top",
             linespacing=1.45)

def interpretation(item, entry, d):
    """What the difference means, from the scenario record and the measurement."""
    m = entry["best"]
    kind = "table" if item["kind"] == "data" else "figure"
    mode = {"run": "the first run of the series beside its last run",
            "series": "the first eight runs of the series beside its last eight",
            "single": "the sound file beside the deviating one"}[m["mode"]]
    if kind == "table":
        lead = (f"{m['metric']:.0f} more or fewer rows and {m['score']:.1f} % of the shared "
                f"cells differ between the two sides.")
    else:
        lead = f"{m['score']:.0f} % of everything drawn on the figure moved between the two sides."
    return (f"{lead} The deviating side is {mode} of {m['case']}, {d['title'].lower()}. "
            f"Onset: {d['onset']}. {d['development']} What to look at: {d['evidence']}")

# ------------------------------------------------------------------ build ---
MIN_IMG, MIN_TAB = 20.0, 2.0
order_img = [i for i, v in best.items() if v["item"]["kind"] == "image" and v["best"]["score"] >= MIN_IMG]
order_tab = [i for i, v in best.items() if v["item"]["kind"] != "image" and v["best"]["score"] >= MIN_TAB]
order_img.sort(key=lambda i: (best[i]["item"]["group"], best[i]["item"]["title"]))
order_tab.sort(key=lambda i: best[i]["item"]["title"])
flat = [i for i, v in best.items() if i not in order_img and i not in order_tab]
flat.sort(key=lambda i: (best[i]["item"]["group"], best[i]["item"]["title"]))

out = "/home/claude/atlas/MISSY_export_atlas.pdf"
with PdfPages(out) as pdf:
    # cover
    fig = plt.figure(figsize=(W, H), facecolor="white"); mark(fig, 0.06, 0.93)
    fig.text(0.06, 0.74, "Export atlas", fontsize=34, color=INK, weight="bold")
    fig.text(0.06, 0.66, "every image and table the page offers for download,\n"
                         "shown once as it looks on a sound run and once on a deviating one",
             fontsize=13.5, color=GREY, linespacing=1.6)
    fig.text(0.06, 0.45,
             f"{len(order_img)+len(order_tab)} of {len(best)} catalogue entries are exercised by the "
             f"demonstration data and appear with a pair of figures.\n"
             f"{len(flat)} entries are listed at the end with the page's own reason for showing nothing.\n\n"
             f"Every figure was produced by loading generated experiment files into the page itself and "
             f"exporting through its own download path.\nNo value in this document was measured.",
             fontsize=10.5, color=INK, linespacing=1.7)
    fig.text(0.06, 0.12, dt.date.today().isoformat(), family=MONO, fontsize=10, color=GREY)
    pdf.savefig(fig); plt.close(fig)

    n = 1
    for section, ids in (("Figures", order_img), ("Tables", order_tab)):
        for i in ids:
            v = best[i]; it = v["item"]; m = v["best"]
            d = dev.get(m["case"], dict(title=m["case"], onset="", development="", evidence=""))
            fig = page(pdf, f"{it['title']}", f"{i}  ·  {it['group']}  ·  {section.lower()[:-1]}", n)
            gl = "SOUND  " + ", ".join(m["goodFiles"][:2]) + (
                f"  (+{len(m['goodFiles'])-2} more)" if len(m["goodFiles"]) > 2 else "")
            bl = "DEVIATION  " + ", ".join(m["badFiles"][-2:]) + (
                f"  ({len(m['badFiles'])} files)" if len(m["badFiles"]) > 2 else "")
            if it["kind"] == "image":
                b1 = put_image(fig, [0.030, 0.330, 0.463, 0.545], m["good"], gl, TEAL)
                b2 = put_image(fig, [0.507, 0.330, 0.463, 0.545], m["bad"], bl, RED)
                top = min(b1, b2) - 0.045
            else:
                put_table(fig, [0.030, 0.330, 0.463, 0.545], m["good"], m["bad"], gl, TEAL)
                put_table(fig, [0.507, 0.330, 0.463, 0.545], m["bad"], m["good"], bl, RED)
                top = 0.300
            top = max(top, 0.300)
            block(fig, 0.030, top, "WHAT IT SHOWS", it.get("note") or it["title"], 150)
            block(fig, 0.030, top - 0.095, "WHAT CHANGED AND WHAT IT MEANS",
                  interpretation(it, v, d), 150)
            others = [e for e in v["all"][1:6]]
            if others:
                fig.text(0.030, 0.062, "also moved by: " + ", ".join(
                    f"{e['case']} ({e['score']:.0f} %)" for e in others),
                    family=MONO, fontsize=7.4, color=GREY, va="top")
            pdf.savefig(fig); plt.close(fig); n += 1

    # part B
    per = 26
    for k in range(0, len(flat), per):
        chunk = flat[k:k + per]
        fig = page(pdf, "Not exercised by the demonstration data",
                   "the page draws these, but nothing in the present files feeds them — "
                   "its own message is quoted", n)
        y = 0.845
        fig.text(0.045, y + 0.035, "CATALOGUE ENTRY", family=MONO, fontsize=7.6,
                 color=TEAL, weight="bold")
        fig.text(0.415, y + 0.035, "WHAT THE PAGE SAYS", family=MONO, fontsize=7.6,
                 color=TEAL, weight="bold")
        for i in chunk:
            it = best[i]["item"]
            r = reasons.get(i, {})
            sc = best[i]["best"]["score"]
            msg = (r.get("text") or [r.get("error", "")])[0] if i in reasons else ""
            if not msg:
                msg = (f"drawn on both sides, but no scenario moves it by more than "
                       f"{sc:.0f} % of what it draws")
            fig.text(0.045, y, f"{i}", family=MONO, fontsize=6.8, color=INK, va="top")
            fig.text(0.185, y, it["title"][:34], fontsize=6.8, color="#34495e", va="top")
            fig.text(0.415, y, msg[:86], fontsize=6.8, color=GREY, va="top")
            y -= 0.0305
        pdf.savefig(fig); plt.close(fig); n += 1

    # method
    fig = page(pdf, "How this was made", "so any page in it can be reproduced", n)
    fig.text(0.045, 0.83, wrap(
        "Each scenario in the demonstration set was loaded into the page itself, running from index.html "
        "in a headless browser, through the same file input and the same Read step a person uses. Once the "
        "runs were decoded, the page's own export catalogue was enumerated and every entry that reported "
        "itself ready was produced through its own figure() or text() path — the same code that writes the "
        "PDF report and the bulk archive. Figures were rasterised with the page's own svgToJpeg at twice "
        "scale; tables were taken as the CSV the page hands out.", 155),
        fontsize=9.2, color=INK, va="top", linespacing=1.6)
    fig.text(0.045, 0.60, wrap(
        "Two sides were produced for every scenario. For a case that lives inside one run, the sound side is "
        "the normal file and the deviating side is the abnormal one. For a case that only appears across a "
        "series, the sound side is the first eight runs and the deviating side all twenty; and, because the "
        "run-level figures always draw the first run loaded, a second pair was produced from the first run "
        "alone against the last run alone.", 155),
        fontsize=9.2, color=INK, va="top", linespacing=1.6)
    fig.text(0.045, 0.40, wrap(
        "Every catalogue entry was then compared across all forty-eight scenarios and both pairings. For a "
        "figure the measure is the share of the drawing area whose grey value differs by more than 18 of 255; "
        "for a table it is the share of shared cells that differ, with the row-count difference beside it. The "
        "pair shown on each page is the one that moved that entry most, and the other scenarios that also "
        "moved it are named at the foot of the page. An entry that no scenario moved is listed at the end with "
        "the page's own reason, quoted from the figure it drew.", 155),
        fontsize=9.2, color=INK, va="top", linespacing=1.6)
    fig.text(0.045, 0.14, wrap(
        "All experiment files are generated. No sample, plate, operator, instrument or laboratory in them is "
        "real, and not one value in this document was measured.", 155),
        fontsize=9.2, color=RED, va="top", linespacing=1.6)
    pdf.savefig(fig); plt.close(fig)
print("pages", n, "->", out, os.path.getsize(out) / 1e6, "MB")
