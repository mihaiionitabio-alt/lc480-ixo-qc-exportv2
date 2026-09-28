function sopInterpretationRows(filterRun,forExport){
  const P=s=>forExport?exportName(s):s;
  return sopEvaluateAll().filter(e=>filterRun==null||filterRun===""||String(e.ri)===String(filterRun)).flatMap(e=>e.rows.map(r=>({
    experiment:runName(e.run),run_status:e.status,sample:P(r.sample),target:r.target,role:r.role,
    kind:r.ctrl?"control: "+r.ctrl.name:r.spec.kind,wells:r.wells.map(w=>w.well).join(" "),
    replicates:r.n,detected:r.det,omitted:r.omitted||"",above_cutoff:r.above||"",
    cq_mean:Number.isFinite(r.cqMean)?+r.cqMean.toFixed(3):"",cq_sd:Number.isFinite(r.cqSd)?+r.cqSd.toFixed(3):"",
    cq_cutoff:Number.isFinite(r.cqMax)?r.cqMax:"",quantity:Number.isFinite(r.conc)?r.conc:"",
    outcome:r.outcome,label:r.label,reason:r.reason,report:sopFmt((SOP.outcomes[r.outcome]||{}).text,{sample:P(r.sample),target:r.target,cq:num(r.cqMean,2),sd:num(r.cqSd,2),det:r.det,n:r.n,cutoff:r.cqMax,reason:r.reason,outcome:r.label,run:runName(e.run)}),
    rule:r.rule,stored_calls:uniq(r.wells.map(w=>w.call)).join(" | "),
    ...sopMeta()})));
}
