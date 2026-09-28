function exportCatalogue(){
  const items=exportCatalogueCore();
  items.splice(1,0,{
    title:"Forensic log (CSV)",
    note:"One row per run (counts, status) and one per finding: controls, flags, replicate spread, Ct traceability, calibrations and instrument log.",
    ready:()=>RUNS.length>0,run:()=>downloadForensicCSV()
  });
  items.splice(2,0,{
    title:"QuantStudio export layout (TXT)",
    note:"Header plus Sample Setup, Raw Data, Amplification Data, Multicomponent Data, analysis summaries and Results as tab-delimited sections (MAN0010409, chapter 3), with the columns and row order of the software's own export. For LIS/LIMS parsers that expect that layout.",
    ready:()=>RUNS.some(r=>r.eds&&r.eds.results.length),
    run:()=>RUNS.filter(r=>r.eds&&r.eds.results.length).forEach(r=>download(safeName(r.meta.name||r.file)+"_QuantStudio_export.txt",
      EDS.qsExport(r.eds,{pseudo:pseudoOn(),nameOf:exportName}),"text/plain"))
  });
  items.splice(3,0,{
    title:"QuantStudio export workbook (XLSX)",
    note:"The same sheets, columns and row order as the QuantStudio software's Excel export (Sample Setup, Raw Data, Amplification Data, Multicomponent Data, analysis summaries, Results, Reagent Information), rebuilt from the .eds using the export configuration saved inside it.",
    ready:()=>RUNS.some(r=>r.eds&&r.eds.results.length),
    run:()=>RUNS.filter(r=>r.eds&&r.eds.results.length).forEach(r=>download(safeName(r.meta.name||r.file)+"_QuantStudio_export.xlsx",
      qsWorkbook(r,{pseudo:pseudoOn(),nameOf:exportName}),"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
  });
  items.push({
    title:"Relative quantification (CSV)",
    note:"Stored relative-quantification results: ΔΔCt summaries with RQ and confidence limits from QuantStudio, pairing ratios from LightCycler.",
    ready:()=>rqRows().length>0,
    run:()=>{const rows=rqRows();download(baseName()+"_relative_quantification.csv",toCSV(Object.keys(rows[0]).map(k=>({key:k,label:k})),rows),"text/csv");}
  });
  items.push({
    title:"Multicomponent and raw filter data (CSV)",
    note:"QuantStudio only: per-dye multicomponent signal and every filter-set reading, one row per named well and cycle — the data under the stored Rn.",
    ready:()=>RUNS.some(r=>r.eds&&r.eds.raw.sets.length),
    run:()=>{const rows=edsSignalRows();if(rows.length)download(baseName()+"_multicomponent_raw.csv",toCSV(Object.keys(rows[0]).map(k=>({key:k,label:k})),rows),"text/csv");}
  });
  const bundle=items.find(it=>/one ZIP/.test(it.title));
  if(bundle){items.splice(items.indexOf(bundle),1);items.push(bundle);}
  return items.map(it=>Object.assign({},it,{run:()=>withExportNames(it.run)}));
}
