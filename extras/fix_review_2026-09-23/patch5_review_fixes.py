import sys, io
src_p, dst_p = sys.argv[1], sys.argv[2]
s = io.open(src_p, encoding="utf-8").read(); n0=len(s)
def rep(old,new,label):
    global s
    c=s.count(old)
    if c!=1: raise SystemExit("ANCHOR x%d: %s"%(c,label))
    s=s.replace(old,new,1)

# =========================================================================
# 1. Command arguments. mgCommand passed the raw text while several handlers
#    read it as a regex match, so "zoom in" reached mgZoom("o") and fell to the
#    reset branch: every zoom, pan, page-leave and view command was inert.
# =========================================================================
rep('  const hit=MG_COMMANDS.find(c=>c.re.test(t));\n'
    '  if(!hit)return false;\n'
    '  try{hit.act(t);}catch(e){appError("console:button",e);}',
    '  const hit=MG_COMMANDS.find(c=>c.re.test(t));\n'
    '  if(!hit)return false;\n'
    '  /* Handlers read capture groups, so they are given the match, not the text.\n'
    '     Passing the text made m[1] the second CHARACTER of the command. */\n'
    '  const m=hit.re.exec(t)||[t];\n'
    '  try{hit.act(m,t);}catch(e){appError("console:button",e);}',
    "mgCommand arg")
rep('{re:/^type (i|ewma|cusum|trend|xbars|p|u|c|funnel)$/, id:"chart type", act:t=>mgSetChartType(t.slice(5))},',
    '{re:/^type (i|ewma|cusum|trend|xbars|p|u|c|funnel)$/, id:"chart type", act:m=>mgSetChartType(m[1])},',"type cmd")
rep('{re:/^x (order|date|hours|cycles)$/, id:"x axis", act:t=>mgSetChartAxis(t.slice(2))},',
    '{re:/^x (order|date|hours|cycles)$/, id:"x axis", act:m=>mgSetChartAxis(m[1])},',"x cmd")
rep('const i=Number(t.slice(7)),it=(MG.exports||[])[i];',
    'const i=Number(m[1]),it=(MG.exports||[])[i];',"export cmd body")
rep("{re:/^export (\\d+)$/, id:\"download a file\", act:t=>{",
    "{re:/^export (\\d+)$/, id:\"download a file\", act:m=>{","export cmd head")

# =========================================================================
# 2. A persistent stage inside the chart viewport. The SVG keeps its drawing
#    size; only the stage is transformed, so zoom magnifies the drawing instead
#    of an object-fit box, and panning is clipped instead of adding scrollbars.
# =========================================================================
rep('function mgApplyChartView(){\n'
    '  const svg=document.querySelector("#mg-chart svg");if(!svg)return;\n'
    '  svg.style.transform=`translate(${MG.panX}px,${MG.panY}px) scale(${MG.zoom})`;\n'
    '  svg.style.transformOrigin="center center";\n'
    '}',
    '/* One viewport (#mg-chart), one transformed stage (#mg-chart-stage).\n'
    '   Every chart write goes through mgStageSet so a redraw cannot orphan the\n'
    '   transform, and the zoom survives a change of chart, graph, type or run. */\n'
    'function mgStage(){\n'
    '  const ch=document.getElementById("mg-chart");if(!ch)return null;\n'
    '  let st=document.getElementById("mg-chart-stage");\n'
    '  if(!st||st.parentNode!==ch){st=document.createElement("div");st.id="mg-chart-stage";ch.innerHTML="";ch.appendChild(st);}\n'
    '  return st;\n'
    '}\n'
    'function mgStageSet(html){const st=mgStage();if(st)st.innerHTML=html||"";mgApplyChartView();}\n'
    'function mgApplyChartView(){\n'
    '  const st=document.getElementById("mg-chart-stage");if(!st)return;\n'
    '  if(!Number.isFinite(MG.zoom)||MG.zoom<=0)MG.zoom=1;\n'
    '  if(!Number.isFinite(MG.panX))MG.panX=0;\n'
    '  if(!Number.isFinite(MG.panY))MG.panY=0;\n'
    '  st.style.transform=`translate(${MG.panX}px,${MG.panY}px) scale(${MG.zoom})`;\n'
    '  st.style.transformOrigin="center center";\n'
    '}',
    "stage")
