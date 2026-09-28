function extraForensicEventsUncached(){
  const out=[],push=(run,severity,area,finding,evidence)=>out.push({experiment:run?runName(run):"(all loaded runs)",severity,area,finding,evidence:evidence||""});
  const bySha=byKey(RUNS.filter(r=>r.meta&&r.meta.sourceSHA256),r=>r.meta.sourceSHA256);
  bySha.forEach(rs=>{if(rs.length>1)push(null,"error","Duplicate file","The same file content was loaded under several names",rs.map(r=>r.file).join(", "));});
  const byName=byKey(RUNS,r=>runName(r));
  byName.forEach((rs,n)=>{if(rs.length>1&&new Set(rs.map(r=>r.meta.sourceSHA256)).size>1)push(null,"review","Duplicate name","Different files carry the same experiment name",`${n}: ${rs.map(r=>r.file).join(", ")}`);});
  const curveHash=c=>c.map(v=>Number(v).toPrecision(7)).join(",");
  const seen=new Map(),pairs=new Map();
  RUNS.forEach(run=>{
    const phys=new Map();
    (run.wells||[]).forEach(w=>{if(w.curve&&w.curve.length>5&&Math.max(...w.curve)>Math.min(...w.curve))phys.set(`${w.channel}|${w.pos}`,{w,h:curveHash(w.curve)});});
    phys.forEach(({w,h})=>{const k=`${w.channel}|${h}`;const prev=seen.get(k);
      if(prev){const pk=`${RUNS.indexOf(prev.run)}|${RUNS.indexOf(run)}`;if(!pairs.has(pk))pairs.set(pk,{a:prev.run,b:run,list:[]});pairs.get(pk).list.push(`${prev.w.well}=${w.well}`);}
      else seen.set(k,{run,w});});
  });
  pairs.forEach(p=>out.push({experiment:runName(p.b),severity:"error",area:"Copied data",
    finding:p.a===p.b?`${p.list.length} well pair(s) carry identical fluorescence curves`:`${p.list.length} curve(s) are identical to curves in another run`,
    evidence:(p.a===p.b?"":`${runName(p.a)} ↔ ${runName(p.b)}: `)+p.list.slice(0,12).join(", ")+(p.list.length>12?" …":"")}));
  RUNS.forEach(run=>{
    const T=runTimes(run);
    if(Number.isFinite(T.created)&&Number.isFinite(T.start)&&T.created>T.start+60000)
      push(run,"error","Timeline","Experiment was created after the run started",`created ${sopFmtTime(T.created)}; run started ${sopFmtTime(T.start)}`);
    if(Number.isFinite(T.editDelayH)){
      push(run,T.editDelayH>24?"review":"info","Timeline",`Last recorded change ${num(T.editDelayH,1)} h after the run ended`,
        runTimeline(run).filter(e=>e.kind==="edit"||e.kind==="analysis").slice(-4).map(e=>`${e.what} ${sopFmtTime(e.time)}`).join("; "));
    }
    if(Number.isFinite(T.lastEdit)&&Number.isFinite(T.start)&&T.lastEdit<T.start-60000)
      push(run,"review","Timeline","Last recorded change is earlier than the run start","the file dates are inconsistent");
    const m=run.meta||{};
    if(!run.isTemplate&&!String(m.Technician||m.CreatedByName||"").trim())push(run,"info","Traceability","No operator recorded in the file","");
    if(run.eds&&!(run.eds.reagents||[]).some(x=>x&&(x.lot||x.lotNumber)))push(run,"info","Traceability","No reagent lot number recorded in the file","");
    const cqs=new Map();
    (run.wells||[]).forEach(w=>{const q=Number(w.CpRaw);if(Number.isFinite(q)&&q>0&&String(w.CpRaw).replace(/^\d+\./,"").length>=6){
      const k=`${w.target}|${w.CpRaw}`;if(!cqs.has(k))cqs.set(k,[]);cqs.get(k).push(w);}});
    cqs.forEach(ws=>{const pos=uniq(ws.map(w=>w.pos));if(pos.length>1)push(run,"review","Copied data","Different wells share a Cq identical to six or more decimals",ws.map(w=>`${w.well} ${w.sample}`).join(", ")+` = ${ws[0].CpRaw}`);});
    const omitted=(run.wells||[]).filter(w=>sopOmitted(w)&&sopControlSpec(w));
    if(omitted.length)push(run,"review","Controls","Control wells were omitted from the analysis",omitted.map(w=>`${w.well} ${w.sample}`).join(", "));
  });
  const multi=(key,label)=>{const vals=uniq(RUNS.map(r=>String((r.meta||{})[key]||"")).filter(Boolean));
    if(vals.length>1)push(null,"info","Batch consistency",`${vals.length} different ${label} across the loaded runs`,vals.slice(0,8).join(" | "));};
  if(RUNS.length>1){multi("SWVersion","software versions");multi("InstrumentID","instrument identifiers");}
  return out;
}
