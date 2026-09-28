# Where everything is — 28 September 2026

All paths are on this computer. Nothing here needs a download; the transfer pieces
(`_p1.pdf`…`_p4.pdf`, `_doc_part*.pdf`, `_tx*.pdf`, `_asm.pdf`) have been deleted and no longer
exist on disk. What remains of them are the file cards in the chat, which live in the conversation
and not in the folder.

## The document

| | |
|---|---|
| **`D:\IXO\release_unified_2026-09-21_r2\documentation\qPCR_QC_forensics_documentation_2026-09-27_base_plus_update.pdf`** | 1,409 pages, 54,816,910 bytes, SHA-256 `B52E8EA67566264F2F77ADEA8C6578FC35A10D454244F158B2639BAAFE7F5D06` |

Inside it: List of Figures (page 8), List of Tables (page 31), *Software diagrams: method and
legend*, *Function by function* with a captioned diagram and a `Current build:` line under every
symbol, *The page in use, on demonstration data* (65 captures, in control and out of control), and
the 8-page 25 September revision addendum at the end.

### Checking it

`D:\IXO\release_unified_2026-09-21_r2\documentation\verify_base_plus_update_2026-09-27.py`
— run it from that folder; it resolves its own directory, so it works from a shell or from Windows.

### Superseded, kept

- `…\documentation\qPCR_QC_forensics_documentation_2026-09-25_base_plus_update.pdf` — the 1,117-page
  manual this was built from, untouched.
- `…\documentation\function_diagrams_addendum_2026-09-27.pdf` — the standalone 632-page addendum;
  its content is now inside the manual.

## Rebuilding it

- `D:\IXO\release_unified_2026-09-21_r2\documentation\documentation_sources\latex_diagram_build_2026-09-28.tgz`
  — every changed `.tex`, the 705 diagram figures, the 66 captures, and the split source appendix.
  Unpack over `documentation_sources\latex` and compile `main.tex` with XeLaTeX, three passes.
- `…\documentation_sources\diagram_generators_2026-09-28.tgz` — the ten scripts:
  `extract2.mjs` (parses the page), `gen_diagrams.py`, `patch_chapter.py`, `gen_gallery_tex.py`,
  `restyle.py`, `fitsource.py`, and `shoot.py`…`shoot4.py` (the captures).
  `restyle.py` is **not** idempotent — run it once, on pristine `.tex` files.

## The page

| | |
|---|---|
| `D:\IXO\release_unified_2026-09-21_r2\index.html` | the committed page, untouched, SHA-256 `61d3aaa5…4a8c65` |
| `D:\IXO\release_unified_2026-09-21_r2\index_interactive_2026-09-27.html` | the interactive build, 2,007,034 bytes, SHA-256 `2747a929…20d1c43` — rename over `index.html` when you adopt it |

Notes and evidence for it:

- `…\INTERACTIVE_CHARTS_IMPLEMENTATION.md` — what changed, the three defects found, the 101/101 export equality.
- `…\PLOTLY_BASIC_25_GRAPHS_VERIFICATION.md` — the per-graph coverage measurement.
- `…\MISSY_interactive_charts_plotly.html` — the standalone comparison page.
- `…\ix_control_chart.png`, `…\ix_control_xbars.png`, `…\ix_graph_curves.png` — captures on synthetic data.
- `…\plotly_basic_25_graphs_2026-09-27.png`, `…\plotly_basic_probe_2026-09-27.png` — the library probes.

## Written notes

- `…\documentation\DOCUMENTATION_REBUILD_2026-09-28.md` — the rebuild: what the check found, what was built, the defects.
- `…\documentation\DOCUMENTATION_UPDATE_2026-09-27.md` — the earlier addendum build.

## Data used for the captures

- `D:\IXO\release_unified_2026-09-21_r2\demo_data\instruments\LC-DEMO-01\` — 32 runs, in control.
- `D:\IXO\release_unified_2026-09-21_r2\demo_data\scenarios\S9_calibrator_shift_between_lots\` — 20 runs, the lot change at run 9 that puts chart B-H2 out of control.
