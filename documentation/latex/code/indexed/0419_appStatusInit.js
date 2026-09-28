function appStatusInit(){
  const bar=document.getElementById("statusbar");if(!bar)return;
  document.getElementById("sb-toggle").onclick=e=>{bar.classList.toggle("open");
    e.target.setAttribute("aria-expanded",bar.classList.contains("open")?"true":"false");appStatusPaint();};
  document.getElementById("sb-cancel").onclick=appCancel;
  document.getElementById("sb-save").onclick=()=>download("qpcr_status_report.json",appStatusReport(),"application/json");
  appTaskWrap(Object.keys(APP_TASK_LABEL));
  const cb=document.getElementById("sb-console");if(cb)cb.onclick=mgToggle;
  mgInit();
  setInterval(()=>{if(!document.hidden)appStatusPaint();},500);
  appStatusPaint();
}
