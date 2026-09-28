# -*- coding: utf-8 -*-
"""Microgravity console overlay: one question at a time, large targets, voice and keyboard first."""
import sys, pathlib
src = pathlib.Path(sys.argv[1]); s = src.read_text(encoding='utf-8'); n0 = len(s)
def rep(old, new, count=1):
    global s
    if s.count(old) < 1: raise SystemExit("NOT FOUND: " + old[:110])
    s = s.replace(old, new, count)

CSS = r'''
/* ============================================================
   Microgravity console overlay
   One object on screen, targets no smaller than a gloved finger,
   no hover, no drag, no small dismiss controls. Every action has a
   number so it can be spoken, typed or pressed.
   ============================================================ */
#mg{position:fixed;inset:0;z-index:200;display:none;flex-direction:column;background:#05070c;color:#e8edf5;
  font:16px/1.45 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
#mg.on{display:flex}
#mg *{box-sizing:border-box}
#mg .mg-num{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-variant-numeric:tabular-nums}
#mg-top{flex:none;display:flex;align-items:center;gap:18px;padding:14px 26px;border-bottom:2px solid #1e2a3a;background:#080c14}
#mg-mode{display:flex;align-items:center;gap:12px;font-size:22px;font-weight:700;letter-spacing:.01em}
#mg-mode .dot{width:16px;height:16px;border-radius:50%;background:#37d67a;flex:none}
#mg.sev-alarm #mg-mode .dot{background:#ff5252}
#mg.sev-watch #mg-mode .dot{background:#ffb020}
#mg.sev-none  #mg-mode .dot{background:#8b98a9}
#mg-facts{font-size:17px;color:#9fb0c6}
#mg-facts b{color:#e8edf5}
#mg-listen{margin-left:auto;display:flex;align-items:center;gap:10px;font-size:15px;color:#9fb0c6}
#mg-listen .ear{width:14px;height:14px;border-radius:50%;background:#33415a}
#mg.listening #mg-listen .ear{background:#4ea1ff;box-shadow:0 0 0 6px rgba(78,161,255,.18)}
#mg-body{flex:1;display:flex;flex-direction:column;justify-content:center;padding:22px 26px;overflow:auto}
#mg.charting #mg-body{justify-content:flex-start}
#mg-count{font-size:17px;letter-spacing:.14em;text-transform:uppercase;color:#8b9cb3;margin-bottom:10px}
#mg-card{border:2px solid #22303f;border-radius:14px;background:#0b111b;padding:22px 26px}
#mg-card.alarm{border-color:#ff5252}
#mg-card.watch{border-color:#ffb020}
#mg-card.ok{border-color:#37d67a}
#mg-head{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
#mg-glyph{font-size:30px;line-height:1}
#mg-code{font-size:20px;color:#9fb0c6;font-family:ui-monospace,Menlo,Consolas,monospace}
#mg-title{font-size:30px;font-weight:700;letter-spacing:-.01em}
#mg-value{margin:14px 0 6px;font-size:62px;font-weight:700;line-height:1;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-variant-numeric:tabular-nums}
#mg-value .unit{font-size:26px;color:#9fb0c6;margin-left:10px;font-weight:600}
#mg-limits{font-size:19px;color:#9fb0c6}
#mg-state{margin-top:12px;font-size:22px;line-height:1.35}
#mg-evidence{margin-top:10px;font-size:17px;color:#9fb0c6}
#mg-chart{margin-top:14px;background:#f7f9fc;border-radius:10px;padding:8px;display:none;max-height:40vh;overflow:hidden}
#mg-chart.on{display:block}
#mg-chart svg{width:100%;height:auto;max-height:30vh;display:block}
#mg-card.with-chart #mg-value{font-size:40px;margin:8px 0 4px}
#mg-card.with-chart #mg-state{font-size:19px;margin-top:8px}
#mg-card.with-chart #mg-evidence{display:none}
#mg-actions{flex:none;display:flex;gap:16px;padding:16px 26px 12px;flex-wrap:wrap;border-top:2px solid #1e2a3a;background:#080c14}
.mg-act{all:unset;cursor:pointer;min-width:196px;min-height:88px;flex:1 1 196px;display:flex;flex-direction:column;justify-content:center;
  gap:6px;padding:12px 18px;border:2px solid #2b3a4d;border-radius:12px;background:#0f1724;color:#e8edf5}
.mg-act:focus-visible{outline:4px solid #4ea1ff;outline-offset:3px}
.mg-act .k{font-size:15px;color:#9fb0c6;letter-spacing:.1em}
.mg-act .l{font-size:22px;font-weight:700}
.mg-act.primary{border-color:#4ea1ff;background:#12243c}
.mg-act.danger{border-color:#ff5252}
.mg-act[disabled]{opacity:.4;cursor:default}
#mg-say{flex:none;padding:0 26px 16px;font-size:17px;color:#9fb0c6}
#mg-say b{color:#cfe0f5;font-weight:600}
#mg-line{flex:none;display:flex;gap:12px;padding:0 26px 18px}
#mg-input{flex:1;min-height:64px;font:19px/1.3 inherit;padding:10px 16px;border-radius:12px;border:2px solid #2b3a4d;background:#0b111b;color:#e8edf5}
#mg-input::placeholder{color:#6d7f94}
#mg-heard{flex:none;padding:0 26px 14px;font-size:18px;color:#cfe0f5;min-height:26px}
#mg-heard .bad{color:#ff8a8a}
#mg-help{position:absolute;inset:0;background:rgba(5,7,12,.97);padding:34px 40px;display:none;overflow:auto}
#mg-help.on{display:block}
#mg-help h2{font-size:26px;margin:0 0 14px}
#mg-help table{border-collapse:collapse;width:100%;font-size:19px}
#mg-help td{padding:8px 14px 8px 0;vertical-align:top;border-bottom:1px solid #1b2634}
#mg-help td.c{color:#8fd3ff;font-family:ui-monospace,Menlo,Consolas,monospace;white-space:nowrap}
@media (max-width:900px){#mg-value{font-size:46px}#mg-title{font-size:24px}.mg-act{min-width:150px}}
@media (prefers-reduced-motion:reduce){#mg *{transition:none!important;animation:none!important}}
'''

