function instrumentRecordTables(run){
  if(!run)return {metadata:[],program:[],channels:[],subsets:[],analyses:[],statistics:[]};
  const m=run.meta||{},metadata=Object.keys(m).map(k=>({field:k,value:m[k]}))
    .concat([{field:"plate_geometry",value:`${run.rows}x${run.cols}`},{field:"block_id",value:run.blockId||""},
      {field:"cycles_decoded",value:run.nCycles||""},{field:"container_signature",value:(run.format||{}).signature||""},
      {field:"container_version",value:(run.format||{}).version||""}]);
  const program=[];
  (((run.protocol||{}).programs)||[]).forEach((p,pi)=>(p.segments||[]).forEach((s,si)=>program.push({
    program:pi+1,name:p.name||"",cycles:p.cycles,analysis_mode:p.mode||"",segment:si+1,
    target:s.target,target_2:s.target2,hold:s.hold,slope:s.slope,step_size:s.stepSize,
    step_delay:s.stepDelay,acquisition_mode:s.acqMode,acquisitions_per_degree:s.acqPerDegree
  })));
  const channels=(((run.protocol||{}).channels)||[]).map((c,i)=>({index:i,name:c.name||"",active:c.active?"yes":"no",
    excitation:c.ex,emission:c.em,integration_time:c.integr,max_integration:c.maxIntegr,
    melt_factor:c.meltFactor,quant_factor:c.quantFactor}));
  const subsets=(run.subsets||[]).map(s=>({name:s.name,id:s.id,for_analysis:s.forAnalysis,
    for_report:s.forReport,use_all_samples:s.useAll,positions:(s.items||[]).map(p=>posToWell(p,run.cols)).join(" ")}));
  const analyses=(run.analyses||[]).map(a=>({name:a.name,short_name:a.shortName,kind:a.kindLabel||a.kind,
    class:a.cls,uid:a.uid,subset:a.subsetName,calculation_state:a.calcState,channel_index:a.channelIdx,
    channel_name:a.channelName,filter:a.filterComb,created:a.created,modified:a.modified,
    created_by:a.createdBy,modified_by:a.modifiedBy,results:a.nResults,
    standard_curve_source:a.stdCurve?a.stdCurve.source:"",slope:a.stdCurve?a.stdCurve.slope:"",
    intercept:a.stdCurve?a.stdCurve.yIntercept:"",efficiency:a.stdCurve?a.stdCurve.efficiency:"",
    fit_error:a.stdCurve?a.stdCurve.fitError:"",colour_compensation:a.cccEnabled?"applied":"not applied"}));
  const statistics=[];
  (run.analyses||[]).forEach(a=>(a.quantStats||[]).forEach(q=>statistics.push({analysis:a.name,
    sample:q.master,wells:q.sampleIds,n:q.count,cq_mean:q.cpAvg,cq_sd:q.cpSD,
    concentration_mean:q.concAvg,concentration_sd:q.concSD,method:q.method})));
  const g=run.integrity,integrity=run.eds?[]:(g?[{check:"Trailing checksum (stored)",result:g.stored||"none"},
    {check:"Trailing checksum (recomputed)",result:g.computed},{check:"Verdict",result:integrityLabel(run)},
    {check:"Method",result:"MD5 of the object stream including its CRLF, four byte-swapped 32-bit words"},
    {check:"SHA-256 of the file",result:(run.meta||{}).sourceSHA256||""}]:[]);
  return Object.assign({metadata,integrity,program,channels,subsets,analyses,statistics},edsRecordTables(run));
}
