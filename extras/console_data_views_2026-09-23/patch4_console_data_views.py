import sys, re, io
src_p, dst_p = sys.argv[1], sys.argv[2]
s = io.open(src_p, encoding="utf-8").read()
n0 = len(s)

def rep(old, new, count=1, label=""):
    global s
    if s.count(old) < 1:
        raise SystemExit("ANCHOR NOT FOUND: " + (label or old[:90]))
    if count and s.count(old) != count:
        raise SystemExit("ANCHOR %d times (want %d): %s" % (s.count(old), count, label or old[:90]))
    s = s.replace(old, new, count or 1)

# ---------------------------------------------------------------- 1. markup
rep('<div id="mg-head"><span id="mg-glyph">●</span><span id="mg-code"></span><span id="mg-title"></span></div>',
    '<div id="mg-head"><span id="mg-pict" aria-hidden="true">▣</span><span id="mg-glyph">●</span>'
    '<span id="mg-code"></span><span id="mg-title"></span><span id="mg-kind"></span></div>',
    label="mg-head")

rep('      <div id="mg-evidence"></div>\n      <div id="mg-chart"></div>',
    '      <div id="mg-evidence"></div>\n      <div id="mg-rows"></div>\n      <div id="mg-chart"></div>',
    label="mg-rows")

# ---------------------------------------------------------------- 2. CSS
rep('#mg-evidence{margin-top:10px;font-size:17px;color:#9fb0c6}',
    '#mg-evidence{margin-top:10px;font-size:17px;color:#9fb0c6}\n'
    '#mg-pict{font-size:34px;line-height:1;width:46px;text-align:center;flex:0 0 auto}\n'
    '#mg-kind{font-size:15px;letter-spacing:.09em;text-transform:uppercase;color:#9fb0c6;'
    'border:2px solid currentColor;border-radius:8px;padding:3px 10px;flex:0 0 auto}\n'
    '#mg-rows{margin-top:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:2px 26px}\n'
    '#mg-rows .r{display:flex;justify-content:space-between;gap:18px;font-size:19px;padding:9px 2px;'
    'border-bottom:1px solid rgba(159,176,198,.28)}\n'
    '#mg-rows .r b{font-weight:400;color:#9fb0c6}\n'
    '#mg-rows .r span{font-weight:650;text-align:right;font-variant-numeric:tabular-nums}\n'
    '#mg-card.with-chart #mg-rows{display:none}\n'
    '#mg-gcap{font-size:21px;font-weight:650;padding:4px 0 12px;width:100%;text-align:center;flex:0 0 auto;color:#0b111b}\n'
    '#mg.charting.theme-dark #mg-gcap{color:#e5e7eb}\n'
    '#mg.charting #mg-chart{flex-direction:column}\n'
    '#mg.charting #mg-chart svg{flex:1 1 auto;min-height:0;width:100%;align-self:stretch;object-fit:contain}\n',
    label="css")