HTML = r'''
<!-- Microgravity console: activated with the status-bar button, the C key or the voice command "console" -->
<div id="mg" role="application" aria-label="Microgravity console" aria-live="polite">
  <div id="mg-top">
    <div id="mg-mode"><span class="dot"></span><span id="mg-mode-text">Ready</span></div>
    <div id="mg-facts"></div>
    <div id="mg-listen"><span class="ear"></span><span id="mg-listen-text">voice off</span></div>
  </div>
  <div id="mg-body">
    <div id="mg-count"></div>
    <div id="mg-card">
      <div id="mg-head"><span id="mg-glyph">●</span><span id="mg-code"></span><span id="mg-title"></span></div>
      <div id="mg-value"></div>
      <div id="mg-limits"></div>
      <div id="mg-state"></div>
      <div id="mg-evidence"></div>
      <div id="mg-chart"></div>
    </div>
  </div>
  <div id="mg-heard"></div>
  <div id="mg-actions"></div>
  <div id="mg-say"></div>
  <div id="mg-line"><input id="mg-input" type="text" autocomplete="off" spellcheck="false"
    placeholder="type a command — next, chart, read, help, exit"></div>
  <div id="mg-help"></div>
</div>
'''

JS = r'''
/* ============================================================
   Microgravity console
   ------------------------------------------------------------
   Designed for an operator who cannot point precisely: no hover, no drag,
   no double click, no small dismiss control. One item is on screen at a time,
   taken from a priority queue built from the same findings the other views
   show. Every action carries a number, so the same instruction works spoken,
   typed or pressed. Speech output is local; speech input is an adapter, so an
   offline recogniser can drive the page without the page needing a service.
   ============================================================ */
const MG={open:false,queue:[],at:0,chart:false,theme:"light",pending:null};
const MG_GLYPH={alarm:"▲",watch:"△",ok:"●",none:"○"};
const MG_WORD={alarm:"outside limits",watch:"watch",ok:"in control",none:"no limits yet"};

/* ---------- the attention queue: what deserves the screen, in order ---------- */
function mgBuildQueue(){
  const q=[];
  if(!RUNS.length&&!PASTED){
    q.push({sev:"none",code:"",title:"No experiment files are loaded",value:"",unit:"",limits:"",
      state:"Load .ixo or .eds files to begin.",evidence:"",actions:[{key:"1",label:"Open the load view",cmd:"load"}]});
    return q;
  }
  /* A pasted Cq table has results but no decoded runs, charts or instrument history. */
  if(!RUNS.length&&PASTED){
    const n=Array.isArray(PASTED.rows)?PASTED.rows.length:0;
    q.push({sev:"none",code:"CSV",title:"Pasted Cq table loaded",value:String(n),unit:n===1?"Cq value":"Cq values",
      limits:"curves and instrument charts unavailable",state:"Use the Results view to inspect the pasted table; file-based forensic and control-chart views need decoded experiment files.",
      evidence:PASTED.source||"pasted data",actions:[{key:"3",label:"Open the results view",cmd:"results"}]});
    return q;
  }
  /* 1. errors first: integrity and decode */
  let events=[];try{events=reviewForensicEvents()||[];}catch(e){appError("console:events",e);}
  const errs=events.filter(e=>e.severity==="error"&&!/^Control chart/i.test(String(e.area||"")));
  const byArea=new Map();errs.forEach(e=>{const k=e.area||"other";byArea.set(k,(byArea.get(k)||[]).concat(e));});
  byArea.forEach((list,area)=>{
    q.push({sev:"alarm",code:"ERR",title:area,value:String(list.length),unit:list.length===1?"finding":"findings",
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
          items.push({sev:st.level==="bad"?"alarm":"watch",code:d.code,title:d.title+(v?" · "+v:""),
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
    if(rej.length)q.push({sev:"alarm",code:"SOP",title:"Runs rejected by the profile",value:String(rej.length),unit:rej.length===1?"run":"runs",
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
      if(none)q.push({sev:"none",code:"BASE",title:"Charts still collecting a baseline",value:String(none),unit:`of ${total}`,
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
            gallery.push({sev:st.level==="ok"?"ok":"none",code:d.code,title:d.title+(v?" · "+v:""),
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
  /* 6. nothing outstanding */
  if(!q.length)q.push({sev:"ok",code:"",title:"Nothing needs attention",value:String(RUNS.length),unit:RUNS.length===1?"run read":"runs read",
    limits:"",state:"Every chart with limits is in control and no error-level finding is open.",
    evidence:"",actions:[]});
  return q;
}

/* ---------- rendering: one item, large ---------- */
function mgItem(){return MG.queue[MG.at]||null;}
const MG_TYPE_LABEL={i:"Individuals (I)",ewma:"EWMA",cusum:"CUSUM",trend:"Trend / forecast",xbars:"X̄–S",p:"p-chart",u:"u-chart",c:"c-chart",funnel:"Funnel"};
function mgChartTypeOptions(it){
  const def=it&&it.chartId?CC_BY_ID[it.chartId]:null;if(!def)return [];
  const types=def.type==="funnel"?["funnel"]:["p","u","c"].includes(def.type)?[def.type]:def.type==="xbars"?["xbars","i","ewma","cusum","trend"]:["i","ewma","cusum","trend"];
  const current=ccCfg(def.id).type||def.type;return types.map(value=>({value,label:MG_TYPE_LABEL[value]||value,current:value===current}));
}
function mgChartAxisOptions(it){
  const def=it&&it.chartId?CC_BY_ID[it.chartId]:null;if(!def||def.type==="funnel")return [];
  const rows=ccRowsFor(it.instrument),current=ccCfg(def.id).x||def.x||"order",out=[{value:"order",label:"Run order"}];
  if(rows.some(r=>Number.isFinite(r.date)))out.push({value:"date",label:"Date"});
  if(rows.length)out.push({value:"hours",label:"Cumulative hours"});
  if(rows.some(r=>Number.isFinite(r.block_cycles)))out.push({value:"cycles",label:"Block cycles"});
  return out.map(o=>Object.assign(o,{current:o.value===current}));
}
function mgRender(){
  if(!MG.open)return;
  const it=mgItem(),root=document.getElementById("mg");
  const d=appStatusSnapshot();
  document.getElementById("mg-mode-text").textContent=(APP_PHASE_TEXT&&APP_PHASE_TEXT[d.phase])||d.phase;
  document.getElementById("mg-facts").innerHTML=RUNS.length
    ?`<b class="mg-num">${d.runs}</b> runs · <b class="mg-num">${d.wells.toLocaleString()}</b> results · profile <b>${esc(SOP.name)}</b>`
    :PASTED
      ?`<b class="mg-num">${Array.isArray(PASTED.rows)?PASTED.rows.length:0}</b> pasted Cq values · file charts unavailable`
      :`no data loaded`;
  root.classList.remove("sev-alarm","sev-watch","sev-none");
  if(it)root.classList.add("sev-"+(it.sev==="ok"?"ok":it.sev));
  root.classList.remove("theme-light","theme-dark");root.classList.add("theme-"+(MG.theme||"light"));
  const card=document.getElementById("mg-card");
  card.className=(it?it.sev:"")+((MG.chart&&it&&it.chartId)?" with-chart":"");
  const alarms=MG.queue.filter(x=>x.sev==="alarm").length,watch=MG.queue.filter(x=>x.sev==="watch").length;
  document.getElementById("mg-count").textContent=
    `item ${MG.at+1} of ${MG.queue.length}  ·  ${alarms} outside limits  ·  ${watch} to watch`;
  document.getElementById("mg-glyph").textContent=it?MG_GLYPH[it.sev]:"";
  document.getElementById("mg-code").textContent=it?it.code:"";
  document.getElementById("mg-title").textContent=it?it.title:"";
  document.getElementById("mg-value").innerHTML=it&&it.value!==""?`${esc(it.value)}${it.unit?`<span class="unit">${esc(it.unit)}</span>`:""}`:"";
  document.getElementById("mg-limits").textContent=it?it.limits:"";
  document.getElementById("mg-state").textContent=it?it.state:"";
  document.getElementById("mg-evidence").textContent=it?(it.evidence||""):"";
  const ch=document.getElementById("mg-chart");
  const charting=!!(MG.chart&&it&&it.chartId);
  ch.classList.toggle("on",charting);root.classList.toggle("charting",charting);
  if(MG.chart&&it&&it.chartId){
    try{const rows=ccRowsFor(it.instrument),def=CC_BY_ID[it.chartId],res=ccCompute(def,rows,it.variant||"");
      ch.innerHTML=ccChartSvg(res,`${def.code} ${def.title}${it.variant?" · "+it.variant:""}`);}
    catch(e){ch.innerHTML="";appError("console:chart",e);}
  }
  /* Buttons are the only console interaction. Chart mode gets its own full-screen controls. */
  const typeActs=charting?mgChartTypeOptions(it).map((o,i)=>({key:"T"+(i+1),label:(o.current?"Chart type · ":"Use ")+o.label,cmd:"type "+o.value,cls:o.current?"selected":""})) : [];
  const axisActs=charting?mgChartAxisOptions(it).map((o,i)=>({key:"X"+(i+1),label:(o.current?"X axis · ":"Use X · ")+o.label,cmd:"x "+o.value,cls:o.current?"selected":""})) : [];
  const rawActs=MG.pending
    ?[{key:"1",label:"Confirm "+MG.pending.id,cmd:"confirm",cls:"primary"},{key:"2",label:"Cancel",cmd:"cancel"},
      {key:"0",label:"Leave the console",cmd:"exit"}]
    :charting
      ?[{key:"1",label:"Previous chart",cmd:"chart previous",cls:"primary"},
        {key:"2",label:"Next chart",cmd:"chart next",cls:"primary"},
        {key:"3",label:"Close chart",cmd:"chart close"},
        ...typeActs,...axisActs,
        {key:"8",label:"Light theme",cmd:"theme light"},
        {key:"9",label:"Dark theme",cmd:"theme dark"},
        {key:"0",label:"Return to the page",cmd:"exit"}]
      :[{key:"1",label:"Next",cmd:"next",cls:"primary"},{key:"2",label:"Previous",cmd:"previous"}]
        .concat((it&&it.actions||[]).map(a=>Object.assign({},a)))
        .concat([{key:"0",label:"Return to the page",cmd:"exit"}]);
  const seenKeys=new Set(),acts=rawActs.filter(a=>{if(seenKeys.has(a.key))return false;seenKeys.add(a.key);return true;});
  document.getElementById("mg-actions").innerHTML=acts.map(a=>
    `<button class="mg-act ${a.cls||""}" data-cmd="${esc(a.cmd)}">
       <span class="k">${esc(a.key)}  ·  select</span><span class="l">${esc(a.label)}</span></button>`).join("");
  document.querySelectorAll("#mg-actions .mg-act").forEach(b=>b.onclick=()=>mgCommand(b.dataset.cmd,"button"));
  document.getElementById("mg-body").scrollTop=0;
}

function mgItemSentence(it){
  if(!it)return "Nothing to report.";
  const sev=MG_WORD[it.sev]||"";
  return `${it.code?it.code+". ":""}${it.title}. ${it.value?it.value+" "+(it.unit||"")+". ":""}${sev}. ${it.state||""}`;
}

/* ---------- the command grammar ----------
   One table: the phrase, what it does, whether it must be confirmed.
   Recognisers, the keyboard and the buttons all go through mgCommand(). */
const MG_COMMANDS=[
  {re:/^next$/, id:"next", act:()=>mgGo(1)},
  {re:/^previous$/, id:"previous", act:()=>mgGo(-1)},
  {re:/^chart previous$/, id:"chart previous", act:()=>mgGoChart(-1)},
  {re:/^chart next$/, id:"chart next", act:()=>mgGoChart(1)},
  {re:/^chart close$/, id:"chart close", act:()=>{MG.chart=false;}},
  {re:/^type (i|ewma|cusum|trend|xbars|p|u|c|funnel)$/, id:"chart type", act:t=>mgSetChartType(t.slice(5))},
  {re:/^x (order|date|hours|cycles)$/, id:"x axis", act:t=>mgSetChartAxis(t.slice(2))},
  {re:/^theme light$/, id:"theme light", act:()=>{MG.theme="light";}},
  {re:/^theme dark$/, id:"theme dark", act:()=>{MG.theme="dark";}},
  {re:/^chart$/, id:"chart", act:()=>{MG.chart=!MG.chart;}},
  {re:/^panel$/, id:"panel", act:()=>mgLeaveTo("panel")},
  {re:/^results$/, id:"results", act:()=>mgLeaveTo("results")},
  {re:/^review$/, id:"review", act:()=>mgLeaveTo("review")},
  {re:/^load$/, id:"load", act:()=>mgLeaveTo("load")},
  {re:/^sop$/, id:"sop", act:()=>mgLeaveTo("sop")},
  {re:/^exit$/, id:"exit", act:()=>mgClose()}
];
function mgCommand(text,source){
  const t=String(text||"").toLowerCase().trim();
  const hit=MG_COMMANDS.find(c=>c.re.test(t));
  if(!hit)return false;
  try{hit.act(t);}catch(e){appError("console:button",e);}
  mgRender();
  return true;
}
function mgGo(step){
  if(!MG.queue.length)return;
  MG.at=(MG.at+step+MG.queue.length)%MG.queue.length;MG.chart=!!(MG.queue[MG.at]&&MG.queue[MG.at].chartId);
}
function mgGoChart(step){
  const chartIndexes=MG.queue.map((x,i)=>x&&x.chartId?i:-1).filter(i=>i>=0);
  if(!chartIndexes.length)return;
  let pos=chartIndexes.indexOf(MG.at);
  if(pos<0)pos=step>0?-1:0;
  pos=(pos+step+chartIndexes.length)%chartIndexes.length;
  MG.at=chartIndexes[pos];MG.chart=true;
}
function mgSetChartType(type){
  const it=mgItem();if(!it||!it.chartId)return;const def=CC_BY_ID[it.chartId];
  ccSetCfg(it.chartId,{type:type===def.type?"":type});CC_STATE.cache=null;MG.chart=true;mgRefresh();
}
function mgSetChartAxis(axis){
  const it=mgItem();if(!it||!it.chartId)return;
  ccSetCfg(it.chartId,{x:axis===((CC_BY_ID[it.chartId]||{}).x||"order")?"":axis});CC_STATE.cache=null;MG.chart=true;mgRefresh();
}
function mgLeaveTo(tab){mgClose();try{showTab(tab);}catch(e){}}
function mgItemKey(it){return it?`${it.sev}|${it.code||""}|${it.title||""}|${it.instrument||""}|${it.variant||""}`:"";}
function mgRefresh(){
  const oldKey=mgItemKey(mgItem());
  const all=mgBuildQueue();
  MG.queue=MG.filter==="alarm"?all.filter(x=>x.sev==="alarm"):all;
  if(!MG.queue.length){
    MG.queue=MG.filter==="alarm"?[{sev:"ok",code:"",title:"No outside-limit alarms",value:"",unit:"",limits:"",state:"No alarm-level item is currently in the queue.",evidence:"",actions:[{key:"3",label:"Show all items",cmd:"everything"}]}]:all;
  }
  const same=MG.queue.findIndex(x=>mgItemKey(x)===oldKey);
  MG.at=same>=0?same:Math.min(Math.max(0,MG.at),Math.max(0,MG.queue.length-1));
}

/* Button-only console: no speech recognizer, command line, or external command adapter. */
/* ---------- open, close, keys ---------- */
function mgOpen(){
  MG.open=true;MG.filter="";mgRefresh();MG.at=0;MG.chart=false;
  document.getElementById("mg").classList.add("on");
  mgRender();
}
function mgClose(){
  MG.pending=null;MG.open=false;document.getElementById("mg").classList.remove("on");
}
function mgToggle(){MG.open?mgClose():mgOpen();}
function mgInit(){
  document.querySelectorAll("#mg-nav [data-tab]").forEach(b=>b.onclick=()=>mgLeaveTo(b.dataset.tab));
  /* the console follows the data: rebuild when a read finishes or the profile changes */
  const tick=()=>{if(MG.open){const before=MG.queue.map(mgItemKey).join("\u001f")+"|"+MG.at;mgRefresh();const after=MG.queue.map(mgItemKey).join("\u001f")+"|"+MG.at;if(before!==after)mgRender();}};
  setInterval(tick,4000);
}

'''

