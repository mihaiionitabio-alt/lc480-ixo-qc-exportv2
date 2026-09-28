# Microgravity console fixes — 23 September 2026

The corrected candidate is `..\qpcr_qc_forensics_console.html`. It has now also been promoted to the release entry points `..\qpcr_qc_forensics.html` and `..\index.html`; the pre-promotion files are in `..\documentation\backups\before_console_promotion_20260923\`. The source page plus overlay generator are `patch_micro_console.py`.

## Corrections

- Pasted Cq tables now produce a useful console item instead of the false “no experiment files” message. The item explains that file-based forensic and instrument charts need decoded experiment files.
- Queue-building failures in forensic, SOP, and baseline summaries are recorded through the page diagnostics instead of being silently discarded.
- Chart findings are not duplicated as generic error findings; the chart item remains the source of the chart alarm.
- The alarm-only filter now says that there are no outside-limit alarms when the filtered queue is empty. It no longer silently falls back to every item.
- The current item is retained by identity when the queue is rebuilt. A changed queue no longer makes the operator look at a different item without notice.
- Confirmation, chart navigation, and leaving the console are now visible button actions. Chart navigation uses a dedicated full-screen chart view with a fixed bottom action bar.
- Duplicate action numbers are removed from the rendered button list.
- The console is button-only: speech recognition, speech synthesis, the command field, voice status, and external voice adapters were removed.
- Export commands now report missing chart data and status-report failures instead of failing silently.
- The periodic queue refresh detects content and selection changes even when the item count stays the same.

## Verification

- The application script passes `node --check`.
- The generator passes `python -m py_compile`.
- Re-running `patch_micro_console.py` against the current production HTML produces a console-enabled page whose application script also passes `node --check`.
- The promoted production files `qpcr_qc_forensics.html` and `index.html` are identical and pass the same application-script syntax check.
