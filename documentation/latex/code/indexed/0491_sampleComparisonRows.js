function sampleComparisonRows(a,b,limit){
  const stableKey=w=>`${w.target||""}||${w.analysis||w.analysisGroupName||"(analysis)"}`;
  const keys=uniq(RUNS.flatMap(r=>(r.wells||[]).map(stableKey)))
    .filter(Boolean);
  return keys.map(key=>{
    const all=RUNS.flatMap(r=>(r.wells||[]).filter(w=>stableKey(w)===key));
    const meta=all[0]||{},vals=name=>all.filter(w=>(w.sample||"")===name)
      .map(w=>Number(w.CpRaw)).filter(q=>Number.isFinite(q)&&q>0);
    const av=vals(a),bv=vals(b),ma=mean(av),mb=mean(bv),diff=ma-mb;
    return {analysis:meta.analysis||key,target:meta.target||"",sample_1:a,mean_1:ma,sd_1:sd(av),n_1:av.length,
      sample_2:b,mean_2:mb,sd_2:sd(bv),n_2:bv.length,difference:diff,
      review:Number.isFinite(diff)&&Math.abs(diff)>=limit?`Review: |ΔCq| ≥ ${limit}`:""};
  }).sort((x,y)=>(x.target||x.analysis).localeCompare(y.target||y.analysis));
}
