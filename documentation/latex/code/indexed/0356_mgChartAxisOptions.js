function mgChartAxisOptions(it){
  const def=it&&it.chartId?CC_BY_ID[it.chartId]:null;if(!def||def.type==="funnel")return [];
  const rows=ccRowsFor(it.instrument),current=ccCfg(def.id).x||def.x||"order",out=[{value:"order",label:"Run order"}];
  if(rows.some(r=>Number.isFinite(r.date)))out.push({value:"date",label:"Date"});
  if(rows.length)out.push({value:"hours",label:"Cumulative hours"});
  if(rows.some(r=>Number.isFinite(r.block_cycles)))out.push({value:"cycles",label:"Block cycles"});
  return out.map(o=>Object.assign(o,{current:o.value===current}));
}
