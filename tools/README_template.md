# MISSY — qPCR raw values, open formats, quality control and forensics

A single HTML file that reads finished qPCR experiments — LightCycler `.ixo`, QuantStudio
`.eds`/`.edt` and RDML — and hands you the numbers the instrument stored, in formats open-source
tools read directly. Nothing is uploaded; everything runs in the page.

**Research use only. Not validated for diagnostic use.** This is an independent, offline tool. It is
**not** software of the instrument manufacturers and is not endorsed by them. It reads what the
instrument software stored; it does not replace vendor software, a validated LIMS, or method
validation. Instrument and software names appear only to identify file formats.

## What is here

| | |
|---|---|
| `page/index.html` | the page |
| `page/index_interactive_2026-09-27.html` | the same page with an interactive chart view |
| `docs/latex/` | the source of the technical documentation |
| `tools/` | everything that generates the documentation from the page |
| `notes/` | the written record of each build |

The built document — **1,408 pages** — is attached to the
[latest release](../../releases/latest), together with the synthetic demonstration data.

```
qPCR_QC_forensics_documentation_2026-09-27_base_plus_update.pdf
  1,408 pages · 54,839,747 bytes
  SHA-256 7B4468F9389C7982AC9FE71AEFB692F1A3814D341706FFD64A0FB65B8A6C2B6F
```

## The data in the documentation is synthetic

Every demonstration run, plotted measurement and history row in the document and in `demo-data/` is
invented for testing. Dates, identifiers and values are not from any experiment. The document says
so on its second page and labels every figure drawn from it.

## Rebuilding

See `tools/build.sh` (or `tools\build.ps1`). You need XeLaTeX, Python 3.11 with `reportlab`,
`pypdf` and `playwright`, Node 20 with `acorn`, a Chromium for Playwright, and a CJK-capable font —
`docs/fonts/README.md` explains why and how to supply one.

`tools/verify_base_plus_update_2026-09-27.py` is the acceptance check: page count, the diagram
caption on every symbol, the table captions, the two indexes, and both data states in the gallery.

## Licence

<choose one and state it here — the page, the documentation and the scripts are the author's work;
the demonstration data is synthetic and carries no third-party rights>
