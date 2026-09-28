function ccValue(def,row,variant){const v=row.m[def.metric||def.id];if(v==null)return undefined;
  if(def.id==="ntc_rate"||def.id==="ntc_op"){if(Number.isFinite(v.n))return variant==="legacy pooled (stage unknown)"?v:undefined;}
  return def.variants?v[variant]:v;}
