# Demo instrument histories (synthetic)

**All values are made up. They are demonstration data, not laboratory measurements.**

Each file is an instrument history in the page's `qpcr-instrument-history/1` format:
one row per run, with that run's control-chart measurements. Load it on the
**Control panel** tab with **Import history (JSON)**. No experiment files are needed.

| File | Instrument | Runs | Period | What to look at |
|---|---|---|---|---|
| `DEMO_history_LC-DEMO-01.json` | LC · LC-DEMO-01 (LightCycler 480) | 150 | 2024-01-08 – 2026-02-23 | Service on 2025-05-12 shifts heating rate, settling time and hold temperature; control extract changes on 2025-10-06 (+0.45 Cq on 35S); cooling rate drifts with age and season; Analyst B has wider replicate SD; Analyst C has more positive NTCs |
| `DEMO_history_QS-DEMO-A.json` | QS · QS-DEMO-A (QuantStudio) | 90 | 2024-03-08 – 2026-03-17 | LED current and junction temperature rise with age; heated-cover lowering slows; filter-wheel move time steps up on 2025-09-01; block-zone spread grows |
| `DEMO_history_LC-DEMO-02.json` | LC · LC-DEMO-02 (LightCycler 480) | 55 | 2025-01-14 – 2026-04-18 | Same model as LC-DEMO-01 with no service event — a stable comparison instrument |
| `DEMO_history_QS-DEMO-B.json` | QS · QS-DEMO-B (QuantStudio) | 30 | 2025-06-06 – 2026-05-17 | Short, stable history: just past the 20-run baseline |
| `DEMO_history_all_instruments.json` | all four | 325 | — | Everything in one import; pick the instrument on the Control panel |

Charts with no values in these files come out empty: PCR efficiency and IC shift on every
instrument, and the thermal-step and positive-control charts on the QuantStudio instruments.

Source: built from the history CSVs of the documentation's control-chart atlas
(`documentation/latex/data/atlas/*_history.csv`), which the documented generator
`documentation/latex/code/make_history_realscale_full.py` produced. Operator names are
pseudonymised (`operator-xxxxxxxx`). Run times are given in UTC.

To reproduce a report from one history in Command mode after importing it:

```
select cc:hardware
select cc:method
select cc:operator
pdf demo_history
```
