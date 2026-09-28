function ccTransitionPairs(run){
  const progs=((run.protocol||{}).programs||[]).filter(p=>(p.segments||[]).length),R=v=>Math.round(Number(v)*10)/10;
  const out=new Map(),add=(a,b)=>{if(!Number.isFinite(+a.target)||!Number.isFinite(+b.target))return;
    const A=R(a.target),B=R(b.target);if(Math.abs(A-B)<2)return;
    const sl=Number(b.slope);if(/cont/i.test(b.acqMode||"")||(Number.isFinite(sl)&&sl>0&&sl<1))return;
    out.set(`${A}→${B}`,{from:A,to:B});};
  progs.forEach((p,pi)=>{const s=p.segments;
    for(let i=0;i+1<s.length;i++)add(s[i],s[i+1]);
    if((+p.cycles||1)>1&&s.length>1)add(s[s.length-1],s[0]);
    if(pi>0){const q=progs[pi-1].segments;add(q[q.length-1],s[0]);}});
  return [...out.values()];
}
