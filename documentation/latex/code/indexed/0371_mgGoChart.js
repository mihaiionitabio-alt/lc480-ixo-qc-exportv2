function mgGoChart(step){
  MG.zoom=1;MG.panX=0;MG.panY=0;
  const chartIndexes=MG.queue.map((x,i)=>x&&x.chartId?i:-1).filter(i=>i>=0);
  if(!chartIndexes.length)return;
  let pos=chartIndexes.indexOf(MG.at);
  if(pos<0)pos=step>0?-1:0;
  pos=(pos+step+chartIndexes.length)%chartIndexes.length;
  MG.at=chartIndexes[pos];MG.chart=true;
}
