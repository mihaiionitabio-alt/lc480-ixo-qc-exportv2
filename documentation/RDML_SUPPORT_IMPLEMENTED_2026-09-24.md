# RDML support implementation record — 24 September 2026

RDML 1.2/1.3 intake and processing-state handling are implemented in the production HTML pair. The requested policy is explicit:

> A vendor-export RDML is evaluated by the laboratory profile only when no matching `.ixo` or `.eds` instrument container is loaded. If the instrument file is present, the RDML remains available as a comparison companion and is marked `superseded`.

Raw RDML and third-party-analysis RDML are read for evidence but are profile-not-applicable.

## Production files

- `D:/IXO/release_unified_2026-09-21_r2/qpcr_qc_forensics.html`
- `D:/IXO/release_unified_2026-09-21_r2/index.html`
- SHA-256 for both: `6E14CC49153AD0662B94C47218F213051C5128FEC78CC8A479CE00F17F391F4E`
- Previous pair: `documentation/backups/before_rdml_support_20260924/`

## Implemented behavior

- Accepts `.rdml` files and ZIP files containing `rdml_data.xml`.
- Reads RDML namespace-independently and preserves amplification curves, Cq, exclusions, notes, melting points, N0 and efficiency metadata.
- Classifies each RDML run from its contents as `vendor-export`, `third-party` or `raw`.
- Treats Cq equal to the run cycle count as undetermined for vendor exports when no N0 or efficiency contradicts that interpretation.
- Marks a matching RDML/instrument pair as `superseded`; the instrument container remains the record.
- Adds the processing-state SOP gate before the existing assay applicability gate.
- Skips missing-Cq rising-curve findings for raw RDML and non-quantifying modules.

## Validation

The attached/workshop RDML corpus parsed without page errors. The available six files plus `example_1_3.rdml` were exercised; raw files classified as `raw`, LinRegPCR files as `third-party`, and vendor exports as `vendor-export`.

The real intake smoke test verified:

- RDML alone: one `vendor-export` run, no supersession.
- Matching RDML plus `CORPUS-RDML-1.eds`: the RDML is marked `superseded`, and its SOP status states that the instrument file is the record.
- Page errors: zero.

Regression checks after promotion:

- Synthetic result oracle: 27/27.
- Existing value invariants: 16/16.
- Eight QuantStudio examples: all 25 graphs and exports rendered; zero tab, graph, export or page errors.
- The preceding module-scope and 351-file screening validations remain covered by the backup build and were not changed by the RDML reader.

RDML is not re-analysed: the page records what the producer supplied. Tm-only, genotype-only and raw files do not become quantitative SC results.

> **Note, 28 September 2026.** `example_1_3.rdml` is named above but is **not** in the
> published repository. Its five companions are byte-for-byte the public reader-workshop
> files; this one matches nothing on disk, so its provenance could not be confirmed and it
> was withheld. Nothing in the harness depends on it.
