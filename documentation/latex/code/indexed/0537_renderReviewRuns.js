function renderReviewRuns(){
  const box=$("#review-runs");if(!box)return;
  if(!RUNS.length){box.innerHTML=emptyReview();return;}
  const events=reviewEventsWithoutIntegrity(),runs=reviewRunRows(events);REVIEW_STATE.forensic=events;
  const runDisplay=runs.map(r=>({...r,status:r.status==="Error"?tag("bad",r.status):
    r.status==="Review"?tag("warn",r.status):tag("ok",r.status)}));
  setSelectItems($("#fx-run"),[{value:"",label:"All runs"},...uniq(events.map(e=>e.experiment)).map(x=>({value:x,label:x}))]);
  const lvl=$("#fx-level").value,fr=$("#fx-run").value;
  const shown=events.filter(e=>(lvl==="all"||(lvl==="error"?e.severity==="error":e.severity!=="info"))&&(!fr||e.experiment===fr));
  const eventDisplay=shown.slice(0,500).map(e=>({...e,severity:e.severity==="error"?tag("bad","error"):
    e.severity==="review"?tag("warn","review"):tag("ok","information")}));
  const display=reviewDisplayFindings(events),counts=reviewDisplayCounts(display);
  const uniqueDisplay=display.map(r=>({severity:r.severity==="error"?tag("bad","error"):
      r.severity==="review"?tag("warn","review"):tag("ok","information"),
    area:r.area,finding:r.finding,occurrences:r.occurrences,runs:r.runCount,
    variants:r.variantCount,
    experiments:r.runs.slice(0,3).join(", ")+(r.runCount>3?` (+${r.runCount-3} more)`:"")}));
  box.innerHTML=`<div class="scroll">${table([
      {key:"experiment",label:"Experiment"},{key:"date",label:"Date"},{key:"operator",label:"Operator"},
      {key:"instrument",label:"Instrument"},{key:"plate",label:"Plate"},{key:"analyses",label:"Analyses",n:1},
      {key:"results",label:"Results",n:1},{key:"curves",label:"Curves",n:1},
      {key:"errors",label:"Unique errors",n:1},{key:"reviews",label:"Unique review",n:1},
      {key:"raw_errors",label:"Raw errors",n:1},{key:"raw_reviews",label:"Raw review",n:1},
      {key:"status",label:"Status",html:1}
    ],runDisplay)}</div>
    <h3>Distinct findings</h3>
    <p class="hint">One row per condition and level, counted across runs. "Evidence variants" is how many
       different pieces of evidence that row covers, so an aggregated row never hides that its occurrences
       differ. The raw log below keeps every event, and so does every export.</p>
    <div class="scroll">${table([
      {key:"severity",label:"Level",html:1},{key:"area",label:"Area"},{key:"finding",label:"Finding"},
      {key:"occurrences",label:"Events",n:1},{key:"runs",label:"Runs",n:1},
      {key:"variants",label:"Evidence variants",n:1},{key:"experiments",label:"Experiments"}
    ],uniqueDisplay)}</div>
    <h3>Forensic log (raw events)</h3><div class="scroll">${table([
      {key:"experiment",label:"Experiment"},{key:"severity",label:"Level",html:1},{key:"area",label:"Area"},
      {key:"finding",label:"Finding"},{key:"evidence",label:"Evidence"}
    ],eventDisplay)}</div><p class="hint">${shown.length} of ${events.length} finding(s) shown${shown.length>500?" (first 500 on screen; the CSV has all)":""}.</p>`;
}
