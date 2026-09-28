# The documentation rebuilt: diagrams beside each function, one code design (2026-09-28)

## What the check found first

Before rebuilding anything, the shipped Chapter 18 was compared, symbol by symbol, against the page.

- The manual records **676 symbols**. **641** still exist — but **not one of them still begins on the
  line printed above its listing**. The earliest chapter of symbols has moved by about 190 lines.
  This drift predates the interactive-chart work; it is measured against `index.html` as committed.
- **4** symbols are no longer found as declarations (`CRC_T`, `FLAGS`, `QS_DEFAULT_COLS`, `ROWS`).
  **31** more are no longer top-level: they now live inside the self-contained `.eds` decoding module.
- **19** symbols in `index.html` have no entry at all (`missyEmblem`, `selChartItems`,
  `selParseCommand`, `CLEAN_PAGE_SOURCE`, the option-rule helpers…). With the interactive layer that
  becomes **29**.
- **The LaTeX sources on disk would have made it worse.** `chV2_functions.tex` had been replaced by a
  stub: 660 entries reading "Verdict: source range present in the current build", with no input,
  output or recorded value. The rich chapter survives only in
  `chV2_functions.tex.before_singlecolumn_20260924`. Rebuilding from the current sources would have
  silently deleted the whole validation record — the compile proves it: 887 pages against 1,094 with
  the rich chapter restored.

## What was built

`qPCR_QC_forensics_documentation_2026-09-27_base_plus_update.pdf` — **1,409 pages**, 54,816,910 bytes,
SHA-256 `B52E8EA67566264F2F77ADEA8C6578FC35A10D454244F158B2639BAAFE7F5D06`. It is 1,401 pages compiled
from source plus the 8-page 25 September revision addendum, kept at the end. One file: the transfer
pieces were only a way across the 20 MB limit of the bridge and have been deleted.

It is no longer a base PDF with an appendix bolted on. The whole document was recompiled with
XeLaTeX from `documentation_sources/latex`, with three changes:

1. **One code design everywhere.** `\lstset` in `val_preamble.tex` now gives every listing in the
   document the near-white box with a thin grey rule, and brings the manual's numbered gutter inside
   the box (`xleftmargin` = `framexleftmargin` = 26pt), with the numbers in grey-blue.
2. **A diagram at the end of every function's record.** Each of the 676 entries in Chapter 18 gained
   a `Current build:` line saying where that symbol sits today, and a software diagram. 705 diagram
   figures were generated: 577 functions, 124 declared values, 4 marked absent.
3. **A new chapter before it** — *Software diagrams: method and legend* — carrying the method, the
   legend, and the validation record for the interactive chart view (101 of 101 exports identical,
   23 of 25 graphs interactive, 20 of 20 control charts, the three defects found).
4. **A new chapter after it** — *The page in use, on demonstration data* — 65 figures captured from
   the current page driven by a browser on synthetic runs. Every tab, all 25 graphs, the control
   panel, one chart of each type, the console, both operator modes, the SOP editor, the export
   catalogue and an interactive figure. Each caption names the functions the view enters through and
   how many more are reachable from them.

### In control and out of control

Two sets of runs. **LC-DEMO-01**, 32 runs: 20 charts carry data, 19 in control, one pattern inside
the limits. **Scenario S9**, 20 runs in which a calibrator lot changes at run 9: the control steps
from about 24.2 to 24.6 and drifts to 24.9 by run 20. On that set chart B-H2 goes out of control with
8 flagged points below the lower specification, and the same series is shown again read as CUSUM,
EWMA and a trend chart. Nothing in the page was configured differently between the two sets; only
the files changed.

### Coverage

The 65 figures enter the page at 71 distinct functions. Following the calls from those entry points
reaches **448 of the 563** top-level functions, or 79%. The rest are not reachable from a screen:
the download and export paths, which produce a file rather than a view; the statistics helpers those
paths call; and the graph renderers, which are properties of a table of definitions rather than
functions called by name, so a static reading cannot follow that step — although the 25 graph
figures were produced by running them.

