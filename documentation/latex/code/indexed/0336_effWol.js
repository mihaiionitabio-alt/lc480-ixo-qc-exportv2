function effWol(curve){
  if(!curve||curve.length<8)return null;
  const F=curve.map(Number),n=F.length,cyc=[...Array(n)].map((_,i)=>i+1),fmin=Math.min(...F),fmax=Math.max(...F);
  if(fmax-fmin<50)return null;
  let best=null;const lo=fmin-0.02*(fmax-fmin),hi=fmin*0.999;
  for(let k=0;k<12;k++){
    const baseline=lo+(hi-lo)*k/11,y=F.map(v=>v-baseline);if(y.some(v=>v<=0))continue;
    const ly=y.map(Math.log10),amp=Math.max(...y),idx=[];
    for(let i=0;i<y.length;i++)if(y[i]>=0.02*amp&&y[i]<=0.25*amp)idx.push(i);
    if(idx.length<4)continue;
    const runs=[[idx[0]]];for(let i=1;i<idx.length;i++){if(idx[i]===idx[i-1]+1)runs.at(-1).push(idx[i]);else runs.push([idx[i]]);}
    const run=runs.reduce((a,c)=>c.length>a.length?c:a);if(run.length<4)continue;
    const f=fitLin(run.map(i=>cyc[i]),run.map(i=>ly[i]));
    if(f.slope<=0)continue;if(!best||f.r2>best.r2)best={...f,baseline,window:[run[0]+1,run.at(-1)+1]};
  }
  if(!best||best.r2<0.98)return null;
  const E=(10**best.slope-1)*100;
  return E>30&&E<140?Math.round(E*10)/10:null;
}
