/* ============================================================
   RDML support — reader, processing-state gate, and raw-file priority
   ------------------------------------------------------------
   The page reads what the instrument's own software analysed. An RDML file that
   carries only raw fluorescence has not been analysed by anyone, and an RDML
   written by a third-party tool carries somebody else's analysis. Neither is the
   instrument's record, so neither is evaluated by the laboratory profile: both
   are read, shown and exported, and reported as "Profile not applicable".
   Where the same experiment is present as a vendor container AND as an RDML
   export, the vendor container wins and the RDML is kept as a companion.
   ============================================================ */

/* ---------- 1 · container ---------- */
async function rdmlEntries(ab,archive){
  /* the intake ZIP reader already verifies CRC-32 and rejects unknown compression */
  return readZip(ab,archive,/^[^/]*\.xml$/i);
}
function rdmlIsContainer(entries){
  return entries.some(e=>/^rdml_data\.xml$/i.test(e.name));
}

/* ---------- 2 · XML, namespace-agnostic ---------- */
/* Files in the wild are written with and without a default namespace prefix, and
   RDML 1.0-1.4 differ in optional elements only. Match on local names. */
function rdmlKids(el,name){
  const out=[];if(!el)return out;
  for(const c of el.children)if(c.localName===name)out.push(c);
  return out;
}
function rdmlKid(el,name){return rdmlKids(el,name)[0]||null;}
function rdmlText(el,name){const k=rdmlKid(el,name);return k?String(k.textContent||"").trim():"";}
function rdmlNum(el,name){
  const t=rdmlText(el,name);if(t==="")return null;
  const n=Number(t);return Number.isFinite(n)?n:null;          /* "1.0" is a cycle, not an integer */
}
function rdmlAttrId(el,name){const k=rdmlKid(el,name);return k?String(k.getAttribute("id")||"").trim():"";}

