# qPCR QC and forensics web page

- Updated page: [index_ml.html](https://mihaiionitabio-alt.github.io/lc480-ixo-qc-exportv2/index_ml.html) - build of 17 October 2026
- Updated single-file application: [`index_ml.html`](index_ml.html), SHA-256 `0996aeaff64bcd474e51eb391625b339ea1380e948758f4c77edbadbb88b1101`
- Original page: https://mihaiionitabio-alt.github.io/lc480-ixo-qc-exportv2/
- Single-file web application: [`index.html`](index.html) — build of 7 October 2026, SHA-256 `8754c224ba77162d3c3b5647f81ee81dde703b9a368913243d30fd9d9eb29481`
- **Last published documentation: [`qPCR_QC_forensics_documentation.pdf`](documentation/qPCR_QC_forensics_documentation_2026-10-07.pdf)** 
  - LaTeX source that builds it: [`documentation/latex/main.tex`](documentation/latex/main.tex); the font it needs is not included, see [`tools/fonts_README.md`](tools/fonts_README.md)
  - Build it with latexmk and XeLaTeX: [`documentation/latex/build_complete.sh`](documentation/latex/build_complete.sh) and [`documentation/latex/.latexmkrc`](documentation/latex/.latexmkrc)
  - What changed in the 28 September rebuild: [`DOCUMENTATION_REBUILD_2026-09-28.md`](documentation/DOCUMENTATION_REBUILD_2026-09-28.md)
  - Revalidation record: [`documentation/revalidation_2026-09-28/`](documentation/revalidation_2026-09-28/README.md)
  - Command mode reference: [`COMMAND_MODE.md`](documentation/COMMAND_MODE.md)
  - Shrinking a built PDF without rebuilding it: [`documentation/compress_pdf.py`](documentation/compress_pdf.py)
- Earlier update records and notes: [`documentation/`](documentation/)

## Updates since the last push - 17 October 2026

- Added `index_ml.html` with offline advisory analytics: forecasts, change points and unusual-run scores.
- Added multivariate T2/Q views, exploratory grouping and metric associations.
- Corrected forecast intervals, model caching, cohort scope and coefficient plots.
- Fixed LC480 detection-format selection and channel attribution for optical charts and curves.
- Added optional sample selection before analysis for IXO, EDS/EDT and RDML inputs.
- Added grouping by date, experiment and sample name, search, and bulk select/unselect across matching pages.
- Added learned name-pattern grouping to review unusual sample names; exclusions remain manual.
- Added an excluded-sample view, editable selections and an applied-selection CSV export.
- Preserved raw files, acquisition data and hardware chart values/limits during sample filtering.
- Verified selection workflows and channel mapping; existing advisory engine/panel suites pass (105/50 checks).

## Earlier page additions - 7 October 2026

These additions were introduced in the 7 October build.

- **Graph analysis and review.** Stored curves are plotted interactively: hover for values,
  wheel to zoom, drag to pan, reset the view. The panel reports per-curve statistics and
  the correlation between the curves in the selected context.
- **Problems across selected experiments.** One overview groups the problems found across
  several loaded experiments, filtered by problem category, with select-all and clear
  controls, the problem curves reconstructed for inspection, and the grouped problems
  downloadable as CSV.
- **Reference-gene handling for SC screening.** Taxon-specific DNA and extraction
  references are recognised as such and labelled accordingly in the SOP targets.
- **Export downloads.** The export files are written through a single download path, which
  fixes exports being lost when several files were produced at once.

## Using it

Open the updated live page, or download [`index_ml.html`](index_ml.html) and open the file in a browser.
It is one self-contained file and works offline. Experiment files are read in the browser
and are never uploaded; nothing leaves the machine the page is open on.

The SOP panel offers two profiles: the SOP-06 laboratory default, which is what laboratory
work uses, and SOP-06-DEMO, a demonstration variant that accepts demonstration identifiers
and draws control limits from five runs instead of twenty. The demonstration variant is a
template for trying the page out, is not restored after a reload, and must not be used to
interpret laboratory runs.

## What this repository does not contain

No experiment data. No instrument files, no laboratory measurements, no sample or patient
identifiers, and no vendor template files. The documentation's figures are drawn from runs
that are not published here.