# The release entry page may already contain this overlay. Do not inject a second
# copy when rebuilding from that page; duplicate const MG declarations break the JS.
if 'const MG={' in s and 'id="mg"' in s:
    pathlib.Path(sys.argv[2]).write_text(s,encoding='utf-8');print('source already contains the button console; copied without reinjection');raise SystemExit

# ---- 1. styles ------------------------------------------------------------
rep('main{padding:22px;max-width:1180px;padding-bottom:64px}',
    'main{padding:22px;max-width:1180px;padding-bottom:64px}\n'+CSS.strip())
# ---- 2. markup ------------------------------------------------------------
rep('<div id="statusbar" aria-live="polite">', HTML.strip()+'\n\n<div id="statusbar" aria-live="polite">')
# ---- 3. a big button in the status bar ------------------------------------
rep('<button type="button" id="sb-save">Save status report</button>',
    '<button type="button" id="sb-console">Console mode</button>\n      <button type="button" id="sb-save">Save status report</button>')
# ---- 4. the console itself -------------------------------------------------
rep('/* ---------- what the page is doing: counters, tasks and the status bar ----------',
    JS.strip()+'\n\n/* ---------- what the page is doing: counters, tasks and the status bar ----------')
# ---- 5. wire it up ---------------------------------------------------------
rep('  appTaskWrap(Object.keys(APP_TASK_LABEL));',
    '  appTaskWrap(Object.keys(APP_TASK_LABEL));\n  const cb=document.getElementById("sb-console");if(cb)cb.onclick=mgToggle;\n  mgInit();')
# ---- 6. test surface -------------------------------------------------------
rep('  APP_LIMITS, APP_STATE, appDiagnostics,','  MG, mgOpen, mgClose, mgCommand, mgBuildQueue, MG_COMMANDS,\n  APP_LIMITS, APP_STATE, appDiagnostics,')
# ---- 7. title --------------------------------------------------------------
rep('<title>','<title>Console mode · ',1)
pathlib.Path(sys.argv[2]).write_text(s,encoding='utf-8');print('patched',n0,'->',len(s))
