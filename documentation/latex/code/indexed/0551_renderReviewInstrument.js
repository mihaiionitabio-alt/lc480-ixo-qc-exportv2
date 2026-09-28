function renderReviewInstrument(){
  const box=$("#review-instrument"),sel=$("#instrument-run");if(!box)return;
  if(!RUNS.length){setSelectItems(sel,[],null);box.innerHTML=emptyReview();return;}
  setSelectItems(sel,RUNS.map((r,i)=>({value:i,label:runName(r)})),sel.value);
  const t=instrumentRecordTables(runAt("#instrument-run",0));
  const block=(title,cols,rows)=>`<div class="record-block"><h3>${esc(title)} <span class="tag">${rows.length} row(s)</span></h3>
    ${rows.length?`<div class="scroll">${table(cols,rows)}</div>`:`<div class="notice">No record of this type.</div>`}</div>`;
  box.innerHTML=
    block("Run metadata",[{key:"field",label:"Field"},{key:"value",label:"Stored value"}],t.metadata)+
    block("Thermal program",Object.keys(t.program[0]||{}).map(k=>({key:k,label:k})),t.program)+
    block("Detection channels",Object.keys(t.channels[0]||{}).map(k=>({key:k,label:k})),t.channels)+
    block("Subsets",Object.keys(t.subsets[0]||{}).map(k=>({key:k,label:k})),t.subsets)+
    block("Analysis objects",Object.keys(t.analyses[0]||{}).map(k=>({key:k,label:k})),t.analyses)+
    block("Instrument replicate statistics",Object.keys(t.statistics[0]||{}).map(k=>({key:k,label:k})),t.statistics);
  const run=runAt("#instrument-run",0),auto=rows=>Object.keys(rows[0]||{}).map(k=>({key:k,label:k}));
  if(run&&run.eds){
    box.insertAdjacentHTML("beforeend",
      (t.std_curves.length?block("Standard curves",auto(t.std_curves),t.std_curves):"")+
      block("Provenance recorded in the file",auto(t.provenance),t.provenance)+
      block("Calibrations",auto(t.calibrations),t.calibrations)+
      block("Target settings",auto(t.target_settings),t.target_settings)+
      block("Analysis settings",auto(t.analysis_settings),t.analysis_settings)+
      block("Flag rules",auto(t.flag_rules),t.flag_rules)+
      block("Software modules",auto(t.software_modules),t.software_modules)+
      block("Per-well baselines",auto(t.well_baselines),t.well_baselines)+
      block("Export configuration saved in the file",auto(t.export_settings),t.export_settings)+
      (t.temperature_trace.length?`<div class="record-block"><h3>${esc(ui("Block and cover temperature during the run"))}</h3>
        <div class="legend"><span><i style="background:#1f6feb"></i>${esc(ui("sample zones (mean)"))}</span><span><i style="background:#d97706"></i>${esc(ui("heated cover"))}</span><span><i style="background:#6f42c1"></i>${esc(ui("zone spread (max − min)"))}</span></div>
        <div class="chart-wrap"><canvas id="temp-chart" width="1000" height="300"></canvas></div>
        <button class="ghost" id="dl-temp-png" type="button">Save chart as PNG</button></div>`:"")+
      block("Instrument log summary",auto(t.log_summary),t.log_summary)+
      block("Run events",auto(t.log_events),t.log_events)+
      block("Errors and warnings in the instrument log",auto(t.log_errors),t.log_errors)+
      block("Archive entries",auto(t.archive_entries),t.archive_entries));
    drawTemperatureTrace($("#temp-chart"),run);
    const b=$("#dl-temp-png");if(b)b.onclick=()=>downloadCanvas($("#temp-chart"),safeName(runName(run))+"_temperature_trace.png");
  }
}
