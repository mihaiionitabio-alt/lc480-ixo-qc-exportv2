function ccWestgard(res){
  const z=res.pts.map(p=>(p.y-res.cl)/res.sigma);
  res.pts.forEach((p,i)=>{if(!Number.isFinite(z[i]))return;const f=[];
    if(Math.abs(z[i])>3)f.push("1-3s");
    if(i>=1&&Math.abs(z[i])>2&&Math.abs(z[i-1])>2&&Math.sign(z[i])===Math.sign(z[i-1]))f.push("2-2s");
    // R-4s requires within-run control measurements; run means cannot implement it.
    if(i>=3&&z.slice(i-3,i+1).every(q=>Math.abs(q)>1&&Math.sign(q)===Math.sign(z[i])))f.push("4-1s");
    if(i>=9&&Math.sign(z[i])!==0&&z.slice(i-9,i+1).every(q=>Math.sign(q)===Math.sign(z[i])))f.push("10-x");
    p.flags=f;});
  return res;
}
