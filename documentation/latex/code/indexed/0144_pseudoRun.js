function pseudoRun(r){
  const P=s=>exportName(s),mapRows=a=>(a||[]).map(w=>Object.assign({},w,{sample:P(w.sample)}));
  const plate={};Object.entries(r.plate||{}).forEach(([k,v])=>plate[k]=Object.assign({},v,{name:P(v.name)}));
  const meta=Object.assign({},r.meta);if(meta.OriginalPath)meta.OriginalPath="(withheld)";
  return Object.assign({},r,{meta,plate,wells:mapRows(r.wells),tmWells:mapRows(r.tmWells),
    genoResults:mapRows(r.genoResults),rqResults:mapRows(r.rqResults),otherResults:mapRows(r.otherResults),
    sourcePath:r.file,analyses:(r.analyses||[]).map(a=>Object.assign({},a,{quantStats:(a.quantStats||[]).map(q=>Object.assign({},q,{master:P(q.master)}))}))});
}
