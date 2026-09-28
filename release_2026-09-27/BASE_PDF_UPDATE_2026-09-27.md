# Base PDF update — 27 September 2026

The 25 September 2026 document was preserved as the base and a five-page revision addendum was appended.

- Base: `qPCR_QC_forensics_documentation_2026-09-25_base_plus_update.pdf` — 1,117 pages.
- Addendum: `revision_addendum_2026-09-27.pdf` — 5 pages (source: `source/revision_addendum_2026-09-27.tex`).
- Final: `qPCR_QC_forensics_documentation_2026-09-27_base_plus_update.pdf` — 1,122 pages.
- Final SHA-256: `A7DF5641C731F378A31BE45CE459DCB211235E687629394326BA85C1AC9D25BD`.
- Addendum SHA-256: `4A0F70033EA403347091A294418F6C91F4C4E533D5011769147DBFBD1C5A9DD1`.
- Current HTML (`index.html` = `qpcr_qc_forensics.html`) SHA-256: `8DF4472EBA4831BAB5C0C712A30C60CDD20AD3E179ED1164C91C441DB33C770B`; 940,696 bytes.

The addendum records the changes made to the page after the 25 September build (see `UI_HISTORY_2026-09-25.md`):
public page identity (title, heading, blue status bar), the bottom page bar with the language selector and one
**Download website** button, the inline favicon, Command mode documentation (`COMMAND_MODE.md`) with full-example
lines and `target=all` meaning every target, per-chart control-chart types in the default script, and Console mode
keyboard keys. It lists current source line locations and the validation record.

Validation completed:

- Addendum compiled with XeLaTeX (TeX Live) twice; no LaTeX errors; pages visually checked.
- PDF merge check: all 1,117 base pages preserved at page-text level; 5 addendum pages appended and identical at page-text level.

Rebuild:

```sh
cd source
xelatex revision_addendum_2026-09-27.tex && xelatex revision_addendum_2026-09-27.tex
# then append revision_addendum_2026-09-27.pdf to the 25 September PDF (append-only, e.g. pypdf PdfWriter)
```

The 1,109-page template chapters are built from `source/base_latex/main.tex` (XeLaTeX or Tectonic; see its header).
