function ccTrend(x,y,cfg,spec){
  const idx=y.map((v,i)=>i).filter(i=>Number.isFinite(y[i])&&Number.isFinite(x[i])),ph=cfg.trendFit==="phase1"?idx.slice(0,Math.max(Math.min(cfg.phase1,idx.length),Math.min(5,idx.length))):idx;   // default: refit on every run since the baseline
  if(ph.length<3)return ccI(y,cfg);
  const xs=ph.map(i=>x[i]),ys=ph.map(i=>y[i]),mx=mean(xs),my=mean(ys),sxx=xs.reduce((s,v)=>s+(v-mx)**2,0);
  let b=sxx?xs.reduce((s,v,j)=>s+(v-mx)*(ys[j]-my),0)/sxx:0,a=my-b*mx;
  /* slope significance: t = b / SE(b). A slope estimated on a short or noisy baseline is noise; drawing it forward
     would put every later run "off the trend". Below |t| = 2 the fitted line is flat (the baseline mean). */
  {const r0=ys.map((v,j)=>v-(a+b*xs[j])),se=sxx?Math.sqrt(r0.reduce((q,e)=>q+e*e,0)/Math.max(1,ph.length-2)/sxx):Infinity,t=se>0?b/se:0;
   if(!(Math.abs(t)>=2)){b=0;a=my;}}
  const r=ys.map((v,j)=>v-(a+b*xs[j])),s=Math.max(Math.sqrt(r.reduce((q,e)=>q+e*e,0)/Math.max(1,ph.length-2))||sd(ys)||1,(cfg.res||0)/2);
  const res={cl:NaN,slope:b,intercept:a,sigma:s,pts:y.map((v,i)=>{const fit=a+b*x[i];
    return {y:v,cl:fit,ucl:fit+3*s,lcl:fit-3*s,flags:Number.isFinite(v)&&Math.abs(v-fit)>3*s?["off the trend line (3σ)"]:[]};})};
  const lastX=Math.max(...idx.map(i=>x[i]));
  for(const lim of [spec.lo,spec.hi])if(Number.isFinite(lim)&&b!==0){const at=(lim-a)/b;if(at>lastX)res.reach={limit:lim,at,ahead:at-lastX};}
  return res;
}