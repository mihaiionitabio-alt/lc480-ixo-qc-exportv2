function plateColour(row,mode,lo,hi){
  if(mode==="cq")return heatColour(Number(row.cq),lo,hi);
  const key=mode==="subset"?row.subsets:mode==="type"?row.instrument_type:mode==="call"?row.call:row.role;
  if(mode==="role"||mode==="call")return REVIEW_COLOURS[key||"Unknown"]||"#f8fafc";
  let h=0;for(const c of String(key||""))h=(h*31+c.charCodeAt(0))>>>0;
  return key?PLATE_PASTELS[h%PLATE_PASTELS.length]:"#f8fafc";
}
