function sopRunRows(){
  return sopEvaluateAll().map(e=>{
    const cnt=o=>e.rows.filter(r=>r.outcome===o).length,T=e.times||{};
    return {experiment:runName(e.run),platform:e.run.platform||"LightCycler 480",status:e.status,
      rejected:e.rejected.map(c=>c.criterion).join("; "),review:e.reviewed.map(c=>c.criterion).join("; "),
      positive:cnt("Positive"),negative:cnt("Negative"),inconclusive:cnt("Inconclusive"),repeat:cnt("Repeat"),
      invalid:cnt("Invalid")+cnt("Invalid run"),control_fail:cnt("Control fail"),
      run_start:sopFmtTime(T.start),run_end:sopFmtTime(T.end),last_change:sopFmtTime(T.lastEdit),
      hours_run_end_to_last_change:Number.isFinite(T.editDelayH)?+T.editDelayH.toFixed(2):"",
      run_minutes:Number.isFinite(T.durationMin)?+T.durationMin.toFixed(1):"",...sopMeta()};
  });
}
