function ccDynamic(run,ev,counts){
  const m={},rows=(ev&&ev.rows)||[];
  const pos=rows.filter(r=>r.ctrl&&r.ctrl.expect==="positive"&&r.ctrl.purpose!=="reference check"),amp={},pcq={},bat={};
  /* one series per target and control material; the extract (extraction date and aliquot/dilution qualifiers) is kept
     in pc_batch and becomes a segment of the chart. A second extract of the same material on one plate is its own series. */
  byKey(pos,r=>sopControlIdentity(r.wells[0],run).series).forEach((rs,ser)=>{
    const byEx=[...byKey(rs,r=>sopControlIdentity(r.wells[0],run).extract)].sort((a,b)=>b[1].reduce((s,r)=>s+r.n,0)-a[1].reduce((s,r)=>s+r.n,0));
    byEx.forEach(([ex,grp],k)=>{const t=k?`${ser} · additional extract ${k}`:ser;
      const a=grp.flatMap(r=>r.used.filter(w=>w.curve&&w.curve.length).map(w=>wellSignal(w.curve).amplitude));
      if(a.length)amp[t]=ccMedian(a);const q=grp.map(r=>r.cqMean).filter(Number.isFinite);if(q.length)pcq[t]=mean(q);bat[t]=ex;});});
  if(Object.keys(amp).length)m.pc_amplitude=amp;if(Object.keys(pcq).length)m.pc_cq=pcq;if(Object.keys(bat).length)m.pc_batch=bat;
  const eff={};sopStdCurves(run).forEach(s=>{if(Number.isFinite(s.efficiency)&&s.efficiency>0&&s.efficiency<200)eff[s.target]=s.efficiency;});
  if(Object.keys(eff).length)m.efficiency=eff;
  const neg=rows.filter(r=>r.ctrl&&r.ctrl.expect==="negative");
  if(neg.length){m.ntc_rate={};byKey(neg,r=>r.ctrl.purpose||r.ctrl.name).forEach((rs,k)=>{m.ntc_rate[k]={bad:rs.reduce((s,r)=>s+r.det,0),n:rs.reduce((s,r)=>s+r.n,0)};});}
  const ic=rows.filter(r=>r.spec&&r.spec.kind==="ic"&&!r.ctrl&&Number.isFinite(r.cqMean)&&Number.isFinite(ev.icMedian));
  const fixed=sopNum(SOP.ic.referenceCq);
  if(ic.length&&Number.isFinite(fixed))m.ic_shift=mean(ic.map(r=>r.cqMean-fixed));
  const samp=rows.filter(r=>!r.ctrl&&r.outcome!=="Standard"&&r.outcome!=="Not interpreted");
  if(samp.length){
    m.action_rate={bad:samp.filter(r=>/Inconclusive|Repeat|Invalid/.test(r.outcome)).length,n:samp.length};
    m.late_rate={bad:samp.filter(r=>/late-signal|stochastic/.test(r.reason||"")).length,n:samp.length};
    const comparable=samp.flatMap(r=>r.used.map(w=>({w,o:r.storedOutcome||r.outcome}))).filter(x=>/Positive|Negative/.test(x.w.call)&&/Positive|Negative/.test(x.o));
    if(comparable.length)m.call_disagree={bad:comparable.filter(x=>x.w.call!==x.o).length,n:comparable.length};
  }
  if(run.eds){const cq=(run.wells||[]).filter(w=>Number(w.CpRaw)>0);
    if(cq.length)m.low_conf={bad:cq.filter(w=>/CQCONF/.test(w.warnCodes||"")).length,n:cq.length};}
  /* replicate precision (Cq < 30, so stochastic noise does not hide pipetting skill) */
  const reps=rows.filter(r=>!r.ctrl&&r.det>=2&&r.cqMean<30&&Number.isFinite(r.cqSd));
  if(reps.length)m.rep_sd=Math.sqrt(mean(reps.map(r=>r.cqSd**2)));
  /* row/column pattern: residual of each well from its replicate-group mean, averaged per plate row and column */
  const res=[];reps.forEach(r=>r.used.forEach(w=>{const q=Number(w.CpRaw);if(q>0)res.push({row:w.row,col:w.col,e:q-r.cqMean});}));
  if(res.length>=8){const eff=k=>[...byKey(res,x=>x[k]).values()].filter(g=>g.length>=2).map(g=>Math.abs(mean(g.map(x=>x.e))));
    const rc=Math.max(0,...eff("row"),...eff("col"));m.rowcol=rc<1e-9?0:rc;}
  /* passive reference (QS): level and well-to-well spread */
  if(run.eds&&run.eds.mc&&run.eds.plate.passiveRef&&run.eds.plate.passiveRef!=="NULL"){
    const dye=run.eds.plate.passiveRef,lv=[];
    Object.entries(run.eds.mc.signal||{}).forEach(([pos,d])=>{const w=(run.plate||{})[pos];if(!w||!w.name||!d[dye])return;lv.push(mean(d[dye].slice(0,5)));});
    if(lv.length>=4){m.rox_level=ccMedian(lv);m.rox_cv=100*sd(lv)/mean(lv);}
  }
  /* manual interventions */
  let man=0,items=0;
  if(run.eds){const D=run.eds.analysis.detectors||{};Object.values(D).forEach(d=>{items+=2;if(d.autoCt===false)man++;if(d.autoBaseline===false)man++;});}
  (run.wells||[]).forEach(w=>{items++;if(sopOmitted(w)||String(w.manual||"")==="1")man++;});
  if(items)m.manual_rate={bad:man,n:items};
  counts=counts||forensicCounts();
  m.copied={count:counts.copied.get(runName(run))||0};
  m.findings={count:counts.findings.get(runName(run))||0};
  return m;
}
