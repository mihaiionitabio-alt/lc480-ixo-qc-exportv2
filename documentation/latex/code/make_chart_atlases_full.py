#!/usr/bin/env python3
"""Build landscape A4 and A3 print atlases from the app's SVG chart export."""
from __future__ import annotations

import csv
import io
import json
import math
import re
import zipfile
from pathlib import Path

import cairosvg
import fitz

HERE = Path(__file__).resolve().parent
ZIP_PATH = HERE / "out" / "DEMO_control_charts_realscale.zip"
CATALOGUE_PATH = HERE / "catalogue.json"
OUT_DIR = HERE.parent
FONT = "helv"


def clean(s: str) -> str:
    s = str(s or "").replace("→", " to ").replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", s).strip()


def chart_catalogue() -> dict[str, dict]:
    data = json.loads(CATALOGUE_PATH.read_text(encoding="utf-8"))
    return {c["code"]: c for c in data["CC_CHARTS"]}


def fmt(x: str | float | None) -> str:
    try:
        n = float(x)
        return f"{n:.4g}"
    except (TypeError, ValueError):
        return ""


def spec_text(spec: dict, instrument: str, unit: str) -> str:
    ins = "QS" if instrument.startswith("QS") else "LC"
    bounds = spec.get(ins, {}) if isinstance(spec, dict) else {}
    if not bounds:
        return ""
    lo, hi = bounds.get("lo"), bounds.get("hi")
    if lo is not None and hi is not None:
        return f"Configured reference range: {fmt(lo)}–{fmt(hi)} {unit}."
    if lo is not None:
        return f"Configured minimum: {fmt(lo)} {unit}."
    if hi is not None:
        return f"Configured maximum: {fmt(hi)} {unit}."
    return ""


def limit_summary(csv_bytes: bytes) -> str:
    rows = list(csv.DictReader(io.StringIO(csv_bytes.decode("utf-8-sig", errors="replace"))))
    lows, highs = [], []
    for r in rows:
        try:
            v = float(r.get("value", ""))
            lo, hi = r.get("lcl", ""), r.get("ucl", "")
            if lo and v < float(lo):
                lows.append(v)
            if hi and v > float(hi):
                highs.append(v)
        except (ValueError, TypeError):
            pass
    out = []
    if lows:
        out.append(f"{len(lows)} point(s) below the lower control limit")
    if highs:
        out.append(f"{len(highs)} point(s) above the upper control limit")
    return "; ".join(out) if out else "No value is outside the displayed control limits."


def below_above(cat: dict) -> str:
    direction = cat.get("better", "target")
    if direction == "low":
        return ("Below minimum/LCL: lower than this instrument or series' established history; it may be a favorable shift, "
                "but still check whether the change is expected. Above maximum/UCL: unusually high and in the adverse direction; "
                "review run conditions, operator, reagent lot and maintenance records.")
    if direction == "high":
        return ("Below minimum/LCL: unusually low and in the adverse direction; review run conditions, operator, reagent lot "
                "and maintenance records. Above maximum/UCL: higher than established history; it may be favorable, but verify "
                "that the change is expected.")
    return ("Below minimum/LCL or above maximum/UCL: an unusual shift from this series' historical behaviour. For target-centred "
            "measures, either direction can matter; compare with the SOP/vendor acceptance range and investigate context.")


def page_text(page: fitz.Page, rect: fitz.Rect, text: str, size: float, color=(0.17, 0.20, 0.25)) -> float:
    return page.insert_textbox(rect, text, fontname=FONT, fontsize=size, color=color, lineheight=1.16, align=fitz.TEXT_ALIGN_LEFT)


