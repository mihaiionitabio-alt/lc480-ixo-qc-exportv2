# Re-validation of the published page — 28 September 2026

What is in this folder, and how to repeat it.

## What was measured

The page published at the repository root (`index.html`, 2,021,629 B, SHA-256
`327183b2107f704353273066826017abb4b4e2331369130333750c1acedd3753`) was compared with the page it
replaced (940,696 B, SHA-256 `8df4472eba4831bab5c0c712a30c60cdd20ad3e179ed1164c91c441db33c770b`).

Both were driven headless in Chromium, given the same 55 demonstration runs from
`demo_data/instruments/LC-DEMO-01`, and asked for **every** entry in the download catalogue. Each
entry was hashed and the two sets compared.

| | the page replaced | the page published |
|---|---|---|
| Runs read | 55 | 55 |
| Catalogue items | 101 | 101 |
| Export entries written | 139 | 139 |
| Entries that failed to draw | 0 | 0 |
| Page / console errors | 0 / 0 | 0 / 0 |
| Time to catalogue ready | 215 ms | 240 ms |

**138 of the 139 entries are byte-identical.** The one that differs is `README.txt`, and the only
differing line in it is its own generation time — the two runs were 1.3 seconds apart:

```
- Built: 2026-09-28T15:20:07.576Z
+ Built: 2026-09-28T15:20:08.885Z
```

So the stored Cq values, the calls, the chart mathematics and the export bytes are unchanged by the
interactive chart layer, measured against the page that was actually being served.

The interactive layer itself, measured through the catalogue's own export path with default options
and one instrument: **13 of 25 graphs** drawn through it, 12 kept on their drawn SVG (plate,
unanalysed, repsd, ic, outcomes, temperature, recalc, x_accept, x_control, x_control_batches,
x_control_age, x_control_thermal); **20 control charts** drawn through it — every chart with data in
this set — and 38 of the 58 defined kept on their SVG. Nothing failed to draw.

An earlier record put the graph figure at 23 of 25. That was taken in the interface with a target
chosen for each graph; this one is taken through the export path with the defaults, and is the
number these scripts reproduce.

## Files

| File | What it is |
|---|---|
| `parity.mjs` | drives both pages, selects the whole catalogue, hashes every export entry |
| `ix2.mjs` | counts, per catalogue image item, whether it draws through the interactive layer |
| `parity_exports.json` | the raw result: every entry name, length and SHA-256, for both pages |
| `interactive_counts.json` | the raw result: per item, spec count, trace count, any error |
| `chV2a_diagrams.tex` | the chapter section rewritten from these figures, as a standalone copy |

The full LaTeX source that builds the document is in `documentation/latex/`. Its `main.tex`
loads `chV2a_diagrams`, `chV2_functions` and `chV2b_gallery` and compiles to the 1,401 pages;
`fig/fndiag/` holds the 705 function diagrams and `fig/gallery/` the 66 captures. The only
thing missing is the font: supply a CJK-capable monospace at `documentation/latex/fonts/msyh.ttc`
yourself, as `tools/fonts_README.md` explains, because that font is not redistributable.
Three XeLaTeX passes reproduce the document.

## Repeating it

Node 20 with Playwright and a Chromium, and the demonstration runs unpacked:

```
node parity.mjs  <published page>.html  <candidate page>.html   # writes parity.json
node ix2.mjs     <candidate page>.html                          # writes ix2.json
```

Both scripts take the run folder from a constant at the top; point it at
`demo_data/instruments/LC-DEMO-01`. Nothing else is needed — the page is a single file and the
demonstration data is synthetic.

## What the document says

`documentation/qPCR_QC_forensics_documentation_2026-09-28.pdf` (1,401 pages, 53,125,714 B, SHA-256
`8fd4b61507b364d18c8a58bf6c7c92142993ba2219fe09492d822b20f6a6c697`) carries this record in its
chapter on the interactive chart view, naming both page checksums. The 1,409-page document dated
27 September is kept as the superseded record: its validation table describes a 2,007,034-byte build
that was made from the page as it stood on 25 September, did not carry three fixes that were already
published, and was never released.

## What was withdrawn before publication, and what checks the tree

Two identifiers from the laboratory's own files had reached the published document. One was an
export file name printed in the chapter on the reconstructed vendor profile; one was a corpus file
name with its checksum, printed in the method chapter and repeated in five rows of the oracle table.
Both were removed from the LaTeX sources, the affected pages of the two published PDFs were
redacted with a redaction that removes the glyphs from the content stream rather than covering them,
and the names now read as a description of what the file was, with the identifier withheld. Four
strings are additionally held as blocking patterns in `tools/publish_check.py`, so a file the upload
list does not overwrite cannot keep them in the repository unnoticed.

Two scanners guard the set. `tools/make_upload_list.py --scan` reads every file that the list
publishes: each by name, text by raw bytes, each PDF through its extracted text, each zip entry by
entry. It fails closed — a PDF whose text will not extract is reported as unscanned rather than
passed — and it names the text that matched, including inside the scanners themselves, so a real
identifier pasted into one of them is visible on the line instead of being hidden by the file's
name. `tools/publish_check.py` walks the staging tree itself, which is what catches a file the list
never mentions.

Both were wrong in the same way until 28 September. Their rule for a sample identifier asserted a
word boundary on each side of it; in a real file name the identifier is bordered by underscores,
which are word characters, so the rule matched none of the three real names it was tried against —
including the one that had reached GitHub. The boundaries are gone. Measured over the 2,561 files
this list publishes, the corrected rules produce no hit outside the scanners' own pattern
literals, and on a deliberately planted file — a PDF whose text will not extract, named like a
laboratory run — they report both the name and the failed extraction, where before neither appeared.
