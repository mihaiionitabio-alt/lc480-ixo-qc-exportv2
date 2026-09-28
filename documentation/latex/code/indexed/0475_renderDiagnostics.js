function renderDiagnostics(){
  const box=$("#diag-summary"),log=$("#diag-log");if(!box)return;
  const d=appStatusSnapshot();
  const rows=[
    {label:"Software version",value:d.version},{label:"Lifecycle phase",value:d.phase},
    {label:"Open view",value:d.activeTab},{label:"Import generation",value:d.generation},
    {label:"Runs loaded",value:d.runs},{label:"Files staged",value:d.staged},
    {label:"History rows",value:d.historyRows},{label:"Recorded faults",value:d.faults},
    {label:"Last fault",value:d.lastError?`${d.lastError.area}: ${d.lastError.message}`:"none"}
  ];
  box.innerHTML=table([{key:"label",label:"Item"},{key:"value",label:"Value"}],rows);
  const entries=[...APP_STATS.notices.slice(-5).map(e=>({kind:"notice",...e})),...APP_STATE.errorLog.slice(-5).map(e=>({kind:"fault",...e}))]
    .sort((a,b)=>String(a.time).localeCompare(String(b.time))).reverse();
  log.innerHTML=entries.length?table([{key:"kind",label:"Type"},{key:"time",label:"Time"},{key:"message",label:"Message"}],entries.map(e=>({kind:e.kind,time:e.time,message:`${e.area}: ${e.message}`}))):`<p class="hint">No notices or faults recorded.</p>`;
  $("#diag-refresh").onclick=renderDiagnostics;
  $("#diag-save").onclick=()=>download("qpcr_diagnostics.json",appStatusReport(),"application/json");
}
