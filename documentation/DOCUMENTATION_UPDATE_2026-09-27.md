# Documentation updated: a software diagram for every function (2026-09-27)

## Result

`qPCR_QC_forensics_documentation_2026-09-27_base_plus_update.pdf` —
**1,749 pages**, 38,721,119 bytes,
SHA-256 `87855B7DD6C5DE4F3E93B56F5F6B8C945D2932595C00C9F286110295BB453277`
(rebuilt 2026-09-28 with numbered listings; the earlier build's hash was
`824495E2…58F3CD`).

It is the 1,117-page 2026-09-25 manual, carried over unchanged, plus a 632-page addendum. The
addendum also exists on its own as `function_diagrams_addendum_2026-09-27.pdf` (1.5 MB), and
`verify_base_plus_update_2026-09-27.py` re-checks the whole thing.

## What the addendum contains

| | |
|---|---|
| Title, scope and method, how to read a diagram | 3 pages |
| Validation record for the interactive chart view | 2 pages |
| Contents, the page section by section | 13 pages |
| One diagram per function | **614 pages** |

## How the inventory was produced

The page's own script was separated from the inlined chart library and parsed with acorn
(ECMAScript 2022). Every function node was collected — declarations, function expressions and
arrow functions — named directly or by the variable, property or assignment they are bound to.

- **830** named functions found.
- **614** are defined at the top level of the script; each gets a diagram of its own.
- **216** are defined inside another function and are listed on the diagram of their parent.
- **76** section banners in the source give the grouping; 59 of them contain top-level functions.
- **124** module-level names that are not functions were treated as the page's shared state.

## What each diagram shows

Left, the functions that call it; centre, the function with its arguments, section, source line,
named inner helpers and whether it returns a value; right, the functions it calls. Below, the
shared state it mentions and the effects detected in its body (writes the DOM, produces a
download, reads a file, browser storage, hashing, draws an interactive figure, wires events,
notifies the user). Where the source carries an authored comment above the function it is quoted, and the opening
lines of the function are shown verbatim.

## The listings

Each listing keeps the addendum's boxed background and takes the manual's numbered gutter: the
line numbers are the function's true line numbers in `index_interactive_2026-09-27.html`, and the
syntax colours follow the manual's scheme — keywords green, strings orange, numbers green,
comments light blue, everything else near-black. A line too long for the width ends in an
ellipsis; a listing shorter than the function states how many lines follow. All **614** diagram
pages carry one.

Arrow rule: a call written inside an anonymous callback counts as a call by the function that
contains it, because that is how the code reads; a *named* helper defined inside a function owns
its own calls and appears in its parent's "defines inside" line. At most nine callers and nine
callees are drawn, with any remainder counted in a final box; the true degree is always stated
under the centre box. Busiest nodes: `runName` with 47 callers, `uniq` with 42, `$` with 41.

## Verification

`verify_base_plus_update_2026-09-27.py` asserts: 1117 + 632 = 1749 pages; the first page and the
last page of the base manual are byte-for-byte the same text as before; eight required terms
appear in the addendum front matter, including the page's SHA-256 and the validation figures
(101 of 101, 23 of 25, 20 of 20); all 614 diagram pages carry the running footer and a numbered
listing; `ccWestgard`'s page shows its real line numbers 6629 to 6638 and the note above it in the
source; and `svgPlot`, `ixMount`, `ccChartSvg`, `renderGraphs` and `selCatalogue` each have a page.
It passes.

Each token in a listing is drawn as its own coloured run, so PDF text extraction returns them
line-broken; the script compares against the text with whitespace removed.

The script resolves its folder from its own location, so it runs both on the Windows machine and
from a shell, unlike the 2026-09-25 script which had the path written in.