def make_pdf(entries: list[tuple[str, bytes, bytes]], catmap: dict[str, dict], out_path: Path, a3: bool) -> None:
    width, height = ((1190.55, 841.89) if a3 else (841.89, 595.28))  # landscape, points
    margin = 34 if a3 else 27
    title_size = 18 if a3 else 14
    body_size = 11 if a3 else 8.6
    top_y = 27 if a3 else 22
    doc = fitz.open()
    cache = {}
    for name, svg, csv_bytes in entries:
        parts = name.split("/")
        folder = parts[0]
        fname = parts[-1]
        match = re.match(r"(?P<code>[A-Z]-[A-Z]\d+[a-z]?)_(?P<slug>.+)\.svg$", fname)
        if not match:
            continue
        code = match.group("code")
        cat = catmap.get(code, {})
        instrument = "QuantStudio" if folder.startswith("QS_") else "LightCycler"
        instrument_id = folder.split("_", 1)[-1]
        variant = ""
        if csv_bytes:
            try:
                variant = clean(next(csv.DictReader(io.StringIO(csv_bytes.decode("utf-8-sig", "replace"))), {}).get("variant", ""))
            except Exception:
                pass
        title = clean(cat.get("title") or match.group("slug").replace("_", " "))
        if variant:
            title = clean(f"{title} - {variant}")
        page = doc.new_page(width=width, height=height)
        page.draw_rect(page.rect, color=(0.84, 0.87, 0.90), width=0.5)
        page_text(page, fitz.Rect(margin, top_y, width-margin, top_y+25), title, title_size, (0.07,0.18,0.32))
        subtitle = f"{instrument} · {instrument_id} · {code} · {cat.get('unit','')} · SYNTHETIC DEMONSTRATION DATA"
        page_text(page, fitz.Rect(margin, top_y+27, width-margin, top_y+44), subtitle, body_size*0.90, (0.32,0.36,0.40))

        img_key = (name, 3 if a3 else 2)
        if img_key not in cache:
            cache[img_key] = cairosvg.svg2png(bytestring=svg, output_width=2640 if a3 else 1760)
        img = fitz.open(stream=cache[img_key], filetype="png")
        pix = img[0].get_pixmap()
        image_rect = fitz.Rect(margin, top_y+52, width-margin, height-(155 if a3 else 143))
        scale = min(image_rect.width/pix.width, image_rect.height/pix.height)
        iw, ih = pix.width*scale, pix.height*scale
        box = fitz.Rect((width-iw)/2, image_rect.y0+(image_rect.height-ih)/2, (width+iw)/2, image_rect.y0+(image_rect.height-ih)/2+ih)
        page.insert_image(box, pixmap=pix, keep_proportion=True)

        reading = clean(cat.get("reading") or cat.get("idea") or "Interpret this metric against its historical control limits and instrument records.")
        summary = limit_summary(csv_bytes) if csv_bytes else "Control-chart companion view (subgroup spread)."
        spec = spec_text(cat.get("spec", {}), instrument_id, cat.get("unit", ""))
        footer_top = height-(137 if a3 else 126)
        footer = fitz.Rect(margin, footer_top, width-margin, height-31)
        page.draw_rect(footer, color=(0.80,0.84,0.88), fill=(0.96,0.97,0.98), width=0.5)
        pad = 9 if a3 else 7
        page_text(page, fitz.Rect(margin+pad,footer_top+7,width-margin-pad,footer_top+25), "Interpretation: "+reading, body_size, (0.10,0.16,0.22))
        page_text(page, fitz.Rect(margin+pad,footer_top+27,width-margin-pad,footer_top+43), "Observed: "+summary+("  "+spec if spec else ""), body_size*0.92, (0.24,0.29,0.34))
        page_text(page, fitz.Rect(margin+pad,footer_top+45,width-margin-pad,height-37), below_above(cat)+" Control limits describe historical process variation; they are not automatically SOP acceptance limits. Confirm any decision against the approved method and instrument records.", body_size*0.86, (0.24,0.29,0.34))
        page.insert_text((width-margin-31,height-13), str(doc.page_count), fontsize=7, fontname=FONT, color=(0.4,0.4,0.4))
    doc.set_metadata({"title": "qPCR equipment and forensic control-chart atlas", "author": "Synthetic demonstration documentation", "subject": "Landscape chart atlas; control limits and interpretation"})
    out_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(out_path, deflate=True, garbage=4)
    print(f"{out_path}: {doc.page_count} pages, {out_path.stat().st_size:,} bytes")


def main() -> None:
    catmap = chart_catalogue()
    with zipfile.ZipFile(ZIP_PATH) as z:
        names = z.namelist()
        entries=[]
        for n in names:
            if not n.lower().endswith(".svg"):
                continue
            csv_name=n[:-4]+".csv"
            entries.append((n,z.read(n),z.read(csv_name) if csv_name in names else b""))
    if not entries:
        raise SystemExit("No SVG charts were found in the app export.")
    # Keep page order stable and group instruments, then chart codes.
    entries.sort(key=lambda e:(e[0].split("/")[0], re.search(r"/([A-Z]-[A-Z]\d+[a-z]?)_",e[0]).group(1) if re.search(r"/([A-Z]-[A-Z]\d+[a-z]?)_",e[0]) else e[0]))
    make_pdf(entries,catmap,OUT_DIR/"qPCR_control_charts_realscale_A4_landscape.pdf",False)
    make_pdf(entries,catmap,OUT_DIR/"qPCR_control_charts_realscale_A3_landscape.pdf",True)


if __name__ == "__main__":
    main()
