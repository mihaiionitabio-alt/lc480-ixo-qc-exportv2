# How many images and tables can actually be downloaded

Measured in `index.html` (sha256 61d3aaa5…) by reading the page's own definitions
and the option lists it builds for a loaded set of runs.

## The catalogue has 101 entries

83 images (25 general graphs + 58 control charts) and 18 tables. That is the number
of **entries**, not the number of downloadable renderings — most entries can be drawn
in more than one way, and each way is its own download.

## Where the multiplication comes from

| source | rule in the page |
|---|---|
| graph options | 9 of the 25 general graphs carry option selectors: target, signal, metric, colour-by, level, control, and a log toggle |
| control-chart type | `funnel` → 1 · `p` / `u` / `c` → 1 · `X̄–S` → 5 (X̄–S, I, EWMA, CUSUM, Trend) · all others → 4 (I, EWMA, CUSUM, Trend) |
| control-chart x axis | 4 (run order, date, cumulative run hours, block cycles) — except funnel, which has none |
| control-chart variants | 12 charts split per channel, per target, per transition or per control batch; how many depends on the data |
| platform | a control chart only appears for the instrument it belongs to: 31 on LightCycler, 53 on QuantStudio |

## Three counts

| | general images | control charts | tables | total |
|---|---|---|---|---|
| LightCycler demo set (1 target, 55 runs) | 148 | 406 | 18 | **572** |
| QuantStudio demo set (2 targets, 20 runs) | 213 | 762 | 18 | **993** |
| a configured laboratory (3 targets, 2 channels, 2 control extracts) | 278 | 656 (LC) / 980 (QS) | 18 | **950 – 1 280** |

The first two are counted from what the page actually offered with those files loaded.
The third assumes variant counts a working laboratory would have (6 for the control
charts that split by target and extract, 3 for the process-stage charts, 2 per channel).

## A further multiplier, kept separate

14 of the 25 general graphs are drawn from **one run**. With 55 runs loaded, each of
those can be downloaded 55 times, once per run. Counting that way the LightCycler demo
set reaches several thousand files, which is why it is quoted separately rather than
folded into the totals above.

## The short answer

- **101** entries in the catalogue.
- **roughly 600 to 1 300** distinct images and tables for one instrument's history,
  depending on how many targets, channels and control extracts the laboratory runs.
- **around 1 000** is the fair single number to quote for a laboratory with a handful
  of targets.
