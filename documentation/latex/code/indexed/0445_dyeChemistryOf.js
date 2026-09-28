function dyeChemistryOf(run){
  /* SYBR Green and other intercalators must not be reported as probes: the
     chemistry changes how LinRegPCR treats the amplification plateau. */
  const names=(run.protocol.channels||[]).map(c=>(c.name||"").toLowerCase()).join(" ");
  const anaNames=run.analyses.map(a=>(a.name||"").toLowerCase()).join(" ");
  const text=names+" "+anaNames+" "+(run.meta.name||"").toLowerCase();
  if(/sybr|syto|eva\s*green|intercalat/.test(text))return "DNA-binding dye";
  if(/hybprobe|fret/.test(text))return "hybridization probe";
  return "hydrolysis probe";
}
