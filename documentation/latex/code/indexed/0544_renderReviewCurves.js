function renderReviewCurves(){
  const box=$("#review-curves"),runSel=$("#curve-run"),targetSel=$("#curve-target");if(!box)return;
  if(!RUNS.length){setSelectItems(runSel,[],null);setSelectItems(targetSel,[],null);box.innerHTML=emptyReview();return;}
  setSelectItems(runSel,RUNS.map((r,i)=>({value:i,label:runName(r)})),runSel.value);
  const run=runAt("#curve-run",0);
  setSelectItems(targetSel,analysisChoices(run),targetSel.value);
  setSelectItems($("#curve-sample"),[{value:"",label:"All samples"},...uniq((run.wells||[]).map(w=>w.sample).filter(Boolean)).map(x=>({value:x,label:x}))],$("#curve-sample").value);
  $("#curve-signal-wrap").style.display=run.eds?"":"none";
  $("#curve-thr").parentElement.parentElement.style.display=run.eds&&curveSignal(run)==="drn"?"":"none";
  const rows=curveRowsSelected();
  if(!rows.length){box.innerHTML=emptyReview("No decoded amplification curves match this selection.");return;}
  const mode=$("#curve-colour").value,legend=new Map();CURVE_KEY_COLOURS=new Map();
  rows.forEach(w=>{const key=curveKey(w,mode);
    if(!legend.has(key||"Unassigned"))legend.set(key||"Unassigned",curveColour(w,mode));});
  box.innerHTML=`<div class="metric-grid">
      ${metricCard(rows.length,"curves drawn","ok")}
      ${metricCard(Math.max(...rows.map(w=>w.curve.length)),"maximum cycles","")}
      ${metricCard(rows.filter(w=>w.role&&w.role!=="Unknown").length,"control-role curves","")}
    </div><div class="legend">${[...legend].slice(0,24).map(([k,c])=>
      `<span><i style="background:${c}"></i>${esc(k)}</span>`).join("")}</div>
    <div class="chart-wrap" style="position:relative"><canvas id="curve-chart" width="1000" height="420"></canvas><div class="tip" id="curve-tip"></div></div>
    <p class="hint">The CSV contains every cycle of every selected curve, including curves hidden by overlap in the chart. Hover a line to identify it.</p>`;
  const sig=curveSignal(run),hl=[];
  if(sig==="drn"&&$("#curve-thr").checked)uniq(rows.map(w=>w.target)).forEach(t=>{
    const d=run.eds.analysis.detectors[t];if(d&&Number.isFinite(d.threshold))hl.push({y:d.threshold,label:`${t} threshold`,
      colour:(run.eds.exp.detectors.find(x=>x.name===t)||{}).color||"#475569"});});
  drawAmplificationCurves($("#curve-chart"),rows,mode,$("#curve-log").checked,{hlines:hl,
    ylabel:{drn:"ΔRn (stored)",mc:"Multicomponent signal",raw:"Raw filter-set fluorescence",stored:run.eds?"Rn (stored)":""}[sig]});
  bindCurveTip($("#curve-chart"),$("#curve-tip"));
}
