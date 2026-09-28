function sopStdCurves(run){
  const groups=byKey((run.wells||[]).filter(w=>w.role==="Standard"&&!sopOmitted(w)&&Number(w.givenConc||w.StandardConc)>0&&Number.isFinite(sopCq(w))),w=>w.target||w.analysis||"");
  return [...groups].map(([target,ws])=>{
    const pts=ws.map(w=>({x:Math.log10(Number(w.givenConc||w.StandardConc)),y:sopCq(w),well:w.well,sample:w.sample,conc:Number(w.givenConc||w.StandardConc)}));
    const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),n=pts.length,mx=mean(xs),my=mean(ys);
    const sxx=xs.reduce((s,x)=>s+(x-mx)**2,0),sxy=pts.reduce((s,p)=>s+(p.x-mx)*(p.y-my),0);
    const slope=sxx?sxy/sxx:NaN,icpt=my-slope*mx,ssr=pts.reduce((s,p)=>s+(p.y-(icpt+slope*p.x))**2,0),sst=ys.reduce((s,y)=>s+(y-my)**2,0);
    const r2=sst?1-ssr/sst:NaN,eff=(Math.pow(10,-1/slope)-1)*100,logs=n?Math.max(...xs)-Math.min(...xs):0;
    pts.forEach(p=>p.residual=p.y-(icpt+slope*p.x));
    const levels=[...byKey(pts,p=>p.x)].sort((a,b)=>b[0]-a[0]).map(([x,ps])=>({x,mean:mean(ps.map(p=>p.y))}));
    const monotonic=levels.every((l,i)=>i===0||l.mean>=levels[i-1].mean-0.1);
    return {target,points:pts,n,slope,intercept:icpt,r2,efficiency:eff,logs,levels:levels.length,monotonic};
  }).filter(c=>c.levels>=2);
}
