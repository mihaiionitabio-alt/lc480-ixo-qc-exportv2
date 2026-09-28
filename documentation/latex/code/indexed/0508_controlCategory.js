function controlCategory(w){
  const n=String(w.sample||"");
  const mapped=sopControlSpec(w);
  if(mapped){
    if(mapped.expect==="negative"){
      if(/extraction/i.test(mapped.purpose||""))return "Extraction blank";
      if(/grinding|environment/i.test(mapped.purpose||""))return "Blank";
      if(/matrix/i.test(mapped.purpose||""))return "Negative control";
      return "No-template control";
    }
    if(mapped.expect==="positive")return /LOD/i.test(mapped.purpose||"")?"LOD control":"Positive control";
  }
  if(/\b(LOD|limit\s+of\s+detection|LDD)\b/i.test(n))return "LOD control";
  if(/\b(no\s*template|NTC|water|H2O)\b/i.test(n))return "No-template control";
  if(/\b(extraction\s*blank|EBC)\b/i.test(n))return "Extraction blank";
  if(/\b(blank|BLK)\b/i.test(n))return "Blank";
  if(/\b(internal\s*(amplification\s*)?control|IAC|IPC)\b/i.test(n))return "Internal control";
  if(/\b(inhibition\s*control)\b/i.test(n))return "Inhibition control";
  if(/\b(spike|spiked)\b/i.test(n))return "Spike";
  if(/\b(external\s*reference)\b/i.test(n))return "External reference";
  return w.role&&w.role!=="Unknown"?w.role:"";
}
