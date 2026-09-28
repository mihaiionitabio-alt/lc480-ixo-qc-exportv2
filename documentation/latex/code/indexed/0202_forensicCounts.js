function forensicCounts(){
  const c=forensicSnapshot();if(c.counts)return c.counts;
  const copied=new Map(),findings=new Map();
  try{for(const e of extraForensicEvents())if(e.area==="Copied data")copied.set(e.experiment,(copied.get(e.experiment)||0)+1);}catch(e){console.error(e);}
  try{for(const e of reviewForensicEventsCore())if(e.severity!=="info")findings.set(e.experiment,(findings.get(e.experiment)||0)+1);}catch(e){console.error(e);}
  return c.counts={copied,findings};
}