rep('function mgZoom(kind){\n'
    '  if(kind==="in")MG.zoom=Math.min(5,+(MG.zoom*1.25).toFixed(3));\n'
    '  else if(kind==="out")MG.zoom=Math.max(.5,+(MG.zoom/1.25).toFixed(3));\n'
    '  else {MG.zoom=1;MG.panX=0;MG.panY=0;}\n'
    '  mgApplyChartView();\n'
    '}',
    'function mgZoom(kind){\n'
    '  const z=Number.isFinite(MG.zoom)&&MG.zoom>0?MG.zoom:1;\n'
    '  if(kind==="in")MG.zoom=Math.min(5,+(z*1.25).toFixed(3));\n'
    '  else if(kind==="out")MG.zoom=Math.max(.5,+(z/1.25).toFixed(3));\n'
    '  else {MG.zoom=1;MG.panX=0;MG.panY=0;}\n'
    '  mgApplyChartView();\n'
    '}',"mgZoom guard")
# route the three chart writes through the stage
rep('    try{const rows=ccRowsFor(it.instrument),def=CC_BY_ID[it.chartId],res=ccCompute(def,rows,it.variant||"");\n'
    '      ch.innerHTML=ccChartSvg(res,`${def.code} ${def.title}${it.variant?" · "+it.variant:""}`);}\n'
    '    catch(e){ch.innerHTML="";appError("console:chart",e);}',
    '    try{const rows=ccRowsFor(it.instrument),def=CC_BY_ID[it.chartId],res=ccCompute(def,rows,it.variant||"");\n'
    '      mgStageSet(ccChartSvg(res,`${def.code} ${def.title}${it.variant?" · "+it.variant:""}`));}\n'
    '    catch(e){mgStageSet("");appError("console:chart",e);}',"chart write")
rep('      ch.innerHTML=`<div id="mg-gcap">${esc(it.title)} · ${esc(it.limits)}</div>`+((res&&res.svg)||"");}\n'
    '    catch(e){ch.innerHTML=`<p style="font-size:20px;padding:18px">This graph could not be drawn from the loaded run: ${esc(e.message)}</p>`;appError("console:graph",e);}',
    '      mgStageSet(`<div id="mg-gcap">${esc(it.title)} · ${esc(it.limits)}</div>`+((res&&res.svg)||""));}\n'
    '    catch(e){mgStageSet(`<p style="font-size:20px;padding:18px">This graph could not be drawn from the loaded run: ${esc(e.message)}</p>`);appError("console:graph",e);}',
    "graph write")

# CSS: viewport clips, stage is the transformed box, svg keeps its drawing size
rep('#mg.charting #mg-chart svg{flex:1 1 auto;min-height:0;width:100%;align-self:stretch;object-fit:contain}\n',
    '#mg.charting #mg-chart{overflow:hidden;touch-action:none}\n'
    '#mg-chart-stage{width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;will-change:transform;transition:transform .12s ease}\n'
    '#mg.charting #mg-chart-stage{flex:1 1 auto;min-height:0}\n'
    '#mg.charting #mg-chart-stage svg{flex:1 1 auto;min-height:0;width:100%;align-self:stretch;object-fit:contain}\n',
    "stage css")

# the action row: the key is the key, not the word "select"
rep('    `<button class="mg-act ${a.cls||""}" data-cmd="${esc(a.cmd)}">\n'
    '       <span class="k">${esc(a.key)}  ·  select</span><span class="l">${esc(a.label)}</span></button>`).join("");',
    '    `<button class="mg-act ${a.cls||""}" data-cmd="${esc(a.cmd)}" title="${esc(/^[0-9]$/.test(String(a.key))?"press "+a.key:a.label)}">\n'
    '       <span class="k">${esc(a.key)}${/^[0-9]$/.test(String(a.key))?"  ·  key":""}</span>'
    '<span class="l">${esc(a.label)}</span></button>`).join("");',"action label")
# reset button shows the current magnification
rep('{key:"−",label:"Zoom out",cmd:"zoom out"},{key:"100%",label:"Reset view",cmd:"zoom reset"},{key:"+",label:"Zoom in",cmd:"zoom in"},',
    '{key:"−",label:"Zoom out",cmd:"zoom out"},\n'
    '        {key:"⟲",label:`Reset view · ${Math.round((Number.isFinite(MG.zoom)?MG.zoom:1)*100)}%`,cmd:"zoom reset"},\n'
    '        {key:"+",label:"Zoom in",cmd:"zoom in"},',"zoom labels")