# ---------------------------------------------------------------- 3. the seven views
VIEWS = r'''
/* ============================================================
   The console as a data console, not only an alarm queue.
   ------------------------------------------------------------
   Each of the seven names on the top row is a VIEW with its own builder. A view
   reports what that part of the data set holds, whether or not anything is wrong,
   so the top row never leads to an empty screen. Every item carries a pictogram
   for the kind of object, a state glyph with its word, a headline number, and a
   detail list of the numbers behind it. Nothing here recomputes a measurement:
   the builders read the same functions the page's own views read.
   ============================================================ */
const MG_PICT={file:"▤",summary:"▣",rule:"§",sample:"◉",run:"▥",chart:"◪",
  graph:"◩",finding:"⚠",export:"↓",baseline:"◐",instrument:"⚙",control:"◈"};
function mgIt(o){return Object.assign({kind:"data",sev:"none",pict:MG_PICT.summary,kindWord:"",code:"",title:"",
  value:"",unit:"",limits:"",state:"",evidence:"",rows:[],actions:[]},o);}
function mgSafe(f,fallback){try{return f();}catch(e){appError("console:view",e);return fallback;}}
function mgTxt(v){return (v===undefined||v===null||v==="")?"—":String(v);}

/* ---------- 1 · Load files: one item per file, with what was read out of it ---------- */
function mgViewLoad(){
  const out=[];
  if(!RUNS.length&&!PASTED)return [mgIt({kind:"intake",sev:"none",pict:MG_PICT.file,kindWord:"intake",code:"LOAD",
    title:"No experiment files are loaded",value:"0",unit:"files",
    state:"Drop .ixo, .eds, .edt or .zip files on the load view to begin.",
    actions:[{key:"3",label:"Open the load view on the page",cmd:"open page load"}]})];
  const meta=mgSafe(()=>metaRows(),[]);
  if(RUNS.length){
    const bad=RUNS.filter(r=>r.integrity&&(r.integrity.ok===false||r.integrity.zipCrcOk===false)).length;
    const results=RUNS.reduce((a,r)=>a+((r.wells||[]).length),0);
    const curves=RUNS.reduce((a,r)=>a+mgSafe(()=>uniqueCurveCount(r),0),0);
    const tm=RUNS.reduce((a,r)=>a+((r.tmWells||[]).length),0);
    out.push(mgIt({kind:"summary",sev:bad?"alarm":"ok",pict:MG_PICT.summary,kindWord:"files read",code:"LOAD",
      title:"Files read into this session",value:String(RUNS.length),unit:RUNS.length===1?"file":"files",
      limits:`${RUNS.length-bad} of ${RUNS.length} container checksums match`,
      state:bad?`${bad} container(s) no longer match the checksum written when the file was sealed.`
               :"Every container matches the checksum written when the file was sealed.",
      evidence:uniq(RUNS.map(r=>r.platform||"LightCycler 480")).join(" · "),
      rows:[["Stored results",results.toLocaleString()],["Curves decoded",curves.toLocaleString()],
            ["Melting results",tm.toLocaleString()],
            ["Instruments",uniq(RUNS.map(r=>(r.meta&&r.meta.InstrumentName)||"not named")).join(", ")],
            ["Operators",uniq(meta.map(m=>m.operator).filter(Boolean)).join(", ")||"—"],
            ["Active profile",`${SOP.name} v${SOP.version}`]],
      actions:[{key:"3",label:"Open the load view on the page",cmd:"open page load"}]}));
    RUNS.forEach((r,i)=>{
      const m=meta[i]||{},integ=r.integrity||{},ok=!(integ.ok===false||integ.zipCrcOk===false);
      out.push(mgIt({kind:"file",sev:ok?(r.acqError?"watch":"ok"):"alarm",pict:MG_PICT.file,kindWord:"file",
        code:"F"+(i+1),title:m.experiment||r.file||("Experiment "+(i+1)),
        value:String(m.quantification_results||0),unit:"stored results",
        limits:`${mgTxt(m.plate)} plate · ${mgTxt(m.cycles)} cycles · ${m.curves_decoded||0} curves`,
        state:!ok?"Container checksum does not match — the file was changed after the software sealed it."
              :r.acqError?("Fluorescence could not be read: "+r.acqError)
              :r.isTemplate?"Template or unrun experiment — plate setup, protocol and analysis settings only."
              :"Container integrity verified; the file is as the instrument software wrote it.",
        evidence:`${mgTxt(m.platform)} · ${m.instrument||"instrument not named"} · ${m.run_started||m.experiment_created||"no date"}`,
        rows:[["File",mgTxt(r.file)],["Instrument",mgTxt(m.instrument)],["Software",mgTxt(m.software_version)],
              ["Operator",mgTxt(m.operator)],["Run started",mgTxt(m.run_started)],["Run ended",mgTxt(m.run_ended)],
              ["Run minutes",mgTxt(m.run_duration_minutes)],["Channels",mgTxt(m.channels)],
              ["Analyses",String(m.analyses||0)],["Melting results",String(m.melting_results||0)],
              ["Container integrity",mgTxt(m.integrity)],
              ["Bytes",m.source_bytes?Number(m.source_bytes).toLocaleString():"—"]],
        actions:[{key:"3",label:"Open the load view on the page",cmd:"open page load"}]}));
    });
  }
  if(PASTED)out.push(mgIt({kind:"file",sev:"ok",pict:MG_PICT.file,kindWord:"pasted table",code:"CSV",
    title:"Pasted Cq table",value:String((PASTED.rows||[]).length),unit:"Cq values",
    limits:"no fluorescence curves in a pasted table",
    state:"Replicate checks and the inhibition test use these values; curve-based exports need an .ixo or .eds file.",
    evidence:PASTED.source||"pasted data"}));
  return out;
}

/* ---------- 2 · SOP: the profile itself, rule by rule, with how each one lands ---------- */
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
    limits:`integrity: ${mgTxt(RN.integrity)} · controls failing: ${mgTxt(RN.controlsFail)}`,
    state:"These decide whether a whole run is accepted, reviewed or rejected before any sample is reported.",
    evidence:"applied to every loaded run",
    rows:[["Container integrity",mgTxt(RN.integrity)],["Controls missing",mgTxt(RN.controlsMissing)],
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

/* ---------- 3 · Results: outcomes, runs and targets under the active profile ---------- */
function mgViewResults(){
  const out=[];
  if(!RUNS.length&&PASTED)return [mgIt({kind:"results",sev:"none",pict:MG_PICT.sample,kindWord:"pasted table",code:"CSV",
    title:"Pasted Cq table",value:String((PASTED.rows||[]).length),unit:"Cq values",
    state:"Open the results view on the page to inspect the pasted table.",evidence:PASTED.source||"pasted data",
    actions:[{key:"3",label:"Open the results view on the page",cmd:"open page results"}]})];
  const ev=mgSafe(()=>sopEvaluateAll(),[]);
  if(!ev.length)return [mgIt({kind:"results",sev:"none",pict:MG_PICT.sample,kindWord:"results",code:"RES",
    title:"No run has been evaluated yet",value:"0",unit:"runs",
    state:"Load an experiment file; results are recomputed as soon as the profile or the data changes."})];
  const rows=ev.flatMap(e=>e.rows||[]);
  const cnt=o=>rows.filter(r=>r.outcome===o).length;
  const rej=ev.filter(e=>e.accept&&e.accept.ok===false);
  const action=rows.filter(r=>/Invalid|Repeat|Inconclusive|Control fail/.test(r.outcome)).length;
  out.push(mgIt({kind:"summary",sev:rej.length?"alarm":action?"watch":"ok",pict:MG_PICT.summary,kindWord:"results",
    code:"RES",title:"Results under this profile",value:String(rows.length),unit:"interpreted results",
    limits:`${ev.length} run(s) · ${rej.length} rejected · ${action} result(s) need action`,
    state:rej.length?`${rej.length} run(s) were rejected by the profile; their samples are not reportable.`
      :action?`${action} result(s) need an action before the report can be signed.`
      :"Every run was accepted and no result needs an action.",
    evidence:`profile ${SOP.name} v${SOP.version}`,
    rows:[["Positive",String(cnt("Positive"))],["Negative",String(cnt("Negative"))],
          ["Inconclusive",String(cnt("Inconclusive"))],["Repeat",String(cnt("Repeat"))],
          ["Invalid",String(cnt("Invalid")+cnt("Invalid run"))],["Control failed",String(cnt("Control fail"))],
          ["Control accepted",String(cnt("Control pass"))],["Standards",String(cnt("Standard"))]],
    actions:[{key:"3",label:"Open the results view on the page",cmd:"open page results"}]}));
  if(rej.length)out.push(mgIt({kind:"results",sev:"alarm",pict:MG_PICT.run,kindWord:"rejected runs",code:"REJ",
    title:"Runs rejected by the profile",value:String(rej.length),unit:rej.length===1?"run":"runs",
    limits:`of ${ev.length} run(s) read`,
    state:((rej[0].accept&&rej[0].accept.reasons)||[]).join("; ")||"see the results view for the reasons",
    evidence:rej.map(r=>runName(r.run)).slice(0,3).join(", "),
    rows:rej.slice(0,12).map(r=>[runName(r.run),((r.accept&&r.accept.reasons)||[]).join("; ").slice(0,70)||"rejected"]),
    actions:[{key:"3",label:"Open the results view on the page",cmd:"open page results"}]}));
  /* per outcome class */
  const order=["Invalid run","Invalid","Control fail","Repeat","Inconclusive","Positive","Negative","Control pass","Standard"];
  order.forEach((o,i)=>{
    const list=rows.filter(r=>r.outcome===o);if(!list.length)return;
    const bad=/Invalid|Control fail/.test(o),warn=/Repeat|Inconclusive/.test(o);
    out.push(mgIt({kind:"results",sev:bad?"alarm":warn?"watch":"ok",pict:MG_PICT.sample,kindWord:"outcome",
      code:"O"+(i+1),title:o,value:String(list.length),unit:list.length===1?"result":"results",
      limits:`${uniq(list.map(r=>r.target)).length} target(s) · ${uniq(list.map(r=>r.sample)).length} sample(s)`,
      state:mgTxt((SOP.outcomes[o]||{}).label)+((list[0]&&list[0].reason)?" — "+list[0].reason:""),
      evidence:uniq(list.map(r=>r.target)).slice(0,6).join(", "),
      rows:list.slice(0,12).map(r=>[`${r.sample} · ${r.target}`,
        Number.isFinite(r.cqMean)?"Cq "+r.cqMean.toFixed(2):(r.reason||"—")])}));
  });
  /* per target */
  const byT=new Map();rows.forEach(r=>{const l=byT.get(r.target)||[];l.push(r);byT.set(r.target,l);});
  [...byT].forEach(([t,list],i)=>{
    const cq=list.map(r=>r.cqMean).filter(Number.isFinite);
    const need=list.filter(r=>/Invalid|Repeat|Inconclusive|Control fail/.test(r.outcome)).length;
    out.push(mgIt({kind:"results",sev:need?"watch":"ok",pict:MG_PICT.sample,kindWord:"target",code:"TG"+(i+1),
      title:t||"unnamed target",value:cq.length?cq.reduce((a,b)=>a+b,0)/cq.length:"—",
      unit:cq.length?"mean Cq":"",
      limits:`${list.length} result(s) · ${cq.length} with a Cq${need?` · ${need} need action`:""}`,
      state:cq.length?`Cq from ${Math.min(...cq).toFixed(2)} to ${Math.max(...cq).toFixed(2)} across ${uniq(list.map(r=>r.sample)).length} sample(s).`
        :"No Cq was stored for this target.",
      evidence:uniq(list.map(r=>r.role||"")).filter(Boolean).join(", ")||"—",
      rows:[["Results",String(list.length)],["Samples",String(uniq(list.map(r=>r.sample)).length)],
            ["Positive",String(list.filter(r=>r.outcome==="Positive").length)],
            ["Negative",String(list.filter(r=>r.outcome==="Negative").length)],
            ["Need action",String(need)],
            ["Lowest Cq",cq.length?Math.min(...cq).toFixed(2):"—"],
            ["Highest Cq",cq.length?Math.max(...cq).toFixed(2):"—"]]}));
  });
  /* per run */
  mgSafe(()=>sopRunRows(),[]).forEach((r,i)=>{
    out.push(mgIt({kind:"results",sev:r.rejected?"alarm":(r.review?"watch":"ok"),pict:MG_PICT.run,kindWord:"run",
      code:"R"+(i+1),title:r.experiment,value:String(r.positive),unit:"positive",
      limits:`${r.negative} negative · ${r.inconclusive} inconclusive · ${r.repeat} repeat · ${r.invalid} invalid`,
      state:r.rejected?("Rejected: "+r.rejected):r.review?("For review: "+r.review):"Accepted under this profile.",
      evidence:`${r.platform} · ${mgTxt(r.run_start)}`,
      rows:[["Status",mgTxt(r.status)],["Platform",mgTxt(r.platform)],["Run start",mgTxt(r.run_start)],
            ["Run end",mgTxt(r.run_end)],["Run minutes",mgTxt(r.run_minutes)],
            ["Last change",mgTxt(r.last_change)],["Hours end to change",mgTxt(r.hours_run_end_to_last_change)],
            ["Control failed",String(r.control_fail)]]}));
  });
  return out;
}

/* ---------- 4 · Control panel: the state of every control chart, no drawing ---------- */
function mgPanelItems(includeAll){
  const items=[];
  const insts=mgSafe(()=>ccInstruments(),[]);
  if(!insts.length)return items;
  const key=CC_STATE.instrument&&insts.some(i=>i.key===CC_STATE.instrument)?CC_STATE.instrument:insts[0].key;
  const rows=ccRowsFor(key),pf=rows.length?rows[0].platform:"LC";
  CC_CHARTS.filter(d=>d.inst.includes(pf)).forEach(d=>{
    const cfg=ccCfg(d.id);if(cfg.enabled===false)return;
    const vs=ccVariants(d,rows);(vs.length?vs:[""]).forEach(v=>{
      let res;try{res=ccCompute(d,rows,v);}catch(e){return;}
      const st=ccStatus(res),pts=res.pts.filter(p=>Number.isFinite(p.y)&&!p.pre),last=pts[pts.length-1];
      if(!last)return;
      if(!includeAll&&st.level!=="bad"&&st.level!=="warn")return;
      const lim=Number.isFinite(last.lcl)&&Number.isFinite(last.ucl)
        ?`limits ${fmtTick(+last.lcl.toPrecision(4))} – ${fmtTick(+last.ucl.toPrecision(4))}`:"no limits yet";
      const sp=res.spec||{},spec=[Number.isFinite(sp.lo)?`≥ ${fmtTick(sp.lo)}`:"",Number.isFinite(sp.hi)?`≤ ${fmtTick(sp.hi)}`:""].filter(Boolean).join(" and ");
      const sev=st.level==="bad"?"alarm":st.level==="warn"?"watch":st.level==="ok"?"ok":"none";
      items.push(mgIt({kind:"chart",sev,pict:MG_PICT.chart,kindWord:"control chart",code:d.code,
        title:d.title+(v?" · "+v:""),
        value:fmtTick(+Number(st.last!==undefined?st.last:last.y).toPrecision(4)),unit:d.unit||"",
        limits:lim+(spec?`  ·  specification ${spec}`:""),state:st.text,
        evidence:`${key} · ${pts.length} run(s) in this chart · last run ${last.row&&last.row.date?sopFmtTime(last.row.date).slice(0,10):"unknown date"}`,
        chartId:d.id,variant:v,instrument:key,
        rows:[["Chart",d.code],["Measurement",d.title],["Variant",v||"—"],
              ["Latest value",fmtTick(+Number(st.last!==undefined?st.last:last.y).toPrecision(4))+(d.unit?" "+d.unit:"")],
              ["Centre line",Number.isFinite(last.cl)?fmtTick(+last.cl.toPrecision(4)):"—"],
              ["Lower limit",Number.isFinite(last.lcl)?fmtTick(+last.lcl.toPrecision(4)):"—"],
              ["Upper limit",Number.isFinite(last.ucl)?fmtTick(+last.ucl.toPrecision(4)):"—"],
              ["Specification",spec||"—"],["Runs in chart",String(pts.length)],
              ["Chart type",MG_TYPE_LABEL[cfg.type||d.type]||(cfg.type||d.type)],
              ["Instrument",key],["State",MG_WORD[sev]||""]],
        actions:[{key:"3",label:"Show the chart",cmd:"chart"}]}));
    });
  });
  const rank={alarm:0,watch:1,none:2,ok:3};
  items.sort((a,b)=>(rank[a.sev]-rank[b.sev])||a.code.localeCompare(b.code));
  return items;
}
function mgViewPanel(){
  const insts=mgSafe(()=>ccInstruments(),[]);
  if(!insts.length)return [mgIt({kind:"chart",sev:"none",pict:MG_PICT.chart,kindWord:"control panel",code:"CC",
    title:"No instrument history yet",value:"0",unit:"runs",
    state:"Control charts are built from the numbers the instrument writes into its own files. Read a run, or import a stored history.",
    actions:[{key:"3",label:"Open the control panel on the page",cmd:"open page panel"}]})];
  const key=CC_STATE.instrument&&insts.some(i=>i.key===CC_STATE.instrument)?CC_STATE.instrument:insts[0].key;
  const rows=ccRowsFor(key),items=mgPanelItems(true);
  const c=t=>items.filter(x=>x.sev===t).length;
  const out=[mgIt({kind:"summary",sev:c("alarm")?"alarm":c("watch")?"watch":"ok",pict:MG_PICT.instrument,
    kindWord:"instrument",code:"CC",title:key,value:String(rows.length),unit:"runs in this history",
    limits:`${items.length} chart(s) · ${c("alarm")} outside limits · ${c("watch")} to watch`,
    state:c("alarm")?`${c("alarm")} chart(s) have a point outside a control or specification limit.`
      :c("watch")?`${c("watch")} chart(s) show a pattern inside the limits.`
      :"Every chart with limits is in control on the latest run.",
    evidence:`${insts.length} instrument(s) in the loaded history`,
    rows:[["Instrument",key],["Runs",String(rows.length)],["Charts",String(items.length)],
          ["Outside limits",String(c("alarm"))],["To watch",String(c("watch"))],
          ["In control",String(c("ok"))],["Collecting a baseline",String(c("none"))],
          ["Baseline needed",String(mgSafe(()=>ccBaselineNeed(ccCfg("heat_rate")),"—"))+" runs"]],
    actions:[{key:"3",label:"Open the control panel on the page",cmd:"open page panel"}]})];
  return out.concat(items);
}

/* ---------- 5 · Graphs: the page's own single-run graphs, drawn in the console ---------- */
function mgGraphCtx(g,ri,target){
  const run=RUNS[ri];
  const tg=target!==undefined?target:((g.opts||[]).includes("target")&&run?(mgSafe(()=>gTargets(run),[])[0]||""):"");
  return {g,ri,run,target:tg,metric:"outcome",signal:"stored",log:false,colourby:"outcome",level:"end",control:"0"};
}
function mgViewGraphs(){
  const out=[];
  if(!RUNS.length)return [mgIt({kind:"graph",sev:"none",pict:MG_PICT.graph,kindWord:"graphs",code:"G",
    title:"No run to draw",value:"0",unit:"runs",
    state:"The graphs are drawn from one decoded run at a time. Load an experiment file first.",
    actions:[{key:"3",label:"Open the graphs view on the page",cmd:"open page graphs"}]})];
  const ri=Math.min(Math.max(0,MG.run|0),RUNS.length-1);
  const run=RUNS[ri];
  out.push(mgIt({kind:"summary",sev:"ok",pict:MG_PICT.summary,kindWord:"graphs",code:"G",
    title:"Graphs for "+runName(run),value:String(GRAPHS.length),unit:"graphs",
    limits:`run ${ri+1} of ${RUNS.length} · ${uniq(GRAPHS.map(g=>g.group)).length} group(s)`,
    state:"Each graph below is drawn here with the limits of the active profile. Use Next run to change the experiment.",
    evidence:uniq(GRAPHS.map(g=>g.group)).join(" · "),
    rows:GRAPHS.slice(0,14).map(g=>[g.group,g.title.slice(0,54)]),
    actions:RUNS.length>1?[{key:"3",label:"Next run",cmd:"next run"},
                           {key:"4",label:"Open the graphs view on the page",cmd:"open page graphs"}]
                         :[{key:"3",label:"Open the graphs view on the page",cmd:"open page graphs"}]}));
  GRAPHS.forEach((g,i)=>out.push(mgIt({kind:"graph",sev:"none",pict:MG_PICT.graph,kindWord:g.group,
    code:"G"+(i+1),title:g.title,value:"",unit:"",
    limits:g.scope==="run"?runName(run):"all loaded runs",
    state:g.note||"",evidence:`graph ${i+1} of ${GRAPHS.length} · drawn with ${SOP.name} v${SOP.version}`,
    graphId:g.id,runIndex:ri,
    rows:[["Group",g.group],["Drawn from",g.scope==="run"?"one run":"every loaded run"],
          ["Run",runName(run)],["Options",(g.opts||[]).join(", ")||"none"],
          ["Profile",`${SOP.name} v${SOP.version}`],["Graph",`${i+1} of ${GRAPHS.length}`]],
    actions:[{key:"3",label:"Draw the graph",cmd:"chart"},
             {key:"4",label:"Open the graphs view on the page",cmd:"open page graphs"}]})));
  return out;
}

/* ---------- 6 · Quality & forensic review: findings, grouped, with the evidence listed ---------- */
function mgViewReview(){
  const events=mgSafe(()=>reviewForensicEvents()||[],[]);
  if(!events.length)return [mgIt({kind:"finding",sev:"ok",pict:MG_PICT.finding,kindWord:"review",code:"QC",
    title:"No finding was raised",value:"0",unit:"findings",
    limits:`${RUNS.length} run(s) examined`,
    state:"The file, result, timeline and interpretation checks all passed on the loaded runs.",
    actions:[{key:"3",label:"Open the review view on the page",cmd:"open page review"}]})];
  const err=events.filter(e=>e.severity==="error").length,rev=events.filter(e=>e.severity==="review").length;
  const by=new Map();events.forEach(e=>{const k=e.area||"other";const l=by.get(k)||[];l.push(e);by.set(k,l);});
  const out=[mgIt({kind:"summary",sev:err?"alarm":rev?"watch":"ok",pict:MG_PICT.summary,kindWord:"review",code:"QC",
    title:"Quality and forensic review",value:String(events.length),unit:"findings",
    limits:`${err} error · ${rev} review · ${by.size} area(s)`,
    state:err?`${err} finding(s) are error level: the evidence contradicts what the file claims about itself.`
      :rev?`${rev} finding(s) are for review; none is error level.`:"Every check passed.",
    evidence:[...by.keys()].slice(0,5).join(" · "),
    rows:[...by].map(([a,l])=>[a,`${l.filter(e=>e.severity==="error").length} error · ${l.filter(e=>e.severity==="review").length} review`]),
    actions:[{key:"3",label:"Open the review view on the page",cmd:"open page review"}]})];
  const rank=l=>l.some(e=>e.severity==="error")?0:1;
  [...by].sort((a,b)=>rank(a[1])-rank(b[1])).forEach(([area,list])=>{
    const e0=list.find(e=>e.severity==="error")||list[0];
    const errs=list.filter(e=>e.severity==="error").length;
    out.push(mgIt({kind:"finding",sev:errs?"alarm":"watch",pict:MG_PICT.finding,kindWord:"finding",
      code:errs?"ERR":"REV",title:area,value:String(list.length),unit:list.length===1?"finding":"findings",
      limits:`${errs} error · ${list.length-errs} review · expected: none`,
      state:e0.finding||"",evidence:e0.experiment||"",
      rows:list.slice(0,14).map(e=>[String(e.experiment||e.finding||"").slice(0,44),
        String(e.evidence||e.finding||"").slice(0,80)]),
      actions:[{key:"3",label:"Open the review view on the page",cmd:"open page review"}]}));
  });
  return out;
}

/* ---------- 7 · Open formats: the downloads themselves, one press each ---------- */
function mgViewExport(){
  const items=mgSafe(()=>exportCatalogue(),[]);
  const ready=items.filter(it=>mgSafe(()=>it.ready(),false));
  const missing=items.filter(it=>!mgSafe(()=>it.ready(),false));
  MG.exports=ready;
  const summaryActions=ready.length
    ?[{key:"3",label:"Download "+String(ready[0].title||"first format").slice(0,36),cmd:"export 0"},
      {key:"4",label:"Open the formats view on the page",cmd:"open page export"}]
    :[{key:"3",label:"Open the formats view on the page",cmd:"open page export"}];
  const out=[mgIt({kind:"export",sev:ready.length?"ok":"none",pict:MG_PICT.summary,kindWord:"downloads",code:"OUT",
    title:"Formats this data set can produce",value:String(ready.length),unit:ready.length===1?"format":"formats",
    limits:missing.length?`${missing.length} format(s) need data this experiment does not hold`:"every format is available",
    state:ready.length?"Select a format below and press Download. Sample names follow the pseudonymisation switch on the page."
      :"Nothing is loaded yet, so no download can be produced.",
    evidence:missing.length?("not available: "+missing.map(m=>m.title).slice(0,4).join(", ")):"",
    rows:ready.slice(0,14).map(it=>[it.title,String(it.note||"").slice(0,64)]),
    actions:summaryActions})];
  ready.forEach((it,i)=>out.push(mgIt({kind:"export",sev:"ok",pict:MG_PICT.export,kindWord:"download",
    code:"D"+(i+1),title:it.title,value:"",unit:"",limits:"ready",state:it.note||"",
    evidence:`download ${i+1} of ${ready.length}`,exportIndex:i,
    rows:[["Format",it.title],["Contents",String(it.note||"").slice(0,90)],
          ["Runs included",String(RUNS.length)],["Profile",`${SOP.name} v${SOP.version}`],
          ["Sample names","as set by the pseudonymisation switch"]],
    actions:[{key:"3",label:"Download this file",cmd:"export "+i}]})));
  return out;
}

const MG_VIEWS={
  load:{label:"Load files",build:mgViewLoad},
  sop:{label:"SOP",build:mgViewSop},
  results:{label:"Results",build:mgViewResults},
  panel:{label:"Control panel",build:mgViewPanel},
  graphs:{label:"Graphs",build:mgViewGraphs},
  review:{label:"Quality & forensic review",build:mgViewReview},
  export:{label:"Open formats",build:mgViewExport}
};
'''

