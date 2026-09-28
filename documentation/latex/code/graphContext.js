function graphContext(){
  const g=GRAPHS.find(x=>x.id===$("#g-graph").value)||GRAPHS[0];
  const ri=Number($("#g-run").value)||0;
  return {g,ri,run:RUNS[ri],target:$("#g-target").value,metric:$("#g-metric").value,signal:$("#g-signal").value,
    log:$("#g-log").checked,colourby:$("#g-colourby").value,level:$("#g-level").value,control:$("#g-control").value};
}