function bundleReadme(){
  return `Raw values, open formats, instrument records and forensic log exported from LightCycler 480 .ixo / QuantStudio 3/5 .eds experiments
${new Date().toISOString()}

Runs included
${RUNS.map(r=>`  - ${r.meta.name||r.file} (${r.rows}x${r.cols}, ${r.nCycles||"?"} cycles, `
  +`${r.wells.length} results, ${uniqueCurveCount(r)} result-linked curves, ${acquiredCurveCount(r)} acquired channel/well curves, `
  +`UID ${sourceUidOf(r)||"not recorded"}, SHA-256 ${sourceSHA256Of(r)||"not recorded"}, CRC-32 ${sourceCRCOf(r)||"not recorded"})`).join("\n")}

Files
  cq_values.csv         stored crossing points (Cq / Ct), one row per result; QuantStudio flags, ΔCt, ΔΔCt, RQ
  runs_qc_forensic_log.csv   container integrity, control, flag and traceability findings
  relative_quantification.csv  stored ΔΔCt / ratio summaries, if any
  multicomponent_raw.csv  QuantStudio per-dye and per-filter signal, if any
  <run>/*_QuantStudio_export.txt   QuantStudio export layout as text (MAN0010409, chapter 3)
  <run>/*_QuantStudio_export.xlsx  the same as a workbook with the software's sheet layout
  <run>/instrument_records/*.csv  run metadata, integrity, program, channels, calibrations, log
  melting_peaks.csv     melting temperatures, if the run has a Tm analysis
  experiment_settings.csv  every setting read out of the container, with its source
  metadata.jsonld       Schema.org/DCAT dataset metadata with PROV-O/PAV provenance
  checksums.sha256      SHA-256 of every component in this open bundle
  <run>/rdml_data.xml   RDML 1.4 - rename to .rdml or zip it to open in RDML tools
  <run>/*_qpcR_curves.csv     one wide curve table per analysis, first column "Cycles"
  <run>/*.rdes.tsv            one long curve table per analysis, one row per cycle
  analyse_with_qpcR.R         fits the curves in R and compares with stored Cq
  analyse_with_linregpcr.py   runs LinRegPCR through rdmlpython

Two things worth knowing
  Keep the original .ixo / .eds alongside this open bundle. It is the provenance anchor;
  its SHA-256 is recorded above and in metadata.jsonld, but the original vendor
  container is not duplicated inside this export.

  RDML is written at version 1.4 because rdmlpython refuses to run LinRegPCR on
  anything older, and every dye is declared as its own element because it raises
  KeyError on a target whose dye is only referenced. Both were found by running
  the tool, not by reading the specification.

  The values in cq_values.csv are the instrument's own. Nothing was recomputed.
  Where this export disagrees with the instrument software, the file is the
  reference - please report it. If sample names were pseudonymised, the mapping
  is not part of this bundle.
`;
}
