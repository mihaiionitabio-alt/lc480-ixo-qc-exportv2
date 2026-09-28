import sys, io
src_p,dst_p=sys.argv[1],sys.argv[2]
s=io.open(src_p,encoding="utf-8").read(); n0=len(s)
def rep(old,new,label):
    global s
    c=s.count(old)
    if c!=1: raise SystemExit("ANCHOR x%d: %s"%(c,label))
    s=s.replace(old,new,1)

# ---------------------------------------------------------------- 1. viewport overflow
# The later rule won: panning produced scrollbars instead of a clipped viewport.
rep('#mg.charting #mg-chart{overflow:hidden;touch-action:none}\n','',"remove early overflow")
rep('#mg.charting #mg-chart{display:flex;flex:1;align-items:center;justify-content:center;margin:0;padding:22px;max-height:none;border-radius:0;overflow:auto}',
    '#mg.charting #mg-chart{display:flex;flex:1;align-items:center;justify-content:center;margin:0;padding:22px;max-height:none;border-radius:0;overflow:hidden;touch-action:none}',
    "viewport overflow")

# ---------------------------------------------------------------- 2. curve linkage
# A result ROW is not a result. A row counts as analysed only when it carries a finite
# Cq/Ct or an explicit "undetermined / not detected" status written by the instrument.
# A row with neither, over a rising trace, is a missing-Cq finding, not a reason to be quiet.
rep('function orphanCurveCandidates(run){',
    '/* Is this stored row an ANSWER for its channel? A finite Cq is one. So is an explicit\n'
    '   "undetermined"/"not detected" status: the instrument looked and reported no crossing,\n'
    '   which under the profile is a negative, not an absence. A row with neither, sitting over\n'
    '   a rising trace, is the case the operator most needs to see. */\n'
    'const CQ_NEGATIVE_STATUS=/undeterm|not\\s*detect|no\\s*c[tq]\\b|negativ/i;\n'
    '/* Number(null) is 0, so a null Cq must be rejected BEFORE the numeric test:\n'
    '   the .eds decoder writes CpRaw:null for an undetermined result, and reading that\n'
    '   as "Cq 0" would report a crossing at cycle zero. A crossing at 0 is not a result. */\n'
    'function resultCq(w){\n'
    '  for(const v of [w&&w.CpRaw,w&&w.Cq,w&&w.Ct,w&&w.cq,w&&w.ct]){\n'
    '    if(v===null||v===undefined||v==="")continue;\n'
    '    const n=Number(v);if(Number.isFinite(n)&&n>0)return n;}\n'
    '  return null;\n'
    '}\n'
    'function resultAnswers(w){\n'
    '  if(resultCq(w)!==null)return "cq";\n'
    '  if(w&&w.undetermined===true)return "undetermined";\n'
    '  const st=`${(w&&w.CpState)||""} ${(w&&w.CrossingPointStatus)||""} ${(w&&w.call)||""}`;\n'
    '  if(CQ_NEGATIVE_STATUS.test(st))return "undetermined";\n'
    '  return "";\n'
    '}\n'
    'function orphanCurveCandidates(run){',"resultAnswers")

rep('''  const claimed=new Set(results.filter(w=>Number.isFinite(Number(w.channel))&&Number.isFinite(Number(w.pos)))
    .map(w=>`${Number(w.channel)}|${Number(w.pos)}`));''',
    '''  /* answered: this channel and position carry a real answer (a Cq, or a reported
     no-crossing). unanswered: a row exists but says nothing, which is itself a finding. */
  const answered=new Set(),unanswered=new Map();
  results.filter(w=>Number.isFinite(Number(w.channel))&&Number.isFinite(Number(w.pos))).forEach(w=>{
    const k=`${Number(w.channel)}|${Number(w.pos)}`,a=resultAnswers(w);
    if(a)answered.add(k);else if(!unanswered.has(k))unanswered.set(k,w);
  });
  const claimed=answered;''',"claimed set")

rep('''    const blank=orphanBlankRole(rec,chRec);
    const others=orphanOtherChannels(run,pos,channel);''',
    '''    const blank=orphanBlankRole(rec,chRec);
    const stale=unanswered.get(key);           /* a row with no Cq and no reported no-crossing */
    const others=orphanOtherChannels(run,pos,channel);''',"stale lookup")

rep('''    const cls=blank?"blank-with-signal":others.length?"channel-not-analysed":"position-not-analysed";''',
    '''    const cls=blank?"blank-with-signal":stale?"result-without-cq"
      :others.length?"channel-not-analysed":"position-not-analysed";''',"cls")

