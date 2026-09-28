function mgViewReview(){
  const events=mgSafe(()=>reviewEventsWithoutIntegrity()||[],[]);
  if(!events.length)return [mgIt({kind:"finding",sev:"ok",pict:MG_PICT.finding,kindWord:"review",code:"QC",
    title:"No finding was raised",value:"0",unit:"findings",
    limits:`${RUNS.length} run(s) examined`,
    state:"The file, result, timeline and interpretation checks all passed on the loaded runs.",
    actions:[{key:"3",label:"Open the review view on the page",cmd:"open page review"}]})];
  const err=events.filter(e=>e.severity==="error").length,rev=events.filter(e=>e.severity==="review").length;
  const by=new Map();events.forEach(e=>{const k=e.area||"other";const l=by.get(k)||[];l.push(e);by.set(k,l);});
  const out=[mgIt({kind:"summary",sev:err?"alarm":rev?"watch":"ok",pict:MG_PICT.summary,kindWord:"review",code:"QC",
    title:"Quality and forensic review",value:String(events.length),unit:"findings",
    limits:`${err} error · ${rev} review · ${by.size} area(s)`,
    state:err?`${err} finding(s) are error level: the evidence contradicts what the file claims about itself.`
      :rev?`${rev} finding(s) are for review; none is error level.`:"Every check passed.",
    evidence:[...by.keys()].slice(0,5).join(" · "),
    rows:[...by].map(([a,l])=>[a,`${l.filter(e=>e.severity==="error").length} error · ${l.filter(e=>e.severity==="review").length} review`]),
    actions:[{key:"3",label:"Open the review view on the page",cmd:"open page review"}]})];
  const rank=l=>l.some(e=>e.severity==="error")?0:1;
  [...by].sort((a,b)=>rank(a[1])-rank(b[1])).forEach(([area,list])=>{
    const e0=list.find(e=>e.severity==="error")||list[0];
    const errs=list.filter(e=>e.severity==="error").length;
    out.push(mgIt({kind:"finding",sev:errs?"alarm":"watch",pict:MG_PICT.finding,kindWord:"finding",
      code:errs?"ERR":"REV",title:area,value:String(list.length),unit:list.length===1?"finding":"findings",
      limits:`${errs} error · ${list.length-errs} review · expected: none`,
      state:e0.finding||"",evidence:e0.experiment||"",
      rows:list.slice(0,14).map(e=>[String(e.experiment||e.finding||"").slice(0,44),
        String(e.evidence||e.finding||"").slice(0,80)]),
      actions:[{key:"3",label:"Open the review view on the page",cmd:"open page review"}]}));
  });
  return out;
}