rep('const MG_SCOPES={\n'
    '  load:{label:"Load files",keeps:["intake"],empty:"Every file was read. Nothing to answer here."},\n'
    '  sop:{label:"SOP",keeps:["profile","results"],empty:"The profile raised nothing that needs an answer."},\n'
    '  results:{label:"Results",keeps:["results"],empty:"No run was rejected by the profile."},\n'
    '  panel:{label:"Control panel",keeps:["chart","baseline"],empty:"No chart is outside its limits or on watch."},\n'
    '  graphs:{label:"Graphs",keeps:["chart"],empty:"Charts appear here once a chart is open."},\n'
    '  review:{label:"Quality & forensic review",keeps:["finding"],empty:"No error-level finding is open."},\n'
    '  export:{label:"Open formats",keeps:["export"],empty:"Exports are actions, not findings."}\n'
    '};',
    VIEWS.strip(), label="MG_SCOPES")

# scope switch keeps chart state sensible
rep('function mgScope(tab){\n'
    '  MG.scope=(MG.scope===tab)?"":tab;          /* pressing the active one shows everything again */\n'
    '  MG.at=0;MG.chart=false;mgRefresh();mgRender();\n'
    '}',
    'function mgScope(tab){\n'
    '  MG.scope=(MG.scope===tab)?"":tab;          /* pressing the active one returns to the attention queue */\n'
    '  MG.at=0;MG.chart=false;MG.filter="";mgSheetClose();mgRefresh();mgRender();\n'
    '}', label="mgScope")

