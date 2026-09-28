function ccStatus(res){
  if(res.type==="funnel"){
    if(res.pts.length<2||res.nRows<5)return {level:"none",text:res.pts.length<2?"needs two or more operators":"needs five or more runs"};
    const bad=res.pts.filter(p=>p.flags.some(f=>/99.8/.test(f))).length,warn=res.pts.filter(p=>p.flags.length).length;
    return {level:res.pts.length<2?"none":bad?"bad":warn?"warn":"ok",text:res.pts.length<2?"needs two or more operators":bad?`${bad} operator(s) outside 99.8 %`:warn?`${warn} outside 95 %`:"all operators within limits"};}
  const pts=res.pts.filter(p=>Number.isFinite(p.y)&&!p.pre);
  if(!pts.length)return {level:"none",text:res.s0?"no runs since the new baseline date":ccNoDataReason(res.def)};
  const last=pts[pts.length-1],recent=pts.slice(-5).filter(p=>p.flags.length);
  if(!res.baselineReady)return {level:last.flags.length?"bad":"none",text:(last.flags.length?last.flags.join(", ")+" · ":"")+(res.cohortOK===false?"mixed instrument/protocol/firmware cohort — select comparable runs":`collecting baseline: ${pts.length} of ${ccBaselineNeed(res.cfg)} runs — exploratory only`),last:last.raw!==undefined?last.raw:last.y};
  const lastSig=ccSignal(last),hard=lastSig==="limit"||(lastSig==="rule"&&res.def.westgard);
  const lastSeg=res.segmented&&res.segments?res.segments.find(g=>g.last):null;
  if(lastSeg&&!lastSeg.ready){const sg=lastSeg;
    return {level:"none",text:`new control extract (${sg.key}): ${sg.n} of ${ccBaselineNeed(res.cfg)} runs — no limits yet for this extract`,last:last.raw!==undefined?last.raw:last.y};}
  let level=hard?"bad":lastSig?"warn":recent.some(p=>ccSignal(p)==="limit")?"warn":recent.length?"warn":"ok",
    text=lastSig==="limit"?"outside the limits: "+last.flags.join(", "):lastSig==="rule"?"pattern inside the limits: "+last.flags.join(", "):recent.length?"signal in the last 5 runs":"in control";
  if(res.shift&&lastSig==="limit"){const h=res.shift,f=v=>fmtTick(+Number(v).toPrecision(4));
    text=`sustained shift since ${h.date?sopFmtTime(h.date).slice(0,10):"run "+h.run} (${f(h.before)} → ${f(h.after)} ${res.def.unit||""}, ${h.n} runs)`
      +(h.hasSpec?(h.inSpec?" · still inside the specification":" · outside the specification"):"")+" — find the cause; if the new level is accepted, start a new baseline on that date";
    if(h.hasSpec&&h.inSpec)level="warn";}
  if(res.reach){let runs=res.reach.ahead;
    if(res.X.kind!=="order"){const xs=pts.map(p=>p.x),step=(xs[xs.length-1]-xs[0])/Math.max(1,xs.length-1);runs=step>0?res.reach.ahead/step:Infinity;}
    if(runs<=res.cfg.warnAhead&&level==="ok"){level="warn";}
    text+=` · limit ${fmtTick(+res.reach.limit.toPrecision(3))} in ≈ ${Number.isFinite(runs)?Math.round(runs):"∞"} runs`;}
  if(pts.length<Math.min(res.cfg.phase1,20))text=`baseline ${pts.length}/${res.cfg.phase1} runs · `+text;
  return {level,text,last:last.raw!==undefined?last.raw:last.y};
}