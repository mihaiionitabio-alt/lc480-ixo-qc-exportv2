function replicateReviewRows(limit){
  const groups=new Map();
  RUNS.forEach((run,ri)=>(run.wells||[]).forEach(w=>{
    const q=Number(w.CpRaw);if(!(q>0))return;
    const key=`${ri}|${w.analysisUid||w.analysis||""}|${w.sample||w.well}`;
    if(!groups.has(key))groups.set(key,{experiment:runName(run),analysis:w.analysis||"",
      target:w.target||"",sample:w.sample||w.well,wells:[],cq:[]});
    const g=groups.get(key);g.wells.push(w.well);g.cq.push(q);
  }));
  return [...groups.values()].filter(g=>g.cq.length>1&&range(g.cq)>=limit).map(g=>({
    experiment:g.experiment,analysis:g.analysis,target:g.target,sample:g.sample,
    wells:g.wells.join(" "),n:g.cq.length,mean:mean(g.cq),sd:sd(g.cq),range:range(g.cq),
    finding:`Replicate range ≥ ${limit} Cq`
  }));
}
