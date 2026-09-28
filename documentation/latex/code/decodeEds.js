async function decodeEds(source){
  const p=await EDS.parseEds(source.name,source.bytes);
  const cols=p.plate.cols||12,rows=p.plate.rows||8,A=p.analysis,ec=A.ddct.EndogenousControl||"";
  const dyes=p.mc.dyes.length?p.mc.dyes:uniq(p.exp.detectors.map(d=>d.reporter).filter(Boolean));
  const dyeIdx=d=>{const i=dyes.indexOf(d);return i<0?0:i;};
  const reporterOf=t=>(p.exp.detectors.find(d=>d.name===t)||{}).reporter||"";
  const channels=dyes.map(d=>{const fs=QS_DYE_FILTER[String(d).toUpperCase()]||"";
    const passive=p.plate.passiveRef&&p.plate.passiveRef.toUpperCase()===String(d).toUpperCase();
    return {name:passive?`${d} (passive reference)`:d,active:true,ex:fs.split("-")[0]||"",em:fs.split("-")[1]||"",filterSet:fs,
      collected:fs?p.protocol.filters.includes(fs):null,integr:"",maxIntegr:"",meltFactor:"",quantFactor:""};});
  const programs=p.protocol.stages.map(s=>({name:s.flag,cycles:s.reps,
    mode:s.steps.some(x=>x.collect)?(/DISSOC|MELT/i.test(s.flag)?"Melting Curves":"Quantification"):"None",
    segments:s.steps.map(x=>({target:x.temps[0],target2:new Set(x.temps).size>1?Math.max(...x.temps):"",
      hold:x.hold,slope:x.ramp,acqMode:x.collect?(x.collectMode||"Single"):"None",acqPerDeg:"",stepSize:"",stepDelay:""}))}));
  const plate={};
  p.plate.wells.forEach(w=>{
    const ch={};
    w.tasks.forEach(t=>{ch[dyeIdx(t.reporter)]={sampleType:t.task,targetName:t.target,
      targetType:ec?(t.target===ec?"dtReference":"dtTarget"):""};});
    plate[w.i]={name:w.sample,sampleId:"",notes:w.comment,channels:ch,subsets:[]};
  });
  const [kind,kindLabel]=QS_KIND[p.exp.typeId]||["other",p.exp.typeName||"QuantStudio analysis"];
  const targets=uniq([...p.exp.detectors.map(d=>d.name),...p.targets]).filter(Boolean);
  const analyses=targets.map(t=>{
    const ds=A.detectors[t]||A.defaults||{},rep=reporterOf(t),fs=QS_DYE_FILTER[String(rep).toUpperCase()]||"";
    const res=p.results.filter(x=>x.target===t);
    const stats=new Map();
    res.filter(x=>x.sample&&!x.undetermined).forEach(x=>{
      if(!stats.has(x.sample))stats.set(x.sample,{master:x.sample,wells:[],cpAvg:x.ctMean,cpSD:x.ctSd});
      stats.get(x.sample).wells.push(x.pos);});
    return {name:`${kindLabel} — ${t}`,shortName:t,uid:"eds:"+t,kind,kindLabel,cls:`QuantStudio ${p.exp.typeId||""}`.trim(),
      subsetName:t,calcState:p.exp.finalAnalysis==="true"?"analysed":"not analysed",
      channelIdx:dyeIdx(rep),channelName:rep,filterName:rep,filterComb:fs,
      cpMethod:"Threshold cycle (Ct)",cccEnabled:true,ccNote:"multicomponent (pure-dye) deconvolution",
      created:isoLocal(p.exp.created),modified:"",createdBy:p.exp.operator||"",modifiedBy:"",
      nResults:res.length,channelMismatch:null,channelSignal:null,
      stdCurve:(p.stdCurves||{})[t]?{source:"analysis_result.txt Std Curve Results",curveType:"fitted",
        slope:p.stdCurves[t].slope,yIntercept:p.stdCurves[t].yIntercept,r2:p.stdCurves[t].r2,
        efficiency:p.stdCurves[t].slope<0?Math.pow(10,-1/p.stdCurves[t].slope):null,
        efficiencyPercent:p.stdCurves[t].efficiency,fitError:""}:null,
      settings:{threshold:ds.threshold,autoThreshold:ds.autoCt,autoBaseline:ds.autoBaseline,baselineStart:ds.bStart,baselineEnd:ds.bStop},
      quantStats:[...stats.values()].map(s=>({master:s.master,sampleIds:s.wells.join(" "),count:s.wells.length,
        cpAvg:s.cpAvg,cpSD:s.cpSD,concAvg:"",concSD:"",method:"stored Ct Mean / Ct SD"}))};
  });
  const wells=[],allCurves={};
  p.results.forEach(x=>{
    const ci=dyeIdx(x.reporter||reporterOf(x.target)),pos=x.well;
    if(x.rn&&x.rn.length){
      const amp=Math.max(...x.rn)-Math.min(...x.rn);
      allCurves[`${ci}|${pos}`]={channel:ci,pos,curve:x.rn,amplitude:amp};
    }
    if(!x.sample)return;
    const w=p.plate.wells[pos]||{},task=(w.tasks||[]).find(t=>t.target===x.target)||{};
    const amp=QS_AMP[String(x.amp).trim()]||{call:"NotCalculated",code:3,label:x.ampLabel||String(x.amp)};
    wells.push({
      kind:"quant",well:posToWell(pos,cols),pos,row:Math.floor(pos/cols),col:pos%cols,
      sample:x.sample,sampleId:"",notes:w.comment||"",target:x.target,
      analysis:`${kindLabel} — ${x.target}`,analysisShort:x.target,analysisUid:"eds:"+x.target,analysisKind:kind,
      analysisGroup:"eds:ct",analysisGroupName:"Threshold cycle (Ct)",
      channel:ci,filterName:x.reporter,filterComb:QS_DYE_FILTER[String(x.reporter).toUpperCase()]||"",
// … 69 more line(s): the complete code is at lines 3671–3739 of the HTML file