/* ---------- 3 · one RDML file -> one run per <run> ---------- */
const RDML_SAMPLE_ROLE={ntc:"NTC",neg:"Negative control",pos:"Positive control",std:"Standard",opt:"Unknown",unkn:"Unknown"};
function rdmlParse(xmlText,fileName,fileBytes){
  const doc=new DOMParser().parseFromString(xmlText,"application/xml");
  const err=doc.querySelector("parsererror");
  if(err)throw new Error("RDML XML is not well formed: "+String(err.textContent||"").slice(0,120));
  const root=doc.documentElement;
  if(!root||root.localName!=="rdml")throw new Error("not an RDML document (root element is <"+(root&&root.localName)+">)");
  const version=root.getAttribute("version")||"";
  if(!/^1\.[0-4]$/.test(version))                       /* read it anyway, but say so */
    appNotice&&appNotice("rdml",`${fileName}: RDML version "${version||"absent"}" is outside 1.0-1.4; reading it as 1.4`);

  /* dictionaries */
  const dyes=rdmlKids(root,"dye").map(d=>d.getAttribute("id")||"");
  const samples=new Map();
  rdmlKids(root,"sample").forEach(s=>samples.set(s.getAttribute("id")||"",{
    id:s.getAttribute("id")||"",type:rdmlText(s,"type")||"unkn",description:rdmlText(s,"description")}));
  const targets=new Map();
  rdmlKids(root,"target").forEach(t=>{
    const dye=rdmlAttrId(t,"dyeId");
    targets.set(t.getAttribute("id")||"",{
      id:t.getAttribute("id")||"",type:rdmlText(t,"type")||"toi",dye,
      channel:Math.max(0,dyes.indexOf(dye)),
      ampEff:rdmlNum(t,"amplificationEfficiency"),ampEffSE:rdmlNum(t,"amplificationEfficiencySE"),
      meltingTemperature:rdmlNum(t,"meltingTemperature"),description:rdmlText(t,"description")});
  });
  if(!dyes.length)targets.forEach((t,k)=>{if(!t.dye){t.dye="dye";t.channel=0;}});

  const runs=[];
  rdmlKids(root,"experiment").forEach(exp=>{
    const expId=exp.getAttribute("id")||"experiment";
    rdmlKids(exp,"run").forEach(runEl=>{
      const runId=runEl.getAttribute("id")||"run";
      const fmt=rdmlKid(runEl,"pcrFormat");
      const rows=(fmt&&rdmlNum(fmt,"rows"))||8,cols=(fmt&&rdmlNum(fmt,"columns"))||12;
      const cqMethod=rdmlText(runEl,"cqDetectionMethod");
      const bgMethod=rdmlText(runEl,"backgroundDeterminationMethod");
      const instrument=rdmlText(runEl,"instrument");
      const software=rdmlText(runEl,"dataCollectionSoftware");
      const runDate=rdmlText(runEl,"runDate");

      const wells=[],allCurves={},tmWells=[],plate={};
      let maxCycle=0,maxMelt=0,anyCq=false,anyAdp=false,anyMdp=false,ceilingRows=0;
      const methods=new Set();
      /* one cheap pass for the cycle count: the ceiling rule below needs it before the
         wells are built, and the largest <cyc> in the run is the run's cycle count */
      let maxCycleSeen=0;
      rdmlKids(runEl,"react").forEach(rc=>rdmlKids(rc,"data").forEach(dt=>rdmlKids(dt,"adp").forEach(a=>{
        const c=rdmlNum(a,"cyc");if(c!==null&&c>maxCycleSeen)maxCycleSeen=c;})));

      rdmlKids(runEl,"react").forEach(react=>{
        const id=Number(react.getAttribute("id"));
        if(!Number.isFinite(id))return;
        const pos=id-1;                                  /* react id is 1-based, row-major */
        if(pos<0||pos>=rows*cols)return;                 /* outside the declared plate: ignore, report below */
        const sampleId=rdmlAttrId(react,"sample");
        const smp=samples.get(sampleId)||{id:sampleId,type:"unkn"};
        const role=RDML_SAMPLE_ROLE[smp.type]||"Unknown";
        plate[pos]=plate[pos]||{pos,name:smp.id,sampleId:"",notes:smp.description||"",replicateOf:null,subsets:[],channels:{}};

        rdmlKids(react,"data").forEach(data=>{
          const tarId=rdmlAttrId(data,"tar");
          const tgt=targets.get(tarId)||{id:tarId,type:"toi",dye:"dye",channel:0};
          const ch=tgt.channel;
          plate[pos].channels[ch]={sampleType:smp.type,targetName:tarId,
            targetType:tgt.type==="ref"?"dtReference":"dtTarget"};

          /* amplification: order by cycle, do not assume the file is sorted */
          const adp=rdmlKids(data,"adp").map(a=>[rdmlNum(a,"cyc"),rdmlNum(a,"fluor")])
            .filter(([c,f])=>c!==null&&f!==null).sort((a,b)=>a[0]-b[0]);
          const curve=adp.map(([,f])=>f);
          if(curve.length){anyAdp=true;maxCycle=Math.max(maxCycle,adp[adp.length-1][0]);
            allCurves[`${ch}|${pos}`]={channel:ch,pos,curve,amplitude:Math.max(...curve)-Math.min(...curve)};}

          /* melting */
          const mdp=rdmlKids(data,"mdp").map(m=>[rdmlNum(m,"tmp"),rdmlNum(m,"fluor")])
            .filter(([t,f])=>t!==null&&f!==null).sort((a,b)=>a[0]-b[0]);
          if(mdp.length){anyMdp=true;maxMelt=Math.max(maxMelt,mdp.length);}

          let cq=rdmlNum(data,"cq");
          const ampEffMet=rdmlText(data,"ampEffMet");
          /* A vendor export writes "no crossing" as a Cq equal to the cycle count: measured on
             CORPUS-RDML-1.rdml, 158 of 192 rows carry cq = 40.0 on a 40-cycle run, while the
             .eds for the same run reports those wells as undetermined. Reading them as a crossing
             at the cut-off would turn 82 % of that file into late detections. A re-analysis file
             does not do this (example_3_linregpcr: 0 of 90 at the ceiling, maximum 34), so the
             rule is applied only where there is no N0 and no efficiency to contradict it. */
          let cqCeiling=false;
          if(cq!==null&&Number.isFinite(maxCycleSeen)&&maxCycleSeen>0
             &&Math.abs(cq-maxCycleSeen)<1e-9
             &&rdmlNum(data,"N0")===null&&rdmlNum(data,"ampEff")===null){cqCeiling=true;cq=null;}
          if(cq!==null)anyCq=true;
          if(cqCeiling)ceilingRows++;
          if(ampEffMet)methods.add(ampEffMet);

          const excl=rdmlText(data,"excl"),note=rdmlText(data,"note");
          const w={
            kind:"quant",well:posToWell(pos,cols),pos,row:Math.floor(pos/cols),col:pos%cols,
            sample:smp.id,sampleId:"",notes:smp.description||"",
            target:tarId,analysis:`RDML — ${tarId}`,analysisShort:tarId,analysisUid:"rdml:"+tarId,
            analysisKind:"absquant",analysisGroup:"",analysisGroupName:"",
            channel:ch,filterName:tgt.dye||("channel "+ch),filterComb:"",
            instrType:smp.type,instrRole:role,givenConc:"",targetName:tarId,
            targetType:tgt.type==="ref"?"dtReference":"dtTarget",subsetsOfWell:[],
            IsIncluded:excl?"false":"true",manual:"",warnCodes:excl?"excl":"",warnDesc:excl||"",
            /* A Cq in an RDML file is the analysis of whoever wrote the file. It is stored,
               but never as though the instrument had reported it: cqSource says whose it is. */
            CpRaw:cq,Cp:cq,cqSource:ampEffMet||cqMethod||"RDML file",
            callCode:cq===null?0:1,call:cq===null?"Not analysed":"Analysed",
            curve,CpUncertain:"",
            CpState:cq===null?"Undetermined":"",CrossingPointStatus:cq===null?"Undetermined":"",
            cqAtCycleCeiling:cqCeiling,
            CalcConc:"",ConcStatus:"",StandardConc:"",CalcConcUnc:"",
            rdml:{N0:rdmlNum(data,"N0"),ampEff:rdmlNum(data,"ampEff"),ampEffSE:rdmlNum(data,"ampEffSE"),
                  ampEffMet,bgFluor:rdmlNum(data,"bgFluor"),quantFluor:rdmlNum(data,"quantFluor"),
                  meltTemp:rdmlNum(data,"meltTemp"),excl,note,melt:mdp}
          };
          wells.push(w);
          if(mdp.length)tmWells.push({kind:"tm",well:w.well,pos,channel:ch,sample:smp.id,target:tarId,
            analysis:w.analysis,analysisUid:w.analysisUid,role,melt:mdp,
            Tm:rdmlNum(data,"meltTemp"),curve:mdp.map(([,f])=>f),temps:mdp.map(([t])=>t)});
        });
      });

      const tgtList=[...targets.values()];
      const analyses=tgtList.map(t=>({
        name:`RDML — ${t.id}`,shortName:t.id,uid:"rdml:"+t.id,
        kind:"absquant",kindLabel:"RDML exchange record",cls:"RDML "+version,subsetName:t.id,
        calcState:anyCq?"analysed":"not analysed",
        channelIdx:t.channel,channelName:t.dye,filterName:t.dye,filterComb:"",
        cpMethod:cqMethod||"not stated in the file",cccEnabled:false,ccNote:bgMethod||"",
        created:runDate||"",modified:"",createdBy:"",modifiedBy:"",
        nResults:wells.filter(w=>w.channel===t.channel).length,
        channelMismatch:null,channelSignal:null,stdCurve:null,settings:{},quantStats:[]}));

      runs.push({
        file:fileName,sourcePath:fileName,sourceArchive:null,zip:null,
        platform:instrument||"RDML",eds:null,rdmlDoc:{version,experiment:expId,run:runId,instrument,
          cqDetectionMethod:cqMethod,backgroundDeterminationMethod:bgMethod,methods:[...methods],
          cqAtCycleCeiling:ceilingRows},
        isTemplate:false,
        meta:{name:`${expId} / ${runId}`,Created:runDate||"",RunCreated:runDate||"",StartTime:runDate||"",
          EndTime:"",LastModified:"",CreatedByName:"",Technician:"",SWVersion:software,
          InstrumentName:instrument,SerialNumber:"",sourceBytes:(fileBytes&&fileBytes.length)||0},
        wells,tmWells,genoResults:[],rqResults:[],otherResults:[],allCurves,plate,subsets:[],
        analyses,
        nCycles:maxCycle||null,amplificationCycles:maxCycle||null,acquisitionCycles:maxCycle||null,
        meltAcquisitionPoints:maxMelt,acqStats:[],acqError:null,
        protocol:{stages:[],filters:[],channels:(dyes.length?dyes:["dye"]).map((d,i)=>({name:d,ex:i,em:i,active:true}))},
        acqMelt:null,acqSegments:[],acqAcquisitions:maxCycle||0,acqScalingFactors:[],
        identities:{},duplicates:0,namedPositions:Object.keys(plate).length,
        maxPos:rows*cols-1,cols,rows,blockId:"",
        kinds:[anyAdp?"absquant":null,anyMdp?"tm":null].filter(Boolean),
        format:{signature:"RDML",version},
        /* RDML carries no container checksum of its own; the ZIP CRC-32 was verified on read. */
        integrity:{kind:"rdml",stored:"",computed:"",ok:null,
          note:"RDML carries no container checksum; the ZIP entry CRC-32 was verified on reading"},
        experimentId:expId,runId
      });
    });
  });
  if(!runs.length)throw new Error("RDML file contains no <experiment>/<run>");
  return runs;
}

