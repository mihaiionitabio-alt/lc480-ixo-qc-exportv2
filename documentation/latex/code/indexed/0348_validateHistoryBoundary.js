function validateHistoryBoundary(j,source){
  const at=m=>new Error(`${source||"history"}: ${m}`);
  if(!j||j.schema!=="qpcr-instrument-history/1"||!Array.isArray(j.rows))throw at("not an instrument history file");
  if(j.rows.length>APP_LIMITS.maxHistoryRows)throw at(`${j.rows.length.toLocaleString()} rows exceeds the import limit`);
  const bad=j.rows.findIndex(r=>!r||typeof r!=="object"||Array.isArray(r)||typeof r.key!=="string"||!r.key||!r.m||typeof r.m!=="object"||Array.isArray(r.m));
  if(bad>=0)throw at(`row ${bad+1} has no key/measurement object`);
  return j;
}
