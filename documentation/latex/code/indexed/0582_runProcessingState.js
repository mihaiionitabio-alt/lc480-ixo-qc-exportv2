function runProcessingState(run){
  if(!run)return {state:"unknown",reason:"no run"};
  if(!run.rdmlDoc)return {state:"instrument",reason:"decoded from the instrument's own container"};
  const d=run.rdmlDoc||{};
  const cq=(run.wells||[]).filter(w=>resultCq(w)!==null).length;
  if(!cq)return {state:"raw",
    reason:"the file carries fluorescence data only: no Cq, and no analysis by any software"};
  const named=(d.methods||[]).filter(Boolean);
  const tool=named.find(m=>RDML_REANALYSIS_TOOLS.test(m))
    ||(RDML_REANALYSIS_TOOLS.test(d.backgroundDeterminationMethod||"")?String(d.backgroundDeterminationMethod).split(",")[0]:"");
  if(tool)return {state:"third-party",tool,
    reason:`the results in this file were produced by ${tool}, not by the instrument's software`};
  if((run.meta&&run.meta.InstrumentName)||d.instrument)
    return {state:"vendor-export",
      reason:`exchange export of an analysis made by the instrument's software on ${(run.meta&&run.meta.InstrumentName)||d.instrument}`};
  return {state:"third-party",
    reason:"the file names no instrument, so the results in it were not written by the instrument's software"};
}
