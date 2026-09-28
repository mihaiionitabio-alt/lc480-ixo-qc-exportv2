# Roche-calibrated synthetic equipment-history demo

351 synthetic history rows: ROCHE-DEMO-A (130), ROCHE-DEMO-B (221).

Use `DEMO_ROCHE_history_SYNTHETIC.json` with the website's Control panel instrument-history import. This is not a raw IXO/EDS file. Use a separate demo session; names, keys and dates are synthetic. Control and raw-curve charts will lack data by design. The supplied SVGs and matching CSVs are 22 populated equipment series rendered by the current application engine in an offline source-level test.

The numerical model was calibrated to the two history exports in the supplied Roche folder. It generates fresh joint draws, rather than reproducing the source run vectors. The invented time axis does not preserve real ageing or maintenance events. The data are for demonstrations, not laboratory acceptance or assessment of an instrument's condition. The calibration model is not a formal anonymisation guarantee.

Control Cq/amplitude, negative-control rates, SOP actions, call disagreement, replicate spread, manual/late calls, spatial Cq effects, edit delays and copied/forensic counts are omitted. The source export used a generic SOP and does not establish correct laboratory control roles.

Files:

- `DEMO_ROCHE_history_SYNTHETIC.json` and `.csv`: importable history and flat measurements.
- `calibration_model.json`: aggregate numerical model, seed, omitted metrics and source file hashes.
- `distribution_checks.json`: source aggregate versus generated quantiles, showing that they are approximations.
- `correlations_SYNTHETIC.json`: generated within-instrument paired counts and Pearson coefficients.
- `reconstruction_checks.json`: generator checks and targeted identifier scan.
- `application_import_checks.json`: application import, duplicate-key handling and chart-series checks.
- `*.svg` and matching `*.csv`: current application equipment charts and their values. Limits and flags are illustrative, not validated acceptance decisions.

Rebuild the data and documentation figures from the supplied model:

```sh
python -m pip install numpy matplotlib
cd generator
python reconstruct_roche.py
npm ci
node render_roche.cjs
```

Raw experiment files are not needed. `render_roche.cjs` tests the history import and rebuilds the equipment SVG/CSV exports using an offline DOM, without opening a browser. Refitting with `--source PATH_TO_ROCHE_FOLDER` requires the local source history exports. The PDF explains the derivation and limitations in its Roche reconstruction chapter.
