function resultCq(w){
  for(const v of [w&&w.CpRaw,w&&w.Cq,w&&w.Ct,w&&w.cq,w&&w.ct]){
    if(v===null||v===undefined||v==="")continue;
    const n=Number(v);if(Number.isFinite(n)&&n>0)return n;}
  return null;
}
