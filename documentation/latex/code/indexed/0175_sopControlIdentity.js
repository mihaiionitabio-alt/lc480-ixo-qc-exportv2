function sopControlIdentity(w,run){
  const c=sopControlSpec(w);if(!c)return null;
  const raw=String(w.sample||c.name||""),normal=raw.trim().replace(/\s+/g," ").toUpperCase();
  const m=normal.match(/(?<!\d)(\d{1,2})\.(\d{1,2})\.(\d+)(?![\d.])/);
  let extractionDate="",dateState="not recorded",ageDays=NaN;
  if(m){const d=+m[1],mo=+m[2],y=+m[3],t=new Date(Date.UTC(y,mo-1,d));dateState="invalid date";
    if(m[3].length===4&&t.getUTCFullYear()===y&&t.getUTCMonth()===mo-1&&t.getUTCDate()===d){
      extractionDate=t.toISOString().slice(0,10);dateState="parsed from label";
      const start=run&&runTimes(run).start;
      if(Number.isFinite(start)){const r=new Date(start);ageDays=(Date.UTC(r.getFullYear(),r.getMonth(),r.getDate())-t.getTime())/864e5;
        if(ageDays<0)dateState="after run date";}}}
  const material=c.material||normal.replace(/\d{1,2}\.\d{1,2}\.\d+/g,"").trim()||c.name;
  const purpose=c.purpose||(c.expect==="negative"?"negative control":c.expect==="standard"?"standard":"positive control");
  // Exact normalized label retains aliquot numbers, dilution labels and extraction date.
  // Unknown/invalid dates are isolated per source for longitudinal statistics.
  const unresolved=dateState!=="parsed from label";
  const scope=unresolved&&run?" | "+((run.meta||{}).sourceSHA256||runName(run)):"";
  const qual=normal.replace(/(?<!\d)\d{1,2}\.\d{1,2}\.\d+(?![\d.])/,"").replace(material.toUpperCase(),"").replace(/\s+/g," ").trim();
  const extract=(extractionDate?(dateState==="after run date"?extractionDate+" after run":"extracted "+extractionDate):"date "+(dateState==="not recorded"?"not recorded":"unresolved"))+(qual?" · "+qual:"");
  return {raw,material,purpose,extractionDate,dateState,ageDays,
    batch:normal,key:`${w.target||w.analysis||""} | ${normal}${scope}`,
    series:`${ccCanonTarget(w.target||w.analysis||"")} | ${String(material).toUpperCase()}`,extract};
}