Chapter 18 also gained a closing section, *Symbols present in the page and not covered by this
record*, with the 29 uncovered symbols, their source and their diagrams, each marked
**not in the harness**. No verdict is claimed for them.

## The line that was not crossed

The verdicts, argument tables and returned values were **not** restated as though the harness had been
re-run. Each record still describes the page as it was when it was tested; the `Current build:` line
and the diagram describe the page as it is now. A `notebox` at the head of the chapter states the
drift in numbers so a reader cannot mistake one for the other.

## A defect found in the diagram generator itself

`pdfDoc` came out with one callee and no shared state. Its body is a set of named closures, and the
first rule — a nested named function owns its own calls — left the parent looking empty. Worse, a
shorthand object method is stored by the parser from its parameter list, so the slice read
`(a,b){...}` and failed to re-parse; every such helper silently reported no calls at all. Both are
fixed: the re-parse tries an object wrapper, and a top-level function's diagram now unions in what
its own helpers call, marked *some calls are made by its own helpers*. `pdfDoc` now shows 26 calls
including `pdfStr` and `pdfWrap`, and mentions `PDF_PAGE`. 76 functions still show no calls; those
are genuinely trivial.

## Also noticed

Chapter 7 prints `ccWestgard` at HTML lines 6159–6169; Chapter 18 prints the same function at
6288–6298. The two chapters were generated from different snapshots of the page. Not touched here.

## Files

- `documentation/qPCR_QC_forensics_documentation_2026-09-27_base_plus_update.pdf` — the document.
- `documentation/verify_base_plus_update_2026-09-27.py` — rewritten for the integrated build; passes.
- `documentation_sources/latex_diagram_build_2026-09-28.tgz` — the changed `.tex` files and the 705
  diagram figures.
- `documentation_sources/diagram_generators_2026-09-28.tgz` — `extract2.mjs`, `gen_diagrams.py`,
  `patch_chapter.py`.
- `documentation/function_diagrams_addendum_2026-09-27.pdf` — superseded; its content is now inside
  the manual.
- Transfer leftovers that can be deleted: `documentation/_build_transfer/` and
  `documentation_sources/_build_transfer/`.


## 28 September, second pass: fitting, captions, tables, indexes

**Text that left the box.** Two kinds of line were too wide. A long run of Latin characters can be
broken once the listing engine is given somewhere to break, so an invisible break opportunity is now
inserted every eight characters inside such a run — 355 lines of the source appendix. A long run of
ideographs the engine cannot break at all, at any setting: that was measured, not assumed. Those 189
lines are wrapped here instead, and the appendix is emitted in 271 chunks so that **every line keeps
its true number in the file** — a wrapped line carries its number once, on its first row, and the
continuation rows carry the same hook marker the engine uses for its own soft wraps. Nothing now
overflows a box.

A side effect caught by looking: setting `columns=fixed` to help the breaking made this font render
`="` as a single raised glyph, so `class="sb-bar"` came out wrong across the whole appendix. The
breaking works just as well with the flexible columns the document already used, so that setting was
reverted.

**Every diagram has a description.** Each of the 705 diagrams is now a numbered figure —
*Figure 19.1: Software diagram of the function `selectedWells`.* — so each one is also listed in the
index of figures.

**Tables in classical form.** 448 tables across the document were rewritten with a rule between every
column as well as between every row, and each carries a caption — *Table 19.2: Input to
`selectedWells`*. The per-function input tables and the section index tables were given proportional
column widths so they fill the text block instead of huddling at the left. The old hack that drew a
hairline after every row was removed, since every row now closes with a proper rule.

**Two indexes.** The document opens with a List of Figures and a List of Tables, covering the 705
diagrams, the 65 captures and the 448 tables.
