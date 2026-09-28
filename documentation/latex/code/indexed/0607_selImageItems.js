  const n=Number(SEL_STATE.run)||0;
  return RUNS.length?Math.min(Math.max(0,n),RUNS.length-1):0;
}
function selGraphContext(g){
  const ri=selRunIndex();
  const o=SEL_STATE.options["img:"+g.id]||{};
  return {g,ri,run:RUNS[ri],target:o.target||(g.id==="curves"?((typeof gTargets==="function"&&RUNS[ri]?gTargets(RUNS[ri])[0]:"")||""):""),
    metric:o.metric||"outcome",signal:o.signal||"stored",log:o.log==="yes",colourby:o.colourby||"outcome",level:o.level||"end",control:o.control||"0"};
