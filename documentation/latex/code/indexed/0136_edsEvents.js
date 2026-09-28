function edsEvents(run,push){
  const p=run.eds,A=p.analysis,wells=run.wells||[],list=(a,n=10)=>a.slice(0,n).join(", ")+(a.length>n?` … (+${a.length-n})`:"");
  const ntcCut=Number(((A.rules.find(r=>r.code==="NHC")||{}).criteria||"").split(" ")[1])||35;
  const hsd=Number(((A.rules.find(r=>r.code==="HSD")||{}).criteria||"").split(" ")[1])||0.5;
  if(run.isTemplate){push("info","Run state","Template or unrun experiment",`RunState ${p.exp.runState}; no results, curves or instrument log`);return;}
  if(p.exp.runState!=="COMPLETE")push("review","Run state",`Run state is ${p.exp.runState}`,"");
  if(p.exp.finalAnalysis!=="true")push("review","Run state","Final analysis is not marked complete","");
  const ntcByName=wells.filter(w=>w.role==="NTC"),ntcTask=Object.values(run.plate).some(r=>Object.values(r.channels||{}).some(c=>c.sampleType==="NTC"));
  if(ntcByName.length&&!ntcTask)push("review","Assay controls","NTC wells are identified by name only",
    "their task is UNKNOWN in the plate setup, so the instrument's AMPNC rule cannot fire on them");
  const late=ntcByName.filter(w=>w.CpRaw>=ntcCut);
  if(late.length)push("review","Assay controls",`${late.length} NTC result(s) with a late Ct ≥ ${ntcCut}`,list(late.map(w=>`${w.well} ${w.target} ${num(w.CpRaw,2)}`)));
  const inc=ntcByName.filter(w=>w.eds.ampLabel==="Inconclusive");
  if(inc.length)push("review","Assay controls",`${inc.length} NTC result(s) classed Inconclusive`,list(inc.map(w=>`${w.well} ${w.target}`)));
  const lowc=wells.filter(w=>Number.isFinite(w.CpRaw)&&w.eds.flags.includes("CC"));
  if(lowc.length)push("review","Stored Ct",`${lowc.length} reported Ct value(s) carry CQCONF (low Cq confidence)`,
    list(lowc.map(w=>`${w.well} ${w.sample} ${w.target} Ct ${num(w.CpRaw,2)} conf ${num(Number(w.eds.cqConf),3)}`)));
  const groups=byKey(wells,w=>`${w.sample}|${w.target}`);
  groups.forEach((g,k)=>{
    const [s,t]=k.split("|"),d=g.filter(w=>Number.isFinite(w.CpRaw)).map(w=>w.CpRaw);
    if(d.length&&d.length<g.length)push("review","Replicates",`${s} / ${t}: ${d.length} of ${g.length} replicates detected`,
      `Ct ${d.map(v=>num(v,2)).join(", ")}; stored means and ΔΔCt rest on these values only`);
    if(d.length>1&&sd(d)>hsd)push("review","Replicates",`${s} / ${t}: Ct SD ${num(sd(d),3)} above ${hsd} (HIGHSD rule)`,
      `range ${num(Math.min(...d),2)}–${num(Math.max(...d),2)}; wells ${g.filter(w=>Number.isFinite(w.CpRaw)).map(w=>w.well).join(" ")}`);
  });
  if(ec(run)){
    const e=ec(run),cal=A.ddct.Calibrator,ref=wells.filter(w=>w.sample===cal&&w.target===e&&Number.isFinite(w.CpRaw)).map(w=>w.CpRaw);
    uniq(wells.filter(w=>w.target===e&&w.role!=="NTC").map(w=>w.sample)).forEach(s=>{
      const v=wells.filter(w=>w.sample===s&&w.target===e),d=v.filter(w=>Number.isFinite(w.CpRaw)).map(w=>w.CpRaw);
      if(d.length<v.length)push("review","Endogenous control",`${e} not detected in ${v.length-d.length} of ${v.length} ${s} wells`,"");
      if(s!==cal&&ref.length&&d.length&&Math.abs(mean(d)-mean(ref))>3)
        push("review","Endogenous control",`${s}: ${e} differs by ${num(mean(d)-mean(ref),2)} cycles from ${cal}`,"shifts above 3 cycles are marked for review");
    });
  }
  (run.rqResults||[]).forEach(q=>{
    if(q.rqMin>0&&q.rqMax/q.rqMin>100)push("review","Relative quantification",
      `${q.sample} / ${q.target}: RQ interval spans more than 100-fold`,`RQ ${Number(q.normRatio).toPrecision(3)} (${Number(q.rqMin).toPrecision(3)} – ${Number(q.rqMax).toPrecision(3)}), n = ${q.n}`);
  });
  const cmp=p.results.filter(x=>x.ctDelta!=null),big=cmp.filter(x=>Math.abs(x.ctDelta)>0.2);
  if(cmp.length)push(big.length?"review":"info","Ct traceability",
    `Stored Ct re-derived from stored ΔRn and threshold: max |difference| ${num(Math.max(...cmp.map(x=>Math.abs(x.ctDelta))),3)} cycles`,
    big.length?list(big.map(x=>`${x.pos} ${x.target} ${num(x.ctDelta,2)}`)):`${cmp.length} wells compared; the software smooths first, so hundredths are expected`);
  const hidden=p.results.filter(x=>x.sample&&x.undetermined&&x.ctRecalc!=null);
  if(hidden.length)push("review","Ct traceability",`${hidden.length} Undetermined result(s) whose stored ΔRn crosses the threshold`,
    list(hidden.map(x=>`${x.pos} ${x.sample} ${x.target} ≈${num(x.ctRecalc,1)}`)));
  const start=p.exp.runStart,expired=p.calibrations.filter(c=>c.exp&&start&&c.exp<start);
  if(p.calibrations.length)push(expired.length?"error":"info","Calibration",
    expired.length?`${expired.length} calibration(s) expired before the run`:`${p.calibrations.length} calibrations valid on the run date`,
    p.calibrations.map(c=>`${c.name} ${EDS.dt(c.ts)}`).join("; "));
  const logName=p.log&&p.log.runName,qn=(p.provenance||{}).quantRunNames||[];
  if(logName&&logName!==p.exp.name)push("review","Provenance",`The instrument ran this plate as "${logName}"; the document is now named "${p.exp.name}"`,
    "messages.log Run Starting; the file was renamed or saved under a new name after the run");
  const foreign=qn.filter(n=>n!==p.exp.name&&n!==logName);
  if(foreign.length)push("review","Provenance",`Raw-data parts name a different run folder: ${foreign.join(", ")}`,"quant/*.xml calibration and output paths");
  else if(qn.length)push("info","Provenance","Raw-data parts name the same run folder",qn.join(", "));
  const pi=(p.provenance||{}).plateIni,pr=p.plate.passiveRef&&p.plate.passiveRef!=="NULL"?p.plate.passiveRef:"";
  if(pi&&pi.reference&&pr&&pi.reference.toUpperCase()!==pr.toUpperCase())
    push("review","Plate setup",`Passive reference differs between plate_setup.xml (${pr}) and plate_setup.ini (${pi.reference})`,"");
  if(pr)push("info","Plate setup",`Rn is normalised to the passive reference ${pr}`,"");
  const es=(p.provenance||{}).exportSetting;
  if(es&&es.location)push("info","Provenance",`Last export recorded in the file: ${es.format||"?"} to ${es.location}`,`file name ${es.fileName||"?"}`);
  Object.values(p.stdCurves||{}).forEach(sc=>{
    const bad=sc.r2!=null&&sc.r2<0.98,eff=sc.efficiency;
    push(bad||(eff!=null&&(eff<90||eff>110))?"review":"info","Standard curve",
      `${sc.target}: slope ${num(sc.slope,4)}, R² ${num(sc.r2,4)}, efficiency ${num(eff,2)} % (derived from the stored slope)`,
      `y-intercept ${num(sc.yIntercept,3)}; ${sc.x?sc.x.length:0} standard points; review limits R² ≥ 0.98, efficiency 90–110 %`);
  });
  const flagged=p.plate.wells.filter(w=>w.sample&&w.flags.length);
  if(flagged.length)push("info","Flags",`${flagged.reduce((n,w)=>n+w.flags.length,0)} stored flag(s) on ${flagged.length} named well(s)`,
    uniq(flagged.flatMap(w=>w.flags.map(f=>EDS.flagName(f.code)))).join(", "));
  const emp=p.plate.wells.filter(w=>!w.sample&&w.tasks.length);
  if(emp.length)push("info","Plate setup",`${emp.length} well(s) carry targets but no sample name`,"read, but left out of the result rows");
  const om=p.plate.wells.filter(w=>w.omit);
  if(om.length)push("review","Plate setup",`${om.length} omitted well(s)`,om.map(w=>w.pos).join(" "));
  if(p.log){
    const L=p.log;
    push("info","Instrument log",`${L.temps.length} temperature records, ${L.images} images, ${L.errors.length} error/warning line(s)`,
      `run ${EDS.dt(L.start)} – ${EDS.dt(L.end)}; firmware ${L.version||"?"}`);
    const spread=L.temps.length?Math.max(...L.temps.map(t=>t[4])):0;
    if(spread>1.5)push("review","Instrument log",`Block zone spread reached ${num(spread,2)} °C`,"maximum difference between the six sample zones");
    if(L.start&&p.exp.runStart&&Math.abs(L.start-p.exp.runStart)>120000)
      push("review","Instrument log","Log start and experiment start differ by more than 2 minutes",`${EDS.dt(L.start)} vs ${EDS.dt(p.exp.runStart)}`);
  }else push("review","Instrument log","messages.log is missing from a completed run","");
}
