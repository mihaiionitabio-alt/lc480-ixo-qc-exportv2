function sopEvents(){
  const out=[];
  sopEvaluateAll().forEach(e=>{
    const exp=runName(e.run);
    e.criteria.filter(c=>c.status==="fail"||c.status==="review").forEach(c=>out.push({experiment:exp,severity:c.status==="fail"?"error":"review",
      area:"SOP: "+SOP.name,finding:`${c.criterion} — ${c.status==="fail"?"not met (run rejected)":"not met (review)"}`,evidence:c.evidence}));
    const act=e.rows.filter(r=>/Invalid$|Repeat|Inconclusive/.test(r.outcome));
    if(act.length)out.push({experiment:exp,severity:"review",area:"SOP: "+SOP.name,
      finding:`${act.length} result(s) need action (${uniq(act.map(r=>r.outcome)).join(", ")})`,
      evidence:act.slice(0,8).map(r=>`${r.sample}/${r.target}: ${r.reason}`).join("; ")+(act.length>8?" …":"")});
  });
  return out;
}