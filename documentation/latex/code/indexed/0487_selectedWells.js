function selectedWells(run,key){
  const all=(run&&run.wells)||[];
  if(key===ORPHAN_CURVE_KEY)return orphanCurveCandidates(run);
  return key?all.filter(w=>(w.analysisUid||w.analysis||w.target||"")===key):all;
}
