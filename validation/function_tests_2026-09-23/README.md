# Read-only function verification dossier

This folder documents the current `qpcr_qc_forensics.html` without modifying it. The source index contains 571 functions, arrow functions, constants and object expressions. `function_test_results.json` is the machine-readable record produced by the browser harness. `function_test_report.md` is the complete one-row-per-entry audit; `function_test_report.html` provides a searchable table.

## Artifacts

- `function_test_report.md` — inputs, outputs/contracts, test status, line range, layer and relations for all 571 entries.
- `function_test_report.html` — same record with browser filtering.
- `function_test_results.json` — raw harness output.
- `function_call_map.mmd` — readable Mermaid end-to-end map.
- `function_call_map_full.dot` — full static graph with 571 nodes and indexed reference edges.
- `function_logic_diagrams.md` — module-level logic diagrams for intake, decoding, SOP interpretation, review/rising traces, control charts, views and exports.
- `run_function_verification.cjs` — reproducible read-only harness.
- `build_dossier.py` — report generator.

## Result vocabulary

`PASS-executable` is an actual isolated browser invocation. `REVIEW-fixture-required` is a deliberate non-execution when a coherent decoded run/profile/history/DOM/file/export fixture is required; it is not a failure. `REVIEW-runtime` records a generated probe that did not meet the runtime contract and identifies the error. `PASS-static` confirms that the indexed source range exists and matches the current HTML. No application values, stored calls, exports or source files were changed.

The current run processed all 571 entries: 197 executable passes, 350 fixture-required reviews, 24 runtime reviews, 556 static range passes, 15 static range reviews, and zero page errors. The HTML SHA-256 is recorded in the report and JSON so the dossier can be tied to the exact source version.
- unction_logic_flows.json — one input → indexed symbol → output flow and relation list for each of the 571 entries.
