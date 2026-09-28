function renderReviewStatistics(){
  const box=$("#review-statistics");if(!box)return;
  if(!RUNS.length){box.innerHTML=emptyReview();return;}
  const limit=Math.max(0,Number($("#stat-rep-limit").value)||0),rows=reviewStatisticsRows(),
    reps=replicateReviewRows(limit),orph=reviewOrphanWells(),missing=rows.reduce((n,r)=>n+r.missing_curves,0),
    uncertain=rows.reduce((n,r)=>n+r.uncertain,0);
  REVIEW_STATE.statistics=rows;
  const show=rows.map(r=>({...r,mean:num(r.mean,3),sd:num(r.sd,3),cv:num(r.cv,2),
    min:num(r.min,3),q1:num(r.q1,3),median:num(r.median,3),q3:num(r.q3,3),max:num(r.max,3),
    concentration_mean:Number.isFinite(r.concentration_mean)?Number(r.concentration_mean).toPrecision(5):"",
    concentration_sd:Number.isFinite(r.concentration_sd)?Number(r.concentration_sd).toPrecision(5):"",
    concentration_cv:num(r.concentration_cv,2)}));
  let h=`<div class="metric-grid">
    ${metricCard(rows.length,"analysis summaries","ok")}
    ${metricCard(missing,"result rows without a linked curve",missing?"warn":"ok")}
    ${metricCard(uncertain,"uncertain stored calls",uncertain?"warn":"ok")}
    ${metricCard(reps.length,`replicate groups with range ≥ ${limit} Cq`,reps.length?"warn":"ok")}
    ${metricCard(orph.length,"rising curves omitted from analyses",orph.length?"warn":"ok")}
  </div>`;
  h+=`<div class="scroll">${table([
    {key:"experiment",label:"Experiment"},{key:"target",label:"Target"},{key:"analysis",label:"Analysis"},
    {key:"results",label:"Results",n:1},{key:"amplified",label:"Amplified",n:1},
    {key:"mean",label:"Mean Cq",n:1},{key:"sd",label:"SD",n:1},{key:"cv",label:"CV %",n:1},
    {key:"min",label:"Min",n:1},{key:"q1",label:"Q1",n:1},{key:"median",label:"Median",n:1},
    {key:"q3",label:"Q3",n:1},{key:"max",label:"Max",n:1},
    {key:"uncertain",label:"Uncertain",n:1},{key:"missing_curves",label:"No curve",n:1},
    {key:"concentration_n",label:"Conc. n",n:1},{key:"concentration_mean",label:"Conc. mean",n:1},
    {key:"concentration_sd",label:"Conc. SD",n:1},{key:"concentration_cv",label:"Conc. CV %",n:1}
  ],show)}</div>`;
  if(reps.length)h+=`<h3>Replicate groups to review</h3>`+table([
    {key:"experiment",label:"Experiment"},{key:"target",label:"Target"},{key:"sample",label:"Sample"},
    {key:"wells",label:"Wells"},{key:"n",label:"n",n:1},{key:"mean",label:"Mean Cq",n:1},
    {key:"sd",label:"SD",n:1},{key:"range",label:"Range",n:1},{key:"finding",label:"Finding"}
  ],reps.map(r=>({...r,mean:num(r.mean,3),sd:num(r.sd,3),range:num(r.range,3)})));
  if(orph.length)h+=`<p class="hint">${orph.length} rising curve(s) need their own evidence view. Open the <b>Rising curves without result</b> sheet for the combined plot, plate locations, channel context and Cq/Ct evidence.</p>`;
  box.innerHTML=h;
}
