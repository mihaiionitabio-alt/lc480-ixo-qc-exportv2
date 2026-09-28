function sopDownloadBundle(){
  if(!RUNS.length)return;
  const entries=[{name:"README.txt",data:sopReadme()},{name:"sop_profile.json",data:sopJSON()},
    {name:"runs.csv",data:csvOf(sopRunRows())},{name:"run_acceptance.csv",data:csvOf(sopCriteriaRows())},
    {name:"sample_report.csv",data:csvOf(sopSampleRows("",true))},{name:"results_by_target.csv",data:csvOf(sopInterpretationRows("",true))}];
  withExportNames(()=>entries.push({name:"forensic_log.csv",data:csvOf(reviewForensicEvents())}));
  const sums=entries.map(e=>`${sha256Hex(typeof e.data==="string"?new TextEncoder().encode(e.data):e.data)}  ${e.name}`).join("\n")+"\n";
  entries.push({name:"SHA256SUMS.txt",data:sums});
  download(baseName()+"_SOP_bundle.zip",makeStoredZip(entries),"application/zip");
}
