function metaRows(){
  /* Every field is read defensively. This table is drawn on load, before any
     check has run, so a run that decoded only partly must still be describable -
     crashing here would hide the very problem the user needs to see. */
  return RUNS.map(r=>({
    file:r.file,platform:r.platform||"LightCycler 480",integrity:integrityLabel(r),
    source_uid:sourceUidOf(r),source_crc32:sourceCRCOf(r),source_sha256:sourceSHA256Of(r),
    source_bytes:(r.meta&&r.meta.sourceBytes)||"",experiment:(r.meta&&r.meta.name)||"",
    experiment_created:(r.meta&&r.meta.Created)||"",experiment_created_by:(r.meta&&r.meta.CreatedByName)||"",
    experiment_last_modified:(r.meta&&r.meta.LastModified)||"",
    run_created:(r.meta&&r.meta.RunCreated)||"",run_started:(r.meta&&r.meta.StartTime)||"",
    run_ended:(r.meta&&r.meta.EndTime)||"",run_duration_minutes:runDurationMinutes(r),
    operator:operatorOf(r),software_version:(r.meta&&r.meta.SWVersion)||"",
    instrument:(r.meta&&r.meta.InstrumentName)||"",
    block:r.blockId||"", plate:`${r.rows??"?"}x${r.cols??"?"}`, cycles:r.nCycles??"",
    channels:(((r.protocol||{}).channels)||[]).filter(c=>c.active).map(c=>c.name||`${c.ex}-${c.em}`).join(" | "),
    fluorescence_scaling_factors:(r.acqScalingFactors||[]).join(" | "),
    analyses:(r.analyses||[]).length, modules:(r.kinds||[]).join(" | "),
    quantification_results:(r.wells||[]).length, melting_results:(r.tmWells||[]).length,
    curves_decoded:uniqueCurveCount(r),curves_linked_to_results:uniqueCurveCount(r),
    curves_acquired:acquiredCurveCount(r),
    acquisition_error:r.acqError||""
  }));
}
