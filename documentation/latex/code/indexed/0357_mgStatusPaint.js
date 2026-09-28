function mgStatusPaint(){
  if(!MG.open)return;
  const d=appStatusSnapshot();
  const state=(APP_PHASE_TEXT&&APP_PHASE_TEXT[d.phase])||d.phase||"Ready — no files read";
  const mem=isFinite(d.heapMB)?appFmtMB(d.heapMB):"—";
  const last=d.lastRender&&d.lastRender.ms!=null?`${d.lastRender.tab||"view"} drawn in ${appFmtMs(d.lastRender.ms)}`:"export drawn in —";
  const a=$("#mg-sb-state"),b=$("#mg-sb-load"),c=$("#mg-sb-render");
  if(a)a.textContent=state;if(b)b.textContent=`memory ${mem}`;if(c)c.textContent=last;
  const dot=$("#mg-statusbar .mg-sb-dot");if(dot)dot.style.background=d.faults?"#ff5252":d.phase==="ready"?"#37d67a":"#ffb020";
}
