function ccChartRows(def,res,variant){
  if(res.type==="funnel")return res.pts.map(p=>({operator:p.operator,n:p.n,bad:p.bad,rate:p.y,limit95:p.u95,limit998:p.u998,flags:p.flags.join("; ")}));
  return res.pts.map(p=>({experiment:p.row.run,date:sopFmtTime(p.row.date),operator:pseudoOn()?"":p.row.operator,x:p.x,value:p.raw!==undefined?p.raw:p.y,plotted:p.y,
    centre:p.cl,ucl:p.ucl,lcl:p.lcl,s:p.s??"",direction:p.flags.length?ccAlarmDir(p,res):"",signal:ccSignal(p),
      plotted_lower:res.type==="cusum"?p.y2:"",signal_side:res.type==="cusum"?(p.sigHi?"upper":p.sigLo?"lower":""):"",
      extract:p.segment||"",flags:p.flags.join("; "),baseline:p.pre?"before baseline":"",
    chart:def.code,type:res.type,variant:variant||"",sop_sha256:sopHash()}));
}
