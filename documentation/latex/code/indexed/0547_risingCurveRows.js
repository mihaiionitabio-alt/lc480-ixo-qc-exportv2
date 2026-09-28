function risingCurveRows(){
  return RUNS.flatMap((run,ri)=>orphanCurveCandidates(run).map(o=>Object.assign({runIndex:ri},o)));
}
