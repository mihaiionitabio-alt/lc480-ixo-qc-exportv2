function reviewStatisticsRows(){
  const groups=new Map();
  RUNS.forEach((run,ri)=>(run.wells||[]).forEach(w=>{
    const key=`${ri}|${w.analysisUid||w.analysis||w.target||""}`;
    if(!groups.has(key))groups.set(key,{experiment:runName(run),analysis:w.analysis||"",target:w.target||"",
      rows:[],cq:[],conc:[]});
    const g=groups.get(key),q=Number(w.CpRaw),c=Number(w.CalcConc);
    g.rows.push(w);if(Number.isFinite(q)&&q>0)g.cq.push(q);if(c>0)g.conc.push(c);
  }));
  return [...groups.values()].map(g=>({
    experiment:g.experiment,analysis:g.analysis,target:g.target,results:g.rows.length,
    amplified:g.cq.length,uncertain:g.rows.filter(w=>w.call==="Uncertain").length,
    missing_curves:g.rows.filter(w=>!w.curve).length,
    mean:mean(g.cq),sd:sd(g.cq),cv:cv(g.cq),min:g.cq.length?Math.min(...g.cq):NaN,
    q1:percentile(g.cq,.25),median:median(g.cq),q3:percentile(g.cq,.75),
    max:g.cq.length?Math.max(...g.cq):NaN,
    concentration_n:g.conc.length,concentration_mean:mean(g.conc),
    concentration_sd:sd(g.conc),concentration_cv:cv(g.conc)
  }));
}