# =========================================================================
# 3. File integrity: one vertical record per mismatch. Field names and the CSV
#    are unchanged; only the layout is replaced, because .kv is a two-column
#    page grid and a 64-character hash wraps across its neighbour.
# =========================================================================
rep('  list.innerHTML=rows.length?rows.map((r,i)=>`<div class="record-block" style="padding:10px 0;border-bottom:1px solid var(--line)"><b>${i+1}. ${esc(r.file)}</b><div class="kv"><b>Check</b><span>${esc(r.type)}</span><b>Expected</b><span>${esc(r.expected)}</span><b>Observed</b><span>${esc(r.actual)}</span><b>Meaning</b><span>${esc(r.detail)}</span></div></div>`).join("")',
    '  list.innerHTML=rows.length?`<ol class="integrity-records">${rows.map((r,i)=>\n'
    '    `<li class="integrity-record"><div class="integrity-record-head">\n'
    '       <span class="integrity-index">${i+1}</span>\n'
    '       <b class="integrity-file" title="${esc(r.file)}">${esc(r.file)}</b>\n'
    '       <span class="integrity-badge">file integrity</span></div>\n'
    '     <dl class="integrity-fields">\n'
    '       <div><dt>Check</dt><dd>${esc(r.type)}</dd></div>\n'
    '       <div><dt>Expected</dt><dd class="integrity-value">${esc(r.expected)}</dd></div>\n'
    '       <div><dt>Observed</dt><dd class="integrity-value">${esc(r.actual)}</dd></div>\n'
    '       <div><dt>Meaning</dt><dd>${esc(r.detail)}</dd></div>\n'
    '     </dl></li>`).join("")}</ol>`',
    "integrity list")

# =========================================================================
# 4. Raw events vs unique findings. The key deliberately EXCLUDES experiment and
#    well: those are the dimensions being aggregated. Raw rows stay the export.
# =========================================================================
rep('function reviewEventsWithoutIntegrity(){',
    'const FINDING_SEVERITY_RANK={info:0,review:1,error:2};\n'
    'function findingTextKey(s){return String(s||"").toLowerCase().replace(/\\s+/g," ").trim();}\n'
    '/* The key is the CONDITION, not the occurrence: experiment and well are what a\n'
    '   finding is counted across, so putting them in the key would make every row\n'
    '   unique and the count identical to the raw one. Well identifiers inside the\n'
    '   finding text are folded out for the same reason. */\n'
    'function findingKey(e){\n'
    '  const text=findingTextKey(e.finding).replace(/\\b[a-h](?:[0-9]|1[0-9]|2[0-4])\\b/gi,"<well>")\n'
    '    .replace(/\\b\\d+(?:\\.\\d+)?\\b/g,"<n>");\n'
    '  return [findingTextKey(e.area),findingTextKey(e.severity),text].join("|");\n'
    '}\n'
    'function reviewDisplayFindings(raw){\n'
    '  const groups=new Map();\n'
    '  (raw||reviewEventsWithoutIntegrity()||[]).forEach((e,i)=>{\n'
    '    const sev=FINDING_SEVERITY_RANK[e&&e.severity]!=null?e.severity:"review";\n'
    '    const key=findingKey(Object.assign({},e,{severity:sev})),g=groups.get(key);\n'
    '    if(!g){groups.set(key,{key,severity:sev,area:e.area||"Uncategorised",\n'
    '      finding:e.finding||"Unspecified finding",evidence:e.evidence||"",occurrences:1,\n'
    '      runs:new Set(e.experiment?[e.experiment]:[]),sources:[i]});return;}\n'
    '    g.occurrences++;g.sources.push(i);\n'
    '    if(e.experiment)g.runs.add(e.experiment);\n'
    '    if(FINDING_SEVERITY_RANK[sev]>FINDING_SEVERITY_RANK[g.severity])g.severity=sev;\n'
    '    if(!g.evidence&&e.evidence)g.evidence=e.evidence;\n'
    '  });\n'
    '  return [...groups.values()].map(g=>Object.assign(g,{runCount:g.runs.size,runs:[...g.runs]}))\n'
    '    .sort((a,b)=>FINDING_SEVERITY_RANK[b.severity]-FINDING_SEVERITY_RANK[a.severity]\n'
    '      ||b.occurrences-a.occurrences||a.area.localeCompare(b.area));\n'
    '}\n'
    'function reviewDisplayCounts(rows){\n'
    '  return {unique:rows.length,\n'
    '    errors:rows.filter(r=>r.severity==="error").length,\n'
    '    reviews:rows.filter(r=>r.severity==="review").length,\n'
    '    affectedRuns:uniq(rows.flatMap(r=>r.runs||[])).length,\n'
    '    raw:rows.reduce((n,r)=>n+r.occurrences,0)};\n'
    '}\n'
    'function reviewEventsWithoutIntegrity(){',"finding dedup")

