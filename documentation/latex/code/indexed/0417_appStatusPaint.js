function appStatusPaint(){
  const bar=document.getElementById("statusbar");if(!bar)return;
  try{
    const d=appStatusSnapshot(),busy=!!d.task||d.phase==="reading"||d.phase==="staging";
    renderConsoleIdentity(d);
    if(typeof MG!=="undefined"&&MG.open)mgStatusPaint();
    const parts=[];
    if(d.task){
      const pct=d.task.total?Math.min(100,Math.round(100*d.task.done/d.task.total)):0;
      const left=d.task.total&&d.task.done?(d.task.ms/d.task.done)*(d.task.total-d.task.done):0;
      parts.push(`<b>${esc(d.task.label)}</b>${d.task.total?` ${d.task.done} / ${d.task.total}`:""}`
        +`${d.task.detail?` · ${esc(d.task.detail.length>46?d.task.detail.slice(0,44)+"…":d.task.detail)}`:""} · ${appFmtMs(d.task.ms)}`
        +`${left>900?` · about ${appFmtMs(left)} left`:""}`);
      const pb=document.getElementById("sb-progress");pb.hidden=!d.task.total;pb.firstElementChild.style.width=pct+"%";
    }else{
      parts.push(`<b>${esc(APP_PHASE_TEXT[d.phase]||d.phase)}</b>`);
      document.getElementById("sb-progress").hidden=true;
    }
    const load=[];
    if(d.runs)load.push(`${d.runs} run(s), ${d.wells.toLocaleString()} stored result(s)`);
    if(d.staged)load.push(`${d.staged} file(s) staged, ${appFmtMB(d.stagedMB)} held`);
    if(d.historyRows)load.push(`${d.historyRows} history row(s)`);
    if(isFinite(d.heapMB))load.push(`memory ${appFmtMB(d.heapMB)}`);
    if(d.lastRender)load.push(`${esc(d.lastRender.tab)} drawn in ${appFmtMs(d.lastRender.ms)}`);
    document.getElementById("sb-state").innerHTML=parts.join(" ");
    document.getElementById("sb-load").innerHTML=load.length?`<span class="sb-sep">|</span> ${load.join(' <span class="sb-sep">·</span> ')}`:"";
    const note=APP_STATS.notices[APP_STATS.notices.length-1];
    document.getElementById("sb-faults").innerHTML=(d.faults?`<span class="sb-fault">${d.faults} fault(s) recorded</span>`:"no faults")
      +(note&&!busy?` <span class="sb-sep">·</span> ${esc(note.message)}`:"");
    document.getElementById("sb-cancel").hidden=!(d.task&&d.task.cancellable);
    bar.classList.toggle("busy",busy);bar.classList.toggle("fault",!!d.faults&&!busy);
    if(bar.classList.contains("open")){
      const rows=[["Lifecycle phase",esc(d.phase)],["Open view",esc(d.activeTab)],["Import generation",d.generation],
        ["Runs loaded",`${d.runs} (peak ${APP_STATS.runsPeak})`],["Stored results",d.wells.toLocaleString()],
        ["Files staged",`${d.staged}, ${appFmtMB(d.stagedMB)} held (peak ${appFmtMB(APP_STATS.stagedPeak)})`],
        ["History rows imported",d.historyRows],
        ["Memory in use",`${appFmtMB(d.heapMB)} (peak ${appFmtMB(d.heapPeakMB)})`],
        ["Slowest view render",APP_STATS.maxRenderMs?appFmtMs(APP_STATS.maxRenderMs):"—"],
        ["Last finished operation",d.lastTask?`${esc(d.lastTask.label)} — ${appFmtMs(d.lastTask.ms)}`:"—"],
        ["Limits in force",`${d.limits.maxFiles} files · ${(d.limits.maxBytes/1073741824).toFixed(0)} GiB staged · ${APP_LIMITS.maxWellsPerRun.toLocaleString()} wells per run · ${APP_LIMITS.maxFaults} recorded faults`]];
      const notes=APP_STATS.notices.slice(-3).reverse().map(e=>`<tr><td class="k">${esc(e.time.slice(11,19))}</td><td>${esc(e.area)}: ${esc(e.message)}</td></tr>`).join("");
      const faults=APP_STATE.errorLog.slice(-5).reverse().map(e=>`<tr><td class="k">${esc(e.time.slice(11,19))}</td><td class="sb-fault">${esc(e.area)}: ${esc(e.message)}</td></tr>`).join("");
      document.getElementById("sb-detail").innerHTML=`<table>${rows.map(r=>`<tr><td class="k">${r[0]}</td><td>${r[1]}</td></tr>`).join("")}
        ${notes?`<tr><td class="k">Recent notices</td><td><table>${notes}</table></td></tr>`:""}
        ${faults?`<tr><td class="k">Last faults</td><td><table>${faults}</table></td></tr>`:""}</table>`;
    }
  }catch(e){/* the status bar must never stop the page */}
}
