function mgGo(step){
  if(!MG.queue.length)return;MG.zoom=1;MG.panX=0;MG.panY=0;
  MG.at=(MG.at+step+MG.queue.length)%MG.queue.length;
  const nx=MG.queue[MG.at];
  MG.chart=!!(nx&&(nx.chartId||(MG.scope==="graphs"&&nx.graphId)));
}
