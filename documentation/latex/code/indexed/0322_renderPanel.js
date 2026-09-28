function renderPanel(){
  const box=$("#cc-tiles");if(!box)return;
  const insts=ccInstruments();
  setSelectItems($("#cc-inst"),insts.map(i=>({value:i.key,label:`${i.key} (${i.n} run${i.n>1?"s":""})`})),CC_STATE.instrument);
  CC_STATE.instrument=$("#cc-inst").value;
  const protos=[...byKey(ccAllRows().filter(r=>r.instrument===CC_STATE.instrument),r=>r.protocol||"")].sort((a,b)=>b[1].length-a[1].length);
  setSelectItems($("#cc-proto"),[{value:"",label:"All protocols"},...protos.map(([k,v])=>({value:k,label:`${v.length} run(s): ${k||"(not recorded)"}`}))],CC_STATE.protocol);
  CC_STATE.protocol=$("#cc-proto").value;
  if(!insts.length){box.innerHTML=emptyReview("Load .ixo or .eds runs (or import an instrument history) to fill the control panel.");$("#cc-summary").innerHTML="";$("#cc-detail").hidden=true;return;}
  const rows=ccRowsFor(CC_STATE.instrument),platform=rows[0].platform;
  const results=CC_CHARTS.filter(d=>d.inst.includes(platform)).map(d=>{
    const vs=ccVariants(d,rows),variant=vs[0]||"",res=ccCompute(d,rows,variant),st=ccStatus(res);return {d,res,st,variant,enabled:ccCfg(d.id).enabled!==false};});
  const shown=results.filter(r=>r.res.n>0||(r.d.type==="funnel"&&r.res.nRows>0));
  const count=l=>shown.filter(r=>r.enabled&&r.st.level===l).length,grey=shown.filter(r=>r.st.level==="none").length;
  $("#cc-summary").innerHTML=`<div class="metric-grid">${metricCard(rows.length,"runs in this instrument's history","")}${metricCard(count("ok"),"charts in control","ok")}
    ${metricCard(count("warn"),"charts to watch (rule alarm or limit approaching)",count("warn")?"warn":"ok")}${metricCard(count("bad"),"charts alarming on the latest run",count("bad")?"bad":"ok")}
    ${metricCard(grey,"charts still collecting a baseline","")}${metricCard(rows.filter(r=>r.loaded).length,"runs loaded now","")}${metricCard(rows.filter(r=>!r.loaded).length,"runs from the imported history","")}</div>
    ${rows.length<20?`<div class="notice warn"><span>Control limits need about 20 runs per instrument.</span> <span>${rows.length} run(s) available.</span> <span>Import an instrument history or load more runs to make the alarms meaningful.</span></div>`:""}`;
  const panelEvents=ccEvents(CC_STATE.instrument),alarmCounts=new Map();
  panelEvents.forEach(e=>alarmCounts.set(e.area,(alarmCounts.get(e.area)||0)+1));
  const alarmSummary=[...alarmCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12);
  $("#cc-summary").insertAdjacentHTML("beforeend",panelEvents.length?`<details class="cc-alarm-summary" open><summary><b>${panelEvents.length}</b> control-chart alarm point(s) in Tab 2</summary><p class="hint">These monitoring alarms are kept in the Control panel and are not duplicated in Quality & forensic review. File-integrity, timeline, analysis-membership and interpretation findings remain in Tab 5.</p><div class="scroll" style="max-height:160px"><table><thead><tr><th>Chart</th><th>Alarm points</th></tr></thead><tbody>${alarmSummary.map(([a,n])=>`<tr><td>${esc(a)}</td><td>${n}</td></tr>`).join("")}</tbody></table></div></details>`:`<div class="notice ok">No control-chart alarm points for this instrument.</div>`);
  const onlyAttention=$("#cc-filter").value==="attention";
  box.innerHTML=CC_GROUPS.map(g=>{
    const mine=shown.filter(r=>r.d.group===g.id&&(!onlyAttention||r.st.level==="warn"||r.st.level==="bad"));
    const missing=results.filter(r=>r.d.group===g.id&&!shown.includes(r)),notHere=CC_CHARTS.filter(d=>d.group===g.id&&!d.inst.includes(platform));
    return `<div class="cc-group"><h3>${esc(ui(g.title))} <span class="hint">${esc(ui(g.sub))}</span></h3>
      <div class="cc-grid">${mine.map(r=>`<button class="cc-tile ${r.enabled?"":"off"}" data-cc="${r.d.id}" type="button">
        <span class="cc-top"><i style="background:${CC_COL[r.enabled?r.st.level:"none"]}"></i><b>${esc(r.d.code)}</b><span>${esc(ui(r.d.type==="funnel"?"funnel":(ccCfg(r.d.id).type||r.d.type).toUpperCase()))}</span></span>
        <span class="cc-title">${esc(ui(r.d.title))}${r.variant?` · ${esc(r.variant)}`:""}</span>
        ${r.d.type==="funnel"?`<span class="cc-fun">${esc(ui("by operator"))}</span>`:ccSpark(r.res,r.st)}
        <span class="cc-foot">${r.st.last!=null&&Number.isFinite(r.st.last)?`<b>${fmtTick(+Number(r.st.last).toPrecision(4))}</b> <span>${esc(r.d.unit)}</span> · `:""}<span>${esc(r.enabled?r.st.text:"alarms switched off")}</span></span></button>`).join("")
        ||`<p class="hint">${esc(ui(onlyAttention?"Nothing needs attention in this group.":"No chart in this group has data in these files."))}</p>`}</div>
      ${missing.length||notHere.length?`<details class="cc-missing"><summary>${missing.length+notHere.length} chart(s) not shown</summary>
        ${missing.length?`<p class="hint">${esc(ui("No data in these files:"))} ${missing.map(r=>esc(r.d.code+" "+r.d.title)).join(" · ")}</p>`:""}
        ${notHere.length?`<p class="hint">${esc(ui(platform==="LC"?"Only QuantStudio files carry:":"Only LightCycler files carry:"))} ${notHere.map(d=>esc(d.code+" "+d.title)).join(" · ")}</p>`:""}</details>`:""}</div>`;
  }).join("");
  box.querySelectorAll("[data-cc]").forEach(b=>b.onclick=()=>{CC_STATE.open=b.dataset.cc;CC_STATE.variant="";renderCcDetail();$("#cc-detail").scrollIntoView({behavior:"smooth"});});
  if(CC_STATE.open)renderCcDetail();
  localizeDOM($("#tab-panel"));
}
