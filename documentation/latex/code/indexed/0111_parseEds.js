async function parseEds(name,bytes){
  const buf=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
  const run={file:name,size:bytes.length,warnings:[]};
  run.sha256=await sourceSha256(bytes);
  const zip=await readZip(buf);
  run.entries=zip.entries;
  const get=async n=>zip.get(P+n);
  const text=async n=>{const u=await get(n);return u?new TextDecoder().decode(u):null};

  /* integrity: CRC of every entry + Tamper MD5 over all other entries in archive order */
  const md5=MD5();let tamperEntry=null;
  for(const en of zip.entries){if(en.dir)continue;const d=await zip.get(en.name);
    if(/extensions\/Tamper$/.test(en.name)){tamperEntry=d;continue}md5.update(d)}
  run.crcOk=zip.entries.filter(e=>!e.dir).every(e=>e.crcOk);
  run.crcBad=zip.entries.filter(e=>!e.dir&&!e.crcOk).map(e=>e.name);
  /* The software writes each digest byte with Integer.toHexString, i.e. without a leading zero
     (0x08 -> "8", 0x00 -> "0"). Both spellings are compared; the software's is reported. */
  const padded=md5.digest().toUpperCase(),computed=padded.match(/../g).map(h=>parseInt(h,16).toString(16).toUpperCase()).join("");
  if(tamperEntry){const stored=new TextDecoder().decode(tamperEntry).trim().replace(/^0X/i,"").toUpperCase();
    run.tamper={stored,computed,computedPadded:padded,ok:stored===computed||stored===padded}}else run.tamper={stored:"",computed,computedPadded:padded,ok:null};

  /* manifest + tools */
  const man=await text("Manifest.mf");run.manifest={};
  if(man)for(const l of man.split(/\r?\n/)){const m=l.match(/^([^:]+):\s*(.*)$/);if(m)run.manifest[m[1].trim()]=m[2].trim()}
  run.tools=[];const tx=await get("tools.xml");
  if(tx)for(const t of xml(tx).querySelectorAll("ToolInfo"))run.tools.push({name:t.getAttribute("name"),version:t.getAttribute("version"),id:t.getAttribute("id")});

  /* experiment.xml */
  const ex=await get("experiment.xml");if(!ex)throw new Error("experiment.xml not found — not a QuantStudio .eds file");
  const E=xml(ex).documentElement;const T=kid(E,"Type");
  run.exp={name:txt(E,"Name"),runState:txt(E,"RunState"),finalAnalysis:txt(E,"FinalAnalysisCompleted"),
    created:num(txt(E,"CreatedTime")),modified:num(txt(E,"ModifiedTime")),runStart:num(txt(E,"RunStartTime")),runEnd:num(txt(E,"RunEndTime")),
    fileName:txt(E,"FileName"),label:txt(E,"Label"),typeId:txt(T,"Id"),typeName:txt(T,"Name").replace(/Cт/g,"CT").trim(),typeNameRaw:txt(T,"Name"),experimentId:txt(E,"Id"),
    chemistry:txt(E,"ChemistryType"),mode:txt(E,"TCProtocolMode"),template:txt(E,"DNATemplateType"),instrumentTypeId:txt(E,"InstrumentTypeId"),
    blockTypeId:txt(E,"BlockTypeID"),plateTypeId:txt(E,"PlateTypeID"),operator:txt(E,"Operator")||txt(E,"UserName"),comment:txt(E,"Comment")||txt(E,"Description"),barcode:txt(E,"Barcode")};
  run.exp.samples=kids(kid(E,"Samples"),"Sample").map(s=>({name:txt(s,"Name"),color:argb(txt(s,"Color")),conc:txt(s,"Concentration")}));
  run.exp.detectors=kids(kid(E,"Detectors"),"Detector").map(d=>({name:txt(d,"Name"),reporter:txt(d,"Reporter"),quencher:txt(d,"Quencher"),color:argb(txt(d,"Color"))}));
  run.exp.props={};
  run.exp.reagents=kids(kid(E,"Reagents"),"Reagent").map(g=>({type:txt(g,"Type"),name:txt(g,"Name"),part:txt(g,"PartNumber"),lot:txt(g,"LotNumber"),expiration:txt(g,"ExpirationDate")}));
  for(const p of E.querySelectorAll('ExperimentProperty[type="InstrumentInfo"] > PropertyValue'))run.exp.props[p.getAttribute("key")]=p.firstElementChild?p.firstElementChild.textContent:p.textContent.trim();
  const itk=E.querySelector('ExperimentProperty[type="InstrumentTypeInfo"] PropertyValue[key="INSTRUMENT_TYPE_KEY"]');
  run.exp.instrumentTypeKey=itk?itk.textContent.trim():"";

  /* plate_setup.xml */
  const ps=await get("plate_setup.xml");const plate={rows:8,cols:12,wells:[],passiveRef:"",kind:""};
  if(ps){const D=xml(ps).documentElement;
    plate.rows=+txt(D,"Rows")||8;plate.cols=+txt(D,"Columns")||12;plate.passiveRef=txt(D,"PassiveReferenceDye");
    plate.kind=txt(kid(D,"PlateKind"),"Name");plate.barcode=txt(D,"BarCode");plate.hasBarcode=!!kid(D,"BarCode");plate.description=txt(D,"Description");
    const N=plate.rows*plate.cols;for(let i=0;i<N;i++)plate.wells.push({i,pos:wellPos(i,plate.cols),sample:"",sampleColor:null,tasks:[],flags:[],omit:false,comment:""});
    for(const fm of kids(D,"FeatureMap")){const id=txt(kid(fm,"Feature"),"Id");
      for(const fv of kids(fm,"FeatureValue")){const w=plate.wells[+txt(fv,"Index")];if(!w)continue;const it=kid(fv,"FeatureItem");
        if(id==="sample"){const s=kid(it,"Sample");w.sample=txt(s,"Name");w.sampleColor=argb(txt(s,"Color"))}
        else if(id==="detector-task"){for(const dtk of kid(it,"DetectorTaskList")?kids(kid(it,"DetectorTaskList"),"DetectorTask"):[]){const d=kid(dtk,"Detector");
          w.tasks.push({target:txt(d,"Name"),reporter:txt(d,"Reporter"),quencher:txt(d,"Quencher"),color:argb(txt(d,"Color")),task:txt(dtk,"Task"),quantity:txt(dtk,"Concentration")})}}
        else if(id==="comment"){w.comment=it.textContent.trim()}
      }}
    for(const wl of kids(kid(D,"Wells"),"Well")){const w=plate.wells[+txt(wl,"Index")];if(!w)continue;
      w.omit=txt(wl,"IsOmit")==="true";w.flags=kids(wl,"FlagName").map(f=>{const [code,...t]=f.textContent.trim().split("-");return{code,target:t.join("-")}})}
  }
  run.plate=plate;

  /* tcprotocol.xml */
  const tc=await get("tcprotocol.xml");run.protocol={stages:[],filters:[]};
  if(tc){const D=xml(tc).documentElement;
    Object.assign(run.protocol,{runMode:txt(D,"RunMode"),volume:num(txt(D,"SampleVolume")),cover:num(txt(D,"CoverTemperature")),blockId:txt(D,"BlockID")});
    for(const st of kids(D,"TCStage"))run.protocol.stages.push({flag:txt(st,"StageFlag"),reps:+txt(st,"NumOfRepetitions"),
      steps:kids(st,"TCStep").map(s=>({temps:kids(s,"Temperature").map(t=>+t.textContent),hold:+txt(s,"HoldTime"),ramp:num(txt(s,"RampRate")),collect:(+txt(s,"CollectionFlag")||0)>0,collectMode:txt(s,"CollectionMode")||((+txt(s,"CollectionFlag"))===1?"Step":"")}))});
    run.protocol.filters=Array.from(D.querySelectorAll("CollectionProfile FilterSet")).map(f=>`${f.getAttribute("Excitation")}-${f.getAttribute("Emission")}`);
  }

  /* analysis_protocol.xml */
  const ap=await get("analysis_protocol.xml");const A={detectors:{},defaults:{},ddct:{},rules:[],smoothing:null,dataSelect:{},wellOverrides:0,algorithm:"",wells:{}};
  if(ap){const D=xml(ap).documentElement;
    for(const s of kids(D,"JaxbAnalysisSettings")){const type=txt(s,"Type").split(".").pop();const v={};
      for(const sv of kids(s,"JaxbSettingValue")){const it=kid(sv,"JaxbValueItem");v[txt(sv,"Name")]=it?it.textContent.trim():""}
      const obj=v.ObjectName||"";
      if(type==="IDetectorSettings"){const rec={threshold:num(v.Threshold),autoCt:v.AutoCt==="true",autoBaseline:v.AutoBaseline==="true",bStart:+v.BaselineStart,bStop:+v.BaselineStop,confidence:num(v.ConfidenceLevel)};
        if(obj.includes("DEFAULT"))A.defaults=rec;else A.detectors[obj]=rec}
      else if(type==="IDDCtAnalysisSettings")A.ddct=v;
      else if(type==="ISignalSmoothingSettings")A.smoothing=v.SignalSmoothing==="true";
      else if(type==="IDataSelectSettings")A.dataSelect=v;
      else if(type==="IAlgorithmSelectSettings"&&!A.algorithm)A.algorithm=v.AlgorithmName;
      else if(type==="IWellSettings"&&v.WellIndex!=null){
        if(obj&&!obj.includes("DEFAULT"))A.wells[`${v.WellIndex}|${obj}`]={autoBaseline:v.AutoBaseline==="true",bStart:num(v.BaselineStart),bStop:num(v.BaselineStop),useDefaults:v.UseDetectorDefaults==="true"};
        if(v.UseDetectorDefaults==="false")A.wellOverrides++;}
    }
    for(const s of D.querySelectorAll("AnalysisSetting")){const r={code:txt(s,"Type")};
      for(const sv of kids(s,"SettingValue")){const n=txt(sv,"Name");const val=(kid(sv,"StringValue")||kid(sv,"BooleanValue")||kid(sv,"IntValue")||kid(sv,"DoubleValue"));r[n]=val?val.textContent.trim():""}
      A.rules.push(r)}
  }
  run.analysis=A;

  /* multicomponentdata.xml */
  const mc=await get("multicomponentdata.xml");run.mc={dyes:[],signal:{},cycles:0};
  if(mc){const D=xml(mc).documentElement;run.mc.cycles=+txt(D,"CycleCount");const dyeMap={};
    for(const d of kids(D,"DyeData"))dyeMap[d.getAttribute("WellIndex")]=bracketList(txt(d,"DyeList"));
    const all=new Set();
    for(const s of kids(D,"SignalData")){const wi=s.getAttribute("WellIndex");const dl=dyeMap[wi]||[];const o={};
      kids(s,"CycleData").forEach((c,k)=>{const name=dl[k]||`dye${k+1}`;all.add(name);o[name]=bracketList(c.textContent).map(Number)});
      run.mc.signal[+wi]=o}
    run.mc.dyes=[...all];
  }

  /* filterdata.xml (raw, not normalised) */
  const fd=await get("filterdata.xml");run.raw={sets:[],data:{},cycles:0};
  if(fd){const D=xml(fd).documentElement;
    for(const pd of D.querySelectorAll("PlateData")){const at={};
      for(const a of kids(pd,"Attribute"))at[txt(a,"key")]=txt(a,"value");
      const set=at.FILTER_SET,cyc=+at.CYCLE;if(!set||!cyc)continue;
      if(!run.raw.data[set]){run.raw.data[set]=[];run.raw.sets.push(set)}
      run.raw.data[set][cyc-1]=txt(pd,"WellData").split(/\s+/).filter(Boolean).map(Number);
      run.raw.cycles=Math.max(run.raw.cycles,cyc);
    }
    run.raw.sets.sort();
  }

  /* analysis_result.txt */
  const ar=await text("analysis_result.txt");run.results=[];run.stdCurves={};
  if(ar){let cur=null;const lines=ar.split(/\r?\n/);run.resultHeader=(lines[1]||"").split("\t");
    for(const line of lines.slice(2)){if(!line)continue;const f=line.split("\t");
      if(/^\d+$/.test(f[0])){cur={f,well:+f[0],sample:f[1],target:f[2],task:f[3],ct:num(f[4]),ctMean:num(f[5]),ctSd:num(f[6]),dct:num(f[7]),
          qty:num(f[8]),qtyMean:num(f[9]),qtySd:num(f[10]),amp:f[11]??"",conf:num(f[12]),rn:[],drn:[]};run.results.push(cur)}
      else if(!cur)continue;
      else if(f[0]==="Rn values"){cur.rnS=f.slice(1).filter(x=>x.trim()!=="");cur.rn=cur.rnS.map(Number);}
      else if(f[0]==="Delta Rn values"){cur.drnS=f.slice(1).filter(x=>x.trim()!=="");cur.drn=cur.drnS.map(Number);}
      else if(f[0]==="Std Curve Results"){const sc={target:f[1],r2:num(f[2]),slope:num(f[3]),field4:f[4],yIntercept:num(f[5]),field6:f[6]};
        sc.efficiency=sc.slope<0?(Math.pow(10,-1/sc.slope)-1)*100:null;cur.stdCurve=sc;
        if(!run.stdCurves[sc.target])run.stdCurves[sc.target]=sc;}
      else if(f[0]==="Std Curve Results X Values"){if(run.stdCurves[cur.target]&&!run.stdCurves[cur.target].x)run.stdCurves[cur.target].x=f.slice(1).filter(x=>x.trim()!=="").map(Number);}
      else if(f[0]==="Std Curve Results Y Values"){if(run.stdCurves[cur.target]&&!run.stdCurves[cur.target].y)run.stdCurves[cur.target].y=f.slice(1).filter(x=>x.trim()!=="").map(Number);}
      else if(f[0]==="DDCT Values")cur.ddct={dct:num(f[7]),dctMean:num(f[8]),dctSd:num(f[9]),dctSe:num(f[10]),field11:f[11],rq:num(f[12]),rqMin:num(f[13]),rqMax:num(f[14]),omitted:f[15],ddct:num(f[16]),biogroup:f[2]};
      else if(f[0]==="Study Stat Values")cur.studyStat=f.slice(1);
      else if(f[0]==="Study RQ Values")cur.studyRq=f.slice(1);
    }}
  /* Keep amplification cycles separate from acquisition points.  A melt-only
     acquisition can contain many temperature points, and a PCR+melt file can
     contain both the amplification and melt acquisitions.  Stored traces stay
     untouched; only the cycle metadata and undetermined test use the
     quantification/cycling program. */
  const stagePrograms=Array.isArray(run.protocol&&run.protocol.stages)?run.protocol.stages:[];
  const ampStages=stagePrograms.filter(st=>!/^pre[_ -]?cycling/i.test(String(st.flag||""))&&/cycling|ampl|quant/i.test(`${st.flag||""} ${st.mode||""}`));
  const amplificationCycles=ampStages.reduce((n,st)=>n+Math.max(0,Number(st.reps)||0),0);
  const acquisitionCycles=run.mc.cycles||run.raw.cycles||(run.results[0]?run.results[0].drn.length:0);
  const hasProgramInfo=stagePrograms.length>0;
  const ampCycleLimit=hasProgramInfo?amplificationCycles:Math.min(acquisitionCycles||40,50);
  const meltStages=stagePrograms.filter(st=>/melt|dissoc/i.test(`${st.flag||""} ${st.mode||""}`));
  run.amplificationCycles=ampCycleLimit;
  run.acquisitionCycles=acquisitionCycles;
  run.meltAcquisitionPoints=meltStages.length?Math.max(0,acquisitionCycles-ampCycleLimit):0;
  run.cycles=ampCycleLimit||acquisitionCycles;
  for(const r of run.results){
    const w=plate.wells[r.well];r.pos=w?w.pos:String(r.well);
    const t=w&&w.tasks.find(x=>x.target===r.target);r.reporter=t?t.reporter:"";r.quencher=t?t.quencher:"";
    r.flags=w?w.flags.filter(f=>f.target===r.target).map(f=>f.code):[];r.omit=w?w.omit:false;
    r.undetermined=r.ct==null||(ampCycleLimit>0&&r.ct>=ampCycleLimit);
    const ds=A.detectors[r.target]||A.defaults;r.threshold=ds?ds.threshold:null;
    const ws=A.wells[`${r.well}|${r.target}`];r.baseline=ws?{auto:ds?ds.autoBaseline:ws.autoBaseline,start:ws.bStart,stop:ws.bStop}:(ds?{auto:ds.autoBaseline,start:ds.bStart,stop:ds.bStop}:null);
    r.ctRecalc=recalcCt(r.drn,r.threshold);
    r.ctDelta=(!r.undetermined&&r.ctRecalc!=null)?r.ctRecalc-r.ct:null;
    r.empty=!r.sample;r.ampLabel={"1":"Amp","0":"Inconclusive","-1":"No Amp"}[String(r.amp).trim()]||r.amp;
  }

  /* quant header (instrument block) */
  const q=zip.entries.find(e=>/\/quant\/.+\.quant$/.test(e.name));run.quantCount=zip.entries.filter(e=>/\.quant$/.test(e.name)).length;
  run.inst={};
  if(q){const t=new TextDecoder().decode(await zip.get(q.name));const m=t.match(/\[instrument\]\s*\n([^\n]+)\n([^\n]+)/);
    if(m){const k=m[1].trim().split("\t"),v=m[2].trim().split("\t");k.forEach((kk,i)=>run.inst[kk]=v[i])}}

  /* calibrations */
  run.calibrations=[];
  for(const en of zip.entries.filter(e=>/calibrations\/[^/]+\.ini$/.test(e.name))){
    const itxt=new TextDecoder().decode(await zip.get(en.name)),o=ini(itxt);const h=o.head||{};
    if(typeof ccCalibSummary==="function"){const cs=ccCalibSummary(en.name,itxt);if(cs)run.ccCalib=Object.assign(run.ccCalib||{},cs);}
    run.calibrations.push({file:en.name.split("/").pop(),name:h.name||"",id:h.calibrationID||"",operator:h.operator||"",ts:num(h.timestamp),exp:num(h.expirytime),version:h.version||""});
  }
  const pdm=await text("puredyematrix.txt");run.pureDyes=pdm?((pdm.match(/^dyes=(.*)$/m)||[])[1]||"").split(",").filter(Boolean):[];

  /* messages.log */
  const log=await text("messages.log");run.log=log?parseLog(log):null;
  /* control-chart extraction (functions live in the page; the raw text is not kept) */
  run.ccLog=(log&&typeof ccQsLog==="function")?ccQsLog(log):null;
  const mf=await text("instrumentdata.mf");run.ccMf=(mf&&typeof ccParseJavaDate==="function")?ccParseJavaDate(mf.split(/\r?\n/)[0]):NaN;
  if(typeof ccQuantSaturation==="function"){const qt=[];
    for(const en of zip.entries.filter(e=>/\/quant\/[^/]+\.quant$/.test(e.name)))qt.push(new TextDecoder().decode(await zip.get(en.name)));
    run.ccSat=qt.length?ccQuantSaturation(qt):null;}
  /* provenance written by the instrument into the raw-data parts */
  run.provenance={quantRunNames:[],exportSetting:null,plateIni:null};
  const qx=zip.entries.filter(e=>/\/quant\/[^/]+\.xml$/.test(e.name)).slice(0,12);
  for(const en of qx){const t=new TextDecoder().decode(await zip.get(en.name));
    for(const m of t.matchAll(/experiments\/([^/<]+)\/apldbio/g))if(!run.provenance.quantRunNames.includes(m[1]))run.provenance.quantRunNames.push(m[1]);}
  const es=await get("export_setting.xml");
  if(es){const D=xml(es).documentElement,seen=new Set(),sets=[];
    for(const d of kids(D,"DataSettings")){const type=txt(d,"Type");if(seen.has(type))continue;seen.add(type);
      const cols=kids(d,"ColumnSettings").map(c=>({id:txt(c,"Id"),order:+txt(c,"Order"),inc:txt(c,"Included")==="true"})).filter(c=>c.inc).sort((a,b)=>a.order-b.order).map(c=>c.id);
      sets.push({type,title:txt(d,"Title"),omit:txt(d,"Omit")==="true",skipEmpty:txt(d,"SkipEmptyWell")==="true",cols});}
    run.provenance.exportSetting={format:txt(D,"ExportFormat"),outputFormat:txt(D,"OutputFormat"),fileName:txt(D,"ExportFileName"),
      location:txt(D,"ExportFileLocation"),sets};}
  const pi=await text("plate_setup.ini");
  if(pi){const o=ini(pi);run.provenance.plateIni={dyes:((o.dye||{}).dyes||"").split(",").map(x=>x.trim()).filter(Boolean),reference:(o.dye||{}).reference||"",wells:Object.keys(o.layout||{}).length};}
  if(run.log){run.inst.product=run.log.props.product||"";run.inst.hostname=run.log.props.hostname||"";run.inst.firmware=run.log.version||run.inst.version}

  run.isTemplate=/\.edt$/i.test(run.file)||run.exp.runState==="INIT";
  run.id=`${run.file}#${run.sha256.slice(0,8)}`;
  run.sampleSet=[...new Set(run.results.filter(r=>r.sample).map(r=>r.sample))];
  run.targets=[...new Set(run.results.map(r=>r.target))];
  return run;
}
