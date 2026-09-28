# RDML reader — per-function validation evidence (2026-09-24)

This folder holds the machine-readable evidence and the sources that produced
`documentation/RDML_VALIDATION_REPORT_2026-09-24.pdf`.

Build under test: `qpcr_qc_forensics.html`
SHA-256 `6e14cc49153ad0662b94c47218f213051c5128fec78cc8a479ce00f17f391f4e`.

| File | What it is |
|---|---|
| `capture.cjs` | The harness. Loads the production page in a headless browser, calls each RDML symbol with a named input, records the exact input, the exact output, the expectation and the verdict. |
| `validation_data.json` | 89 records, 89 passing, 0 page errors, covering 15 functions and 2 constants (19 record groups including the integration cases). |
| `prod_functions.json` | The source of all 17 symbols as extracted from the production build, with their line numbers, so the listings in the report can be checked against the page. |
| `gen.py` … `gen4.py` | The report generators. Each reads `validation_data.json` and `prod_functions.json` and emits one LaTeX part; nothing in the report is typed by hand. |
| `tex/` | The LaTeX sources. `main.tex` inputs `part1`–`part4`. Build with `latexmk -xelatex main.tex`. |

## Provenance classes used throughout the report

* **R** — a real corpus file, unmodified. The input is bytes the laboratory or the
  RDML consortium produced.
* **D** — derived by the code under test: the input is the output of an earlier
  production function applied to an R input.
* **S** — synthetic, written for this report to reach a boundary the corpus does
  not contain (missing element, null attribute, empty text node). Every S input
  is printed in full in the report.

No patient identifier and no measured value from a laboratory file appears in
the report or in this folder; the corpus files are named and hashed, and the
quoted fragments are structural (element names, attributes, counts).

## Reproducing

```
node capture.cjs            # writes validation_data.json
python3 gen.py && python3 gen2.py && python3 gen3.py && python3 gen4.py
cd tex && latexmk -xelatex main.tex
```

## Typesetting checks applied to the delivered PDF

* 0 LaTeX errors, 0 overfull boxes.
* 17,253 word boxes extracted from the PDF; **0 overlapping pairs**.
* 0 words within 20 pt of any page edge.
* 63 pages: 57 A4, then 5 A3 landscape fold-outs (420 × 297 mm), then 1 A4.
