function ccAllRows(){
  const loaded=ccRowsFromRuns(),keys=new Set(loaded.map(r=>r.key));
  return CC_STATE.imported.filter(r=>!keys.has(r.key)).concat(loaded);
}
