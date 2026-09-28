# Chart.js or Plotly.js for the MISSY page — measured, not argued

Both were downloaded, inlined into equivalent single-file pages, and rendered headlessly with the
same data: one I-MR control chart of 336 runs with a tolerance band, and 96 amplification curves of
45 cycles. Nothing here is from memory.

## The numbers

| | Chart.js 4.5 | Plotly.js basic 2.35 |
|---|---|---|
| minified library | **208 KB** (+38 KB annotation plugin = 247 KB) | **1 071 KB** |
| gzipped | 70 KB (+13 KB) | 354 KB |
| your page would grow from 994 KB to | **1.24 MB** (+25 %) | **2.07 MB** (+108 %) |
| render, 2 charts | 115 ms | 200 ms |
| render, 20 control charts on one page | 234 ms | 491 ms |
| DOM nodes, 20 charts | 49 | 10 151 |
| JS heap | 10.0 MB | 10.6 MB |
| **SVG export** | **none** — canvas only, PNG via `toDataURL` | **built in**, `Plotly.toImage({format:'svg'})` |
| control limits, zones, spec bands | annotation plugin (extra 38 KB) | `layout.shapes`, no plugin |
| zoom, pan, box-select | chartjs-plugin-zoom, another ~30 KB | built in |
| hover readout | built in | built in |
| licence | MIT | MIT |

The full Plotly bundle is 4.56 MB — do not use it. `plotly.js-basic-dist-min` carries scatter and bar,
which is everything your nine chart types need.

## The one argument that decides it

Your page's whole export contract is SVG. `figure()` returns `{svg, rows}`, `svgToJpeg` rasterises
that same SVG, the export atlas is built from it, and a forensics tool's figures end up in reports
where vector matters. **Chart.js cannot produce SVG at all.** Adopting it for the 58 control charts
would mean either losing vector downloads, or keeping your hand-written SVG renderer alongside it —
two renderers that must agree about limits, zones and flagged points, and that will drift. For a
tool that has to show exactly what it exports, that drift is a validation problem, not a
maintenance annoyance.

Plotly draws in SVG and exports the same SVG. Screen and download cannot disagree, by construction.

**Recommendation: Plotly.js basic.** The 800 KB is the price of keeping vector export and one
renderer.

## Two caveats, both manageable

**DOM weight.** Plotly builds about 500 DOM nodes per chart. Fifty-eight charts at once would be
~29 000 nodes — but your interface already shows one graph at a time on the Graphs tab and one
chart page at a time in the control panel, so that case does not arise. If you ever build a grid
view, call `Plotly.purge()` on charts that scroll out.

**The nine chart types still need shapes.** Neither library has control charts. The band, centre
line, control limits, Western Electric zones, the funnel curves and the CUSUM decision interval are
all `layout.shapes` entries — about the same amount of code you already have, but declarative.
The one that needs care is X̄–S, which wants two linked subplots.

## If you would rather keep the page small

Chart.js is the right choice only if you accept PNG-only downloads for the interactive charts and
keep the existing SVG renderer as the authoritative export for the atlas and the report bundle.
That is a coherent position — interactive on screen, authoritative on export — but it means the
screen and the file are produced by different code, and someone has to test that they agree.

## Try it

`MISSY_interactive_charts_plotly.html` is one self-contained file, 1.12 MB, no network. It renders
B-H1 with the real corpus tolerance (4.30 – 5.576 °C/s) and a drift after run 18, plus a 96-well
plate. Drag to zoom, hover for the run and date, click a legend role to hide it, toggle the EWMA
overlay, switch the plate to a log axis, and download SVG, PNG or the numbers as CSV. The SVG comes
out of the same renderer that drew the screen.

The series is synthetic at the levels measured in your corpus, and says so on the page.