# the filter becomes a view selector
rep('function mgScopeFilter(all){\n'
    '  const sc=MG_SCOPES[MG.scope];if(!sc)return all;\n'
    '  const keep=all.filter(x=>sc.keeps.includes(x.kind||""));\n'
    '  if(keep.length)return keep;\n'
    '  return [{kind:"empty",sev:"ok",code:"",title:sc.label,value:"",unit:"",limits:"",\n'
    '    state:sc.empty,evidence:"This view of the console has nothing outstanding.",\n'
    '    actions:[{key:"3",label:"Show every item again",cmd:"everything"},\n'
    '             {key:"4",label:"Open this view on the page",cmd:"open page "+MG.scope}]}];\n'
    '}',
    '/* A named view replaces the attention queue rather than filtering it: every view reports\n'
    '   what its part of the data set holds, so no view can end on an empty screen. */\n'
    'function mgScopeFilter(all){\n'
    '  const v=MG_VIEWS[MG.scope];if(!v)return all;\n'
    '  let items=[];try{items=v.build()||[];}catch(e){appError("console:view",e);items=[];}\n'
    '  if(!items.length)items=all;\n'
    '  return items;\n'
    '}', label="mgScopeFilter")

# refresh: views are not filtered by the alarm switch, and graphs open drawn
rep('function mgRefresh(){\n'
    '  const oldKey=mgItemKey(mgItem());\n'
    '  const all=mgBuildQueue();\n'
    '  MG.queue=mgScopeFilter(MG.filter==="alarm"?all.filter(x=>x.sev==="alarm"):all);',
    'function mgRefresh(){\n'
    '  const oldKey=mgItemKey(mgItem());\n'
    '  const all=mgBuildQueue();\n'
    '  MG.queue=MG.scope?mgScopeFilter(all):(MG.filter==="alarm"?all.filter(x=>x.sev==="alarm"):all);',
    label="mgRefresh")

