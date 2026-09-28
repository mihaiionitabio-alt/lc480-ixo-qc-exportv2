async function decodeIxo(source,geomPref){
  const raw=source.text,end=raw.indexOf("</objectstream>");
  const dom=new DOMParser().parseFromString(end>=0?raw.slice(0,end+15):raw,"application/xml");
  if(dom.querySelector("parsererror"))throw new Error("XML parse error");

  /* Experiment and run provenance live at different levels. Scope each property
     so a nested object's Created/LastModified value can never be mistaken for the
     experiment's, and keep the four distinct run timestamps distinct. */
  const expObj=dom.querySelector('[class="HTCExperiment"]'),runObj=dom.querySelector('[class="HTCRun"]');
  const from=(el,k)=>pv(el,k)||propText(dom,k);
  const meta={
    name:from(expObj,"name"),UID:from(expObj,"UID"),
    Created:from(expObj,"Created"),CreatedByName:from(expObj,"CreatedByName"),
    LastModified:from(expObj,"LastModified"),LastModifiedByName:from(expObj,"LastModifiedByName"),
    SWVersion:from(expObj,"SWVersion"),AppliedTemplates:from(expObj,"AppliedTemplates"),
    State:from(expObj,"State"),Notes:from(expObj,"Notes"),
    RunCreated:from(runObj,"Created"),StartTime:from(runObj,"StartTime"),EndTime:from(runObj,"EndTime"),
    InstrumentName:from(runObj,"InstrumentName"),InstrumentVersion:from(runObj,"InstrumentVersion"),
    InstrumentID:from(runObj,"InstrumentID"),PlateID:from(runObj,"PlateID"),
    Technician:from(runObj,"Technician"),InstrCalibrationDate:from(runObj,"InstrCalibrationDate"),
    RevsComplete:from(runObj,"RevsComplete"),MacroName:from(runObj,"MacroName"),
    MacroOwner:from(runObj,"MacroOwner"),
    sourceCRC32:source.bytes?crc32(source.bytes).toString(16).padStart(8,"0"):"",
    sourceSHA256:source.bytes?await sourceSha256(source.bytes):"",
    sourceBytes:source.bytes?source.bytes.length:""
  };
  if(!meta.AppliedTemplates){const it=dom.querySelector('list[name="AppliedTemplates"] item');if(it&&it.textContent)meta.AppliedTemplates=it.textContent.trim();}
  const identities={};["Id","InstrumentID","PlateID","OwnerUID","UID","SubsetID"].forEach(k=>identities[k]=uniq(propValues(dom,k)));

  const plate=decodePlateModel(dom);
  const subsets=decodeSubsets(dom);
  const protocol=decodeProtocol(dom);
  const analyses=decodeAnalyses(dom);

  /* plate geometry: the block type is authoritative (LIMS guide, HTCBlockType RowCount/ColCount) */
  let rows,cols;
  if(protocol.block&&protocol.block.rowCount>0&&protocol.block.colCount>0){
    rows=protocol.block.rowCount;cols=protocol.block.colCount;
  }else{
    const seen=Math.max(96,...analyses.map(a=>a.maxPos||0),
      (protocol.setup&&protocol.setup.maxPositions)||0,...Object.keys(plate).map(x=>Number(x)+1));
    cols=seen>96?24:12;rows=seen>96?16:8;
  }
  if(geomPref==="96"){rows=8;cols=12;}
  else if(geomPref==="384"){rows=16;cols=24;}
  const maxPos=rows*cols;

  /* Excitation wavelength -> acquisition / plate-model channel index.
     ChannelIdx and AcquisitionStore.Channel number the ACTIVE channels in detection-format
     order. Inactive declarations do not consume an index. This matters for Roche's dual-colour
     hydrolysis demo: Cyan 500 is declared first but inactive, while FAM and Hex are stored as
     channels 0 and 1. Counting the inactive declaration loses every Hex curve and attaches the
     FAM plate properties to Hex. Sorting wavelengths remains only a last resort. */
  const ex2chan={},chanName={},exem2chan={};
  const acquisitionChannels=protocol.channels.some(c=>c.active)
    ? protocol.channels.filter(c=>c.active) : protocol.channels;
  acquisitionChannels.forEach((c,i)=>{
    if(Number.isFinite(c.ex)&&!(c.ex in ex2chan)){ex2chan[c.ex]=i;chanName[c.ex]=c.name;}
    /* Two channels can share an excitation filter (533-580 and 533-610 in the four-channel
       COVID format). The excitation/emission pair is therefore the key; excitation alone is
       only the fallback for analyses that do not name an emission wavelength. */
    if(Number.isFinite(c.ex)&&Number.isFinite(c.em)&&!(`${c.ex}-${c.em}` in exem2chan))exem2chan[`${c.ex}-${c.em}`]=i;
  });
  if(!Object.keys(ex2chan).length){
    const exs=[...dom.querySelectorAll('prop[name="ExcitationWL"]')].map(e=>parseInt(e.textContent)).filter(Number.isFinite);
    uniq(exs).sort((a,b)=>a-b).forEach((e,i)=>ex2chan[e]=i);
  }
  const fallback={465:0,533:1,498:2,610:3,640:4};

  let acq={channels:null,melt:null,scalingFactors:[],error:null};
  try{acq=await decodeAcq(raw,protocol);}catch(err){acq={channels:null,melt:null,scalingFactors:[],error:err.message};}
  const channels=acq.channels,cycles={};
  if(channels)for(const c in channels)cycles[c]=Object.keys(channels[c]).map(Number).sort((a,b)=>a-b);
  const meltTraceFor=(analysis,chanIdx,pos)=>{
    if(!acq.melt)return null;
    let segments=acq.melt.filter(s=>(s.points||[]).some(p=>p.channel===chanIdx));
    if(!segments.length)return null;
    const selected=String((analysis.settings||{}).selectedProgram||"").trim();
    const analysisName=String(analysis.name||"");
    const exact=segments.filter(s=>s.programName&&(s.programName===selected
      ||analysisName.toLowerCase().includes(s.programName.toLowerCase())));
    if(exact.length)segments=exact;
    else if(selected){
      const n=Number(selected);
      const numeric=segments.filter(s=>Number.isFinite(n)&&(s.program===n||s.program+1===n));
      if(numeric.length)segments=numeric;
    }
    /* Never concatenate independent temperature ramps. If the analysis cannot be
       tied to one program, omit the raw melt trace rather than exporting a curve
       that never existed. The instrument's stored Tm peaks remain available. */
    if(segments.length!==1)return {points:null,ambiguous:true,candidates:segments.map(s=>({
      program:s.program,segment:s.segment,programName:s.programName
    }))};
    const s=segments[0],points=(s.points||[])
      .filter(p=>p.channel===chanIdx&&Number.isFinite(p.temp)&&p.values&&Number.isFinite(p.values[pos]))
      .map(p=>({temp:p.temp,fluor:p.values[pos],scalingFactor:p.scalingFactor}));
    return points.length?{points,program:s.program,segment:s.segment,programName:s.programName,ambiguous:false}:null;
  };

  const subsetsOfPos={};
  subsets.forEach(s=>{if(s.useAll)return;s.items.forEach(p=>{(subsetsOfPos[p]??=[]).push(s.name);});});

  const wells=[],tmWells=[],genoResults=[],rqResults=[],otherResults=[];
  const seen=new Set();let duplicates=0;

  analyses.forEach(a=>{
    const target=a.subsetName||a.name;
    const pairKey=`${a.numeratorXWL}-${a.numeratorEWL}`;
    const chanIdx=(a.numeratorXWL!=null&&a.numeratorEWL!=null&&pairKey in exem2chan)?exem2chan[pairKey]
      :(a.numeratorXWL!=null&&a.numeratorXWL in ex2chan)?ex2chan[a.numeratorXWL]
      :(a.numeratorXWL!=null?(fallback[a.numeratorXWL]??0):0);
    const chDef=protocol.channels.find(c=>c.ex===a.numeratorXWL&&(a.numeratorEWL==null||c.em===Number(a.numeratorEWL)))
      ||protocol.channels.find(c=>c.ex===a.numeratorXWL);
    a.channelIdx=chanIdx;
    a.channelName=chDef?chDef.name:(chanName[a.numeratorXWL]||"");
    a.filterName=a.channelName;
    /* An analysis whose name contains the name of a DIFFERENT detection channel is reading a
       channel other than the one it appears to be named after. That is legitimate - an
       operator may name an analysis anything - but it is worth surfacing, because it changes
       what the numbers mean. */
    const others=protocol.channels.filter(c=>c.name&&c.name!==a.channelName);
    const claimed=others.find(c=>new RegExp("\\b"+c.name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b","i").test(a.name||""));
    a.channelMismatch=(claimed&&a.channelName&&!new RegExp("\\b"+a.channelName.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b","i").test(a.name||""))
      ? {named:claimed.name,reading:a.channelName} : null;
    a.filterComb=a.numeratorXWL!=null
      ? `${a.numeratorXWL}-${a.numeratorEWL??(chDef?chDef.em:"")}`
      : (chDef?`${chDef.ex}-${chDef.em}`:"");
    if(a.denominatorXWL!=null)a.filterComb+=" / "+a.denominatorXWL+"-"+(a.denominatorEWL??"");
    const recs=analysisResults(a,cols);
    a.nResults=recs.length;
    a.resultKinds=uniq(recs.map(r=>r.kind));
    recs.forEach(rec=>{
      const pos=rec.pos,d=rec.d,lists=rec.lists;
      const prec=plate[pos]||{},ch=(prec.channels||{})[chanIdx]||{};
      const base={
        well:posToWell(pos,cols),pos,row:Math.floor(pos/cols),col:pos%cols,
        sample:prec.name||"",sampleId:prec.sampleId||"",notes:prec.notes||"",
        target,analysis:a.name,analysisShort:a.shortName,analysisUid:a.uid,analysisKind:a.kind,
        /* Measurements that may be pooled: different targets of the same quantification
           method belong together, but a second-derivative and a fit-points reading of the
           same wells do not, and neither do two relative quantification analyses. */
        analysisGroup:a.parentUid||a.cpMethod||a.uid,
        analysisGroupName:a.parentName||a.cpMethod||a.name,
        channel:chanIdx,filterName:a.filterName,filterComb:a.filterComb,
        instrType:ch.sampleType||"",instrRole:TYPE_TO_ROLE[ch.sampleType]||"",
        givenConc:ch.givenConc,cpLow:ch.cpLow,cpHigh:ch.cpHigh,rqEfficiency:ch.rqEfficiency,
        targetName:ch.targetName||"",targetType:ch.targetType||"",
        dominantChannel:prec.dominantChannel,
        replicateOf:prec.replicateOf,subsetsOfWell:subsetsOfPos[pos]||[],
        IsIncluded:d.IsIncluded??"",manual:d.ManualCall??d.ManualTms??d.ManualGroup??"",
        warnCodes:d.WarnCodes??"",warnDesc:d.WarnDesc??""
      };
      if(rec.kind==="quant"){
        const key=target+"|"+a.uid+"|"+pos;
        if(seen.has(key)){duplicates++;return;}
        seen.add(key);
        const rawCq=Number(d.CrossingPoint),callCode=Number(d.Call??3);
        const curve=(channels&&channels[chanIdx]&&cycles[chanIdx])?cycles[chanIdx].map(c=>channels[chanIdx][c][pos]):null;
        wells.push(Object.assign(base,{
          kind:"quant",
          CpRaw:Number.isFinite(rawCq)?rawCq:null,Cp:Number.isFinite(rawCq)&&rawCq>0?rawCq:null,
          callCode,call:CALL[callCode]??String(callCode),curve,
          CpUncertain:d.CpUncertain??"",CpState:d.CpState??"",CrossingPointStatus:d.CrossingPointStatus??"",
          CalcConc:d.CalcConc??"",ConcStatus:d.ConcStatus??"",StandardConc:d.StandardConc??"",
          CalcConcUnc:d.CalcConcUnc??""
        }));
      }else if(rec.kind==="tm"){
        /* the peak lists are fixed-length and zero-padded; TmCount gives the real number */
        const nPk=Number.isFinite(Number(d.TmCount))?Number(d.TmCount):(lists.Tms||[]).filter(v=>v>0).length;
        const cut=a=>(a||[]).slice(0,nPk);
        const meltTrace=meltTraceFor(a,chanIdx,pos);
        tmWells.push(Object.assign(base,{
          kind:"tm",tms:cut(lists.Tms),shoulders:(lists.Shoulder||[]).slice(0,nPk).filter(v=>v>0),
          areas:cut(lists.Amounts),heights:cut(lists.Heights),widths:cut(lists.Widths),
          callCode:d.Call===undefined?null:Number(d.Call),nPeaks:nPk,showShoulder:d.ShowShoulder==="1",
          manualTms:d.ManualTms??"",meltCurve:meltTrace&&meltTrace.points,
          meltProgram:meltTrace&&meltTrace.programName||"",meltProgramIndex:meltTrace&&meltTrace.program,
          meltSegment:meltTrace&&meltTrace.segment,meltCurveAmbiguous:!!(meltTrace&&meltTrace.ambiguous),
          CpRaw:null,call:"",curve:null
        }));
      }else if(rec.kind==="genotype"){
        genoResults.push(Object.assign(base,{
          kind:"genotype",
          /* Endpoint Genotyping stores the genotype itself in Call. Gene Scanning
             and Melt Curve Genotype store an integer Call state and the textual
             genotype in GroupName (LIMS guide, Tables 6-25 and 6-26). */
          callText:a.kind==="endptgeno"?(d.Call??""):(d.GroupName??""),
          callCode:a.kind==="endptgeno"?null:(d.Call===undefined?null:Number(d.Call)),
          score:d.Score===undefined?null:Number(d.Score),
          groupName:d.GroupName??"",res:d.Res??"",
          peakWt:d.PeakWtFluor===undefined?null:Number(d.PeakWtFluor),
          peakMut:d.PeakMutFluor===undefined?null:Number(d.PeakMutFluor)
        }));
      }else if(rec.kind==="relquant"){
        rqResults.push(Object.assign(base,{
          kind:"relquant",pairingName:d.PairingName??"",
          targetTargetName:d.TargetTargetName??"",referenceName:d.ReferenceReferenceName??"",
          targetCp:d.TargetCpMedian===undefined?null:Number(d.TargetCpMedian),
          targetCpSD:d.TargetCpMedianSTD===undefined?null:Number(d.TargetCpMedianSTD),
          refCp:d.RefCpMedian===undefined?null:Number(d.RefCpMedian),
          refCpSD:d.RefCpMedianSTD===undefined?null:Number(d.RefCpMedianSTD),
          concRatio:d.ConcRatio===undefined?null:Number(d.ConcRatio),
          concRatioSD:d.ConcRatioSTD===undefined?null:Number(d.ConcRatioSTD),
          normRatio:d.NormRatio===undefined?null:Number(d.NormRatio),
          correction:d.CorrectionFactor??"",multiplication:d.MultiplicationFactor??""
        }));
      }else otherResults.push(Object.assign(base,{kind:"other",raw:d}));
    });
  });

  /* Relative quantification stores its result sets outside the per-position model: one
     group per target gene, each holding the calibrator result and one result per pairing. */
  const nameAt=pos=>((plate[pos]||{}).name)||"";
  analyses.filter(a=>a.kind==="relquant"&&a.relQuant).forEach(a=>{
    const rq=a.relQuant;
    rq.groups.forEach(g=>{
      const refLabel=g.references.join("; ");
      const push=(res,label)=>{
        if(!res)return;
        const targetWell=res.pairName?res.pairName.split("/")[0]:"";
        const refWell=res.pairName&&res.pairName.indexOf("/")>=0?res.pairName.split("/")[1]:"";
        const tp=targetWell?wellToPos(targetWell,cols):null;
        rqResults.push({
          kind:"relquant",analysis:a.name,analysisUid:a.uid,analysisKind:"relquant",
          rule:rq.rule,pairingName:res.pairName||label,
          well:targetWell,refWell,pos:tp,
          sample:res.isCalib?"calibrator":(tp!=null?nameAt(tp):""),
          isCalibrator:res.isCalib,
          target:g.target,targetTargetName:g.target,referenceName:refLabel,
          targetCp:res.targetCp,targetCpSD:res.targetCpSD,
          refCp:res.refCp,refCpSD:res.refCpSD,
          concRatio:res.concRatio,concRatioSD:res.concRatioSD,
          normRatio:res.normRatio,normRatioSD:res.normRatioSD,
          targetCall:res.targetCall,refCall:res.refCall,
          concStat:res.concStat,normStat:res.normStat,
          hasConcError:res.hasConcError,hasNormError:res.hasNormError,
          externalCurve:res.externalCurve,
          correction:rq.correction,multiplication:rq.multiplication,
          coveredPairings:res.pairings.join(" ")
        });
      };
      push(g.calib,"calibrator");
      g.unknowns.forEach(u=>push(u,""));
    });
  });
  /* The LIMS interface export writes the same information as flat RelQuantResults records
     rather than as result groups, so accept that shape too - but only where the structural
     decoding above produced nothing, so nothing is counted twice. */
  if(!rqResults.length)dom.querySelectorAll('[class*="RelQuantResult"]').forEach(el=>{
    const d={};el.querySelectorAll(':scope > prop').forEach(pr=>d[pr.getAttribute("name")]=(pr.textContent||"").trim());
    if(!("NormRatio" in d)&&!("ConcRatio" in d))return;
    const num=t=>d[t]===undefined||d[t]===""?null:Number(d[t]);
    rqResults.push({kind:"relquant",analysis:"",analysisKind:"relquant",rule:"",
      pairingName:d.PairingName??d.PairName??"",well:"",refWell:"",pos:null,
      sample:d.SampleName??"",isCalibrator:false,
      target:d.TargetTargetName??"",targetTargetName:d.TargetTargetName??"",
      referenceName:d.ReferenceReferenceName??"",
      targetCp:num("TargetCpMedian"),targetCpSD:num("TargetCpMedianSTD"),
      refCp:num("RefCpMedian"),refCpSD:num("RefCpMedianSTD"),
      concRatio:num("ConcRatio"),concRatioSD:num("ConcRatioSTD"),
      normRatio:num("NormRatio"),normRatioSD:num("NormRatioSTD"),
      targetCall:d.TargetCall??"",refCall:d.RefCall??"",
      concStat:d.ConcRatioStat??"",normStat:d.NormRatioStat??"",
      hasConcError:d.HasConcError==="1",hasNormError:d.HasNormError==="1",
      externalCurve:d.ExtCurve==="1",
      correction:d.CorrectionFactor??"",multiplication:d.MultiplicationFactor??"",
      coveredPairings:""});
  });

  /* Which channel does each analysis's signal actually live in?
     An analysis names a filter combination, but nothing guarantees that the wells it covers
     were labelled with the dye that channel detects. Comparing the fluorescence rise of the
     same wells across every decoded channel answers it from the data: if another channel
     carries a substantially larger rise, the analysis is reading the wrong one. */
  if(channels&&Object.keys(channels).length>1){
    const chIdx=Object.keys(channels).map(Number).sort((a,b)=>a-b);
    analyses.forEach(a=>{
      const pos=uniq(wells.filter(w=>w.analysisUid===a.uid).map(w=>w.pos));
      if(pos.length<3)return;
      const profile=chIdx.map(ci=>{
        const cyc=cycles[ci];
        if(!cyc||!cyc.length)return {channel:ci,median:null};
        const rises=pos.map(p=>{
          const v=cyc.map(c=>channels[ci][c][p]).filter(Number.isFinite);
          return v.length?Math.max(...v)-Math.min(...v):0;
        }).sort((x,y)=>x-y);
        return {channel:ci,median:rises[Math.floor(rises.length/2)],
          name:(acquisitionChannels[ci]||{}).name||("channel "+ci)};
      }).filter(x=>x.median!=null);
      a.channelProfile=profile;
      const own=profile.find(x=>x.channel===a.channelIdx);
      const best=profile.reduce((m,x)=>(!m||x.median>m.median)?x:m,null);
      /* only meaningful when the winner is clearly ahead and there is real signal at all */
      /* A larger rise in another channel does NOT prove the analysis reads the wrong one:
         a bright dye bleeds into neighbouring channels, and a control present in every well
         raises its own channel everywhere. Without colour compensation the two cannot be
         separated, so this is reported as "not verifiable from the data", not as an error.
         The threshold is deliberately high to keep it rare. */
      a.channelSignal=(own&&best&&best.channel!==a.channelIdx&&best.median>2*own.median&&best.median>200)
        ? {reading:own,strongest:best,ratio:best.median/Math.max(1,own.median)} : null;
    });
  }

  const stats=acquisitionStats(channels),nCycles=stats.length?Math.max(...stats.map(s=>s.cycles)):null;

  /* Every acquired curve, indexed by acquisition channel and plate position,
     regardless of whether any
     analysis claimed it. The instrument reads the whole block on every cycle, so
     a well that was loaded but left out of the analysis still has a trace here.
     Finding those wells is the point: nothing in the LightCycler software warns
     about them, and an omitted positive is a silent false negative. Channels must
     remain separate: a well can be analysed in FAM while an unclaimed YELLOW curve
     at the same position still needs review. */
  const allCurves={};
  if(channels){
    for(const ch in channels){
      const cyc=cycles[ch];
      if(!cyc||!cyc.length)continue;
      const first=channels[ch][cyc[0]];
      if(!first)continue;
      for(let pos=0;pos<first.length;pos++){
        const curve=cyc.map(c=>channels[ch][c]?channels[ch][c][pos]:NaN);
        if(curve.some(v=>!Number.isFinite(v)))continue;
        const amp=Math.max(...curve)-Math.min(...curve);
        allCurves[`${ch}|${pos}`]={channel:Number(ch),pos,curve,amplitude:amp};
      }
    }
  }

  analyses.forEach(a=>{delete a.el;});
  return {
    file:source.name,sourcePath:source.path||source.name,sourceArchive:source.archive||null,zip:source.zip||null,
    meta,wells,tmWells,genoResults,rqResults,otherResults,allCurves,
    plate,subsets,protocol,analyses,nCycles,acqStats:stats,acqError:acq.error,
    acqMelt:acq.melt||null,acqSegments:acq.segments||[],acqAcquisitions:acq.acquisitions||0,
    acqScalingFactors:acq.scalingFactors||[],identities,duplicates,
    namedPositions:Object.values(plate).filter(r=>r.name).length,maxPos,cols,rows,
    blockId:(protocol.block&&protocol.block.id)||"",
    kinds:uniq(analyses.map(a=>a.kind)),
    format:{signature:dom.documentElement.getAttribute("signature")||"",version:dom.documentElement.getAttribute("version")||""},
    platform:"LightCycler 480",integrity:ixoIntegrity(source.bytes)
  };
}