rep('  const stats=reviewStatisticsRows(),events=reviewEventsWithoutIntegrity(),orph=reviewOrphanWells(),\n'
    '    reviews=events.filter(e=>e.severity==="review").length,errors=events.filter(e=>e.severity==="error").length,',
    '  const stats=reviewStatisticsRows(),events=reviewEventsWithoutIntegrity(),orph=reviewOrphanWells(),\n'
    '    display=reviewDisplayFindings(events),counts=reviewDisplayCounts(display),\n'
    '    reviews=counts.reviews,errors=counts.errors,',"overview counts")
rep('    ${metricCard(errors,"structural errors",errors?"bad":"ok")}\n'
    '    ${metricCard(reviews,"review findings",reviews?"warn":"ok")}\n'
    '    ${metricCard(uncertain,"uncertain stored calls",uncertain?"warn":"ok")}\n'
    '    ${metricCard(orph.length,"rising curves omitted from analyses",orph.length?"warn":"ok")}\n'
    '  </div>',
    '    ${metricCard(errors,"unique structural errors",errors?"bad":"ok")}\n'
    '    ${metricCard(reviews,"unique review findings",reviews?"warn":"ok")}\n'
    '    ${metricCard(counts.affectedRuns,"runs affected","")}\n'
    '    ${metricCard(uncertain,"uncertain stored calls",uncertain?"warn":"ok")}\n'
    '    ${metricCard(orph.length,"rising curves with no result in their own channel",orph.length?"warn":"ok")}\n'
    '  </div>\n'
    '  <p class="hint">${events.length} raw event(s) from the file, timeline, result and profile scans collapse to\n'
    '     ${counts.unique} distinct finding(s) across ${counts.affectedRuns} run(s). The forensic log and every export\n'
    '     keep all ${events.length} rows; only this summary is deduplicated.</p>',"overview cards")

# the forensic log gets a unique-finding table above the raw log
rep('  box.innerHTML=`<div class="scroll">${table([\n'
    '      {key:"experiment",label:"Experiment"},{key:"date",label:"Date"},{key:"operator",label:"Operator"},',
    '  const display=reviewDisplayFindings(events),counts=reviewDisplayCounts(display);\n'
    '  const uniqueDisplay=display.map(r=>({severity:r.severity==="error"?tag("bad","error"):\n'
    '      r.severity==="review"?tag("warn","review"):tag("ok","information"),\n'
    '    area:r.area,finding:r.finding,occurrences:r.occurrences,runs:r.runCount,\n'
    '    experiments:r.runs.slice(0,3).join(", ")+(r.runCount>3?` (+${r.runCount-3} more)`:"")}));\n'
    '  box.innerHTML=`<div class="scroll">${table([\n'
    '      {key:"experiment",label:"Experiment"},{key:"date",label:"Date"},{key:"operator",label:"Operator"},',
    "runs display")
rep('    ],runDisplay)}</div><h3>Forensic log</h3><div class="scroll">${table([',
    '    ],runDisplay)}</div>\n'
    '    <h3>Distinct findings</h3>\n'
    '    <p class="hint">One row per condition, counted across runs. The raw log below keeps every event.</p>\n'
    '    <div class="scroll">${table([\n'
    '      {key:"severity",label:"Level",html:1},{key:"area",label:"Area"},{key:"finding",label:"Finding"},\n'
    '      {key:"occurrences",label:"Events",n:1},{key:"runs",label:"Runs",n:1},{key:"experiments",label:"Experiments"}\n'
    '    ],uniqueDisplay)}</div>\n'
    '    <h3>Forensic log (raw events)</h3><div class="scroll">${table([',"forensic heading")

