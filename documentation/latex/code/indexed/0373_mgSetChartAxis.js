function mgSetChartAxis(axis){
  const it=mgItem();if(!it||!it.chartId)return;
  ccSetCfg(it.chartId,{x:axis===((CC_BY_ID[it.chartId]||{}).x||"order")?"":axis});CC_STATE.cache=null;MG.chart=true;mgRefresh();
}
