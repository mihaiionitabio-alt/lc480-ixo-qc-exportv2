function effSliwinProxy(curve){
  if(!curve||curve.length<8)return null;
  const F=curve.map(Number),n=F.length,cyc=[...Array(n)].map((_,i)=>i+1),fmin=Math.min(...F),fmax=Math.max(...F);
  if(fmax-fmin<50)return null;
  const y=F.map(v=>v-fmin+1),ly=y.map(Math.log10),amp=Math.max(...y);let best=null;const width=5;
  for(let s=0;s+width<=n;s++){
    const win=[...Array(width)].map((_,i)=>s+i);
    if(y[win[0]]<0.01*amp||y[win.at(-1)]>0.35*amp)continue;
    const f=fitLin(win.map(i=>cyc[i]),win.map(i=>ly[i]));
    if(f.slope>0&&(!best||f.r2>best.r2))best=f;
  }
  if(!best||best.r2<0.99)return null;
  const E=(10**best.slope-1)*100;return E>30&&E<140?Math.round(E*10)/10:null;
}
