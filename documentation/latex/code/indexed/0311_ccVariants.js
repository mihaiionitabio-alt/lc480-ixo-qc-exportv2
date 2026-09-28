function ccVariants(def,rows){if(!def.variants)return [];
  const c=new Map();rows.forEach(r=>{const v=r.m[def.metric||def.id];if(v&&typeof v==="object"){if((def.id==="ntc_rate"||def.id==="ntc_op")&&Number.isFinite(v.n))c.set("legacy pooled (stage unknown)",1);else Object.keys(v).forEach(k=>c.set(k,(c.get(k)||0)+1));}});
  return [...c].sort((a,b)=>b[1]-a[1]).map(x=>x[0]);}
