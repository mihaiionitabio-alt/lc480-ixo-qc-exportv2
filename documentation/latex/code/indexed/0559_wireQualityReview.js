function wireQualityReview(){
  $$("#review-tabs button").forEach(b=>b.onclick=()=>showReviewSheet(b.dataset.review));
  $("#plate-run").onchange=()=>{setSelectItems($("#plate-target"),analysisChoices(runAt("#plate-run",0)),"");renderReviewPlate();};
  $("#plate-target").onchange=renderReviewPlate;$("#plate-colour").onchange=renderReviewPlate;
  $("#dl-plate-csv").onclick=()=>{const run=runAt("#plate-run",0),rows=plateMapRows(run,$("#plate-target").value);
    if(rows.length)download(safeName(runName(run))+"_plate_map.csv",toCSV(Object.keys(rows[0]).map(k=>({key:k,label:k})),rows),"text/csv");};
  $("#dl-plate-png").onclick=()=>downloadCanvas(drawPlateMapImage(),safeName(runName(runAt("#plate-run",0)))+"_plate_map.png");
  ["#cmp-a","#cmp-b","#cmp-limit"].forEach(id=>$(id).onchange=renderReviewComparison);
  $("#dl-compare").onclick=()=>{const rows=REVIEW_STATE.comparison;if(rows.length)download(baseName()+"_sample_comparison.csv",
    toCSV(Object.keys(rows[0]).map(k=>({key:k,label:k})),rows),"text/csv");};
  $("#stat-rep-limit").onchange=renderReviewStatistics;
  $("#dl-statistics").onclick=()=>{const rows=REVIEW_STATE.statistics;if(rows.length)download(baseName()+"_statistics.csv",
    toCSV(Object.keys(rows[0]).map(k=>({key:k,label:k})),rows),"text/csv");};
  $("#lj-grouping").onchange=renderReviewControls;$("#lj-series").onchange=renderReviewControls;
  $("#reset-control-categories").onclick=()=>{REVIEW_STATE.controlCategoryOverrides={};renderReviewControls();};
  $("#dl-lj-csv").onclick=()=>{const s=REVIEW_STATE.controlSeries.find(x=>x.key===$("#lj-series").value);
    if(s)download(safeName(`${s.sample}_${s.target}`)+"_levey_jennings.csv",
      toCSV(Object.keys(s.points[0]||{}).map(k=>({key:k,label:k})),s.points),"text/csv");};
  $("#dl-lj-png").onclick=()=>{const s=REVIEW_STATE.controlSeries.find(x=>x.key===$("#lj-series").value);
    if(s)downloadCanvas($("#lj-chart"),safeName(`${s.sample}_${s.target}`)+"_levey_jennings.png");};
  $("#dl-runs").onclick=downloadForensicCSV;
  ["#fx-level","#fx-run"].forEach(id=>$(id).onchange=renderReviewRuns);
  $("#curve-run").onchange=()=>{setSelectItems($("#curve-target"),analysisChoices(runAt("#curve-run",0)),"");renderReviewCurves();};
  ["#curve-target","#curve-colour","#curve-log","#curve-signal","#curve-sample","#curve-thr"].forEach(id=>$(id).onchange=renderReviewCurves);
  $("#rising-run").onchange=renderReviewRising;$("#rising-level").onchange=renderReviewRising;
  $("#dl-rising-csv").onclick=()=>{const rows=risingCurveDisplayRows(risingCurveRows());if(rows.length)download(baseName()+"_rising_curves_review.csv",toCSV(Object.keys(rows[0]).map(k=>({key:k,label:k})),rows),"text/csv");};
  $("#dl-rising-png").onclick=()=>downloadCanvas($("#rising-chart"),baseName()+"_rising_curves.png");
  $("#dl-curves-csv").onclick=downloadCurveCSV;
  $("#dl-curves-png").onclick=()=>downloadCanvas($("#curve-chart"),safeName(runName(runAt("#curve-run",0)))+"_amplification_curves.png");
  $("#instrument-run").onchange=renderReviewInstrument;$("#dl-instrument").onclick=instrumentZip;
}
