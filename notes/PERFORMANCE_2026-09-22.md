# Performance update — 22 September 2026

Updated `index.html` and `qpcr_qc_forensics.html` (identical entry points).

## Trace finding

Analysis of `D:\IXO\Trace-20260922T135225.json.gz` found that chart-row construction repeatedly scanned the entire experiment collection for forensic findings, once per experiment. Its inclusive sampled CPU time was approximately 265 seconds across the recording; the longest recorded UI task was approximately 93 seconds. Inclusive times overlap and are not independent totals.

## Changes

- Cache forensic scans for the current experiment collection and SOP profile, and build per-experiment finding counts once. Refreshing data or changing the SOP invalidates these caches.
- Index SOP evaluations by run rather than searching the list for every chart row.
- Use asynchronous native SHA-256 for source files where available, retaining the original implementation as a fallback.
- Decode staged IXO text one file at a time, avoiding retention of a second text representation of the entire collection.
- Skip translation DOM scans in English; explicitly restore text when switching back from Chinese.
- Display graph-export progress before ZIP construction and disable repeated export clicks until completion.

No chart definitions, statistical thresholds, control-role rules, or forensic comparison tolerances were changed.

## Verification

An offline Node/DOM regression harness loaded the old and new scripts and decoded three real IXO files. Decoded run objects, including source hashes, matched. For 3-, 30-, and 100-run collections assembled from those fixtures, chart rows and forensic findings matched exactly. SOP export rows and all graph ZIP entry contents also matched. SOP changes and replacement experiment collections invalidated the forensic cache correctly.

Chart-row calculation benchmark (milliseconds):

| Fixture runs | Original | Updated |
|---|---:|---:|
| 3 | 33 | 20 |
| 30 | 1,441 | 99 |
| 100 | 16,156 | 317 |
| 350 | Not repeated | 1,105 |

Repeated cached calculations rounded to 0–1 ms. These are source-level benchmarks using repeated real fixtures, not an end-to-end browser benchmark of 350 distinct experiments or the full 750 MB collection. Browser rendering, PNG rasterization, initial parsing, and disk saving remain separate costs. Memory improvement follows from removing retained staged text; browser peak memory was not measured. EDS end-to-end import was not included in this regression run.

## Use and rollback

Save any needed session exports, then reload the HTML page and select the experiment files again to use the updated code. An already open tab still runs the previous code until reloaded.

Original HTML copies, the trace summary, patch script, regression harness, and measurements are in `D:\IXO\performance_20260922`. To roll back, copy the two HTML files from its `before` directory back to this release directory.

The PDF and LaTeX documentation were not regenerated for this performance-only patch; printed source line numbers describe the preceding revision.
