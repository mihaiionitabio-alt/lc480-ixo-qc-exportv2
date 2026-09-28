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
  });

  /* run acceptance */
  const crit=[],add=(criterion,action,pass,evidence)=>{if(action==="off")return;crit.push({criterion,action,status:pass===null?"n/a":pass?"pass":action==="reject"?"fail":"review",evidence:evidence||""});};
  if(SOP.reviewOnly)add("Profile is a review scaffold", "review", null, "Informational: laboratory approval and assay-specific sample interpretation are not configured.");
  const g=run.integrity;
  add("Container integrity",R.integrity,g?(g.ok!==false&&g.zipCrcOk!==false):null,integrityLabel(run));
  if(run.eds)add("Run completed",R.runState,run.eds.exp.runState==="COMPLETE",run.eds.exp.runState);
  SOP.controls.forEach(c=>{
    if(!(Number(c.minPerRun)>0))return;
    const present=uniq(wells.filter(w=>sopControlSpec(w)===c).map(w=>w.pos)).length;
    add(`Control present — ${c.name}`,R.controlsMissing,present>=Number(c.minPerRun),`${present} well(s); SOP requires ${c.minPerRun}`);
  });
  const fails=rows.filter(r=>r.outcome==="Control fail");
  const sid=SOP.sample_id||SOP.sampleId;
  if(sid&&sid.pattern){let re=null;try{re=new RegExp(sid.pattern,sid.flags||"i");}catch(e){}
    if(re){const sampleNames=uniq(wells.filter(w=>w.sample&&!sopControlSpec(w)&&w.role!=="Standard").map(w=>String(w.sample).trim()).filter(Boolean));
      const bad=sampleNames.filter(n=>!re.test(n));add("SC sample identifier format","review",bad.length===0,bad.length?`${bad.length} sample name(s) do not match ${sid.pattern}`:`${sampleNames.length} sample name(s) match the SC_ identifier rule`);}}
  SOP.controls.forEach(c=>{
    const mine=rows.filter(r=>r.ctrl===c&&c.expect!=="standard");if(!mine.length)return;
    const bad=mine.filter(r=>r.outcome==="Control fail");
    add(`Control result — ${c.name}`,c.onFail||R.controlsFail,!bad.length,bad.length?bad.map(r=>`${r.sample}/${r.target}: ${r.reason}`).join("; "):`${mine.length} control result(s) accepted`);
  });
  sopStdCurves(run).forEach(sc=>{
    const ok=sc.r2>=sopNum(R.minR2)&&sc.efficiency>=sopNum(R.effMin)&&sc.efficiency<=sopNum(R.effMax)&&sc.logs>=sopNum(R.minLogs)-1e-9&&sc.monotonic;
    add(`Standard curve — ${sc.target}`,R.stdCurve,ok,`slope ${num(sc.slope,3)}, R² ${num(sc.r2,4)}, E ${sc.efficiency>1000||sc.efficiency<-100?"out of range":num(sc.efficiency,1)+" %"}, ${num(sc.logs,1)} log range${sc.monotonic?"":", standards out of order"}`);
  });
  const ntcRows=rows.filter(r=>r.ctrl&&r.ctrl.expect==="negative"&&r.det);
  if(ntcRows.length&&Number.isFinite(sopNum(R.ntcGap))){
    ntcRows.forEach(n=>{
      const unk=rows.filter(r=>!r.ctrl&&r.target===n.target&&r.det&&r.role!=="Standard").map(r=>r.cqMaxObs);
      if(!unk.length)return;const gap=n.cqMin-Math.max(...unk);
      add(`NTC-to-sample gap — ${n.target}`,R.ntcGapAction,gap>=sopNum(R.ntcGap),`NTC ${n.sample} Cq ${num(n.cqMin,2)}; latest sample Cq ${num(Math.max(...unk),2)}; gap ${num(gap,2)} (SOP ≥ ${R.ntcGap})`);
    });
  }
  const T=runTimes(run);
  if(Number.isFinite(T.editDelayH)&&Number.isFinite(sopNum(R.editDelayHours)))
    add("Edited within the allowed window",R.editAction,T.editDelayH<=sopNum(R.editDelayHours),`last change ${sopFmtTime(T.lastEdit)} — ${num(T.editDelayH,1)} h after the run ended (SOP ≤ ${R.editDelayHours} h)`);
  if(Number.isFinite(T.created)&&Number.isFinite(T.start)&&T.created>T.start+60000)
    add("Experiment created before the run",R.editAction,false,`created ${sopFmtTime(T.created)}, run started ${sopFmtTime(T.start)}`);
  if(run.eds){
    const start=run.eds.exp.runStart,exp=(run.eds.calibrations||[]).filter(c=>c.exp&&start&&c.exp<start);
    if((run.eds.calibrations||[]).length)add("Calibrations valid on the run date",R.calibration,!exp.length,exp.length?exp.map(c=>`${c.name} expired ${sopFmtTime(c.exp)}`).join("; "):`${run.eds.calibrations.length} calibration(s) valid`);
    const L=run.eds.log;
    if(L&&L.temps&&L.temps.length&&Number.isFinite(sopNum(R.maxZoneSpread))){const sp=Math.max(...L.temps.map(t=>t[4]));
      add("Block zone uniformity",R.zoneAction,sp<=sopNum(R.maxZoneSpread),`maximum zone spread ${num(sp,2)} °C (SOP ≤ ${R.maxZoneSpread})`);}
  }
  const rejected=crit.filter(c=>c.status==="fail"),reviewed=crit.filter(c=>c.status==="review");
  const status=run.isTemplate?"Template":rejected.length?"Rejected":reviewed.length?"Accepted with review":"Accepted";
  if(rejected.length&&R.invalidRunOverrides)rows.forEach(r=>{if(!r.ctrl&&r.outcome!=="Standard"&&r.outcome!=="Not interpreted"){r.storedOutcome=r.outcome;r.outcome="Invalid run";r.reason=rejected.map(c=>c.criterion).join("; ");}});
  rows.forEach(r=>{
    const o=SOP.outcomes[r.outcome]||SOP_OUTCOME_DEFAULTS[r.outcome]||{};
    r.label=o.label||r.outcome;r.colour=o.colour||"#94a3b8";
    r.report=sopFmt(o.text,{sample:r.sample,target:r.target,cq:num(r.cqMean,2),sd:num(r.cqSd,2),det:r.det,n:r.n,cutoff:r.cqMax,reason:r.reason,outcome:r.label,run:runName(run)});
  });
  return {run,ri,rows,criteria:crit,status,rejected,reviewed,icMedian,times:T};
}
