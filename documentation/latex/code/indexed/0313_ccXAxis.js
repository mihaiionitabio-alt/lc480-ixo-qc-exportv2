function ccXAxis(def,cfg,rows){
  const want=cfg.x||def.x||"order";
  if(want==="cycles"&&rows.some(r=>Number.isFinite(r.block_cycles)))return {kind:"cycles",label:"Block cycles (instrument counter)",x:rows.map(r=>r.block_cycles)};
  if(want==="hours"||(want==="cycles"))return {kind:"hours",label:"Observed cumulative run hours (loaded archive)",x:rows.map(r=>r.hours)};
  if(want==="date")return {kind:"date",label:"Date",x:rows.map(r=>(r.date||0)/864e5)};
  return {kind:"order",label:"Run (in date order)",x:rows.map((r,i)=>i+1)};
}
