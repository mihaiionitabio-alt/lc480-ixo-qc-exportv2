function ccPeakRates(t,y,win=2,min=1){
  const up=[],dn=[];let j=0,cur=null;
  for(let i=0;i<t.length;i++){
    while(t[i]-t[j]>win)j++;
    const s=i>j?(y[i]-y[j])/(t[i]-t[j]):0,d=s>min?1:s<-min?-1:0;
    if(d&&(!cur||cur.d!==d)){if(cur)(cur.d>0?up:dn).push(cur.m);cur={d,m:Math.abs(s)};}
    else if(d)cur.m=Math.max(cur.m,Math.abs(s));
    else if(cur){(cur.d>0?up:dn).push(cur.m);cur=null;}
  }
  if(cur)(cur.d>0?up:dn).push(cur.m);
  const med=a=>{const v=a.slice().sort((p,q)=>p-q);return v.length?v[Math.floor(v.length/2)]:NaN;};
  return {heat:med(up),cool:med(dn),nUp:up.length,nDown:dn.length};
}
