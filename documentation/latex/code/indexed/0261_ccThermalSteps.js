function ccThermalSteps(t,y,setpoints,band=0.5,minHold=3){
  if(!t||t.length<10)return [];
  if(!setpoints||!setpoints.length){           // no protocol: find the plateaus the log itself shows
    const bins=new Map();
    for(let k=1;k<y.length;k++)if(Math.abs(y[k]-y[k-1])<0.15*(t[k]-t[k-1]||1)){const b=Math.round(y[k]);bins.set(b,(bins.get(b)||0)+1);}
    setpoints=[...bins].filter(([,c])=>c>=20).map(([b])=>b);
  }
  const plateaus=[];let cur=null;
  for(let k=0;k<y.length;k++){
    const sp=setpoints.find(s=>Math.abs(y[k]-s)<=band);
    if(cur&&sp===cur.sp){cur.end=k;continue;}
    if(cur&&t[cur.end]-t[cur.start]>=minHold)plateaus.push(cur);
    cur=sp===undefined?null:{sp,start:k,end:k};
  }
  if(cur&&t[cur.end]-t[cur.start]>=minHold)plateaus.push(cur);
  const out=[];
  for(let p=1;p<plateaus.length;p++){
    const A=plateaus[p-1],B=plateaus[p];if(A.sp===B.sp)continue;
    const up=B.sp>A.sp,x10=A.sp+0.1*(B.sp-A.sp),x90=A.sp+0.9*(B.sp-A.sp);
    let k10=null,k90=null,ext=up?-Infinity:Infinity;
    for(let k=A.end;k<=B.start;k++){
      if(k10===null&&(up?y[k]>=x10:y[k]<=x10))k10=k;
      if(k90===null&&(up?y[k]>=x90:y[k]<=x90))k90=k;
      if(k90!==null)ext=up?Math.max(ext,y[k]):Math.min(ext,y[k]);
    }
    if(k10===null||k90===null||t[k90]===t[k10])continue;
    const hold=y.slice(B.start,B.end+1),m=mean(hold);
    out.push({from:A.sp,to:B.sp,up,rate:Math.abs((y[k90]-y[k10])/(t[k90]-t[k10])),
      overshoot:Number.isFinite(ext)?Math.max(0,up?ext-B.sp:B.sp-ext):0,settling:t[B.start]-t[k90],
      offset:m-B.sp,sd:sd(hold)||0});
  }
  return out;
}
