function forensicSnapshot(){
  const profile=sopCanonical(SOP);
  if(!FORENSIC_CACHE||FORENSIC_CACHE.runs!==RUNS||FORENSIC_CACHE.n!==RUNS.length||FORENSIC_CACHE.profile!==profile)
    FORENSIC_CACHE={runs:RUNS,n:RUNS.length,profile};
  return FORENSIC_CACHE;
}
