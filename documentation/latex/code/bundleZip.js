function bundleZip(){
  const entries=[];
  const rows=allWellRows();
  if(rows.length)entries.push({name:"cq_values.csv",data:toCSV(Object.keys(rows[0]).map(k=>({key:k,label:k})),rows)});
  const tm=tmRows();
  if(tm.length)entries.push({name:"melting_peaks.csv",data:toCSV(Object.keys(tm[0]).map(k=>({key:k,label:k})),tm)});
  const settings=derivedSettings();
  if(settings.length)entries.push({name:"experiment_settings.csv",
    data:toCSV([{key:"setting",label:"setting"},{key:"value",label:"value"},{key:"source",label:"read_from"}],settings)});
  entries.push({name:"metadata.jsonld",data:machineMetadataJSON()});
  const ev=reviewForensicEvents(),rr=reviewRunRows(ev),frows=[...rr.map(r=>({record_type:"run",...r})),
    ...ev.map(e=>({record_type:"forensic_event",experiment:e.experiment,severity:e.severity,area:e.area,finding:e.finding,evidence:e.evidence}))];
  entries.push({name:"runs_qc_forensic_log.csv",data:toCSV(uniq(frows.flatMap(Object.keys)).map(k=>({key:k,label:k})),frows)});
  const rq=rqRows();
  if(rq.length)entries.push({name:"relative_quantification.csv",data:toCSV(Object.keys(rq[0]).map(k=>({key:k,label:k})),rq)});
  const sig=edsSignalRows();
  if(sig.length)entries.push({name:"multicomponent_raw.csv",data:toCSV(Object.keys(sig[0]).map(k=>({key:k,label:k})),sig)});
  RUNS.forEach(r=>{
    const s=safeName(r.meta.name||r.file);
    if(r.eds&&r.eds.results.length)entries.push({name:`${s}/${s}_QuantStudio_export.txt`,
      data:EDS.qsExport(r.eds,{pseudo:pseudoOn(),nameOf:exportName})});
    if(r.eds&&r.eds.results.length)entries.push({name:`${s}/${s}_QuantStudio_export.xlsx`,data:qsWorkbook(r,{pseudo:pseudoOn(),nameOf:exportName})});
    const rec=instrumentRecordTables(r);
    Object.entries(rec).forEach(([k,rows])=>{if(rows&&rows.length)entries.push({name:`${s}/instrument_records/${k}.csv`,
      data:toCSV(uniq(rows.flatMap(Object.keys)).map(x=>({key:x,label:x})),rows)});});
    if(r.wells.some(w=>w.curve)){
      entries.push({name:`${s}/rdml_data.xml`,data:makeRDMLXML(r)});
      makeQpcrWideTables(r).forEach(t=>entries.push({name:`${s}/${t.file}`,data:t.data}));
      makeRDESTables(r).forEach(t=>entries.push({name:`${s}/${t.file}`,data:t.data}));
    }
  });
  const first=RUNS[0]?safeName(RUNS[0].meta.name||RUNS[0].file):"run";
  const firstWide=RUNS[0]&&makeQpcrWideTables(RUNS[0])[0];
  entries.push({name:"analyse_with_qpcR.R",
    data:rScript().replace("REPLACE_WIDE",firstWide?`${first}/${firstWide.file}`:`${first}/${first}_qpcR_curves.csv`).replace("REPLACE_CQ","cq_values.csv")});
  entries.push({name:"analyse_with_linregpcr.py",
    data:pyScript().replace("REPLACE_RDML",`${first}/rdml_data.xml`)});
  entries.push({name:"README.txt",data:bundleReadme()});
  entries.push({name:"checksums.sha256",data:entries.map(e=>{
    const bytes=e.data instanceof Uint8Array?e.data:new TextEncoder().encode(String(e.data));
    return `${sha256Hex(bytes)}  ${e.name}`;
  }).join("\n")+"\n"});
  download(baseName()+"_open_formats.zip",makeStoredZip(entries),"application/zip");
}