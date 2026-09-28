function mgChartTypeOptions(it){
  const def=it&&it.chartId?CC_BY_ID[it.chartId]:null;if(!def)return [];
  const types=def.type==="funnel"?["funnel"]:["p","u","c"].includes(def.type)?[def.type]:def.type==="xbars"?["xbars","i","ewma","cusum","trend"]:["i","ewma","cusum","trend"];
  const current=ccCfg(def.id).type||def.type;return types.map(value=>({value,label:MG_TYPE_LABEL[value]||value,current:value===current}));
}
