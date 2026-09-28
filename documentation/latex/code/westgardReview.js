function westgardReview(points,m,d){
  const flags=points.map(()=>[]);
  if(!(Number.isFinite(d)&&d>0))return flags;
  const z=points.map(p=>Number.isFinite(p.cq)?(p.cq-m)/d:null);
  z.forEach((v,i)=>{if(Number.isFinite(v)&&Math.abs(v)>=3)flags[i].push("1-3s");});
  for(let i=1;i<z.length;i++){
    if(Number.isFinite(z[i])&&Number.isFinite(z[i-1])){
      if(Math.abs(z[i])>=2&&Math.abs(z[i-1])>=2&&Math.sign(z[i])===Math.sign(z[i-1]))
        flags[i].push("2-2s");
      // No R-4s across consecutive run means.
    }
  }
  for(let i=9;i<z.length;i++){
    const a=z.slice(i-9,i+1);
    if(a.every(Number.isFinite)&&(a.every(v=>v>0)||a.every(v=>v<0)))flags[i].push("10-x");
  }
  return flags;
}