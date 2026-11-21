# IXO bibliography — coverage and limitations

Updated 21 November 2026. Main catalogue: **318 references**. Separate source-provided records needing review: **63**.

## Scope

- Inventory of 110,146 files in the IXO project, excluding dependency caches such as node_modules and .git. Extracted 10,524 unique content sources, including 1,522 PDF documents; duplicate file copies are deduplicated by SHA-256.
- PDF text, document metadata, DOCX/PPTX XML, project BibTeX files, Markdown, text, TeX, wiki sources and selected reference JSON/homepages were searched. Attached public NASA/Fortran material was included where available.
- DOI candidates from both source documents and their reference lists were checked against Crossref and, where applicable, DataCite. NASA reports were checked against NTRS. Metadata verification confirms the registered work, not the correctness of a claim in that work or its use by IXO.
- Accessible active and archived ChatGPT/Codex history lists were searched; project-related message pages were inspected. The search does not include deleted, inaccessible or unreturned messages. Some large Codex threads and oversized message bodies were only partially available.
- Two requested private Claude conversations could not be read through the public web tool; computer access was blocked because the browser URL could not be verified safely. Their contents are **not claimed as reviewed**. Private conversation URLs are omitted from public files.

## Citation format

`ixo-bibliography.bib` is the principal reusable file. Use `biblatex` with `style=authoryear` and Biber, or a Harvard-compatible BibTeX style. `urldate` stores the actual access date; `year` is the publication year, never inferred from file modification dates. Undated web resources omit `year` and appear as n.d. in the reading list. Author-year disambiguation is handled automatically by your citation processor; the supplied plain-text list includes display suffixes.

Web pages use Available at and Accessed: 21 November 2026 where retrieved successfully. For DOI records, this date records registry metadata retrieval; publisher landing pages were not each independently tested. Failed web retrieval attempts are described in the record and link-check report without a false successful access date. The Harvard text is an author-date reading aid; a university or journal's required Harvard variant may differ.

`review-required.bib` retains bibliographic records from project reference lists that could not be independently resolved. Do not treat them as verified. `metadata-discrepancies.json` lists title/DOI conflicts detected in imported citations; registry metadata takes precedence in the main catalogue, but a mismatched DOI may belong to a different work than originally intended.

## Boundaries

No claim that every project file was scholarly literature. Generated plots, test outputs, private SOPs, laboratory records, internal drafts and template examples are not automatically published as independent references. Bundled R-library references may be discovered indirectly and are not proof of runtime dependency. References found only inside another work's bibliography are secondary discoveries: consult the originals before citing substantive claims.

Scanned PDFs without extractable text, unreadable files, archives not expanded in the project tree, embedded binary assets and external webpages not explicitly retrieved can contain additional sources. No OCR was performed. There are 3 extraction errors recorded in the local audit. This is a documented bibliography harvest, not a guarantee of exhaustive retrieval or peer review.

## Privacy and copyright

Only bibliographic metadata and public-source links are published. Manuals, articles, private paths, chat transcripts and sensitive project data are not redistributed. Local provenance retains source-file mappings separately. NASA/JAXA/CCSDS titles are reproduced accurately as references; citing these does not characterize MISSY as a flight system or imply agency endorsement.

Private PCR SOPs, laboratory experiment reports and references to the private laboratory organisation are excluded from all public catalogue files, including review candidates.

Private PCR SOPs, laboratory experiment reports and references to the private laboratory organisation are excluded from all public catalogue files, including review candidates.
