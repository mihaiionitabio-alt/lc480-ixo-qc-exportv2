function mgViewSop(){
  const out=[],T=SOP.targets||[],C=SOP.controls||[],R=SOP.replicates||{},IC=SOP.ic||{},RN=SOP.run||{};
  out.push(mgIt({kind:"summary",sev:SOP.locked?"ok":"none",pict:MG_PICT.summary,kindWord:"profile",code:"SOP",
    title:SOP.name||"Laboratory profile",value:"v"+mgTxt(SOP.version),unit:"",
    limits:`${T.length} target rule(s) · ${C.length} control(s) · ${Object.keys(RN).length} run rule(s)`,
    state:"Every outcome on this page is produced by this profile. Stored Cq values, calls and fluorescence are never changed.",
    evidence:"sha256 "+mgSafe(()=>sopHash().slice(0,16)+"…","—"),
    rows:[["Assay",mgTxt(SOP.assay)],["Author",mgTxt(SOP.author)],["Effective",mgTxt(SOP.effective)],
          ["Locked",SOP.locked?"yes":"no"],["Minimum replicates",mgTxt(R.min)],
          ["Positive replicates",mgTxt(R.positiveMin)],["Maximum Cq SD",mgTxt(R.maxSd)],
          ["Runs evaluated",String(mgSafe(()=>sopEvaluateAll().length,0))]],
    actions:[{key:"3",label:"Open the SOP view on the page",cmd:"open page sop"}]}));
  T.forEach((t,i)=>out.push(mgIt({kind:"rule",sev:"none",pict:MG_PICT.rule,kindWord:"target rule",code:"T"+(i+1),
    title:t.match==="*"?"Every other target":t.match,
    value:mgTxt(t.cqMax),unit:"Cq cut-off",
    limits:`kind ${mgTxt(t.kind)}${t.cqLate!==""&&t.cqLate!=null?` · late signal beyond Cq ${t.cqLate}`:""}${t.quantMin!==""&&t.quantMin!=null?` · minimum quantity ${t.quantMin}`:""}`,
    state:`A signal later than the cut-off is called negative. A late signal is reported as ${mgTxt(t.lateOutcome)}.`,
    evidence:`rule ${i+1} of ${T.length}; the first matching rule wins`,
    rows:[["Match",mgTxt(t.match)],["Kind",mgTxt(t.kind)],["Cq cut-off",mgTxt(t.cqMax)],
          ["Late signal from",mgTxt(t.cqLate)],["Minimum quantity",mgTxt(t.quantMin)],
          ["Late outcome",mgTxt(t.lateOutcome)]]})));
  C.forEach((c,i)=>out.push(mgIt({kind:"rule",sev:"none",pict:MG_PICT.control,kindWord:"control",code:"C"+(i+1),
    title:c.name||c.match,value:mgTxt(c.minPerRun),unit:"required per run",
    limits:`expected ${mgTxt(c.expect)} · matched by ${mgTxt(c.matchBy)}`,
    state:`If this control fails the run is ${c.onFail==="reject"?"rejected":"flagged for review"}.`,
    evidence:`matches ${mgTxt(c.match)} on targets ${mgTxt(c.targets)}`,
    rows:[["Name",mgTxt(c.name)],["Match",mgTxt(c.match)],["Matched by",mgTxt(c.matchBy)],
          ["Expected",mgTxt(c.expect)],["Cq window",(c.cqLo!==""&&c.cqLo!=null?c.cqLo:"—")+" – "+(c.cqHi!==""&&c.cqHi!=null?c.cqHi:"—")],
          ["Minimum per run",mgTxt(c.minPerRun)],["On failure",mgTxt(c.onFail)]]})));
  out.push(mgIt({kind:"rule",sev:"none",pict:MG_PICT.rule,kindWord:"replicates and control",code:"REP",
    title:"Replicates and internal control",value:mgTxt(R.maxSd),unit:"maximum Cq SD",
    limits:`at least ${mgTxt(R.min)} replicate(s), ${mgTxt(R.positiveMin)} of them positive`,
    state:`A spread above the limit is reported as ${mgTxt(R.sdOutcome)}; a partly positive replicate set as ${mgTxt(R.partialOutcome)}.`,
    evidence:"internal control shift limit "+mgTxt(IC.maxShift)+" Cq",
    rows:[["Minimum replicates",mgTxt(R.min)],["Positive replicates",mgTxt(R.positiveMin)],
          ["Partial outcome",mgTxt(R.partialOutcome)],["Maximum Cq SD",mgTxt(R.maxSd)],["SD outcome",mgTxt(R.sdOutcome)],
          ["IC reference Cq",mgTxt(IC.referenceCq)],["IC maximum shift",mgTxt(IC.maxShift)],
          ["IC shift outcome",mgTxt(IC.shiftOutcome)],["IC missing outcome",mgTxt(IC.missingOutcome)]]}));
  out.push(mgIt({kind:"rule",sev:"none",pict:MG_PICT.rule,kindWord:"run acceptance",code:"RUN",
    title:"Run acceptance rules",value:String(Object.keys(RN).length),unit:"rules",
    limits:`controls failing: ${mgTxt(RN.controlsFail)}`,
    state:"These decide whether a whole run is accepted, reviewed or rejected before any sample is reported.",
    evidence:"applied to every loaded run",
    rows:[["Controls missing",mgTxt(RN.controlsMissing)],
          ["Controls failing",mgTxt(RN.controlsFail)],["Standard curve",mgTxt(RN.stdCurve)],
          ["Minimum R²",mgTxt(RN.minR2)],["Efficiency window",`${mgTxt(RN.effMin)} – ${mgTxt(RN.effMax)} %`],
          ["NTC gap",mgTxt(RN.ntcGap)],["Edit delay (hours)",mgTxt(RN.editDelayHours)],
          ["Calibration",mgTxt(RN.calibration)],["Zone spread limit",mgTxt(RN.maxZoneSpread)],
          ["Instrument run state",mgTxt(RN.runState)]]}));
  /* how the rules actually landed on the loaded runs */
  const crit=mgSafe(()=>sopCriteriaRows(),[]);
  if(crit.length){
    const by=new Map();
    crit.forEach(c=>{const l=by.get(c.criterion)||[];l.push(c);by.set(c.criterion,l);});
    [...by].forEach(([name,list],i)=>{
      const fail=list.filter(c=>c.status==="fail").length,rev=list.filter(c=>c.status==="review").length;
      const worst=list.find(c=>c.status==="fail")||list.find(c=>c.status==="review")||list[0];
      out.push(mgIt({kind:"rule",sev:fail?"alarm":rev?"watch":"ok",pict:MG_PICT.rule,kindWord:"criterion on the data",
        code:"A"+(i+1),title:name,value:String(list.length-fail-rev),unit:`of ${list.length} run(s) met`,
        limits:fail?`${fail} rejected`+(rev?`, ${rev} for review`:""):rev?`${rev} for review`:"every run met it",
        state:mgTxt(worst&&worst.evidence),
        evidence:list.map(c=>c.experiment).slice(0,3).join(", ")+(list.length>3?` … (+${list.length-3})`:""),
        rows:list.slice(0,12).map(c=>[c.experiment,`${c.status}${c.evidence?" — "+String(c.evidence).slice(0,70):""}`])}));
    });
  }
  return out;
}
