function reviewForensicEventsCoreUncached(){
  const all=[];
  RUNS.forEach(run=>{
    const exp=runName(run),events=[],push=(severity,area,finding,evidence)=>
      events.push({experiment:exp,severity,area,finding,evidence:evidence||""});
    push("info","Recovery",run.eds?"QuantStudio experiment decoded":"Experiment decoded",
      `${run.rows}x${run.cols}; ${(run.analyses||[]).length} analyses; ${(run.wells||[]).length} quantification results`);
    if(run.acqError)push("error","AcquisitionStore","Fluorescence could not be decoded",run.acqError);
    if(run.duplicates)push("error","Results","Duplicate result records",String(run.duplicates));
    const active=(((run.protocol||{}).channels)||[]).filter(c=>c.active);
    (run.analyses||[]).forEach(a=>{
      if(Number.isFinite(a.channelIdx)&&(a.channelIdx<0||a.channelIdx>=active.length))
        push("error","Channel assignment",`Analysis reads channel index ${a.channelIdx}, but ${active.length} active channel(s) exist`,a.name);
      if(a.channelMismatch)push("review","Channel assignment",
        `Analysis is named for ${a.channelMismatch.named} but reads ${a.channelMismatch.reading}`,a.name);
    });
    const miss=(run.wells||[]).filter(w=>!w.curve).length;
    if(miss&&(run.allCurves&&Object.keys(run.allCurves).length))
      push("review","Curve linkage",`${miss} stored result(s) have no linked amplification curve`,"Cq remains available");
    const disagree=(run.wells||[]).filter(w=>w.roleDisagrees);
    if(disagree.length)push("review","Sample role",`${disagree.length} instrument-versus-name role disagreement(s)`,
      disagree.slice(0,6).map(w=>`${w.well} ${w.sample}: ${w.roleInstrument} / ${w.roleName}`).join("; "));
    const ceiling=(run.wells||[]).filter(w=>Number(w.CpRaw)===40&&w.call==="Positive");
    if(ceiling.length)push("review","Stored call",`${ceiling.length} positive result(s) are stored exactly at Cq 40`,
      ceiling.slice(0,10).map(w=>`${w.well} ${w.sample}`).join(", "));
    const uncertain=(run.wells||[]).filter(w=>w.call==="Uncertain");
    if(uncertain.length)push("review","Stored call",`${uncertain.length} uncertain call(s)`,
      uncertain.slice(0,10).map(w=>`${w.well} ${w.sample}`).join(", "));
    const contaminated=(run.wells||[]).filter(w=>(w.role==="NTC"||w.role==="Blank")
      &&(w.call==="Positive"||Number(w.CpRaw)>0));
    if(contaminated.length)push("review","Assay controls",`${contaminated.length} NTC/blank result(s) are positive`,
      contaminated.slice(0,10).map(w=>`${w.well} ${w.sample} ${w.target}: Cq ${Number(w.CpRaw).toFixed(3)}`).join("; "));
    const failedPositive=(run.wells||[]).filter(w=>(w.role==="Calibrator"||w.role==="Positive control")
      &&(!(Number(w.CpRaw)>0)||w.call==="Negative"||w.call==="NotCalculated"));
    if(failedPositive.length)push("review","Assay controls",`${failedPositive.length} positive-control/calibrator result(s) did not amplify`,
      failedPositive.slice(0,10).map(w=>`${w.well} ${w.sample} ${w.target}: ${w.call||"no call"}`).join("; "));
    const ambiguousMelt=(run.tmWells||[]).filter(w=>w.meltCurveAmbiguous);
    if(ambiguousMelt.length)push("review","Melting curve",
      `${ambiguousMelt.length} Tm result(s) have an ambiguous raw melting program`,
      "Stored Tm peaks are preserved; the raw melt trace is omitted rather than merging programs");
    if(active.length>1&&!(run.analyses||[]).some(a=>a.cccEnabled))
      push("review","Detection format",`${active.length} active channels and colour compensation is not recorded as applied`,
        active.map(c=>`${c.name||"channel"} ${c.ex}-${c.em}`).join(", "));
    integrityEvents(run,push);
    if(run.eds)edsEvents(run,push);
    /* Inspect this run directly. Filtering the global orphan table by experiment
       name duplicated findings when two imported files shared the same title. */
    orphanCurveCandidates(run).forEach(o=>
      push(o.severity==="error"?"error":"review",
        o.severity==="error"?"Contamination":o.cls==="result-without-cq"?"Stored result":"Analysis membership",
        `${o.well}: ${o.finding}`,
        [o.sample,o.filterComb||o.filterName||`channel ${o.channel}`,o.otherChannels]
          .filter(Boolean).join("; ")));
    if(!events.some(e=>e.severity==="error"||e.severity==="review"))
      push("info","QC","No structural review finding","The run may still require assay-specific acceptance review");
    all.push(...events);
  });
  return all;
}