# =========================================================================
# 5. Rising curves. Linkage stays position+channel: a Cq in another channel of
#    the same well says nothing about this channel's trace, so it must not
#    suppress it. What changes is the classification and the wording, and a
#    rising trace in a no-template or blank position is raised to error,
#    because under the screening profile that reads as contamination.
# =========================================================================
# --- helper: what else the position holds, and whether it is a declared blank
rep('function orphanCurveCandidates(run){',
    '/* A no-template control, extraction blank or matrix negative is DECLARED to be\n'
    '   without template. A rising trace there is not noise to be filtered away: under\n'
    '   the screening profile it reads as contamination and is the most serious finding\n'
    '   this scan can produce, so it is raised rather than suppressed. Names follow the\n'
    '   laboratory profile\'s own control vocabulary (NAME_ROLE_RULES) plus the\n'
    '   instrument sample types. */\n'
    'const BLANK_ROLES=["NTC","Blank","Negative control"];\n'
    'function orphanBlankRole(rec,chRec){\n'
    '  const byName=roleFromName((rec&&rec.name)||"");\n'
    '  const byType=TYPE_TO_ROLE[chRec&&chRec.sampleType]||"";\n'
    '  if(BLANK_ROLES.includes(byName))return byName;\n'
    '  if(BLANK_ROLES.includes(byType))return byType;\n'
    '  return "";\n'
    '}\n'
    '/* Results at the same POSITION but in another channel. They are reported as\n'
    '   context; they never suppress this channel, because a Cq for one target says\n'
    '   nothing about the trace of another. */\n'
    'function orphanOtherChannels(run,pos,channel){\n'
    '  const active=(((run.protocol||{}).channels)||[]);\n'
    '  const out=[];\n'
    '  [...(run.wells||[]),...(run.tmWells||[]),...(run.genoResults||[]),...(run.otherResults||[])]\n'
    '    .forEach(w=>{\n'
    '      if(Number(w.pos)!==pos||Number(w.channel)===channel)return;\n'
    '      const cq=[w.CpRaw,w.Cq,w.Ct,w.cq,w.ct].map(Number).find(n=>Number.isFinite(n)&&n>=0);\n'
    '      out.push({channel:Number(w.channel),name:(active[Number(w.channel)]||{}).name||`channel ${w.channel}`,\n'
    '        target:w.target||w.analysis||"",cq:Number.isFinite(cq)?+cq.toFixed(2):null});\n'
    '    });\n'
    '  const seen=new Set();\n'
    '  return out.filter(o=>{const k=o.channel+"|"+o.target;if(seen.has(k))return false;seen.add(k);return true;});\n'
    '}\n'
    'function orphanCurveCandidates(run){',"orphan helpers")

rep('''    out.push({experiment:runName(run),well:posToWell(pos,run.cols),pos,
      row:Math.floor(pos/run.cols),col:pos%run.cols,sample:rec.name||"",
      target:"Omitted from analyses",analysis:"Flagged curve omitted from analyses",
      analysisUid:ORPHAN_CURVE_KEY,channel,filterName:chDef.name||"",
      filterComb:Number.isFinite(chDef.ex)?`${chDef.ex}-${chDef.em??""}`:"",
      instrType:chRec.sampleType||"",instrRole,role:role||"Unknown",call:"Not analysed",
      curve:e.curve,amplitude:e.amplitude,relative:e.amplitude/ref,
      finding:run.eds?"Well without a sample name carries a rising curve"
        :rec.name?"Named position with a rising curve is in no analysis":"Rising curve is in no analysis"});''',
    '''    /* Classify rather than merely flag. Every class below is a rising trace with
       no result IN ITS OWN CHANNEL; what differs is what the position declares. */
    const blank=orphanBlankRole(rec,chRec);
    const others=orphanOtherChannels(run,pos,channel);
    const withCq=others.filter(o=>o.cq!==null);
    const chName=chDef.name||`channel ${channel}`;
    const cls=blank?"blank-with-signal":others.length?"channel-not-analysed":"position-not-analysed";
    const context=withCq.length
      ? `the same position has ${withCq.map(o=>`${o.name}${o.target?" "+o.target:""} Cq ${o.cq}`).join(", ")}, in other channel(s)`
      : others.length?"the same position has results in other channels, none with a Cq"
        :"no stored result of any kind at this position";
    out.push({experiment:runName(run),well:posToWell(pos,run.cols),pos,
      row:Math.floor(pos/run.cols),col:pos%run.cols,sample:rec.name||"",
      target:"No result in this channel",analysis:"Rising curve with no result in its channel",
      analysisUid:ORPHAN_CURVE_KEY,channel,filterName:chDef.name||"",
      filterComb:Number.isFinite(chDef.ex)?`${chDef.ex}-${chDef.em??""}`:"",
      instrType:chRec.sampleType||"",instrRole,role:role||"Unknown",call:"Not analysed",
      curve:e.curve,amplitude:e.amplitude,relative:e.amplitude/ref,
      cls,severity:blank?"error":"review",blankRole:blank,
      otherChannels:others.map(o=>`${o.name}${o.target?" "+o.target:""}${o.cq!==null?" Cq "+o.cq:""}`).join("; "),
      context,
      finding:blank
        ? `${blank} position carries a rising curve in ${chName} — read as contamination until explained`
        : `${chName} has a rising curve that belongs to no analysis (${context})`});''',
    "orphan classification")

