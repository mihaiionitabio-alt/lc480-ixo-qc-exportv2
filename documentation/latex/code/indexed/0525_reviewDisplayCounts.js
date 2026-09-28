function reviewDisplayCounts(rows){
  return {unique:rows.length,
    errors:rows.filter(r=>r.severity==="error").length,
    reviews:rows.filter(r=>r.severity==="review").length,
    info:rows.filter(r=>r.severity==="info").length,
    affectedRuns:uniq(rows.flatMap(r=>r.runs||[])).length,
    variants:rows.reduce((n,r)=>n+(r.variantCount||1),0),
    raw:rows.reduce((n,r)=>n+r.occurrences,0)};
}
