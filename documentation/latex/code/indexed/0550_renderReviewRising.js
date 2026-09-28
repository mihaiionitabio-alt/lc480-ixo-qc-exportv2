function renderReviewRising(){
  const box=$("#review-rising"),sel=$("#rising-run"),level=$("#rising-level");if(!box)return;
  const all=risingCurveRows();
  if(!RUNS.length||!all.length){setSelectItems(sel,[],null);box.innerHTML=emptyReview("No rising curve without an own-channel result was detected.");return;}
  setSelectItems(sel,[{value:"",label:"All loaded experiments"},...RUNS.map((r,i)=>({value:i,label:runName(r)}))],sel.value);
  const runValue=sel.value,lev=level.value;
  const rows=all.filter(o=>(runValue===""||String(o.runIndex)===String(runValue))&&(lev==="all"||o.severity===lev));
  if(!rows.length){box.innerHTML=emptyReview("No rising curves match this filter.");return;}
  const display=risingCurveDisplayRows(rows),errors=rows.filter(o=>o.severity==="error").length;
  const legend=new Map();rows.forEach(o=>{const k=`${o.experiment} · ${o.filterName||"channel "+o.channel}`;if(!legend.has(k))legend.set(k,hashColour(k));});
  box.innerHTML=`<div class="metric-grid">${metricCard(rows.length,"rising curves",errors?"warn":"ok")}${metricCard(uniq(rows.map(o=>o.experiment)).length,"experiments","")}${metricCard(uniq(rows.map(o=>o.well)).length,"plate positions","")}${metricCard(errors,"error-level curves",errors?"bad":"ok")}</div>
    <div class="legend">${[...legend].slice(0,32).map(([k,c])=>`<span><i style="background:${c}"></i>${esc(k)}</span>`).join("")}${legend.size>32?`<span>+${legend.size-32} more series</span>`:""}</div>
    <div class="chart-wrap"><canvas id="rising-chart" width="1100" height="470"></canvas></div>
    <p class="hint">The combined plot is per-curve normalised for visibility. Use the amplitude and Cq/Ct evidence columns for the stored scale and same-position result context. No Cq/Ct is invented for the missing channel.</p>
    <div class="scroll">${table([
      {key:"experiment",label:"Experiment"},{key:"well",label:"Plate position"},{key:"sample",label:"Sample"},
      {key:"role",label:"Role"},{key:"channel",label:"Channel / filter"},{key:"target",label:"Missing analysis"},
      {key:"cq_ct",label:"Same-channel Cq/Ct"},{key:"other_cq_ct",label:"Other-channel Cq/Ct"},
      {key:"other_channels",label:"Other-channel evidence"},{key:"amplitude",label:"Amplitude",n:1},
      {key:"relative",label:"Vs reference",n:1},{key:"classification",label:"Classification"},
      {key:"severity",label:"Level"},{key:"finding",label:"Finding"}
    ],display.map(r=>({...r,severity:r.severity==="error"?tag("bad","error"):tag("warn","review")})))}</div>`;
  drawRisingCurveBundle($("#rising-chart"),rows);
}
