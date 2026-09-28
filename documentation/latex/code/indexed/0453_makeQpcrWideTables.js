function makeQpcrWideTables(run){
  const groups=curveAnalysisGroups(run),multi=groups.length>1;
  return groups.map((g,i)=>({
    key:g.key,analysis:g.name,
    file:`${safeName(run.meta.name||run.file)}${multi?"_"+String(i+1).padStart(2,"0")+"_"+safeName(g.name||"analysis"):""}_qpcR_curves.csv`,
    data:makeQpcrWide(run,g.key)
  }));
}
