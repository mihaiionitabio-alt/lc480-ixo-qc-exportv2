function ccSetpoints(run){
  const v=((run.protocol||{}).programs||[]).flatMap(p=>(p.segments||[]).map(s=>Number(s.target))).filter(x=>x>20&&x<110);
  return uniq(v.map(x=>Math.round(x*10)/10));
}