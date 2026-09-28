function ccThermalSummary(steps,peaks){
  const med=a=>{const v=a.filter(Number.isFinite).sort((p,q)=>p-q);return v.length?v[Math.floor(v.length/2)]:NaN;};
  const pk=peaks||{};
  if(!steps.length)return {heat_rate:pk.heat,cool_rate:pk.cool};
  const top=Math.max(...steps.map(s=>s.to));
  return {heat_rate:pk.heat,cool_rate:pk.cool,
    overshoot:med(steps.filter(s=>s.up&&s.to===top).map(s=>s.overshoot)),
    settling:med(steps.filter(s=>s.up&&s.to===top).map(s=>s.settling))};
}