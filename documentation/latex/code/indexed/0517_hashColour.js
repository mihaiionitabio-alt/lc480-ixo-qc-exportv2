function hashColour(text){
  let h=0;for(const c of String(text||""))h=(h*31+c.charCodeAt(0))>>>0;
  return PALETTE[h%PALETTE.length];
}
