function ccChartSvg(res,title){
  const def=res.def,unit=def.unit||"";
  if(res.type==="funnel"){
    if(!res.pts.length)return svgMessage("No operator data for this chart.");
    const nmax=Math.max(...res.pts.map(p=>p.n))*1.1,grid=Array.from({length:60},(_,i)=>1+i*(nmax-1)/59),p0=res.p0;
    const curve=z=>grid.map(n=>[n,Math.min(1,p0+z*Math.sqrt(p0*(1-p0)/n))]);
    return svgPlot({title,x:[0,nmax],y:[0,Math.max(0.05,...res.pts.map(p=>p.y),...curve(3.09).map(c=>c[1]))*1.1],xlab:"Number of items (workload)",ylab:unit,
      series:[{type:"line",colour:"#f59e0b",dash:"5 4",data:curve(1.96),tip:"95 %"},{type:"line",colour:"#dc2626",dash:"5 4",data:curve(3.09),tip:"99.8 %"},
        {type:"points",r:5.5,data:res.pts.map(p=>[p.n,p.y,`${p.operator}: ${p.bad}/${p.n} = ${(100*p.y).toFixed(1)} %`,p.flags.length?CC_COL.bad:CC_COL.pt])}],
      hlines:[{y:p0,label:`overall ${(100*p0).toFixed(1)} %`,colour:"#374151",dash:"1 0"}],
      texts:res.pts.map(p=>({x:p.n,y:p.y,text:"  "+p.operator,size:10})),legend:[{label:"95 % limit",colour:"#f59e0b"},{label:"99.8 % limit",colour:"#dc2626"}]});
  }
  const pts=res.pts.filter(p=>Number.isFinite(p.y));
  if(!pts.length)return svgMessage("No data for this chart in the loaded runs or the imported history.");
  const lim=k=>pts.filter(p=>Number.isFinite(p[k])).map(p=>[p.x,p[k]]);
  const opCol=new Map(),byOp=def.byOperator&&uniq(pts.map(p=>p.row.operator)).length>1;
  const segCol=new Map(),bySeg=!!res.segmented,segColour=(m,k)=>{k=String(k||"—");if(!m.has(k))m.set(k,CC_SEG_PALETTE[m.size%CC_SEG_PALETTE.length]);return m.get(k);};
  const colourOf=p=>p.pre?"#cbd5e1":ccSignal(p)==="limit"?CC_COL.bad:ccSignal(p)==="rule"?CC_COL.rule:byOp?catColour(opCol,p.row.operator):bySeg?segColour(segCol,p.segment):CC_COL.pt;
  const tip=(p,side)=>`${p.row.run} · ${sopFmtTime(p.row.date)} · ${p.row.operator}${side?" · "+(side==="lo"?"lower sum":"upper sum"):""}\n${fmtTick(+Number(p.raw!==undefined?p.raw:p.y).toPrecision(4))} ${unit}${p.segment?"\ncontrol extract: "+p.segment:""}${(p.flags.length&&(!side||(side==="lo"?p.sigLo:p.sigHi)))?"\n"+(ccSignal(p)==="limit"?"⚠ outside the limits: ":"△ pattern inside the limits: ")+p.flags.join(", "):""}`;
  const series=[{type:"line",colour:"#94a3b8",width:1,data:pts.map(p=>[p.x,p.y])}];
  [...byKey(pts,p=>p.segment||"")].forEach(([key,sp])=>{const L=k=>sp.filter(p=>Number.isFinite(p[k])).map(p=>[p.x,p[k]]),c=bySeg?segColour(segCol,key):null;
    series.push({type:"line",colour:c||"#475569",dash:"6 4",width:1.2,data:L("ucl")},{type:"line",colour:c||"#475569",dash:"6 4",width:1.2,data:L("lcl")},
      {type:"line",colour:c||"#16a34a",width:1.2,data:L("cl")});});
  /* A point is red only on the series whose own statistic is outside its limit. On a CUSUM
     chart the upper and the lower sum are two series: a lower-sum alarm must not paint the
     upper sum, which is sitting at zero inside the band. */
  const cusumColour=(p,side)=>p.pre?"#cbd5e1":(side==="lo"?p.sigLo:p.sigHi)?CC_COL.bad:(side==="lo"?"#0891b2":CC_COL.pt);
  if(res.type==="cusum"){
    series.push({type:"line",colour:"#0891b2",width:1.2,data:pts.map(p=>[p.x,p.y2])},
      {type:"points",r:3,colour:"#0891b2",data:pts.map(p=>[p.x,p.y2,tip(p,"lo"),cusumColour(p,"lo")])});
    series.push({type:"points",r:4,data:pts.map(p=>[p.x,p.y,tip(p,"hi"),cusumColour(p,"hi")])});
  }else series.push({type:"points",r:4,data:pts.map(p=>[p.x,p.y,tip(p),colourOf(p)])});
  const hl=[];if(Number.isFinite(res.spec.lo)&&res.type!=="cusum"&&res.type!=="p")hl.push({y:res.spec.lo,label:`lower spec ${fmtTick(+res.spec.lo.toPrecision(4))}`,colour:"#7f1d1d",dash:"2 2"});
  if(Number.isFinite(res.spec.hi)&&res.type!=="cusum")hl.push({y:res.spec.hi,label:`upper spec ${fmtTick(+res.spec.hi.toPrecision(4))}`,colour:"#7f1d1d",dash:"2 2"});
  const px=pts.map(p=>p.x),pmin=Math.min(...px),pmax=Math.max(...px),room=pmax+0.35*Math.max(1e-9,pmax-pmin);let clipped=false,atShow=NaN;
  if(res.reach){const r=res.reach;atShow=Math.min(r.at,room);clipped=r.at>room;
    series.push({type:"line",colour:"#7c3aed",dash:"3 3",data:[[pts[pts.length-1].x,res.intercept+res.slope*pts[pts.length-1].x],[atShow,res.intercept+res.slope*atShow]],tip:"projection"});}
  /* The y-scale is set by what is plotted — the values and their control limits. A
     specification far outside that range would squeeze the data into a sliver, so it is
     drawn only when it is near the data and is otherwise reported in words. */
  const core=pts.flatMap(p=>[p.y,p.y2,p.ucl,p.lcl]).filter(Number.isFinite);
  const cLo=Math.min(...core),cHi=Math.max(...core),cSpan=Math.max(1e-9,cHi-cLo);
  const nearScale=v=>Number.isFinite(v)&&v>=cLo-0.6*cSpan&&v<=cHi+0.6*cSpan;
  const hlFar=hl.filter(h=>!nearScale(h.y));
  const hlNear=hl.filter(h=>nearScale(h.y));
  const ys=core.concat(hlNear.map(h=>h.y)).concat(res.reach&&!clipped&&nearScale(res.reach.limit)?[res.reach.limit]:[]).filter(Number.isFinite);
  const xs=px.concat(res.reach?[atShow]:[]),[xa,xb]=extent(xs,0.03);
  const xticks=res.X.kind==="date"?niceTicks(xa,xb,6).map(v=>({v,label:sopFmtTime(v*864e5).slice(0,10)}))
    :res.X.kind==="order"?niceTicks(xa,xb,8).filter(v=>Number.isInteger(v)).map(v=>({v,label:String(v)})):undefined;
  const legend=byOp?legendFromMap(opCol):bySeg?legendFromMap(segCol).concat([{label:"outside limits",colour:CC_COL.bad},{label:"pattern, in limits",colour:CC_COL.rule}])
    :[{label:"in control",colour:CC_COL.pt},{label:"outside limits",colour:CC_COL.bad},{label:"pattern, in limits",colour:CC_COL.rule},{label:"centre / fitted line",colour:"#16a34a"},{label:"control limits",colour:"#475569"}];
  const ylab=res.type==="cusum"?"CUSUM (σ units): upper / lower":res.type==="ewma"?`EWMA of ${unit}`:res.type==="p"?`share (${unit})`:res.type==="u"?unit:unit;
  const vl=ccVersionMarks(res);if(res.shift)vl.push({x:res.shift.x-0.5*(res.X.kind==="order"?1:0),label:"shift starts",colour:"#7c3aed",dash:"3 3"});if(Number.isFinite(res.baseX))vl.push({x:res.baseX,label:"new baseline",colour:"#0f766e",dash:"6 3"});
  (res.segments||[]).slice(1).forEach((sg,i)=>vl.push({x:sg.x-0.5*(res.X.kind==="order"?1:0),label:"",colour:segColour(segCol,sg.key),dash:"2 4"}));
  const tx=[];
  hlFar.forEach((h,i)=>tx.push({px:null,x:pts[0].x,y:(h.y<cLo?cLo:cHi),
    text:`${h.label} — ${h.y<cLo?"below":"above"} this scale`,anchor:"start",size:11,colour:"#7f1d1d"}));
  if(res.reach&&clipped)tx.push({px:null,x:atShow,y:res.intercept+res.slope*atShow,text:`→ limit ${fmtTick(+res.reach.limit.toPrecision(3))} beyond this chart`,anchor:"end",size:10,colour:"#7c3aed"});
  return svgPlot({title,x:[xa,xb],y:extent(ys,0.08),xticks,xlab:res.X.label,ylab,series,hlines:hlNear,vlines:vl,legend,texts:tx});
}
