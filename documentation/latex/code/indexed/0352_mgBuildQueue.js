function mgBuildQueue(){
  const q=[];
  if(!RUNS.length&&!PASTED){
    const staged=Array.isArray(STAGED)&&STAGED.length;
    q.push({kind:"intake",sev:"none",code:"",title:staged?"Files staged, ready to read":"No experiment files are loaded",
      value:staged?String(STAGED.length):"0",unit:staged?"files staged":"files",limits:"",
      state:staged?"The files passed intake. Read them to decode runs and build the views.":"Load .ixo or .eds files to begin.",
      evidence:"",actions:staged
        ?[{key:"3",label:"Read staged files",cmd:"read files"},{key:"4",label:"Choose another selection",cmd:"choose files"}]
        :[{key:"3",label:"Choose experiment files",cmd:"choose files"}]});
    return q;
  }
  /* A pasted Cq table has results but no decoded runs, charts or instrument history. */
  if(!RUNS.length&&PASTED){
    const n=Array.isArray(PASTED.rows)?PASTED.rows.length:0;
    q.push({kind:"results",sev:"none",code:"CSV",title:"Pasted Cq table loaded",value:String(n),unit:n===1?"Cq value":"Cq values",
      limits:"curves and instrument charts unavailable",state:"Use the Results view to inspect the pasted table; file-based forensic and control-chart views need decoded experiment files.",
      evidence:PASTED.source||"pasted data",actions:[{key:"3",label:"Open the results view",cmd:"results"}]});
    return q;
  }
  /* 1. errors first: integrity and decode */
  let events=[];try{events=reviewForensicEvents()||[];}catch(e){appError("console:events",e);}
  const errs=events.filter(e=>e.severity==="error"&&String(e.area||"").toLowerCase()!=="integrity"&&!/^Control chart/i.test(String(e.area||"")));
  const byArea=new Map();errs.forEach(e=>{const k=e.area||"other";byArea.set(k,(byArea.get(k)||[]).concat(e));});
  byArea.forEach((list,area)=>{
    q.push({kind:"finding",sev:"alarm",code:"ERR",title:area,value:String(list.length),unit:list.length===1?"finding":"findings",
      limits:"expected: none",state:list[0].finding||"",evidence:(list[0].evidence||"")+(list.length>1?`  (+${list.length-1} more of the same kind)`:""),
      run:list[0].experiment||"",actions:[{key:"3",label:"Open the review view",cmd:"review"}]});
  });
  /* 2. control charts of the selected instrument: limit alarms, then patterns */
  try{
    const insts=ccInstruments();
    if(insts.length){
      const key=CC_STATE.instrument&&insts.some(i=>i.key===CC_STATE.instrument)?CC_STATE.instrument:insts[0].key;
      const rows=ccRowsFor(key),pf=rows.length?rows[0].platform:"LC";
      const items=[];
      CC_CHARTS.filter(d=>d.inst.includes(pf)).forEach(d=>{
        const cfg=ccCfg(d.id);if(cfg.enabled===false)return;
        const vs=ccVariants(d,rows);(vs.length?vs:[""]).forEach(v=>{
          let res;try{res=ccCompute(d,rows,v);}catch(e){return;}
          const st=ccStatus(res);if(st.level!=="bad"&&st.level!=="warn")return;
          const pts=res.pts.filter(p=>Number.isFinite(p.y)&&!p.pre),last=pts[pts.length-1];
          if(!last)return;
          const lim=Number.isFinite(last.lcl)&&Number.isFinite(last.ucl)
            ? `limits ${fmtTick(+last.lcl.toPrecision(4))} – ${fmtTick(+last.ucl.toPrecision(4))}`:"no limits yet";
          const sp=res.spec||{},spec=[Number.isFinite(sp.lo)?`≥ ${fmtTick(sp.lo)}`:"",Number.isFinite(sp.hi)?`≤ ${fmtTick(sp.hi)}`:""].filter(Boolean).join(" and ");
          items.push({kind:"chart",sev:st.level==="bad"?"alarm":"watch",code:d.code,title:d.title+(v?" · "+v:""),
            value:fmtTick(+Number(st.last!==undefined?st.last:last.y).toPrecision(4)),unit:d.unit||"",
            limits:lim+(spec?`  ·  specification ${spec}`:""),state:st.text,
            evidence:`${key} · ${pts.length} run(s) in this chart · last run ${last.row&&last.row.date?sopFmtTime(last.row.date).slice(0,10):"unknown date"}`,
            chartId:d.id,variant:v,instrument:key,
            actions:[{key:"3",label:MG.chart?"Hide the chart":"Show the chart",cmd:"chart"}]});
        });
      });
      items.sort((a,b)=>(a.sev==="alarm"?0:1)-(b.sev==="alarm"?0:1));
      q.push(...items);
    }
  }catch(e){appError("console:queue",e);}
  /* 3. what the run acceptance says */
  try{
    const ev=sopEvaluateAll(),rej=ev.filter(e=>e.accept&&e.accept.ok===false);
    if(rej.length)q.push({kind:"results",sev:"alarm",code:"SOP",title:"Runs rejected by the profile",value:String(rej.length),unit:rej.length===1?"run":"runs",
      limits:`of ${ev.length} run(s) read`,state:(rej[0].accept&&rej[0].accept.reasons||[]).join("; ")||"see the results view",
      evidence:rej.map(r=>runName(r.run)).slice(0,3).join(", "),actions:[{key:"3",label:"Open the results view",cmd:"results"}]});
  }catch(e){appError("console:sop-queue",e);}
  /* 4. how much of the panel cannot judge anything yet */
  try{
    const insts=ccInstruments();
    if(insts.length){
      const key=CC_STATE.instrument&&insts.some(i=>i.key===CC_STATE.instrument)?CC_STATE.instrument:insts[0].key;
      const rows=ccRowsFor(key),pf=rows.length?rows[0].platform:"LC";
      let none=0,total=0;
      CC_CHARTS.filter(d=>d.inst.includes(pf)).forEach(d=>{const cfg=ccCfg(d.id);if(cfg.enabled===false)return;
        const vs=ccVariants(d,rows);(vs.length?vs:[""]).forEach(v=>{total++;
          try{if(ccStatus(ccCompute(d,rows,v)).level==="none")none++;}catch(e){}});});
      if(none)q.push({kind:"baseline",sev:"none",code:"BASE",title:"Charts still collecting a baseline",value:String(none),unit:`of ${total}`,
        limits:`a chart needs ${ccBaselineNeed(ccCfg("heat_rate"))} runs before it has limits`,
        state:`${rows.length} run(s) are in this instrument's history. Until a chart has its baseline it can raise no alarm.`,
        evidence:key,actions:[]});
    }
  }catch(e){appError("console:baseline-queue",e);}
  /* 5. chart gallery: keep usable charts in the console even when no alarm exists. */
  try{
    const insts=ccInstruments();
    if(insts.length){
      const key=CC_STATE.instrument&&insts.some(i=>i.key===CC_STATE.instrument)?CC_STATE.instrument:insts[0].key;
      const rows=ccRowsFor(key),pf=rows.length?rows[0].platform:"LC",seen=new Set(q.filter(x=>x.chartId).map(x=>x.chartId+"|"+(x.variant||"")));
      const gallery=[];
      CC_CHARTS.filter(d=>d.inst.includes(pf)).forEach(d=>{
        const cfg=ccCfg(d.id);if(cfg.enabled===false)return;
        const vs=ccVariants(d,rows);(vs.length?vs:[""]).forEach(v=>{
          const id=d.id+"|"+v;if(seen.has(id))return;
          try{
            const res=ccCompute(d,rows,v),st=ccStatus(res),pts=res.pts.filter(p=>Number.isFinite(p.y)&&!p.pre),last=pts[pts.length-1];
            if(!last)return;
            const lim=Number.isFinite(last.lcl)&&Number.isFinite(last.ucl)?`limits ${fmtTick(+last.lcl.toPrecision(4))} – ${fmtTick(+last.ucl.toPrecision(4))}`:"no limits yet";
            gallery.push({kind:"chart",sev:st.level==="ok"?"ok":"none",code:d.code,title:d.title+(v?" · "+v:""),
              value:fmtTick(+Number(st.last!==undefined?st.last:last.y).toPrecision(4)),unit:d.unit||"",limits:lim,state:st.level==="ok"?"In control. Select Show chart to inspect the trend and limits.":"Data available; this chart is still building its baseline.",
              evidence:`${key} · ${pts.length} run(s) · chart gallery`,chartId:d.id,variant:v,instrument:key,
              actions:[{key:"3",label:"Show chart",cmd:"chart"}]});
            seen.add(id);
          }catch(e){appError("console:gallery",e);}
        });
      });
      q.push(...gallery);
    }
  }catch(e){appError("console:gallery",e);}
  /* 6. everything is in order: report the data set rather than an empty screen */
  if(!q.length)q.push({kind:"summary",sev:"ok",pict:MG_PICT.summary,kindWord:"data set",code:"OK",
    title:"All checks passed",value:String(RUNS.length),unit:RUNS.length===1?"run read":"runs read",
    limits:`${RUNS.reduce((a,r)=>a+((r.wells||[]).length),0).toLocaleString()} stored results · profile ${SOP.name}`,
    state:"Every chart with limits is in control and no error-level finding is open. Use the top row to read any part of the data set.",
    evidence:uniq(RUNS.map(r=>(r.meta&&r.meta.InstrumentName)||r.platform||"instrument")).join(" · "),
    rows:[["Runs",String(RUNS.length)],["Stored results",RUNS.reduce((a,r)=>a+((r.wells||[]).length),0).toLocaleString()],
          ["Profile",`${SOP.name} v${SOP.version}`],["Instruments",String(mgSafe(()=>ccInstruments().length,0))]],
    actions:[]});
  return q;
}
