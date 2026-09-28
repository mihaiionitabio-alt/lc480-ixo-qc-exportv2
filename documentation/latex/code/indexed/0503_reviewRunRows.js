function reviewRunRows(events){
  /* Deduplicated WITHIN the run, with the same key the overview uses, so the run table
     and the summary cannot report two different numbers for the same data. The raw
     count stays beside it, because the export is the raw log. */
  return RUNS.map(run=>{
    const ev=events.filter(e=>e.experiment===runName(run));
    const uniqOf=sev=>new Set(ev.filter(e=>e.severity===sev).map(findingKey)).size;
    const errors=uniqOf("error"),reviews=uniqOf("review"),
      rawErrors=ev.filter(e=>e.severity==="error").length,
      rawReviews=ev.filter(e=>e.severity==="review").length;
    return {experiment:runName(run),date:(run.meta||{}).StartTime||(run.meta||{}).Created||"",
      source_uid:sourceUidOf(run),source_crc32:sourceCRCOf(run),
      operator:operatorOf(run),instrument:(run.meta||{}).InstrumentName||"",
      plate:`${run.rows}x${run.cols}`,analyses:(run.analyses||[]).length,results:(run.wells||[]).length,
      curves:uniqueCurveCount(run),errors,reviews,raw_errors:rawErrors,raw_reviews:rawReviews,
      integrity:integrityLabel(run),platform:run.platform||"LightCycler 480",
      status:errors?"Error":reviews?"Review":"No structural finding"};
  });
}