/* ---------- 4 · processing state: who analysed this, if anyone ---------- */
/* The page reports what the instrument's own software concluded, so the first question
   about any file is who produced the results in it. Four states, discriminated by what the
   file itself says - never by the file name:

     instrument     a vendor container (.ixo / .eds): the instrument's own record
     vendor-export  an RDML exported from the vendor's software: it names an <instrument>,
                    carries Cq, and no re-analysis tool is named anywhere in it
     third-party    an RDML whose results were computed by another tool: <ampEffMet> names
                    it, or <backgroundDeterminationMethod> does
     raw            an RDML with fluorescence and no Cq at all: nobody has analysed it

   Measured on the corpus:
     CORPUS-RDML-1.rdml   instrument "QuantStudio Dx", bg "Background Subtraction" -> vendor-export
     example_3_linregpcr.rdml   no instrument, bg "LinRegPCR, constant", ampEffMet LinRegPCR -> third-party
     example_1_raw.rdml         no provenance, no Cq -> raw                                                */
const RDML_REANALYSIS_TOOLS=/linregpcr|pcr-?miner|qpcr-?miner|dart-?pcr|cy0|mak2|lre|analyz/i;
function runProcessingState(run){
  if(!run)return {state:"unknown",reason:"no run"};
  if(!run.rdmlDoc)return {state:"instrument",reason:"decoded from the instrument's own container"};
  const d=run.rdmlDoc||{};
  const cq=(run.wells||[]).filter(w=>resultCq(w)!==null).length;
  if(!cq)return {state:"raw",
    reason:"the file carries fluorescence data only: no Cq, and no analysis by any software"};
  const named=(d.methods||[]).filter(Boolean);
  const tool=named.find(m=>RDML_REANALYSIS_TOOLS.test(m))
    ||(RDML_REANALYSIS_TOOLS.test(d.backgroundDeterminationMethod||"")?String(d.backgroundDeterminationMethod).split(",")[0]:"");
  if(tool)return {state:"third-party",tool,
    reason:`the results in this file were produced by ${tool}, not by the instrument's software`};
  if((run.meta&&run.meta.InstrumentName)||d.instrument)
    return {state:"vendor-export",
      reason:`exchange export of an analysis made by the instrument's software on ${(run.meta&&run.meta.InstrumentName)||d.instrument}`};
  return {state:"third-party",
    reason:"the file names no instrument, so the results in it were not written by the instrument's software"};
}
function runIsInstrumentAnalysed(run){
  const s=runProcessingState(run).state;return s==="instrument"||s==="vendor-export";
}

