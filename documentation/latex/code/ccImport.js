function ccImport(text){
  const j=validateHistoryBoundary(JSON.parse(text),"history");
  const keys=new Set(CC_STATE.imported.map(r=>r.key));
  let accepted=0,skipped=0;
  j.rows.forEach(r=>{if(r&&typeof r.key==="string"&&r.key&&r.m&&typeof r.m==="object"&&!Array.isArray(r.m)&&!keys.has(r.key)){ccMigrateControlKeys(r.m);CC_STATE.imported.push(r);keys.add(r.key);accepted++;}else skipped++;});
  if(!accepted&&!j.rows.length)throw new Error("history file contains no rows");
  if(skipped)appNotice("history import",`${skipped} malformed or duplicate history row(s) were ignored`);
  ccRemember();return accepted;
}