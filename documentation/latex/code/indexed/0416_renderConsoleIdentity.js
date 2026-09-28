function renderConsoleIdentity(snapshot){
  const d=snapshot||appStatusSnapshot(),mode=APP_PHASE_TEXT[d.phase]||d.phase;
  const glyph=d.faults?"▲":d.phase==="ready"?"●":d.phase==="reading"||d.phase==="staging"?"△":"○";
  const instruments=[...new Set(RUNS.map(r=>r.instrument||r.platform).filter(Boolean))];
  const summary=d.runs?`${d.runs.toLocaleString()} run(s) · ${d.wells.toLocaleString()} result(s) · ${instruments.length||1} instrument group(s)`:"Load experiment files to begin.";
  const p=typeof SOP!=="undefined"&&SOP?`SOP: ${SOP.name||"unnamed"} v${SOP.version||"?"}${SOP.sha256?` · ${SOP.sha256.slice(0,8)}…`:" · active"}`:"SOP: no profile applied";
  const modeEl=$("#console-mode-text"),glyphEl=$("#console-mode-glyph"),sumEl=$("#console-data-summary"),profileEl=$("#console-profile");
  if(modeEl)modeEl.textContent=d.faults?`${mode} — with faults`:mode;
  if(glyphEl){glyphEl.textContent=glyph;glyphEl.className=`state-glyph ${d.faults?"state-alarm":d.phase==="ready"?"state-ok":d.phase==="reading"||d.phase==="staging"?"state-watch":"state-unknown"}`;}
  if(sumEl)sumEl.textContent=summary;
  if(profileEl)profileEl.textContent=p;
}
