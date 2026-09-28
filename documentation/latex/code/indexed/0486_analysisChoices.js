function analysisChoices(run){
  const seen=new Set(),out=[{value:"",label:"All analyses"}];
  if(orphanCurveCandidates(run).length)
    out.push({value:ORPHAN_CURVE_KEY,label:"Rising curves with no result in their channel"});
  (run&&run.wells||[]).forEach(w=>{
    const key=w.analysisUid||w.analysis||w.target||"";
    if(!key||seen.has(key))return;seen.add(key);
    out.push({value:key,label:`${w.target||"(no target)"} — ${w.analysis||"analysis"}`});
  });
  return out;
}
