function reviewBundleEntries(){
  if(!RUNS.length)return [];
  const csv=(rows)=>toCSV(Object.keys(rows[0]||{}).map(k=>({key:k,label:k})),rows);
  const stats=reviewStatisticsRows(),events=reviewForensicEvents(),runs=reviewRunRows(events);
  const entries=[
    {name:"review/plate_map.csv",data:csv(RUNS.flatMap(r=>plateMapRows(r,"")))},
    {name:"review/statistics.csv",data:csv(stats)},
    {name:"review/runs_and_qc.csv",data:csv(runs)},
    {name:"review/forensic_log.csv",data:csv(events)}
  ];
  const sampleNames=uniq(RUNS.flatMap(r=>(r.wells||[]).map(w=>w.sample).filter(Boolean)));
  if(sampleNames.length>=2)entries.push({name:"review/sample_comparison.csv",data:csv(sampleComparisonRows(sampleNames[0],sampleNames[1],1))});
  const controls=reviewControlSeries("root").flatMap(s=>s.points.map(p=>({series:s.sample,category:s.category,target:s.target,...p})));
  entries.push({name:"review/control_charts.csv",data:csv(controls)});
  const curves=RUNS.flatMap(run=>(run.wells||[]).filter(w=>w.curve&&w.curve.length).flatMap(w=>w.curve.map((v,i)=>({experiment:runName(run),well:w.well,sample:w.sample||"",target:w.target||"",analysis:w.analysis||"",role:w.role||"",call:w.call||"",cycle:i+1,fluorescence:v}))));
  entries.push({name:"review/amplification_curves.csv",data:csv(curves)});
  RUNS.forEach((run,i)=>{
    const tables=instrumentRecordTables(run);
    Object.entries(tables).forEach(([name,rows])=>entries.push({name:`review/instrument_${String(i+1).padStart(3,"0")}/${safeName(name)}.csv`,data:csv(rows)}));
  });
  return entries;
}
