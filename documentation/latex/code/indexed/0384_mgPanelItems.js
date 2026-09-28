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
