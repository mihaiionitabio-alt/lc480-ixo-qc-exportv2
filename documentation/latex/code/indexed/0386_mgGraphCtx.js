function mgGraphCtx(g,ri,target){
  const run=RUNS[ri];
  const tg=target!==undefined?target:((g.opts||[]).includes("target")&&run?(mgSafe(()=>gTargets(run),[])[0]||""):"");
  return {g,ri,run,target:tg,metric:"outcome",signal:"stored",log:false,colourby:"outcome",level:"end",control:"0"};
}
