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