# ---------------------------------------------------------------- 4. state object
rep('const MG={open:false,queue:[],at:0,chart:false,theme:"light",pending:null,scope:"",sheet:null};',
    'const MG={open:false,queue:[],at:0,chart:false,theme:"light",pending:null,scope:"",sheet:null,run:0,exports:[]};',
    label="MG state")

# ---------------------------------------------------------------- 5. rendering
rep('  document.getElementById("mg-count").textContent=\n'
    '    `item ${MG.at+1} of ${MG.queue.length}  ·  ${alarms} outside limits  ·  ${watch} to watch`;\n'
    '  document.getElementById("mg-glyph").textContent=it?MG_GLYPH[it.sev]:"";',
    '  const view=MG_VIEWS[MG.scope];\n'
    '  document.getElementById("mg-count").textContent=\n'
    '    `${view?view.label:"Attention"}  ·  item ${MG.at+1} of ${MG.queue.length}  ·  ${alarms} outside limits  ·  ${watch} to watch`;\n'
    '  document.getElementById("mg-glyph").textContent=it?MG_GLYPH[it.sev]:"";\n'
    '  document.getElementById("mg-pict").textContent=(it&&it.pict)||MG_PICT.summary;\n'
    '  document.getElementById("mg-kind").textContent=(it&&(it.kindWord||MG_WORD[it.sev]))||"";',
    label="mg-count")

