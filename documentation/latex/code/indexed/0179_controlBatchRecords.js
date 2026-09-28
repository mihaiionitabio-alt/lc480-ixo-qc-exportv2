function controlBatchRecords(){
  return sopEvaluateAll().flatMap(e=>e.rows.filter(r=>r.ctrl&&r.ctrl.expect==="positive"&&r.ctrl.purpose!=="reference check").map(r=>{
    const id=sopControlIdentity(r.wells[0],e.run),m=e.run.ccStatic||ccStatic(e.run);
    return {experiment:runName(e.run),source:(e.run.meta||{}).sourceSHA256||e.run.file,
      instrument:ccInstrumentKey(e.run),protocol:ccProtocolKey(e.run),target:r.target,controlId:r.ctrl.id||r.ctrl.name||r.ctrl.match,control:r.ctrl.name,
      raw_name:id.raw,material:id.material,batch:id.batch,extraction_date:id.extractionDate,date_state:id.dateState,
      age_days:id.dateState==="parsed from label"?id.ageDays:NaN,date:e.times.start,
      cq:r.cqMean,detected:r.det,replicates:r.n,amplitude:ccMedian(r.used.filter(w=>w.curve).map(w=>wellSignal(w.curve).amplitude)),
      cooling:m.cool_rate,setting:r.ctrl};}));
}
