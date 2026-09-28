function mgSetChartType(type){
  const it=mgItem();if(!it||!it.chartId)return;const def=CC_BY_ID[it.chartId];
  ccSetCfg(it.chartId,{type:type===def.type?"":type});CC_STATE.cache=null;MG.chart=true;mgRefresh();
}
