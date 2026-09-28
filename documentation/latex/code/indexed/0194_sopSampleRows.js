function sopSampleRows(filterRun,forExport){
  const P=s=>forExport?exportName(s):s;
  return sopEvaluateAll().filter(e=>filterRun==null||filterRun===""||String(e.ri)===String(filterRun)).flatMap(e=>{
    const by=byKey(e.rows.filter(r=>!r.ctrl&&r.outcome!=="Standard"),r=>r.sample);
    return [...by].map(([s,rs])=>{
      const order=["Invalid run","Invalid","Repeat","Inconclusive","Positive","Negative","Not interpreted"];
      const worst=rs.map(r=>r.outcome).sort((a,b)=>order.indexOf(a)-order.indexOf(b))[0];
      return {experiment:runName(e.run),run_status:e.status,sample:P(s),
        summary:rs.map(r=>`${r.target}: ${r.label}`).join("; "),needs_action:/Invalid|Repeat|Inconclusive/.test(worst)?"yes":"",
        report:rs.map(r=>sopFmt((SOP.outcomes[r.outcome]||{}).text,{sample:P(s),target:r.target,cq:num(r.cqMean,2),sd:num(r.cqSd,2),det:r.det,n:r.n,cutoff:r.cqMax,reason:r.reason,outcome:r.label,run:runName(e.run)})).join(" "),
        ...sopMeta()};
    });
  });
}
