# Catalogue limits

For every entry the page offers for download: what the real and vendor files actually
contain, and the limit that follows from it.

| | |
|---|---|
| catalogue entries | 101 |
| numeric limits | 402, split by instrument family |
| categorical fields | the values seen in the corpus, listed as the allowed set |
| entries the corpus does not reach | 8 — theoretical limit, data set generated inside it |

## Corpus

Six laboratory `.ixo` experiments, ten vendor demonstration `.ixo` experiments and eight
vendor demonstration `.eds` experiments were loaded into the page itself. Every catalogue
entry was then asked for the **rows behind it** — the numbers the figure plots or the table
hands out, not the picture.

Coverage: 60 entries are fed by the laboratory files, 51 by the `.ixo` demonstrations,
70 by the `.eds` demonstrations.

## How a limit is set

1. **Separately per instrument family.** Background fluorescence, passive reference level and
   timing live on different scales in the two formats; a pooled limit would describe neither.
2. **From measurement, twenty values or more:** median ± 3 robust standard deviations
   (1.4826 × the median absolute deviation), widened to the 1st–99th percentile, then clamped
   to what is physically possible for that quantity.
3. **From measurement, fewer than twenty:** the observed range as it stands, with the count
   stated. Three runs cannot define a limit and the file says so.
4. **From specification:** where the chart definition carries a manufacturer figure for that
   instrument, that figure is the limit and the observed values are reported beside it.
5. **Invented:** where nothing in the corpus feeds the entry, the limit is the theoretical
   range for the quantity and twenty points are generated inside it. Those rows carry
   `origin = invented within the theoretical limit`.

## Identifiers

1,428 distinct strings were replaced before anything left the analysis: 670 sample names,
72 run names, 26 targets, 18 plates, 4 operator names and 638 other strings that named a
file, an experiment or a product. The mapping is **not** saved anywhere — only the counts,
in `pseudonym_counts.json`. No laboratory identifier appears in any file here; this was
checked by pattern over every deliverable and returns zero.

## Files

- `MISSY_catalogue_limits.pdf` — 34 landscape pages: method, source coverage, the limits,
  the entries with no data, and the categorical fields.
- `catalogue_limits.csv` / `.json` — one row per entry, column and instrument family:
  counts per source, observed min / p05 / median / p95 / max / SD, the proposed limit, the
  basis, and whether the data was measured or invented.
- `catalogue_datasets.zip` — one CSV per catalogue entry, the extracted rows (pseudonymised)
  or the generated set.
- `catalogue_datasets_summary.csv` — rows and columns per entry, and which source fed it.
- `defs.json` — the chart definitions as the page states them, including the manufacturer
  specification field each one carries.
- `dump.py`, `defs.py`, `analyse.py`, `report.py` — rebuild everything.
