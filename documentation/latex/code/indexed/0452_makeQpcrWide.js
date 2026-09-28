function makeQpcrWide(run,analysisKey){
  const groups=curveAnalysisGroups(run);
  const group=analysisKey==null?groups[0]:groups.find(g=>g.key===analysisKey);
  const wells=group?group.wells:[];
  if(!wells.length)return "";
  const n=Math.max(...wells.map(w=>w.curve.length));
  const names=wells.map(w=>`${safeName(w.target||"tgt")}_${safeName(w.sample||w.well)}_${w.well}`);
  const lines=["Cycles,"+names.join(",")];
  for(let i=0;i<n;i++){
    lines.push([i+1,...wells.map(w=>i<w.curve.length?w.curve[i]:"")].join(","));
  }
  return lines.join("\n")+"\n";
}
