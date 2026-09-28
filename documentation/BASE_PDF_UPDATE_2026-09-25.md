# Base PDF update — 25 September 2026

The supplied document was preserved as the base and the current HTML implementation was appended as an eight-page revision addendum.

- Base: `qPCR_QC_forensics_documentation_2026-09-24_modes.pdf` — 1,109 pages.
- Addendum: `revision_addendum_2026-09-25_clean_numbered.pdf` — 8 pages.
- Final: `qPCR_QC_forensics_documentation_2026-09-25_base_plus_update.pdf` — 1,117 pages.
- Final SHA-256: `30025337476B10D196A13411C19E271332AC6C7EC22AB520DAADD1E0E0B58FF0`.
- Current HTML SHA-256: `37476D19C2FA80E0CECCE3CB20C57FABF0E63593F744522057F61216E37A42A0`.

The addendum records the RDML processing states and ceiling rule, the vendor-file priority rule, the 43 rising-curve review evidence plot and fields, the current MISSY option 3 SVG, the continuous code-panel colours and line-number treatment, current source locations, and the validation record. Generated figures are SVG/HTML graphics; no CSV listing is used.

Validation completed:

- `missy_smoke_2026-09-25.cjs`: 58 charts, 28 group charts, invalid-option rejection, 73 instrument-record rows, report bytes 38,271, zero browser errors.
- PDF merge check: 1,109 base pages preserved byte-for-byte at page text level; 8 addendum pages appended; required update sections present.
- Addendum visual check: plot, tables, continuous code panels and page numbers rendered without the previous fixed-header overlap.

## Correction of 28 September 2026 — identifier withdrawal

Four kinds of string were withdrawn from the final PDF. The file name, the path and the page count
are unchanged; the bytes are not, so every checksum is recorded here. **This record deliberately
does not reprint any withdrawn string** — naming a thing in the document that documents its removal
would defeat the removal. Each is described by what it was and where it stood.

| | |
|---|---|
| Final SHA-256, 25 September (withdrawn) | `30025337476B10D196A13411C19E271332AC6C7EC22AB520DAADD1E0E0B58FF0` |
| Final SHA-256, 28 September (current) | `EDD95C78137AF676C51332974FCE4A5AFE7E27DC6CEE64698AF8100472FD8411` |
| Pages | 1,117, unchanged |
| Bytes | 36,480,689 -> 36,245,231 |

What was withdrawn:

1. **A laboratory export file name**, on one page. It carried a sample identifier, a run date and
   operator initials. The sentence now names the description file without naming the export.
2. **An exchange file in the validation corpus**, on six pages, together with **its SHA-256** on
   three. Its provenance could not be confirmed as a vendor or template file, and an unconfirmed
   file is treated as laboratory material. It is listed as `CORPUS-EDS-3` throughout; a reading
   note in the validation method chapter says why the name is withheld, and its byte count is kept
   because the measurements were taken on it.
3. **A laboratory RDML export and its matching instrument file**, on five pages. The laboratory
   confirmed on 28 September that this was a real run. Both are listed as `CORPUS-RDML-1`. The
   measured counts that describe the *file-format* behaviour are kept — they characterise how a
   vendor export writes a missing crossing, not any sample.
4. **A third party's Windows user name**, on five pages, stored inside a vendor demonstration file
   and reprinted in a JSON listing. It now reads `<user>`.

Method: the text was removed from the content streams with PyMuPDF `apply_redactions`, not covered
over, and replacement text was written into the same boxes. Nothing else on any page was touched.
The unredacted document is retained offline under `documentation/withdrawn_2026-09-28/` and must
not be published.

The appended eight-page addendum still cites the 25 September checksum. That citation was correct
for the document as it stood on that day and has deliberately not been altered; this table is the
record of what replaced it.

The same four categories were withdrawn from
`qPCR_QC_forensics_documentation_2026-09-27_base_plus_update.pdf` (items 1, 3 and 4 applied there;
item 2 had already been withdrawn on 27 September): 1,409 pages unchanged, 54,842,013 ->
54,244,948 bytes, SHA-256
`D6F90C395CAB18739AC5C1CEA259F3F0E10912309815C6DEE35D3F7EEADC360D` ->
`1728428277F05027ED9CF0D2F7C5EA19D729BF0CA8A3641319CDD66DDCE8CFC0`.

Items 1, 3 and 4 were withdrawn from the LaTeX sources and from every other file in the release
that carried them, including the page itself: `index.html` is now
2,021,629 bytes, SHA-256 `327183B2107F704353273066826017ABB4B4E2331369130333750C1ACEDD3753`,
and it loads with zero console errors and 25 graphs.

**Why none of this was found earlier.** The scan that certified these documents matched raw page
text, and PDF justification had split one identifier across a space. `no_real_data_check.py` now
collapses whitespace before matching and treats the withdrawn corpus file and its checksum as
blocking. The RDML export and the user name were found only by a wider sweep — for file names, user
paths, e-mail addresses and operator-initial-and-date combinations — that is now part of the
pre-publication check. Both documents pass with exit 0.
