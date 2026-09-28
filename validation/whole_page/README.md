# Whole-page validation evidence — build with command mode and assisted mode

Page under test: `qpcr_qc_forensics.html`
SHA-256 `5685e516afeee0b7f3af4d13f15ac25131b3d89d18ee508a3ec006105a144f78`, 893,995 bytes.

## Re-running it

```
node fnindex.cjs prod.html      # fnindex.json   the parsed index of the script
python3 srcmap.py               # srcmap.json    line range of every symbol
node capture_all.cjs            # validation_full.json   (three passes)
node endtoend.cjs               # endtoend.json
node invariants.cjs prod.html corpus 3
node synthetic_probe.cjs prod.html corpus
node schema_findings.cjs        # schema_findings.json
node docdata.cjs                # docdata.json   material for the console and mode chapters
python3 genchap.py              # the console, modes and structure chapters
python3 genval2.py              # the validation chapters
python3 gentables.py            # the tables of the older chapters, re-cut to fit
```

`prod.html` is the build under test, `corpus/` the instrument files, `rdml/` the exchange
files, `synth/` the exchange files written to isolate one clause of the specification each.

## Results on this build

| | |
|---|---|
| Symbols indexed | 676 |
| Functions executed with a stated input | 527 |
| Constants read | 113 |
| Private to a module closure | 25 |
| State-changing, probed in isolation | 7 |
| Deliberately not called | 4 |
| Raised an error | 0 |
| Property checks | 16 / 16 |
| Checks against a run whose answers were fixed first | 27 / 27 |
| Named cases for the exchange-file reader | 89 / 89 |
| Tabs / review views / graphs / console views / export buttons | 8 / 8 / 25 / 8 / 7 producing 32 files |
| Page errors | 0 |

Provenance of the arguments: 140 real file (R), 76 derived (D), 336 synthetic (S), 23 live
interface (E).

## The document generators

`texlib.py` holds the three rules every table in the document follows: it fits the text block,
every row is one line, and a cell that does not fit is truncated with an ellipsis rather than
wrapped. It also holds the map that states instrument and file names in neutral terms
everywhere outside a verbatim source listing.
