function analysisGroups(rows){
  const groups=new Map();
  (rows||[]).forEach(w=>{
    const key=w.analysisUid||w.analysis||"analysis";
    if(!groups.has(key))groups.set(key,{key,name:w.analysis||key,wells:[]});
    groups.get(key).wells.push(w);
  });
  return [...groups.values()];
}
