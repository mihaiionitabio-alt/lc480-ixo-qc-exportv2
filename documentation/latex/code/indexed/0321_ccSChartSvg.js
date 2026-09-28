function ccSChartSvg(res){
  const pts=res.pts.filter(p=>Number.isFinite(p.s)&&!p.pre);if(!pts.length)return "";
  return svgPlot({title:"S chart (within-run spread)",height:230,x:extent(pts.map(p=>p.x),0.03),y:[0,Math.max(...pts.map(p=>Math.max(p.s,p.sUcl||0)))*1.15],xlab:res.X.label,ylab:"S",
    series:[{type:"line",colour:"#94a3b8",width:1,data:pts.map(p=>[p.x,p.s])},{type:"line",colour:"#475569",dash:"6 4",data:pts.map(p=>[p.x,p.sUcl])},
      {type:"points",r:3.5,data:pts.map(p=>[p.x,p.s,`${p.row.run}: S = ${fmtTick(+p.s.toPrecision(3))}`,p.flags.some(f=>/spread/.test(f))?CC_COL.bad:CC_COL.pt])}],
    hlines:[{y:res.sbar,label:"S̄",colour:"#16a34a",dash:"1 0"}]});
}
