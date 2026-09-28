function sopEvaluateRun(run,ri){
  const processing=sopProcessingApplicability(run);
  const applicability=processing.applicable?sopRunApplicability(run):processing;
  if(!applicability.applicable){
    const T=runTimes(run),reason=applicability.reason;
    return {run,ri,rows:[],criteria:[{criterion:"Method applicability",action:"unresolved",status:"n/a",evidence:reason}],status:`Profile not applicable — ${reason}`,rejected:[],reviewed:[],icMedian:NaN,times:T,applicability};
  }
  const R=SOP.run,rep=SOP.replicates,wells=(run.wells||[]).filter(w=>w.kind!=="relquant");
  const groups=new Map();
  wells.forEach(w=>{const k=`${w.sample||"(well "+w.well+")"}||${w.target||w.analysis||""}`;
    if(!groups.has(k))groups.set(k,[]);groups.get(k).push(w);});
  const rows=[],sampleRef=new Map(),icCqs=[];
  // first pass: descriptive values
  const pre=[...groups].map(([key,ws])=>{
    const w0=ws[0],spec=sopTargetSpec(w0),ctrl=sopControlSpec(w0),use=ws.filter(w=>!sopOmitted(w));
    const cqMax=sopNum(spec.cqMax),cqs=use.map(sopCq);
    const det=cqs.filter(q=>Number.isFinite(q)&&(!Number.isFinite(cqMax)||q<=cqMax));
    const above=cqs.filter(q=>Number.isFinite(q)&&Number.isFinite(cqMax)&&q>cqMax);
    const conc=use.map(w=>Number(w.CalcConc)).filter(c=>Number.isFinite(c)&&c>0);
    const g={run,ri,key,wells:ws,used:use,sample:w0.sample||"",target:w0.target||w0.analysis||"",role:w0.role||"",
      spec,ctrl,cqMax,n:use.length,omitted:ws.length-use.length,det:det.length,above:above.length,
      cqMean:mean(det),cqSd:sd(det),cqMin:det.length?Math.min(...det):NaN,cqMaxObs:det.length?Math.max(...det):NaN,
      conc:mean(conc)};
    if(spec.kind==="ic"&&!ctrl&&g.role!=="Standard"&&Number.isFinite(g.cqMean))icCqs.push(g.cqMean);
    if((spec.kind==="ic"||spec.kind==="reference")&&!ctrl){
      const cur=sampleRef.get(g.sample)||[];cur.push(g);sampleRef.set(g.sample,cur);}
    return g;
  });
  const icMedian=icCqs.length?icCqs.slice().sort((a,b)=>a-b)[Math.floor(icCqs.length/2)]:NaN;
  const out=(g,outcome,reason,rule)=>{g.outcome=outcome;g.reason=reason||"";g.rule=rule||"";rows.push(g);};
  pre.forEach(g=>{
    const cut=g.cqMax,late=sopNum(g.spec.cqLate),lo=sopNum(g.ctrl&&g.ctrl.cqLo),hi=sopNum(g.ctrl&&g.ctrl.cqHi);
    if(!g.n){out(g,"Not interpreted",g.omitted?"all replicates omitted":"no result","omitted wells");return;}
    if(g.ctrl){
      if(g.ctrl.expect==="standard"){out(g,"Standard","","control: "+g.ctrl.name);return;}
      if(g.ctrl.expect==="negative"){
        if(g.n<(Number(g.ctrl.minReplicates)||1)){out(g,"Control fail","insufficient control replicates","control: "+g.ctrl.name);return;}
        if(g.det)out(g,"Control fail",`amplified in ${g.det}/${g.n} (min Cq ${num(g.cqMin,2)} ≤ ${cut})`,"control: "+g.ctrl.name);
        else out(g,"Control pass","","control: "+g.ctrl.name);
        return;
      }
      const why=[];
      if(g.n<(Number(g.ctrl.minReplicates)||1))why.push(`only ${g.n} replicate(s); control requires ${g.ctrl.minReplicates}`);
      if(g.det<g.n)why.push(`detected in ${g.det}/${g.n}`);
      if(g.det&&Number.isFinite(lo)&&g.cqMean<lo)why.push(`mean Cq ${num(g.cqMean,2)} < ${lo}`);
      if(g.det&&Number.isFinite(hi)&&g.cqMean>hi)why.push(`mean Cq ${num(g.cqMean,2)} > ${hi}`);
      out(g,why.length?"Control fail":"Control pass",why.join("; "),"control: "+g.ctrl.name);return;
    }
    if(g.role==="Standard"){out(g,"Standard","","standard");return;}
    const reasons=[];let outcome;
    const roleNeed=sopReplicateMinimum(g);
    const need=Math.min(Math.max(1,roleNeed),g.n);
    if(g.n<roleNeed)reasons.push(`${g.n} replicate(s), SOP requires ${roleNeed}`);
    if(g.det===0){
      outcome="Negative";
      if(g.spec.kind==="ic"||g.spec.kind==="reference"){outcome=SOP.ic.missingOutcome||"Invalid";reasons.push(`${g.spec.kind==="ic"?"internal control":"reference"} not detected`);}
      else{
        const refs=(sampleRef.get(g.sample)||[]).filter(r=>r!==g);
        const failed=refs.filter(r=>r.det===0);
        const shifted=refs.filter(r=>r.spec.kind==="ic"&&Number.isFinite(icMedian)&&Number.isFinite(r.cqMean)&&r.cqMean-icMedian>sopNum(SOP.ic.maxShift));
        if(failed.length){outcome=SOP.ic.missingOutcome||"Invalid";reasons.push(`${failed.map(r=>r.target).join(", ")} not detected — a negative cannot be reported`);}
        else if(shifted.length){outcome=SOP.ic.shiftOutcome||"Inconclusive";reasons.push(`IC shifted +${num(shifted[0].cqMean-icMedian,2)} cycles from the run median (limit ${SOP.ic.maxShift}) — possible inhibition`);}
      }
    }else if(g.det<need){
      outcome=rep.partialOutcome||"Inconclusive";reasons.push(`detected in ${g.det}/${g.n} replicates, SOP requires ${need}`);
    }else{
      outcome="Positive";
      if(Number.isFinite(late)&&g.cqMean>late){outcome=g.spec.lateOutcome||"Inconclusive";reasons.push(`mean Cq ${num(g.cqMean,2)} above the late-signal limit ${late}`);}
      const qmin=sopNum(g.spec.quantMin);
      if(Number.isFinite(qmin)&&Number.isFinite(g.conc)&&g.conc<qmin){outcome=g.spec.lateOutcome||"Inconclusive";reasons.push(`quantity ${g.conc.toPrecision(3)} below ${qmin} (stochastic zone)`);}
      if(g.det<g.n&&outcome==="Positive")reasons.push(`detected in ${g.det}/${g.n}`);
      if(g.spec.kind==="ic"&&Number.isFinite(icMedian)&&g.cqMean-icMedian>sopNum(SOP.ic.maxShift))
        reasons.push(`IC +${num(g.cqMean-icMedian,2)} cycles from the run median`);
    }
    if(g.det>=2&&Number.isFinite(g.cqSd)&&g.cqSd>sopNum(rep.maxSd)){
      reasons.push(`replicate SD ${num(g.cqSd,2)} > ${rep.maxSd}`);
      if(rep.sdOutcome&&rep.sdOutcome!=="flag"&&(outcome==="Positive"||outcome==="Negative"))outcome=rep.sdOutcome;
    }
    if(g.n<roleNeed&&(outcome==="Positive"||outcome==="Negative"))outcome="Repeat";
    out(g,outcome,reasons.join("; "),g.spec.kind+": "+(g.spec.match||"*"));
// … 57 more line(s): the complete code is at lines 4514–4570 of the HTML file