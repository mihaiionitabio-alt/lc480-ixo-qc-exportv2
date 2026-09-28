function ccShift(res){
  if(!res.baselineReady||res.segmented||!["i","trend","xbars"].includes(res.type))return null;
  const pts=res.pts.filter(p=>!p.pre&&Number.isFinite(p.y)&&Number.isFinite(p.cl)),n=pts.length,run=8;
  const dir=p=>ccSignal(p)==="limit"&&p.flags.some(f=>!/specification/.test(f))?Math.sign(p.y-p.cl):0;
  for(let k=1;k+run<=n;k++){const d=dir(pts[k]);if(!d||dir(pts[k-1])===d)continue;
    if(!pts.slice(k,k+run).every(p=>dir(p)===d))continue;
    const after=pts.slice(k),share=after.filter(p=>dir(p)===d).length/after.length;if(share<0.7)continue;
    const raw=p=>p.raw!==undefined?p.raw:p.y,sp=res.spec||{},inSpec=after.every(p=>!(raw(p)<sp.lo)&&!(raw(p)>sp.hi));
    return {i:res.pts.indexOf(pts[k]),x:pts[k].x,date:pts[k].row&&pts[k].row.date,run:pts[k].row&&pts[k].row.run,n:after.length,dir:d,
      before:ccMedian(pts.slice(0,k).map(raw)),after:ccMedian(after.map(raw)),inSpec,hasSpec:Number.isFinite(sp.lo)||Number.isFinite(sp.hi)};}
  return null;
}
