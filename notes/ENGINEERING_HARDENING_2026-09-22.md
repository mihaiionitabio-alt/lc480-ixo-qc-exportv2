# Application engineering hardening — 2026-09-22

The single-file browser application now has explicit lifecycle and data boundaries while remaining offline and self-contained. The changes are implementation details; they do not alter stored Cq values, calls, control limits, or export formats.

## Runtime boundaries

- File intake accepts only the supported experiment/container extensions and stages original bytes for provenance.
- Decoders must return a run object with a wells array. An impossible well count is rejected at the boundary instead of reaching charts or exports.
- SOP evaluation continues to consume the decoded run model and the selected laboratory profile.
- Rendering and export code reads the run model. It does not replace decoded values.

## Lifecycle and resource controls

- Imports carry a generation token. A later file selection invalidates an earlier asynchronous read, so a slow decode cannot overwrite a newer selection.
- Intake is bounded to 512 selected files and 2 GiB of staged bytes. The limits are reported to the user and are not silent truncation.
- The diagnostic event list is bounded to the last 100 structured failures.
- The existing lazy tab rendering remains in place; render failures are captured and shown in the affected tab.

## Diagnostics

The browser test surface exposes `window.__qc.appDiagnostics()` with the current phase, active tab, import generation, run/staged counts, last error, and error count. `window.__qc.validateRunBoundary()` is available for deterministic decoder tests. No laboratory data is sent to a service.

## Verification

- `node --check` passes for the extracted page script.
- The same HTML is installed at the release root, the source tree, and the documentation package.
- `documentation_sources.zip` was rebuilt after the change.
- TeX compilation remains a separate environment step because XeLaTeX/latexmk is not installed on this Windows host; the LaTeX sources and package are current.
