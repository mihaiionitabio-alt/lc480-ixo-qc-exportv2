# Interactive charts in the page — what was changed and what was proved

Built on `index.html` SHA-256 `61d3aaa5c1deacd18ed9246e6f118cae3fbe86dd93fcb1070df369c6f74a8c65`.
Result: `index_interactive_2026-09-27.html`, SHA-256
`2747a9298909c1dd2237adcd8d936b59d617f93d93f5a1816c33cebe220d1c43`, 2,007,034 bytes.
**`index.html` itself was not touched.**

## The principle

`svgPlot` stays the single source of truth. It still draws every chart, and its SVG is what the
.svg download, the .png rasteriser, the ZIP and the export atlas take, byte for byte. The
interactive figure is an additional on-screen view built from the *same options object*
`svgPlot` was handed. No statistic, no limit, no chart mathematics and no exported byte was
touched.

The drawn SVG is not thrown away when the interactive figure appears: it is moved into a hidden
holder that stays first in document order, so the control-chart SVG/PNG buttons, which read the
chart out of the page, still read the drawn SVG.

## The changes, in order

1. **`svgPlot` records its input.** One line: `if(PLOT_CAPTURE)PLOT_CAPTURE.push(o);`. Capture is
   armed only around the two on-screen renders, so exports and the ZIP pay nothing.
2. **A translator** (`ixTraces` / `ixLayout`) maps the whole `svgPlot` vocabulary to Plotly:
   line / bar / points series with per-point colours and tips, `bands` (x-range and y-range),
   `vlines`, `hlines` with their labels, `texts`, `legend`, `ylog`, custom `xticks` with rotation,
   and the margins `svgPlot` reserves.
3. **`ixMount`** draws the recorded specs, hides the drawn SVG rather than discarding it, and
   returns false — leaving the page exactly as before — if Plotly is missing, if nothing was
   recorded, or if the spec yields no traces.
4. **Two checkboxes**, "Interactive", on the Graphs tab and in the control-chart card, both on by
   default.
5. **plotly.js-basic-dist-min 2.35.2 inlined**, so the page stays one offline file.

## Three defects found and fixed during the build

- **The page has a `<div id="exports">`.** The browser exposes every element id as a window
  property, so the UMD loader read that div as a CommonJS environment and attached the library to
  the element instead of the window: `Plotly` was undefined with no error anywhere. The bundle is
  now evaluated with `exports`, `module` and `define` shadowed.
- **`#g-chart svg` and `#cc-chart svg` style every SVG inside those boxes** — border, white
  background, `width:100%`. An interactive figure is a stack of layered SVGs, so those rules
  painted an opaque white layer over the chart: a correctly built figure that rendered blank. The
  rules are now scoped away from `.ix-plot`.
- **`newPlot` finishes asynchronously.** Replacing a figure before it settled surfaced as a page
  error (`_redrawFromAutoMarginCount`). The figures are released before their nodes are replaced
  and the late rejection is swallowed.

## Verification, on the page with real files loaded

**Exports unchanged.** Every one of the 101 catalogue entries — 83 images and 18 tables — was
produced by both the original and the new page from the same 8 runs and hashed:

| | |
|---|---|
| catalogue entries | 101 |
| byte-identical | **101 / 101** |
| different | 0 |

**All 25 graphs.** Across three datasets (8 synthetic LightCycler demo runs, 3 QuantStudio
templates, 6 LightCycler runs carrying SOP controls), every graph that goes through `svgPlot`
drew as an interactive figure:

| | |
|---|---|
| interactive | **23 / 25** |
| drawn SVG kept | 2 — `plate` and `x_accept`, the two raw `<rect>` grids |

The fallback is structural, not a hard-coded list: a graph that never calls `svgPlot` records
nothing and is shown exactly as before. A graph with no data returns the page's message and is
also left alone.

**Control charts.** All 20 charts that had data in the demo set drew interactively, X̄–S as two
coupled panels, and the SVG the download button reads was identical with the interactive view on
and off in 20 / 20 cases.

**Cost.** Page load to script-ready: 180 ms before, 222 ms after. Opening all 20 control charts:
805 ms. Zero page errors and zero console errors throughout. The file is 2.01 MB against 0.93 MB;
only one chart is drawn at a time, so loading 100+ files costs nothing extra.

## What was deliberately not done

`plate` and `x_accept` keep their hand-written SVG, so their exported bytes are untouched.
Converting them to square scatter markers would add per-cell hover, but it re-renders two
catalogue entries and should be agreed separately.
