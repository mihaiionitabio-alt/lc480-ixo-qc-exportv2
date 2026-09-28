function sopResultForWell(ri,w){
  const ev=sopEvaluateAll()[ri];if(!ev)return null;
  return ev.rows.find(r=>r.wells.includes(w))||null;
}
