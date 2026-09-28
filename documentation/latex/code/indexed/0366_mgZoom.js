function mgZoom(kind){
  const z=Number.isFinite(MG.zoom)&&MG.zoom>0?MG.zoom:1;
  if(kind==="in")MG.zoom=Math.min(5,+(z*1.25).toFixed(3));
  else if(kind==="out")MG.zoom=Math.max(.5,+(z/1.25).toFixed(3));
  else {MG.zoom=1;MG.panX=0;MG.panY=0;}
  mgApplyChartView();
}
