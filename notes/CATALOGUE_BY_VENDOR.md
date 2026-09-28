# The download catalogue, by vendor

Read from `index.html` itself (sha256 61d3aaa5…), by loading a LightCycler-format set
and a QuantStudio-format set and asking `selCatalogue()` what it offers in each case.

**The catalogue holds 101 entries, not 99.** Both file families are offered the same 101
entries; what differs is which ones can be filled. The two missing from my earlier count
were `Melting peaks` and `Relative quantification`, which no run in the test sets fed, so
they never reached the export atlas the count came from.

| | entries |
|---|---|
| offered in total | 101 |
| work on both file families | 68 |
| only in the QuantStudio-format file (.eds, Thermo Fisher) | 28 |
| only in the LightCycler-format file (.ixo, Roche) | 5 |
| available to a LightCycler laboratory | 73 |
| available to a QuantStudio laboratory | 96 |

The vendor tag for a control chart is the page's own `inst` field. For the 43 general
images and tables it is measured: an entry counts as vendor-specific only when it was
ready with one family loaded and not with the other.

## Only in the LightCycler-format file (.ixo) — 5

| code | entry | group | kind |
|---|---|---|---|
| B-H17 | Channel switch time | hardware | image |
| B-H8 | Lamp reference channel (stability) | hardware | image |
| B-H9 | Lamp drift within a run | hardware | image |
| B-S10 | Temperature-log intervals over 500 ms | software | image |
| B-S11 | Invalid fluorescence readings | software | image |

## Only in the QuantStudio-format file (.eds) — 28

| code | entry | group | kind |
|---|---|---|---|
| — | Multicomponent raw values | Tables | data |
| B-H10 | LED drive current | hardware | image |
| B-H10b | LED junction temperature (maximum) | hardware | image |
| B-H12 | Saturated well images | hardware | image |
| B-H13 | Uniformity calibration: edge-to-centre ratio | hardware | image |
| B-H13b | Background calibration: mean offset | hardware | image |
| B-H13c | Well-position (ROI) calibration: spot diameter | hardware | image |
| B-H14 | Filter-wheel move time | hardware | image |
| B-H14b | Filter-wheel moves slower than 500 ms | hardware | image |
| B-H15 | Filter-wheel position offset | hardware | image |
| B-H16 | Camera readout time beyond the exposure | hardware | image |
| B-H18 | Heated cover lowering time | hardware | image |
| B-H18b | Heated cover raising time | hardware | image |
| B-H5 | Block zone uniformity (95th percentile) | hardware | image |
| B-H6 | Heat-sink maximum | hardware | image |
| B-H6b | Heated cover temperature | hardware | image |
| B-M2 | Passive reference (ROX) level | method | image |
| B-M9 | Low Cq confidence | method | image |
| B-O2 | Dispensed-volume spread (ROX CV) | operator | image |
| B-S1 | Reply time to the PC software | software | image |
| B-S12 | Stored Ct not reproducible (> 0.2) | software | image |
| B-S2 | Once-per-second timer lateness | software | image |
| B-S2b | Scheduler falling behind | software | image |
| B-S3 | Image → processing delay | software | image |
| B-S4 | Image analysis time | software | image |
| B-S5 | Run-time prediction error | software | image |
| B-S6 | Data hand-off time | software | image |
| B-S8 | Command errors in the instrument log | software | image |

## In both file families — 68

| code | entry | group | kind |
|---|---|---|---|
| — | Background and plateau fluorescence across runs | Across runs | image |
| — | Control Cq across runs with SOP range | Across runs | image |
| — | Control Cq versus cooling rate | Across runs | image |
| — | Control extract age versus Cq | Across runs | image |
| — | Control extraction batches | Across runs | image |
| — | Forensic findings by area (Pareto) | Across runs | image |
| — | Hours from run end to the last recorded change | Across runs | image |
| — | Run acceptance grid | Across runs | image |
| — | Run duration and instrument use | Across runs | image |
| — | Runs on a calendar — run time and last change | Across runs | image |
| — | SOP outcomes per run | Across runs | image |
| — | Amplification curves coloured by SOP outcome | Fluorescence | image |
| — | Background and plateau fluorescence per channel | Fluorescence | image |
| — | Fluorescence level against Cq | Fluorescence | image |
| — | Instrument records | Instrument records | data |
| — | Plate heat map | Plate | image |
| — | Signal in wells that are not in any analysis | Plate | image |
| — | Cq by target with SOP cut-offs | Results | image |
| — | Internal control / reference Cq per sample (inhibition) | Results | image |
| — | Replicate spread — mean Cq against SD | Results | image |
| — | SOP outcomes per target | Results | image |
| — | Standard curve with residuals and SOP limits | Results | image |
| — | Block temperature trace (LightCycler temperature log) | Run history | image |
| — | Block, cover and zone temperature (QuantStudio log) | Run history | image |
| — | Run timeline — created, run, analysis, last change | Run history | image |
| — | Stored Ct against the Ct re-derived on this page | Run history | image |
| — | Amplification curves | Tables | data |
| — | Control chart points | Tables | data |
| — | Experiment metadata | Tables | data |
| — | Experiment settings | Tables | data |
| — | Forensic findings | Tables | data |
| — | Melting peaks | Tables | data |
| — | Plate map | Tables | data |
| — | Profile answers | Tables | data |
| — | Relative quantification | Tables | data |
| — | Rising curves without a channel result | Tables | data |
| — | Runs and quality control | Tables | data |
| — | SOP criteria | Tables | data |
| — | SOP run decisions | Tables | data |
| — | Sample comparison | Tables | data |
| — | Statistics | Tables | data |
| — | Stored Cq values | Tables | data |
| A-H3 | Background fluorescence per channel | hardware | image |
| A-H3b | End-point fluorescence per channel | hardware | image |
| A-H4 | Run duration | hardware | image |
| B-H1 | Peak heating rate (2-s window) | hardware | image |
| B-H11 | Automatic integration time / exposure | hardware | image |
| B-H2 | Peak cooling rate (2-s window) | hardware | image |
| B-H3 | Overshoot at the denaturation step | hardware | image |
| B-H3b | Settling time at the denaturation step | hardware | image |
| B-H3c | Transition time A → B °C | hardware | image |
| B-H4 | Temperature at the moment of reading | hardware | image |
| A-M1 | Positive control Cq (Levey-Jennings) | method | image |
| B-M1 | Probe signal strength (positive control) | method | image |
| B-M10 | Late signal / stochastic-zone results | method | image |
| B-M3 | PCR efficiency from the standards | method | image |
| B-M5 | Negative controls by process stage | method | image |
| B-M6 | IC shift from fixed reference | method | image |
| B-O1 | Replicate precision (pooled SD, Cq < 30) | operator | image |
| B-O11 | Copied-data events | operator | image |
| B-O3 | Row / column pattern | operator | image |
| B-O5 | Contamination rate by operator (funnel) | operator | image |
| B-O6 | Repeat / inconclusive / invalid rate by operator (funnel) | operator | image |
| B-O7 | Manual interventions | operator | image |
| B-O9 | Stored calls that disagree with the SOP | operator | image |
| A-S4 | Run end → last change | software | image |
| A-S6 | Forensic findings per run | software | image |
| B-S9 | Cycle-timing regularity | software | image |

## Two entries nothing fed

`Melting peaks` and `Relative quantification` were not ready with either test set: neither
carried a melting curve or a relative-quantification analysis. They are in the catalogue and
they are not vendor-specific — they need a run of that kind, from either instrument.
