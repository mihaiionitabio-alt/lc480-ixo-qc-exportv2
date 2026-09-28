function sopEvaluateAll(){
  if(SOP_CACHE&&SOP_CACHE.runs===RUNS)return SOP_CACHE.list;
  const list=RUNS.map((r,i)=>{try{return sopEvaluateRun(r,i);}catch(e){console.error(e);return {run:r,ri:i,rows:[],criteria:[{criterion:"Evaluation",action:"review",status:"review",evidence:e.message}],status:"Not evaluated",rejected:[],reviewed:[],times:{}};}});
  SOP_CACHE={runs:RUNS,list};return list;
}