rep('  const ch=document.getElementById("mg-chart");\n'
    '  const charting=!!(MG.chart&&it&&it.chartId);',
    '  document.getElementById("mg-rows").innerHTML=(it&&it.rows&&it.rows.length)\n'
    '    ?it.rows.map(r=>`<div class="r"><b>${esc(String(r[0]))}</b><span>${esc(String(r[1]))}</span></div>`).join("")\n'
    '    :"";\n'
    '  const ch=document.getElementById("mg-chart");\n'
    '  const charting=!!(MG.chart&&it&&(it.chartId||it.graphId));',
    label="mg-rows render")

rep('  if(MG.chart&&it&&it.chartId){\n'
    '    try{const rows=ccRowsFor(it.instrument),def=CC_BY_ID[it.chartId],res=ccCompute(def,rows,it.variant||"");\n'
    '      ch.innerHTML=ccChartSvg(res,`${def.code} ${def.title}${it.variant?" · "+it.variant:""}`);}\n'
    '    catch(e){ch.innerHTML="";appError("console:chart",e);}\n'
    '  }',
    '  if(charting&&it.chartId){\n'
    '    try{const rows=ccRowsFor(it.instrument),def=CC_BY_ID[it.chartId],res=ccCompute(def,rows,it.variant||"");\n'
    '      ch.innerHTML=ccChartSvg(res,`${def.code} ${def.title}${it.variant?" · "+it.variant:""}`);}\n'
    '    catch(e){ch.innerHTML="";appError("console:chart",e);}\n'
    '  }else if(charting&&it.graphId){\n'
    '    try{const g=GRAPHS.find(x=>x.id===it.graphId);\n'
    '      const res=g?g.render(mgGraphCtx(g,it.runIndex||0)):null;\n'
    '      ch.innerHTML=`<div id="mg-gcap">${esc(it.title)} \u00b7 ${esc(it.limits)}</div>`+((res&&res.svg)||"");}\n'
    '    catch(e){ch.innerHTML=`<p style="font-size:20px;padding:18px">This graph could not be drawn from the loaded run: ${esc(e.message)}</p>`;appError("console:graph",e);}\n'
    '  }',
    label="chart render")

