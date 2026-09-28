function validateRunBoundary(run,source){
  const at=m=>new Error(`${source||"run"}: ${m}`);
  if(!run||typeof run!=="object")throw at("decoder returned no run object");
  if(!Array.isArray(run.wells))throw at("decoded object has no wells array");
  if(run.wells.length>APP_LIMITS.maxWellsPerRun)throw at(`${run.wells.length} wells exceeds the safety limit`);
  if(run.meta!=null&&(typeof run.meta!=="object"||Array.isArray(run.meta)))throw at("meta is not an object");
  const bad=run.wells.findIndex(w=>!w||typeof w!=="object"||Array.isArray(w));
  if(bad>=0)throw at(`well ${bad+1} is not an object`);
  return run;
}
