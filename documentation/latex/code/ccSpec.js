function ccSpec(def,cfg,platform,keep,variant){const d=Object.assign({},((def.spec||{})[platform])||{});
  const n=v=>v===""||v==null?NaN:Number(v);
  if(def.specRel&&keep&&keep.length){   // limit relative to the first runs (e.g. lamp: 50 % of the starting intensity)
    const first=keep.slice(0,3).map(r=>{const v=ccValue(def,r,variant);return typeof v==="object"&&v?v.mean:Number(v);}).filter(Number.isFinite);
    if(first.length){if(def.specRel.lo!=null)d.lo=def.specRel.lo*mean(first);if(def.specRel.hi!=null)d.hi=def.specRel.hi*mean(first);}}
  return {lo:Number.isFinite(n(cfg.specLo))?n(cfg.specLo):n(d.lo),hi:Number.isFinite(n(cfg.specHi))?n(cfg.specHi):n(d.hi)};}