# chart-mode action row: graphs get run stepping, charts keep type/axis sheets
rep('  const curType=charting?(mgChartTypeOptions(it).find(o=>o.current)||{}).label:"";\n'
    '  const curAxis=charting?(mgChartAxisOptions(it).find(o=>o.current)||{}).label:"";\n'
    '  const typeActs=charting&&mgChartTypeOptions(it).length>1?[{key:"4",label:"Chart type · "+curType,cmd:"chart type",cls:"sheet"}]:[];\n'
    '  const axisActs=charting&&mgChartAxisOptions(it).length>1?[{key:"5",label:"X axis · "+curAxis,cmd:"x axis",cls:"sheet"}]:[];',
    '  const onChart=charting&&it&&it.chartId;\n'
    '  const curType=onChart?(mgChartTypeOptions(it).find(o=>o.current)||{}).label:"";\n'
    '  const curAxis=onChart?(mgChartAxisOptions(it).find(o=>o.current)||{}).label:"";\n'
    '  const typeActs=onChart&&mgChartTypeOptions(it).length>1?[{key:"4",label:"Chart type · "+curType,cmd:"chart type",cls:"sheet"}]\n'
    '    :(charting&&it&&it.graphId&&RUNS.length>1?[{key:"4",label:"Next run · "+runName(RUNS[Math.min(it.runIndex||0,RUNS.length-1)]).slice(0,26),cmd:"next run"}]:[]);\n'
    '  const axisActs=onChart&&mgChartAxisOptions(it).length>1?[{key:"5",label:"X axis · "+curAxis,cmd:"x axis",cls:"sheet"}]:[];',
    label="sheet actions")

rep('      ?[{key:"1",label:"Previous chart",cmd:"chart previous",cls:"primary"},\n'
    '        {key:"2",label:"Next chart",cmd:"chart next",cls:"primary"},\n'
    '        {key:"3",label:"Close chart",cmd:"chart close"},',
    '      ?[{key:"1",label:onChart?"Previous chart":"Previous graph",cmd:onChart?"chart previous":"previous",cls:"primary"},\n'
    '        {key:"2",label:onChart?"Next chart":"Next graph",cmd:onChart?"chart next":"next",cls:"primary"},\n'
    '        {key:"3",label:onChart?"Close chart":"Close graph",cmd:"chart close"},',
    label="chart nav labels")

# ---------------------------------------------------------------- 6. navigation keeps drawn state
rep('function mgGo(step){\n'
    '  if(!MG.queue.length)return;\n'
    '  MG.at=(MG.at+step+MG.queue.length)%MG.queue.length;MG.chart=!!(MG.queue[MG.at]&&MG.queue[MG.at].chartId);\n'
    '}',
    'function mgGo(step){\n'
    '  if(!MG.queue.length)return;\n'
    '  MG.at=(MG.at+step+MG.queue.length)%MG.queue.length;\n'
    '  const nx=MG.queue[MG.at];\n'
    '  MG.chart=!!(nx&&(nx.chartId||(MG.scope==="graphs"&&nx.graphId)));\n'
    '}', label="mgGo")

# ---------------------------------------------------------------- 7. commands
rep('  {re:/^exit$/, id:"exit", act:()=>mgClose()}',
    '  {re:/^next run$/, id:"next run", act:()=>{if(RUNS.length>1){MG.run=((MG.run|0)+1)%RUNS.length;mgRefresh();}}},\n'
    '  {re:/^export (\\d+)$/, id:"download a file", act:t=>{\n'
    '     const i=Number(t.slice(7)),it=(MG.exports||[])[i];\n'
    '     if(it)try{it.run();appNotice&&appNotice("console","Download requested: "+it.title);}catch(e){appError("console:export",e);}}},\n'
    '  {re:/^exit$/, id:"exit", act:()=>mgClose()}',
    label="commands")

# ---------------------------------------------------------------- 8. no dead-end wording anywhere
rep('  /* 6. nothing outstanding */\n'
    '  if(!q.length)q.push({kind:"empty",sev:"ok",code:"",title:"Nothing needs attention",value:String(RUNS.length),unit:RUNS.length===1?"run read":"runs read",\n'
    '    limits:"",state:"Every chart with limits is in control and no error-level finding is open.",\n'
    '    evidence:"",actions:[]});',
    '  /* 6. everything is in order: report the data set rather than an empty screen */\n'
    '  if(!q.length)q.push({kind:"summary",sev:"ok",pict:MG_PICT.summary,kindWord:"data set",code:"OK",\n'
    '    title:"All checks passed",value:String(RUNS.length),unit:RUNS.length===1?"run read":"runs read",\n'
    '    limits:`${RUNS.reduce((a,r)=>a+((r.wells||[]).length),0).toLocaleString()} stored results · profile ${SOP.name}`,\n'
    '    state:"Every chart with limits is in control and no error-level finding is open. Use the top row to read any part of the data set.",\n'
    '    evidence:uniq(RUNS.map(r=>(r.meta&&r.meta.InstrumentName)||r.platform||"instrument")).join(" · "),\n'
    '    rows:[["Runs",String(RUNS.length)],["Stored results",RUNS.reduce((a,r)=>a+((r.wells||[]).length),0).toLocaleString()],\n'
    '          ["Profile",`${SOP.name} v${SOP.version}`],["Instruments",String(mgSafe(()=>ccInstruments().length,0))]],\n'
    '    actions:[]});',
    label="empty queue")

