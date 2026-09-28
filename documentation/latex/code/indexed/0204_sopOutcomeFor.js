function sopOutcomeFor(run,w){
  const ri=RUNS.indexOf(run);if(ri<0||!w)return null;
  const ev=sopEvaluateAll()[ri];if(!ev)return null;
  return ev.rows.find(r=>r.wells.some(x=>x.pos===w.pos&&(x.target||x.analysis)===(w.target||w.analysis)))||null;
}
