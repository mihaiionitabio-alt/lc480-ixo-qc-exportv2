function renderGraphs(){
  const box=$("#g-chart");if(!box)return;
  const sel=$("#g-graph");
  if(!sel.options.length){
    const groups=uniq(GRAPHS.map(g=>g.group));
    sel.innerHTML=groups.map(gr=>`<optgroup label="${esc(ui(gr))}">${GRAPHS.filter(g=>g.group===gr).map(g=>`<option value="${g.id}">${esc(ui(g.title))}</option>`).join("")}</optgroup>`).join("");
  }
  if(!RUNS.length){box.innerHTML=emptyReview();$("#g-table").innerHTML="";$("#g-note").textContent="";return;}
  setSelectItems($("#g-run"),RUNS.map((r,i)=>({value:i,label:runName(r)})));
  const c0=graphContext(),g=c0.g,opts=g.opts||[];
  $("#g-run-wrap").style.display=g.scope==="run"?"":"none";
  const tgt=g.scope==="all"?uniq(RUNS.flatMap(r=>(r.wells||[]).map(w=>w.target||w.analysis)).filter(Boolean)):gTargets(c0.run||{});
  setSelectItems($("#g-target"),[{value:"",label:g.id==="x_control"||g.id==="plate"||g.id==="stdcurve"||g.id==="endpoint"?"All targets":"All targets"},...tgt.map(t=>({value:t,label:t}))]);
  if(g.id==="curves"&&!$("#g-target").value&&tgt.length&&!GRAPH_STATE.userTarget)$("#g-target").value=tgt[0];
  setSelectItems($("#g-control"),SOP.controls.map((x,i)=>({value:i,label:x.name||x.match})));
  const show=(id,on)=>{$(id).style.display=on?"":"none";};
  show("#g-target-wrap",opts.includes("target"));show("#g-metric-wrap",opts.includes("metric"));
  show("#g-signal-wrap",opts.includes("signal"));show("#g-log-wrap",opts.includes("signal"));
  show("#g-colourby-wrap",opts.includes("colourby"));show("#g-level-wrap",opts.includes("level"));show("#g-control-wrap",opts.includes("control"));
  const c=graphContext();
  $("#g-note").textContent=ui(g.note||"");
  let res;
  try{res=g.render(c);}catch(e){console.error(e);res={svg:svgMessage("This graph could not be drawn: "+e.message),rows:[]};}
  GRAPH_STATE.last={g,c,res};
  box.innerHTML=missyMarkWithSvg(res.svg,"top-right");
  const svg=box.querySelector("svg");if(svg){svg.removeAttribute("height");svg.style.width="100%";svg.style.maxWidth=svg.getAttribute("width")+"px";svg.style.height="auto";}
  const rows=res.rows||[];
  $("#g-table").innerHTML=rows.length?`<details><summary>${esc(ui("Data behind this graph"))} (${rows.length})</summary><div class="scroll" style="max-height:300px">${table(Object.keys(rows[0]).map(k=>({key:k,label:k,n:typeof rows[0][k]==="number"})),rows.slice(0,300).map(r=>{const o={};for(const k in r)o[k]=typeof r[k]==="number"?+r[k].toPrecision(6):r[k];return o;}))}</div>${rows.length>300?`<p class="hint">First 300 rows shown; the CSV has all ${rows.length}.</p>`:""}</details>`:"";
  $("#g-sop").innerHTML=`${esc(ui("Drawn with SOP profile"))} <b>${esc(SOP.name)}</b> v${esc(SOP.version)} · <code>${sopHash().slice(0,16)}…</code>`;
}
