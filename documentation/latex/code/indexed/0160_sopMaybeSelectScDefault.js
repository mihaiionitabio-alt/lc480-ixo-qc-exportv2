function sopMaybeSelectScDefault(){
  if(!RUNS.length)return;
  const sc=RUNS.every(r=>/^SC(?:[_\s-]|$)/i.test(runName(r)));
  const old=String(SOP&&SOP.name||"");
  if(sc&&/^(Generic qPCR|GMO screening — qualitative|Forensic DNA quantification)/i.test(old)){
    SOP=SOP_PRESETS.sc();sopStore();invalidateAnalysisCaches();
  }
}
