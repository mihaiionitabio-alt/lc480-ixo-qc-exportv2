function curveColour(w,mode){
  const key=curveKey(w,mode);
  if(mode==="sop"){const r=sopOutcomeFor(runAt("#curve-run",0),w);return r?r.colour:"#94a3b8";}
  if(mode==="target"||mode==="well"||mode==="sample"){
    /* distinct colours in order of first appearance; a hash collides too often with few series */
    const k=String(key||w.well);
    if(!CURVE_KEY_COLOURS.has(k))CURVE_KEY_COLOURS.set(k,SERIES_PALETTE[CURVE_KEY_COLOURS.size%SERIES_PALETTE.length]);
    return CURVE_KEY_COLOURS.get(k);
  }
  /* Plate fills are pale by design; lines need the saturated role palette or Unknown curves vanish on white. */
  if(mode==="role")return ROLE_LINE[key||"Unknown"]||hashColour(key||w.well);
  if(mode==="call")return CALL_LINE[key]||hashColour(key||w.well);
  return REVIEW_COLOURS[key]||hashColour(key||w.well);
}
