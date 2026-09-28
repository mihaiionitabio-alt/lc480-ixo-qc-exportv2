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
      instrType:task.task||"",instrRole:QS_TASK_ROLE[task.task]||"",givenConc:task.quantity,
      targetName:x.target,targetType:ec?(x.target===ec?"dtReference":"dtTarget"):"",
      replicateOf:undefined,subsetsOfWell:[],IsIncluded:x.omit?"0":"1",manual:"",
      warnCodes:x.flags.map(EDS.flagName).join(" "),
      warnDesc:x.flags.map(f=>(EDS.FLAGS[f]||[])[1]||f).join("; "),
      CpRaw:x.undetermined?null:x.ct,Cp:x.undetermined?null:x.ct,
      callCode:amp.code,call:amp.call,curve:x.rn&&x.rn.length?x.rn:null,
      CpUncertain:"",CpState:x.undetermined?"Undetermined":"",CrossingPointStatus:x.undetermined?"Undetermined":"",
      CalcConc:x.qty??(x.f&&x.f[8]!==undefined&&x.f[8]!==""?Number(x.f[8]):""),ConcStatus:"",StandardConc:task.quantity??"",CalcConcUnc:"",
      eds:{ampLabel:amp.label,ampCode:x.amp,cqConf:x.conf,flags:x.flags,ctMean:x.ctMean,ctSd:x.ctSd,
        dct:x.ddct?x.ddct.dct:x.dct,ddct:x.ddct||null,threshold:x.threshold,ctRecalc:x.ctRecalc,
        ctDelta:x.ctDelta,undetermined:x.undetermined,drn:x.drn,omit:x.omit}
    });
  });
  const cal=A.ddct.Calibrator||"";
  const rqResults=EDS.studyRows(p).map(s=>{
    const mt=wells.find(w=>w.sample===s.sample&&w.target===s.target)||{},
      mr=wells.find(w=>w.sample===s.sample&&w.target===ec)||{};
    return {kind:"relquant",analysis:`${kindLabel} — ${s.target}`,analysisUid:"eds:"+s.target,analysisKind:"relquant",
      rule:"ΔΔCt",pairingName:"",well:"",refWell:"",pos:null,sample:s.sample,isCalibrator:s.sample===cal,
      target:s.target,targetTargetName:s.target,referenceName:ec,
      targetCp:(mt.eds||{}).ctMean??null,targetCpSD:(mt.eds||{}).ctSd??null,
      refCp:(mr.eds||{}).ctMean??null,refCpSD:(mr.eds||{}).ctSd??null,
      concRatio:null,concRatioSD:null,normRatio:s.rq,normRatioSD:null,
      rqMin:s.rqMin,rqMax:s.rqMax,dctMean:s.mean,dctMedian:s.median,dctSd:s.sd,dctSe:s.se,ddct:s.ddct,n:s.df!=null?s.df+1:"",
      targetCall:"",refCall:"",concStat:"",normStat:"",hasConcError:false,hasNormError:false,externalCurve:false,
      correction:"",multiplication:"",coveredPairings:""};
  });
  const QI=EDS.qsInstrument(p);
  const e=p.exp,props=Object.assign({instrumentType:QI.type?`${QI.type.replace("™","").replace(" System","")} - ${QI.block}`:"",
    instrumentSerialNumber:QI.serial,instrumentName:QI.name},p.exp.props||{}),oldestCal=p.calibrations.map(c=>c.ts).filter(Boolean);
  const meta={
    name:e.name,UID:"",Created:isoLocal(e.created),CreatedByName:e.operator||"",
    LastModified:isoLocal(e.modified),LastModifiedByName:"",
    SWVersion:`${p.manifest["Implementation-Title"]||""} ${p.manifest["Implementation-Version"]||""}`.trim(),
    AppliedTemplates:"",State:e.runState,Notes:p.plate.description||"",
    RunCreated:"",StartTime:isoLocal(e.runStart),EndTime:isoLocal(e.runEnd),
    InstrumentName:(props.instrumentName||"").trim()||props.instrumentType||"QuantStudio",
    InstrumentVersion:(p.inst||{}).firmware||"",InstrumentID:props.instrumentSerialNumber||(p.inst||{}).sn||"",
    SerialNumber:props.instrumentSerialNumber||(p.inst||{}).sn||"",PlateID:p.plate.barcode||"",
    Technician:e.operator||"",InstrCalibrationDate:oldestCal.length?isoLocal(Math.min(...oldestCal)):"",
    RevsComplete:"",MacroName:"",MacroOwner:"",
    Platform:"QuantStudio 3/5 (.eds)",InstrumentType:props.instrumentType||"",BlockSerial:props.blockSerialNumber||"",
    ExperimentType:e.typeName,Chemistry:e.chemistry,RunState:e.runState,OriginalPath:e.fileName,
    DocumentSpecification:p.manifest["Specification-Version"]||"",
    TamperStored:p.tamper.stored,TamperComputed:p.tamper.computed,
    sourceCRC32:crc32(source.bytes).toString(16).padStart(8,"0"),sourceSHA256:p.sha256,sourceBytes:source.bytes.length
  };
  return {
    file:source.name,sourcePath:source.path||source.name,sourceArchive:source.archive||null,zip:null,
    platform:"QuantStudio",eds:p,isTemplate:p.isTemplate,
    meta,wells,tmWells:[],genoResults:[],rqResults,otherResults:[],allCurves,
    plate,subsets:[],analyses,nCycles:p.results.length?(p.amplificationCycles||null):null,
    amplificationCycles:p.amplificationCycles||0,acquisitionCycles:p.acquisitionCycles||0,
    meltAcquisitionPoints:p.meltAcquisitionPoints||0,acqStats:[],acqError:null,
    protocol:{programs,channels,
      block:{id:e.blockTypeId||String(p.protocol.blockId||""),rowCount:rows,colCount:cols,volDefault:p.protocol.volume},
      setup:{channelCount:channels.length,subclass:e.instrumentTypeId,sampleVolume:p.protocol.volume,plateId:p.plate.barcode||"",
        maxPositions:rows*cols},
      detectionFormatName:`QuantStudio filter sets ${p.protocol.filters.join(", ")}`,analysisModes:[e.typeName].filter(Boolean),
      hasTemperatureLog:!!(p.log&&p.log.temps.length)},
    acqMelt:null,acqSegments:[],acqAcquisitions:p.quantCount||0,acqScalingFactors:[],identities:{},duplicates:0,
    namedPositions:p.plate.wells.filter(w=>w.sample).length,maxPos:rows*cols,cols,rows,
    blockId:e.blockTypeId||"",kinds:[kind],
    format:{signature:`QuantStudio EDS ${p.manifest["Specification-Version"]||""}`.trim(),version:p.manifest["Implementation-Version"]||""},
    integrity:{kind:"eds",zipCrcOk:p.crcOk,zipCrcBad:p.crcBad,entries:p.entries.length,
      stored:p.tamper.stored,computed:p.tamper.computed,ok:p.tamper.ok}
  };
}
