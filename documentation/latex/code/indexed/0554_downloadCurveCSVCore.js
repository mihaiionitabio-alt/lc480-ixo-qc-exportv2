function downloadCurveCSVCore(){
  const run=runAt("#curve-run",0),rows=[];
  curveRowsSelected().forEach(w=>w.curve.forEach((v,i)=>rows.push({experiment:runName(run),well:w.well,
    sample:exportName(w.sample),target:w.target,analysis:w.analysis,channel_index:w.channel,
    filter:w.filterComb||w.filterName||"",role:w.role,call:w.call,signal:curveSignal(run),cycle:i+1,fluorescence:v})));
  if(rows.length)download(baseName()+"_amplification_curves.csv",
    toCSV(Object.keys(rows[0]).map(k=>({key:k,label:k})),rows),"text/csv");
}