rep('    MG.queue=MG.filter==="alarm"?[{sev:"ok",code:"",title:"No outside-limit alarms",value:"",unit:"",limits:"",state:"No alarm-level item is currently in the queue.",evidence:"",actions:[{key:"3",label:"Show all items",cmd:"everything"}]}]:all;',
    '    MG.queue=MG.filter==="alarm"\n'
    '      ?[mgIt({kind:"summary",sev:"ok",pict:MG_PICT.summary,kindWord:"data set",code:"OK",title:"No chart is outside a limit",\n'
    '         value:String(RUNS.length),unit:RUNS.length===1?"run read":"runs read",\n'
    '         state:"Nothing is outside a control or specification limit. Use the top row to read any part of the data set.",\n'
    '         actions:[{key:"3",label:"Show every item",cmd:"everything"}]})]\n'
    '      :all;',
    label="alarm fallback")

# ---------------------------------------------------------------- 9. button-only console I/O
# The load view can open the existing file input without leaving the console. The
# input's normal intake path remains the single decoder/staging path; this only
# refreshes the console when that path finishes.
rep('function mgLeaveTo(tab){mgClose();try{showTab(tab);}catch(e){}}',
    '''function mgReadFiles(){
  if(!Array.isArray(STAGED)||!STAGED.length){appNotice("console","No experiment files are staged.");return;}
  const task=readStaged();
  Promise.resolve(task).finally(()=>{
    if(typeof MG!=="undefined"&&MG.open){mgRefresh();mgRender();}
  });
}
function mgChooseFiles(){
  const f=document.getElementById("file");
  if(!f){appError("console:load",new Error("The experiment file control is not available."));return;}
  f.click();
}
function mgLeaveTo(tab){mgClose();try{showTab(tab);}catch(e){}}''', label="console file chooser")
rep('label:"Open the load view on the page",cmd:"open page load"',
    'label:"Choose experiment files",cmd:"choose files"', count=3, label="load actions")
rep('  {re:/^open page (load|sop|results|panel|graphs|review|export)$/, id:"leave for a page", act:m=>mgLeaveTo(m[1])},',
    '''  {re:/^read files$/, id:"read staged files", act:()=>mgReadFiles()},
  {re:/^choose files$/, id:"choose experiment files", act:()=>mgChooseFiles()},
  {re:/^open page (load|sop|results|panel|graphs|review|export)$/, id:"leave for a page", act:m=>mgLeaveTo(m[1])},''', label="choose files command")
rep('  file.onchange=()=>intake([...file.files]);',
    '''  file.onchange=()=>{
    const task=intake([...file.files]);
    Promise.resolve(task).finally(()=>{
      if(typeof MG!=="undefined"&&MG.open){mgRefresh();mgRender();}
    });
  };''', label="console intake refresh")
rep('actions:[{key:"1",label:"Open the load view",cmd:"load"}]',
    'actions:[{key:"3",label:"Choose experiment files",cmd:"choose files"}]',
    label="attention load action")
rep('''  if(!RUNS.length&&!PASTED){
    q.push({kind:"intake",sev:"none",code:"",title:"No experiment files are loaded",value:"",unit:"",limits:"",
      state:"Load .ixo or .eds files to begin.",evidence:"",actions:[{key:"3",label:"Choose experiment files",cmd:"choose files"}]});
    return q;
  }''',
    '''  if(!RUNS.length&&!PASTED){
    const staged=Array.isArray(STAGED)&&STAGED.length;
    q.push({kind:"intake",sev:"none",code:"",title:staged?"Files staged, ready to read":"No experiment files are loaded",
      value:staged?String(STAGED.length):"0",unit:staged?"files staged":"files",limits:"",
      state:staged?"The files passed intake. Read them to decode runs and build the views.":"Load .ixo or .eds files to begin.",
      evidence:"",actions:staged
        ?[{key:"3",label:"Read staged files",cmd:"read files"},{key:"4",label:"Choose another selection",cmd:"choose files"}]
        :[{key:"3",label:"Choose experiment files",cmd:"choose files"}]});
    return q;
  }''', label="attention staged state")
rep('''  if(!RUNS.length&&!PASTED)return [mgIt({kind:"intake",sev:"none",pict:MG_PICT.file,kindWord:"intake",code:"LOAD",
    title:"No experiment files are loaded",value:"0",unit:"files",
    state:"Drop .ixo, .eds, .edt or .zip files on the load view to begin.",
    actions:[{key:"3",label:"Choose experiment files",cmd:"choose files"}]})];''',
    '''  if(!RUNS.length&&!PASTED){
    const staged=Array.isArray(STAGED)&&STAGED.length;
    return [mgIt({kind:"intake",sev:"none",pict:MG_PICT.file,kindWord:"intake",code:"LOAD",
      title:staged?"Files staged, ready to read":"No experiment files are loaded",
      value:staged?String(STAGED.length):"0",unit:staged?"files staged":"files",
      state:staged?"The files passed intake. Read them to decode runs and build the views.":"Drop .ixo, .eds, .edt or .zip files on the load view to begin.",
      actions:staged
        ?[{key:"3",label:"Read staged files",cmd:"read files"},{key:"4",label:"Choose another selection",cmd:"choose files"}]
        :[{key:"3",label:"Choose experiment files",cmd:"choose files"}]})];
  }''', label="load staged state")

io.open(dst_p,"w",encoding="utf-8").write(s)
print("ok", n0, "->", len(s))
