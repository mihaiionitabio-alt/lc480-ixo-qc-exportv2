function makeRDES(run,analysisKey){
  const groups=curveAnalysisGroups(run);
  const group=analysisKey==null?groups[0]:groups.find(g=>g.key===analysisKey);
  const head=["source_uid","source_crc32","experiment","well","sample","target","analysis","channel","filter","role","instrument_type",
    "replicate_group","stored_cq","call","cycle","fluorescence"];
  const lines=[head.join("\t")];
  (group?group.wells:[]).forEach(w=>{
    w.curve.forEach((v,i)=>lines.push([sourceUidOf(run),sourceCRCOf(run),run.meta.name||run.file,w.well,w.sample,w.target,w.analysis,w.channel,
      w.filterComb,w.role,w.instrType,Number.isFinite(w.replicateOf)?w.replicateOf+1:"",
      w.CpRaw??"",w.call,i+1,v].join("\t")));
  });
  return lines.join("\n")+"\n";
}
