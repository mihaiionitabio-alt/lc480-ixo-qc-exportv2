function sopProcessingApplicability(run){
  const s=runProcessingState(run);
  if(s.state==="instrument")return {applicable:true,reason:s.reason,state:s.state};
  /* A vendor export IS the producer's analysis, so it is in scope - unless the instrument's
     own file for the same experiment is loaded, in which case that one is the record and this
     one is a companion. */
  if(s.state==="vendor-export"){
    if(runIsSuperseded(run))return {applicable:false,state:"superseded",
      reason:"superseded — "+run.supersededReason};
    return {applicable:true,reason:s.reason,state:s.state};
  }
  return {applicable:false,state:s.state,
    reason:(s.state==="raw"?"raw exchange file — ":"third-party analysis — ")+s.reason};
}
