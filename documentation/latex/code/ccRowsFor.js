function ccRowsFor(inst){
  const all=ccAllRows().filter(r=>r.instrument===inst).sort((a,b)=>(a.date||0)-(b.date||0));
  let h0=0;all.forEach(r=>{r.hours=h0;h0+=(Number(r.m.run_minutes)||0)/60;});   // run hours count every run on the instrument
  const rows=CC_STATE.protocol?all.filter(r=>(r.protocol||"")===CC_STATE.protocol):all;
  return rows;
}