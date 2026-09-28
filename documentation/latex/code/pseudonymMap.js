function pseudonymMap(){
  if(PSEUDO_MAP)return PSEUDO_MAP;
  const m=new Map();let k=0;
  RUNS.forEach(r=>(r.wells||[]).concat(r.tmWells||[]).forEach(w=>{
    const s=w.sample||"";if(!s||m.has(s))return;
    m.set(s,roleFromName(s)!=="Unknown"?s:`S${String(++k).padStart(2,"0")}`);
  }));
  RUNS.forEach(r=>Object.values(r.plate||{}).forEach(x=>{const s=x.name;if(s&&!m.has(s))m.set(s,roleFromName(s)!=="Unknown"?s:`S${String(++k).padStart(2,"0")}`);}));
  return PSEUDO_MAP=m;
}