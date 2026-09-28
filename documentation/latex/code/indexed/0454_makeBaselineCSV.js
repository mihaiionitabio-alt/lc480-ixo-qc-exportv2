function makeBaselineCSV(run){
  const cols=[{key:"experiment",label:"experiment"},{key:"well",label:"well"},{key:"sample",label:"sample"},
    {key:"target",label:"target"},{key:"role",label:"role"},{key:"cycle",label:"cycle"},
    {key:"raw",label:"raw"},{key:"baseline_subtracted",label:"baseline_subtracted"}];
  const rows=[];
  run.wells.forEach(w=>{
    if(!w.curve)return;
    const base=Math.min(...w.curve);
    w.curve.forEach((v,i)=>rows.push({experiment:run.meta.name||run.file,well:w.well,sample:w.sample||"",
      target:w.target||"",role:w.role||"",cycle:i+1,raw:v,baseline_subtracted:v-base}));
  });
  return toCSV(cols,rows);
}
