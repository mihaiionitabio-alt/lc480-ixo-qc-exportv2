# Can `plotly.js-basic-dist-min` draw all 25 general graphs?

Measured, not assumed. Bundle: `plotly.js-basic-dist-min@2.35.2` (1,071,091 B), inlined into a
single file, rendered headlessly in Chromium, every panel exported to SVG.

Trace types the bundle registers, read from `Plotly.PlotSchema.get().traces`:
**bar, pie, scatter** — nothing else.

## Where the 25 come from

`selImageItems()` maps over `GRAPHS`. The literal at line 5378 holds **21** entries; the file then
adds four more at runtime — `GRAPHS.push(...)` adds the three control-batch graphs (line 7127) and
`GRAPHS.splice(...)` inserts `lc_thermal` after `recalc` (line 7128). 21 + 4 = **25**. That is the
25 in the catalogue.

## Drawing primitives in use

23 of the 25 render through `svgPlot(o)`, whose whole vocabulary is:
series `type:"line"` / `"bar"` / points (default), `bands` (x-range or y-range rectangles),
`vlines`, `hlines`, `texts` (per-point labels with `anchor`), `legend`, `ylog`, `xticks`
(custom tick labels). Two entries bypass `svgPlot` and write raw SVG `<rect>` grids:
**`plate`** and **`x_accept`**.

## Per-graph verdict

| # | id | primitives | plotly-basic | note |
|---|----|-----------|--------------|------|
| 1 | timeline | points, bar, x-band, texts, legend | yes | anchored text labels both sides |
| 2 | curves | line ×n, vlines, hlines, legend, ylog | yes | 12 traces, 24 line paths drawn |
| 3 | **plate** | raw `<rect>` grid, 96 cells | **no (heatmap)** | see below |
| 4 | unanalysed | line, legend | yes | |
| 5 | cqstrip | line, points, legend | yes | |
| 6 | repsd | points, hlines, legend | yes | |
| 7 | stdcurve | points, fit line, residual panel, texts | yes | 2 coupled subplots + equation annotation |
| 8 | ic | points, y-band, hlines, legend | yes | |
| 9 | endpoint | points, vlines, legend | yes | |
| 10 | levels | points, legend, ylog | yes | |
| 11 | outcomes | stacked bar, legend | yes | `barmode:'stack'`, 4 series |
| 12 | temperature | line, hlines, legend | yes | |
| 13 | recalc | points, hlines, legend | yes | |
| 14 | lc_thermal | line, hlines | yes | |
| 15 | x_timeline | line, points, texts, legend | yes | |
| 16 | x_delay | bar, hlines, ylog | yes | log y with bars verified |
| 17 | **x_accept** | raw `<rect>` grid, glyph per cell | **no (heatmap)** | see below |
| 18 | x_outcomes | stacked bar, legend | yes | |
| 19 | x_control | line, points, y-band, hlines, legend | yes | |
| 20 | x_signal | line, points, legend, ylog | yes | |
| 21 | x_duration | bar, legend | yes | |
| 22 | x_findings | bar + cumulative line (Pareto) | yes | second y axis via `overlaying:'y'` |
| 23 | x_control_batches | points, legend, custom date ticks | yes | `tickvals`/`ticktext` |
| 24 | x_control_age | points, legend | yes | |
| 25 | x_control_thermal | points, legend | yes | |

**23 of 25 render with no workaround. 2 need one.**

## Measured results per primitive

| feature tested | outcome | nodes drawn | SVG export |
|---|---|---|---|
| 12 line traces + legend | ok | 24 line paths, 12 legend rows | 24,042 chars |
| log y axis | ok | 24 markers | 13,174 |
| points + y-band + 2 control limits | ok | 24 pts, 3 shapes | 12,611 |
| x-band + 2 vlines | ok | 24 pts, 3 shapes | 12,455 |
| per-point text, both anchors | ok | 24 text points | 17,730 |
| stacked bar, 4 series | ok | 32 bars, 4 legend rows | 11,754 |
| bar + hline on log y | ok | 48 paths, 1 shape | 10,274 |
| Pareto: bar + cumulative on y2 | ok | 3 axes | 12,793 |
| custom date tick labels | ok | 24 pts | 11,351 |
| standard curve + residual subplot + equation | ok | 2 subplots, 1 annotation | 17,206 |
| **`type:'heatmap'`** | **empty** | **0 traces, 0 cells** | 7,188 (frame only) |
| plate as square scatter markers | ok | 96 markers, 96 labels | 56,806 |
| acceptance grid as square scatter markers | ok | 54 markers, 54 glyphs | 30,726 |

Zero page errors, zero console warnings throughout.

## The one real gap

`Plotly.newPlot` with `type:'heatmap'` **does not throw and logs nothing**. It resolves
successfully and draws an empty axis frame: 0 traces, 0 cells in `heatmaplayer`. A silent blank
chart is worse than an exception, so both grid entries must be handled deliberately, not left to
fail at runtime.

Three options for `plate` and `x_accept`:

1. **Square scatter markers** — verified working for both: 96 wells with colour scale, colorbar
   and per-well hover, and 54 cells with discrete colours and a glyph per cell. Adds nothing to
   the bundle and gains hover, which the current hand-written SVG does not have. Marker size is
   in pixels, so it must be recomputed on resize.
2. **Keep the existing hand-written SVG** for these two entries. Zero risk; their export bytes
   stay byte-identical. Neither grid needs zoom or pan.
3. **`plotly.js-cartesian-dist-min`** (~2.6 MB against basic's 1.07 MB) for one native trace type
   used by 2 of 83 images.

## Control-panel preview

Not a plot. The overview builds one status card per chart from
`CC_CHARTS.filter(d=>d.inst.includes(platform)).map(...)` with `ccCompute`/`ccStatus`, so it needs
no plotting library at all. If a sparkline is wanted on each card it is a static scatter, measured
at 77 SVG nodes per card — about 4,500 nodes for 58 cards.

## Recommendation

`plotly.js-basic-dist-min` covers 23 of the 25 general graphs, all 58 control charts and the
control-panel preview. Adopt it, and keep the existing hand-written SVG for `plate` and
`x_accept` (option 2), so no export bytes change. Converting those two grids to scatter markers is
a better chart but a separate, explicitly agreed step.
