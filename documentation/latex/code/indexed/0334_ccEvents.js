function ccEvents(instrumentFilter=""){
  const out=[];if(!RUNS.length)return out;
  const loadedKeys=new Set(ccRowsFromRuns().map(r=>r.key));
  const keepProto=CC_STATE.protocol;CC_STATE.protocol="";      // alarms use every run of the instrument
  try{ccInstruments().filter(inst=>!instrumentFilter||inst.key===instrumentFilter).forEach(inst=>{const rows=ccRowsFor(inst.key),pf=rows[0].platform;
    CC_CHARTS.filter(d=>d.inst.includes(pf)&&d.type!=="funnel").forEach(d=>{const cfg=ccCfg(d.id);if(cfg.action==="off"||cfg.enabled===false)return;
      (ccVariants(d,rows).length?ccVariants(d,rows):[""]).forEach(v=>{const res=ccCompute(d,rows,v);
        res.pts.forEach(p=>{if(p.row&&loadedKeys.has(p.row.key)&&p.flags.length&&Number.isFinite(p.y)&&rows.length>=5)
          out.push({experiment:p.row.run,severity:cfg.action==="reject"?"error":"review",area:`Control chart ${d.code}`,
            finding:`${d.title}${v?" · "+v:""}: ${p.flags.join(", ")}`,evidence:`value ${fmtTick(+Number(p.raw!==undefined?p.raw:p.y).toPrecision(4))} ${d.unit}; centre ${fmtTick(+Number(p.cl).toPrecision(4))}; limits ${fmtTick(+Number(p.lcl).toPrecision(4))} – ${fmtTick(+Number(p.ucl).toPrecision(4))}${CC_LIMIT_TEXT[d.id]?` — ${ccAlarmDir(p,res)==="lo"?"below":"above"}: ${CC_LIMIT_TEXT[d.id][ccAlarmDir(p,res)]}`:""}`});});});});});}finally{CC_STATE.protocol=keepProto;}
  return out;
}
