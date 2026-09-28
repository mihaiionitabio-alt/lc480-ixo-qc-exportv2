function ccHistoryCSV(){
  const rows=ccAllRows().filter(r=>r.instrument===CC_STATE.instrument),cols=new Set();
  const flat=rows.map(r=>{const o={experiment:r.run,date:sopFmtTime(r.date),instrument:r.instrument,operator:pseudoOn()&&r.operator!=="(not recorded)"?"operator-"+sha256Hex(new TextEncoder().encode(r.operator)).slice(0,8):r.operator,firmware:r.firmware,software:r.software,block_cycles:r.block_cycles??""};
    for(const [k,v] of Object.entries(r.m)){if(v&&typeof v==="object"){for(const [a,b] of Object.entries(v))o[`${k}.${a}`]=b;}else o[k]=v;}
    Object.keys(o).forEach(k=>cols.add(k));return o;});
  return toCSV([...cols].map(k=>({key:k,label:k})),flat);
}
