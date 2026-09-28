function renderReviewControls(){
  const box=$("#review-controls"),sel=$("#lj-series");if(!box)return;
  renderControlCategoryEditor();
  if(!RUNS.length){setSelectItems(sel,[],null);box.innerHTML=emptyReview();return;}
  const grouping=$("#lj-grouping").value,series=reviewControlSeries(grouping),old=sel.value;
  REVIEW_STATE.controlSeries=series;
  setSelectItems(sel,series.map(s=>({value:s.key,
    label:`${s.sample} · ${s.category} · ${s.target} (${s.n}/${s.runs} numeric runs)`})),old);
  const s=series.find(x=>x.key===sel.value);
  if(!s){box.innerHTML=emptyReview("No control wells could be identified from sample types or neutral control names.");return;}
  const pooled=s.exact.length>1?`Pooled names: ${s.exact.join(", ")}.`:"";
  const assess=s.judgeable?(s.flagged?tag("warn",`${s.flagged} Westgard flag(s)`):tag("ok","no Westgard flag"))
    :tag("warn","fewer than three numeric run points — limits not drawn");
  box.innerHTML=`<div class="kv">
      <b>Series</b><span>${esc(s.sample)} · ${esc(ui(s.category))} · ${esc(s.target)}</span>
      <b>Runs</b><span>${s.runs} (${s.n} with a numeric Cq)</span>
      <b>Mean / SD</b><span>${s.judgeable?`${num(s.mean,3)} / ${num(s.sd,3)}`:"not estimated as control limits"}</span>
      <b>Assessment</b><span>${assess}</span>
    </div>${pooled?`<p class="hint">${esc(pooled)}</p>`:""}
    <div class="chart-wrap"><canvas id="lj-chart" width="920" height="330"></canvas></div>
    <div class="scroll">${table([
      {key:"experiment",label:"Experiment"},{key:"date",label:"Date"},{key:"wells",label:"Wells"},
      {key:"n",label:"Replicates",n:1},{key:"cq",label:"Run mean Cq",n:1},{key:"flags",label:"Westgard"}
    ],s.points.map(p=>({...p,cq:Number.isFinite(p.cq)?num(p.cq,3):"not detected"})))}</div>`;
  drawLeveyJennings($("#lj-chart"),s);
}