rep('''function reviewOrphanWells(){
  return RUNS.flatMap(run=>orphanCurveCandidates(run).map(o=>({
    experiment:o.experiment,well:o.well,sample:o.sample,channel:o.channel,
    filter:o.filterComb||o.filterName||"",amplitude:o.amplitude,relative:o.relative,finding:o.finding
  })));
}''',
    '''function reviewOrphanWells(){
  return RUNS.flatMap(run=>orphanCurveCandidates(run).map(o=>({
    experiment:o.experiment,well:o.well,sample:o.sample,role:o.role,channel:o.channel,
    filter:o.filterComb||o.filterName||"",classification:o.cls,level:o.severity,
    other_channels:o.otherChannels,amplitude:o.amplitude,relative:o.relative,finding:o.finding
  })));
}''',"reviewOrphanWells")

rep('''    orphanCurveCandidates(run).forEach(o=>
      push("review","Analysis membership",`${o.well}: ${o.finding}`,
        [o.sample,o.filterComb||o.filterName||`channel ${o.channel}`].filter(Boolean).join("; ")));''',
    '''    orphanCurveCandidates(run).forEach(o=>
      push(o.severity==="error"?"error":"review",
        o.severity==="error"?"Contamination":"Analysis membership",
        `${o.well}: ${o.finding}`,
        [o.sample,o.filterComb||o.filterName||`channel ${o.channel}`,o.otherChannels]
          .filter(Boolean).join("; ")));''',"orphan events")

rep('out.push({value:ORPHAN_CURVE_KEY,label:"Flagged curves omitted from analyses"});',
    'out.push({value:ORPHAN_CURVE_KEY,label:"Rising curves with no result in their channel"});',"orphan choice label")


# --- integrity record CSS (vertical, one record per row, hashes wrap inside)
rep('.record-block{margin:0 0 18px}',
    '.integrity-records{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px}\n'
    '.integrity-record{border:1px solid var(--line);border-radius:10px;padding:14px 16px;background:var(--card,#fff);min-width:0}\n'
    '.integrity-record-head{display:flex;align-items:flex-start;gap:10px;min-width:0}\n'
    '.integrity-index{flex:0 0 2rem;color:var(--muted);font-variant-numeric:tabular-nums;font-weight:650}\n'
    '.integrity-file{min-width:0;flex:1 1 auto;overflow-wrap:anywhere;word-break:break-word}\n'
    '.integrity-badge{flex:none;border:1px solid var(--line);border-radius:999px;padding:2px 9px;color:var(--muted);font-size:12px;white-space:nowrap}\n'
    '.integrity-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 22px;margin:12px 0 0 2rem}\n'
    '.integrity-fields>div{min-width:0}\n'
    '.integrity-fields dt{color:var(--muted);font-size:12px;font-weight:650;margin-bottom:2px;letter-spacing:.03em}\n'
    '.integrity-fields dd{margin:0;overflow-wrap:anywhere;word-break:break-word;font-size:13.5px}\n'
    '.integrity-value{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;line-height:1.45}\n'
    '@media (max-width:760px){.integrity-record-head{display:grid;grid-template-columns:2rem minmax(0,1fr)}\n'
    '  .integrity-badge{grid-column:2;justify-self:start}\n'
    '  .integrity-fields{grid-template-columns:1fr;margin-left:2rem}}\n'
    '.record-block{margin:0 0 18px}',"integrity css")

io.open(dst_p,"w",encoding="utf-8").write(s)
print("ok",n0,"->",len(s))
