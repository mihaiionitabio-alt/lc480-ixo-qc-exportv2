function mgApplyChartView(){
  const st=document.getElementById("mg-chart-stage");if(!st)return;
  if(!Number.isFinite(MG.zoom)||MG.zoom<=0)MG.zoom=1;
  if(!Number.isFinite(MG.panX))MG.panX=0;
  if(!Number.isFinite(MG.panY))MG.panY=0;
  st.style.transform=`translate(${MG.panX}px,${MG.panY}px) scale(${MG.zoom})`;
  st.style.transformOrigin="center center";
}
