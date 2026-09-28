function withExportNames(fn){
  if(!pseudoOn())return fn();
  const keep=RUNS;RUNS=keep.map(pseudoRun);
  try{return fn();}finally{RUNS=keep;}
}
