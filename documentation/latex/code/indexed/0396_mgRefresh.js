function mgRefresh(){
  const oldKey=mgItemKey(mgItem());
  const all=mgBuildQueue();
  MG.queue=MG.scope?mgScopeFilter(all):(MG.filter==="alarm"?all.filter(x=>x.sev==="alarm"):all);
  if(!MG.queue.length){
    MG.queue=MG.filter==="alarm"
      ?[mgIt({kind:"summary",sev:"ok",pict:MG_PICT.summary,kindWord:"data set",code:"OK",title:"No chart is outside a limit",
         value:String(RUNS.length),unit:RUNS.length===1?"run read":"runs read",
         state:"Nothing is outside a control or specification limit. Use the top row to read any part of the data set.",
         actions:[{key:"3",label:"Show every item",cmd:"everything"}]})]
      :all;
  }
  const same=MG.queue.findIndex(x=>mgItemKey(x)===oldKey);
  MG.at=same>=0?same:Math.min(Math.max(0,MG.at),Math.max(0,MG.queue.length-1));
}
