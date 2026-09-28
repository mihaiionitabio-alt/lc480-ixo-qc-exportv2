function ccHistoryJSON(onlyInstrument){
  const rows=ccAllRows().filter(r=>!onlyInstrument||r.instrument===CC_STATE.instrument).map(r=>{const o=Object.assign({},r);delete o.loaded;delete o.hours;
    if(pseudoOn())o.operator=o.operator==="(not recorded)"?o.operator:"operator-"+sha256Hex(new TextEncoder().encode(o.operator)).slice(0,8);return o;});
  return JSON.stringify({schema:"qpcr-instrument-history/1",written:new Date().toISOString(),sop:{name:SOP.name,version:SOP.version,sha256:sopHash()},rows},null,1);
}