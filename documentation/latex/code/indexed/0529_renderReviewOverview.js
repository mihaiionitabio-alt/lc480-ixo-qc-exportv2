function renderReviewOverview(){
  const box=$("#review-overview");if(!box)return;
  if(!RUNS.length){box.innerHTML=emptyReview();return;}
  const stats=reviewStatisticsRows(),events=reviewEventsWithoutIntegrity(),orph=reviewOrphanWells(),
    display=reviewDisplayFindings(events),counts=reviewDisplayCounts(display),
    reviews=counts.reviews,errors=counts.errors,
    results=RUNS.reduce((n,r)=>n+(r.wells||[]).length,0),
    curves=RUNS.reduce((n,r)=>n+uniqueCurveCount(r),0),
    uncertain=stats.reduce((n,s)=>n+s.uncertain,0);
  box.innerHTML=`<div class="metric-grid">
    ${metricCard(RUNS.length,"experiments loaded","ok")}
    ${metricCard(results,"stored quantification rows","")}
    ${metricCard(curves,"linked amplification curves",curves<results?"warn":"ok")}
    ${metricCard(errors,"unique structural errors",errors?"bad":"ok")}
    ${metricCard(reviews,"unique review findings",reviews?"warn":"ok")}
    ${metricCard(counts.affectedRuns,"runs affected","")}
    ${metricCard(uncertain,"uncertain stored calls",uncertain?"warn":"ok")}
    ${metricCard(orph.length,"rising curves with no result in their own channel",orph.length?"warn":"ok")}
  </div>
  <p class="hint">${events.length} raw event(s) from the file, timeline, result and profile scans collapse to
     ${counts.unique} distinct finding(s) across ${counts.affectedRuns} run(s). The forensic log and every export
     keep all ${events.length} rows; only this summary is deduplicated.</p>
  <div class="notice ${errors?"bad":reviews?"warn":"ok"}"><b>${errors?"Structural errors found":
    reviews?"Review findings are available":"No structural finding in the loaded data"}.</b>
    These checks describe recoverability and internal consistency; they do not replace method-specific acceptance.</div>
  <div class="toolbar"><button class="ghost" id="open-rising-review">Open rising-curve review</button>
    <button class="ghost" id="dl-review-all">Download review tables (ZIP)</button></div>`;
  const openRising=$("#open-rising-review");if(openRising)openRising.onclick=()=>showReviewSheet("rising");
  $("#dl-review-all").onclick=downloadReviewBundle;
}