/* ---------- 5 · the profile gate ---------- */
/* Called from sopEvaluateRun BEFORE sopRunApplicability: a file the instrument never
   analysed is out of scope whatever the method says. */
function sopProcessingApplicability(run){
  const s=runProcessingState(run);
  if(s.state==="instrument")return {applicable:true,reason:s.reason,state:s.state};
  /* A vendor export IS the producer's analysis, so it is in scope - unless the instrument's
     own file for the same experiment is loaded, in which case that one is the record and this
     one is a companion. */
  if(s.state==="vendor-export"){
    if(runIsSuperseded(run))return {applicable:false,state:"superseded",
      reason:"superseded — "+run.supersededReason};
    return {applicable:true,reason:s.reason,state:s.state};
  }
  return {applicable:false,state:s.state,
    reason:(s.state==="raw"?"raw exchange file — ":"third-party analysis — ")+s.reason};
}

/* ---------- 6 · the vendor container wins ---------- */
/* Same experiment present twice: keep the instrument's file, keep the RDML beside it as a
   companion for comparison, and never evaluate or chart the companion. Matching is on the
   file stem first, then on the experiment identifier, because an export is normally named
   after the run it came from. */
function rdmlStem(name){
  return String(name||"").replace(/\.[^.]+$/,"").replace(/[\s_-]+/g," ").trim().toLowerCase();
}
function rdmlKeyOf(item){
  return [rdmlStem(item.name),String(item.experimentId||"").trim().toLowerCase()].filter(Boolean);
}
function applyRawFilePriority(runs){
  const vendor=runs.filter(r=>!r.rdmlDoc),rdml=runs.filter(r=>r.rdmlDoc);
  if(!vendor.length||!rdml.length)return {runs,superseded:[]};
  const keys=new Set();
  vendor.forEach(v=>{rdmlKeyOf({name:v.file,experimentId:(v.meta||{}).name}).forEach(k=>keys.add(k));});
  const superseded=[],kept=[];
  runs.forEach(r=>{
    if(!r.rdmlDoc){kept.push(r);return;}
    const mine=rdmlKeyOf({name:r.file,experimentId:r.experimentId});
    const hit=mine.find(k=>keys.has(k));
    if(hit){r.supersededBy=vendor.find(v=>rdmlKeyOf({name:v.file,experimentId:(v.meta||{}).name}).includes(hit));
      r.supersededReason=`the instrument's own file for this experiment is loaded (${r.supersededBy?r.supersededBy.file:"vendor container"}); `
        +"the exchange export is kept for comparison only";
      superseded.push(r);}
    kept.push(r);
  });
  return {runs:kept,superseded};
}
function runIsSuperseded(run){return !!(run&&run.supersededBy);}
