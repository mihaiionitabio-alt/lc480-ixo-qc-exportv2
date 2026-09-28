function ccRowsFromRuns(){
  const h=sopHash();
  if(CC_STATE.cache&&CC_STATE.cache.runs===RUNS&&CC_STATE.cache.hash===h)return CC_STATE.cache.rows;
  const evs=new Map(sopEvaluateAll().map(e=>[e.run,e])),counts=forensicCounts();
  const rows=RUNS.filter(r=>!r.isTemplate).map(run=>{
    if(!run.ccStatic)run.ccStatic=ccStatic(run);
    const ev=evs.get(run),T=runTimes(run),st=run.ccStatic;
    const m=Object.assign({},st,ccDynamic(run,ev,counts));
    return {key:(run.meta||{}).sourceSHA256||run.file,run:runName(run),file:run.file,platform:ccPlatform(run),instrument:ccInstrumentKey(run),
      date:Number.isFinite(T.start)?T.start:(Number.isFinite(T.created)?T.created:NaN),operator:ccOperator(run),
      software:(run.meta||{}).SWVersion||"",firmware:st.firmware||(run.meta||{}).InstrumentVersion||"",
      block_cycles:st.block_cycles,protocol:ccProtocolKey(run),sop:SOP.name+" v"+SOP.version,m,loaded:true};
  });
  CC_STATE.cache={runs:RUNS,hash:h,rows};return rows;
}
