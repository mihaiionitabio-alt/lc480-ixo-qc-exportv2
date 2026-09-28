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
  const view=MG_VIEWS[MG.scope];
  document.getElementById("mg-count").textContent=
    `${view?view.label:"Attention"}  ·  item ${MG.at+1} of ${MG.queue.length}  ·  ${alarms} outside limits  ·  ${watch} to watch`;
  document.getElementById("mg-glyph").textContent=it?MG_GLYPH[it.sev]:"";
  document.getElementById("mg-pict").textContent=(it&&it.pict)||MG_PICT.summary;
  document.getElementById("mg-kind").textContent=(it&&(it.kindWord||MG_WORD[it.sev]))||"";
  document.getElementById("mg-code").textContent=it?it.code:"";
  document.getElementById("mg-title").textContent=it?it.title:"";
  document.getElementById("mg-value").innerHTML=it&&it.value!==""?`${esc(it.value)}${it.unit?`<span class="unit">${esc(it.unit)}</span>`:""}`:"";
  document.getElementById("mg-limits").textContent=it?it.limits:"";
  document.getElementById("mg-state").textContent=it?it.state:"";
  document.getElementById("mg-evidence").textContent=it?(it.evidence||""):"";
  document.getElementById("mg-rows").innerHTML=(it&&it.rows&&it.rows.length)
    ?it.rows.map(r=>`<div class="r"><b>${esc(String(r[0]))}</b><span>${esc(String(r[1]))}</span></div>`).join("")
    :"";
  const ch=document.getElementById("mg-chart");
  const charting=!!(MG.chart&&it&&(it.chartId||it.graphId));
  ch.classList.toggle("on",charting);root.classList.toggle("charting",charting);
  if(charting&&it.chartId){
    try{const rows=ccRowsFor(it.instrument),def=CC_BY_ID[it.chartId],res=ccCompute(def,rows,it.variant||"");
      mgStageSet(ccChartSvg(res,`${def.code} ${def.title}${it.variant?" · "+it.variant:""}`));}
    catch(e){mgStageSet("");appError("console:chart",e);}
  }else if(charting&&it.graphId){
    try{const g=GRAPHS.find(x=>x.id===it.graphId);
      const res=g?g.render(mgGraphCtx(g,it.runIndex||0)):null;
      mgStageSet(`<div id="mg-gcap">${esc(it.title)} · ${esc(it.limits)}</div>`+((res&&res.svg)||""));}
    catch(e){mgStageSet(`<p style="font-size:20px;padding:18px">This graph could not be drawn from the loaded run: ${esc(e.message)}</p>`);appError("console:graph",e);}
  }
  /* Buttons are the only console interaction. Chart mode gets its own full-screen controls. */
  /* One button each: the options open as a sheet, so the action row keeps its height. */
  const onChart=charting&&it&&it.chartId;
  const curType=onChart?(mgChartTypeOptions(it).find(o=>o.current)||{}).label:"";
  const curAxis=onChart?(mgChartAxisOptions(it).find(o=>o.current)||{}).label:"";
  const typeActs=onChart&&mgChartTypeOptions(it).length>1?[{key:"4",label:"Chart type · "+curType,cmd:"chart type",cls:"sheet"}]
    :(charting&&it&&it.graphId&&RUNS.length>1?[{key:"4",label:"Next run · "+runName(RUNS[Math.min(it.runIndex||0,RUNS.length-1)]).slice(0,26),cmd:"next run"}]:[]);
  const axisActs=onChart&&mgChartAxisOptions(it).length>1?[{key:"5",label:"X axis · "+curAxis,cmd:"x axis",cls:"sheet"}]:[];
  const rawActs=MG.pending
    ?[{key:"1",label:"Confirm "+MG.pending.id,cmd:"confirm",cls:"primary"},{key:"2",label:"Cancel",cmd:"cancel"},
      {key:"0",label:"Leave the console",cmd:"exit"}]
    :charting
      ?[{key:"1",label:onChart?"Previous chart":"Previous graph",cmd:onChart?"chart previous":"previous",cls:"primary"},
        {key:"2",label:onChart?"Next chart":"Next graph",cmd:onChart?"chart next":"next",cls:"primary"},
        {key:"3",label:onChart?"Close chart":"Close graph",cmd:"chart close"},
        ...typeActs,...axisActs,
        {key:"−",label:"Zoom out",cmd:"zoom out"},
        {key:"⟲",label:`Reset view · ${Math.round((Number.isFinite(MG.zoom)?MG.zoom:1)*100)}%`,cmd:"zoom reset"},
        {key:"+",label:"Zoom in",cmd:"zoom in"},
        {key:"←",label:"Pan left",cmd:"pan left"},{key:"→",label:"Pan right",cmd:"pan right"},{key:"↑",label:"Pan up",cmd:"pan up"},{key:"↓",label:"Pan down",cmd:"pan down"},
        {key:"8",label:"Light theme",cmd:"theme light"},
        {key:"9",label:"Dark theme",cmd:"theme dark"},
        {key:"0",label:"Return to the page",cmd:"exit"}]
      :[{key:"1",label:"Next",cmd:"next",cls:"primary"},{key:"2",label:"Previous",cmd:"previous"}]
        .concat((it&&it.actions||[]).map(a=>Object.assign({},a)))
        .concat([{key:"0",label:"Return to the page",cmd:"exit"}]);
  const seenKeys=new Set(),acts=rawActs.filter(a=>{if(seenKeys.has(a.key))return false;seenKeys.add(a.key);return true;});
  document.getElementById("mg-actions").innerHTML=acts.map(a=>
    `<button class="mg-act ${a.cls||""}" data-cmd="${esc(a.cmd)}" title="${esc(/^[0-9]$/.test(String(a.key))?"press "+a.key:a.label)}">
       <span class="k">${esc(a.key)}${/^[0-9]$/.test(String(a.key))?"  ·  key":""}</span><span class="l">${esc(a.label)}</span></button>`).join("");
  document.querySelectorAll("#mg-actions .mg-act").forEach(b=>b.onclick=()=>mgCommand(b.dataset.cmd,"button"));
  mgScopeMark();
  document.getElementById("mg-body").scrollTop=0;
  mgApplyChartView();mgStatusPaint();
}
