function curveRowsSelected(){
  const run=runAt("#curve-run",0);if(!run)return [];
  const key=$("#curve-target").value,sig=curveSignal(run),smp=$("#curve-sample").value;
  let rows=selectedWells(run,key);
  if(smp)rows=rows.filter(w=>(w.sample||"")===smp);
  if(sig==="drn")return rows.filter(w=>w.eds&&w.eds.drn&&w.eds.drn.length).map(w=>Object.assign({},w,{curve:w.eds.drn}));
  if(sig==="mc"||sig==="raw"){
    const p=run.eds,out=[];
    uniq(rows.map(w=>w.pos)).forEach(pos=>{
      const w=rows.find(x=>x.pos===pos);
      if(sig==="mc")Object.entries(p.mc.signal[pos]||{}).forEach(([dye,arr])=>out.push(Object.assign({},w,{curve:arr,
        target:dye,analysis:"Multicomponent "+dye,analysisUid:"mc:"+dye,filterName:dye,filterComb:QS_DYE_FILTER[dye.toUpperCase()]||""})));
      else p.raw.sets.forEach(fs=>out.push(Object.assign({},w,{curve:(p.raw.data[fs]||[]).map(r=>r?r[pos]:NaN),
        target:fs,analysis:"Raw "+fs,analysisUid:"raw:"+fs,filterName:fs,filterComb:fs})));
    });
    return out.filter(w=>w.curve.length);
  }
  rows=rows.filter(w=>w.curve&&w.curve.length);
  return key||smp?rows:physicalCurveRows(rows);
}