rep('''      finding:blank
        ? `${blank} position carries a rising curve in ${chName} — read as contamination until explained`
        : `${chName} has a rising curve that belongs to no analysis (${context})`});''',
    '''      resultRow:stale?(stale.target||stale.analysis||"stored row"):"",
      finding:blank
        ? `${blank} position carries a rising curve in ${chName} — read as contamination until explained`
        : stale
          ? `${chName} has a stored result row (${stale.target||stale.analysis||"no target named"}) with no Cq and no reported no-crossing, over a rising curve`
          : `${chName} has a rising curve that belongs to no analysis (${context})`});''',"finding text")

# the stale-row case is a result problem, not a membership problem
rep('''      push(o.severity==="error"?"error":"review",
        o.severity==="error"?"Contamination":"Analysis membership",''',
    '''      push(o.severity==="error"?"error":"review",
        o.severity==="error"?"Contamination":o.cls==="result-without-cq"?"Stored result":"Analysis membership",''',
    "orphan area")

rep('''    experiment:o.experiment,well:o.well,sample:o.sample,role:o.role,channel:o.channel,
    filter:o.filterComb||o.filterName||"",classification:o.cls,level:o.severity,
    other_channels:o.otherChannels,amplitude:o.amplitude,relative:o.relative,finding:o.finding''',
    '''    experiment:o.experiment,well:o.well,sample:o.sample,role:o.role,channel:o.channel,
    filter:o.filterComb||o.filterName||"",classification:o.cls,level:o.severity,
    stored_row:o.resultRow||"",other_channels:o.otherChannels,
    amplitude:o.amplitude,relative:o.relative,finding:o.finding''',"orphan row")

# ---------------------------------------------------------------- 3. the finding key
rep('''/* The key is the CONDITION, not the occurrence: experiment and well are what a
   finding is counted across, so putting them in the key would make every row
   unique and the count identical to the raw one. Well identifiers inside the
   finding text are folded out for the same reason. */
function findingKey(e){''',
    '''/* The key is the CONDITION, not the occurrence: experiment and well are what a
   finding is counted across, so putting them in the key would make every row
   unique and the count identical to the raw one. Well identifiers inside the
   finding text are folded out for the same reason.
   Severity stays IN the key on purpose. The same check can end as information in
   one run and as a review item in another - a change 3 h after a run and one 24 h
   after it are the same sentence with different numbers - and merging those would
   report every run at the worst outcome any run reached. Analytical identity is
   already carried by the text: a control failure names its control and its target,
   so two controls do not merge. What the text cannot hold is reported instead:
   every group counts how many distinct pieces of evidence it covers. */
function findingEvidenceKey(e){
  return String(e&&e.evidence||"").toLowerCase().replace(/\\s+/g," ").trim()
    .replace(/\\b[a-h](?:[0-9]|1[0-9]|2[0-4])\\b/gi,"<well>");
}
function findingKey(e){''',"key comment")

rep('''    if(!g){groups.set(key,{key,severity:sev,area:e.area||"Uncategorised",
      finding:e.finding||"Unspecified finding",evidence:e.evidence||"",occurrences:1,
      runs:new Set(e.experiment?[e.experiment]:[]),sources:[i]});return;}
    g.occurrences++;g.sources.push(i);
    if(e.experiment)g.runs.add(e.experiment);
    if(FINDING_SEVERITY_RANK[sev]>FINDING_SEVERITY_RANK[g.severity])g.severity=sev;
    if(!g.evidence&&e.evidence)g.evidence=e.evidence;
  });
  return [...groups.values()].map(g=>Object.assign(g,{runCount:g.runs.size,runs:[...g.runs]}))''',
    '''    if(!g){groups.set(key,{key,severity:sev,area:e.area||"Uncategorised",
      finding:e.finding||"Unspecified finding",evidence:e.evidence||"",occurrences:1,
      runs:new Set(e.experiment?[e.experiment]:[]),
      variants:new Set([findingEvidenceKey(e)]),sources:[i]});return;}
    g.occurrences++;g.sources.push(i);
    if(e.experiment)g.runs.add(e.experiment);
    g.variants.add(findingEvidenceKey(e));
    if(!g.evidence&&e.evidence)g.evidence=e.evidence;
  });
  return [...groups.values()].map(g=>Object.assign(g,{runCount:g.runs.size,runs:[...g.runs],
    variantCount:g.variants.size,variants:[...g.variants]}))''',"group build")

