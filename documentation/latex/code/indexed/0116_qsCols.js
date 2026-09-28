function qsCols(r,type,fallback){
  const es=r.provenance&&r.provenance.exportSetting,set=es&&es.sets.find(s=>s.type===type);
  let cols=set&&set.cols.length?set.cols.slice():fallback.slice();
  if(cols.includes("Well Position")&&cols[0]==="Well"){cols=cols.filter(c=>c!=="Well Position");cols.splice(1,0,"Well Position");}
  return cols;
}
