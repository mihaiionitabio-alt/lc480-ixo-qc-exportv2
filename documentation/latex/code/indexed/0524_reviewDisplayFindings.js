function reviewDisplayFindings(raw){
  const groups=new Map();
  (raw||reviewEventsWithoutIntegrity()||[]).forEach((e,i)=>{
    const sev=FINDING_SEVERITY_RANK[e&&e.severity]!=null?e.severity:"review";
    const key=findingKey(Object.assign({},e,{severity:sev})),g=groups.get(key);
    if(!g){groups.set(key,{key,severity:sev,area:e.area||"Uncategorised",
      finding:e.finding||"Unspecified finding",evidence:e.evidence||"",occurrences:1,
      runs:new Set(e.experiment?[e.experiment]:[]),
      variants:new Set([findingEvidenceKey(e)]),sources:[i]});return;}
    g.occurrences++;g.sources.push(i);
    if(e.experiment)g.runs.add(e.experiment);
    g.variants.add(findingEvidenceKey(e));
    if(!g.evidence&&e.evidence)g.evidence=e.evidence;
  });
  return [...groups.values()].map(g=>Object.assign(g,{runCount:g.runs.size,runs:[...g.runs],
    variantCount:g.variants.size,variants:[...g.variants]}))
    .sort((a,b)=>FINDING_SEVERITY_RANK[b.severity]-FINDING_SEVERITY_RANK[a.severity]
      ||b.occurrences-a.occurrences||a.area.localeCompare(b.area));
}