rep('''    affectedRuns:uniq(rows.flatMap(r=>r.runs||[])).length,
    raw:rows.reduce((n,r)=>n+r.occurrences,0)};''',
    '''    info:rows.filter(r=>r.severity==="info").length,
    affectedRuns:uniq(rows.flatMap(r=>r.runs||[])).length,
    variants:rows.reduce((n,r)=>n+(r.variantCount||1),0),
    raw:rows.reduce((n,r)=>n+r.occurrences,0)};''',"counts")

rep('''  const uniqueDisplay=display.map(r=>({severity:r.severity==="error"?tag("bad","error"):
      r.severity==="review"?tag("warn","review"):tag("ok","information"),
    area:r.area,finding:r.finding,occurrences:r.occurrences,runs:r.runCount,
    experiments:r.runs.slice(0,3).join(", ")+(r.runCount>3?` (+${r.runCount-3} more)`:"")}));''',
    '''  const uniqueDisplay=display.map(r=>({severity:r.severity==="error"?tag("bad","error"):
      r.severity==="review"?tag("warn","review"):tag("ok","information"),
    area:r.area,finding:r.finding,occurrences:r.occurrences,runs:r.runCount,
    variants:r.variantCount,
    experiments:r.runs.slice(0,3).join(", ")+(r.runCount>3?` (+${r.runCount-3} more)`:"")}));''',
    "unique display")
rep('''      {key:"severity",label:"Level",html:1},{key:"area",label:"Area"},{key:"finding",label:"Finding"},
      {key:"occurrences",label:"Events",n:1},{key:"runs",label:"Runs",n:1},{key:"experiments",label:"Experiments"}''',
    '''      {key:"severity",label:"Level",html:1},{key:"area",label:"Area"},{key:"finding",label:"Finding"},
      {key:"occurrences",label:"Events",n:1},{key:"runs",label:"Runs",n:1},
      {key:"variants",label:"Evidence variants",n:1},{key:"experiments",label:"Experiments"}''',
    "unique columns")
rep('''    <p class="hint">One row per condition, counted across runs. The raw log below keeps every event.</p>''',
    '''    <p class="hint">One row per condition and level, counted across runs. "Evidence variants" is how many
       different pieces of evidence that row covers, so an aggregated row never hides that its occurrences
       differ. The raw log below keeps every event, and so does every export.</p>''',"unique hint")

# ---------------------------------------------------------------- 4. per-run counts
rep('''function reviewRunRows(events){
  return RUNS.map(run=>{
    const ev=events.filter(e=>e.experiment===runName(run)),errors=ev.filter(e=>e.severity==="error").length,
      reviews=ev.filter(e=>e.severity==="review").length;''',
    '''function reviewRunRows(events){
  /* Deduplicated WITHIN the run, with the same key the overview uses, so the run table
     and the summary cannot report two different numbers for the same data. The raw
     count stays beside it, because the export is the raw log. */
  return RUNS.map(run=>{
    const ev=events.filter(e=>e.experiment===runName(run));
    const uniqOf=sev=>new Set(ev.filter(e=>e.severity===sev).map(findingKey)).size;
    const errors=uniqOf("error"),reviews=uniqOf("review"),
      rawErrors=ev.filter(e=>e.severity==="error").length,
      rawReviews=ev.filter(e=>e.severity==="review").length;''',"run rows dedup")
rep('''      plate:`${run.rows}x${run.cols}`,analyses:(run.analyses||[]).length,results:(run.wells||[]).length,
      curves:uniqueCurveCount(run),errors,reviews,''',
    '''      plate:`${run.rows}x${run.cols}`,analyses:(run.analyses||[]).length,results:(run.wells||[]).length,
      curves:uniqueCurveCount(run),errors,reviews,raw_errors:rawErrors,raw_reviews:rawReviews,''',"run rows fields")
rep('''      {key:"errors",label:"Errors",n:1},{key:"reviews",label:"Review",n:1},{key:"status",label:"Status",html:1}''',
    '''      {key:"errors",label:"Unique errors",n:1},{key:"reviews",label:"Unique review",n:1},
      {key:"raw_errors",label:"Raw errors",n:1},{key:"raw_reviews",label:"Raw review",n:1},
      {key:"status",label:"Status",html:1}''',"run columns")


# the same null-to-zero read existed in the cross-channel context helper
rep("""      const cq=[w.CpRaw,w.Cq,w.Ct,w.cq,w.ct].map(Number).find(n=>Number.isFinite(n)&&n>=0);""",
    """      const cq=resultCq(w);""","otherChannels cq")

io.open(dst_p,"w",encoding="utf-8").write(s)
print("ok",n0,"->",len(s))
