function derivedSettings(){
  const notes=[];
  const note=(setting,value,source)=>notes.push({setting,value,source});
  RUNS.filter(r=>r.eds).forEach(r=>edsDerived(r,note));
  const ok=RUNS.filter(r=>!r.error&&!r.eds);
  if(!ok.length)return notes;

  /* Read defensively throughout: this panel is drawn the moment a file is read,
     before anything has been checked, so a run that decoded only partly must
     still be describable. Crashing here would hide the very problem the reader
     needs to see. */
  const analyses=ok.flatMap(r=>r.analyses||[]);
  const top=analyses.filter(a=>!a.subordinate);
  const quant=ok.flatMap(r=>r.wells||[]);
  const tm=ok.flatMap(r=>r.tmWells||[]);
  const geno=ok.flatMap(r=>r.genoResults||[]);
  const rq=ok.flatMap(r=>r.rqResults||[]);

  /* ---- what the experiment contains ---- */
  const modules=uniq(top.map(a=>a.kindLabel||a.kind)).filter(Boolean);
  note("Analysis modules",modules.join(", ")||"none",
    `${analyses.length} analysis object(s) in the file`);

  const chans=uniq(ok.flatMap(r=>(((r.protocol||{}).channels)||[])
    .filter(c=>c.active).map(c=>`${c.name||"channel"} ${c.ex}-${c.em}`)));
  note("Detection channels",chans.join(", ")||"none declared","HTCDetectionFormat");
  const inactive=uniq(ok.flatMap(r=>(((r.protocol||{}).channels)||[])
    .filter(c=>!c.active).map(c=>c.name||`${c.ex}-${c.em}`)));
  if(inactive.length)note("Declared but not acquired",inactive.join(", "),
    "HTCDetectionFormat, Active = 0 — these consume no channel index");

  note("Plate",uniq(ok.map(r=>`${r.rows??"?"} x ${r.cols??"?"}`)).join(", ")
    +(ok[0].blockId?` (${uniq(ok.map(r=>r.blockId)).join(", ")})`:""),
    "HTCBlockType RowCount / ColCount");

  /* ---- what kind of result it holds ---- */
  note("Study result",
    quant.length?"Crossing Point":tm.length?"Melting temperature":geno.length?"Genotype":"none",
    quant.length?"quantification results present"
      :tm.length?"only melting results present"
      :geno.length?"only genotyping results present":"no per-well results in the file");

  const curves=ok.reduce((n,r)=>n+uniqueCurveCount(r),0),acquired=ok.reduce((n,r)=>n+acquiredCurveCount(r),0);
  note("Amplification curves",curves?`${curves} linked; ${acquired} acquired`:(acquired?`${acquired} acquired; none linked`:"none"),
    ok.some(r=>r.acqError)?("AcquisitionStore: "+ok.find(r=>r.acqError).acqError):"AcquisitionStore");
  const cyc=uniq(ok.map(r=>r.nCycles).filter(Boolean));
  if(cyc.length)note("Cycles acquired",cyc.join(", "),"AcquisitionStore");
  const scales=uniq(ok.flatMap(r=>r.acqScalingFactors||[]));
  if(scales.length)note("Fluorescence scaling factor",scales.join(", "),
    "AcquisitionStore THTCFloAcquisition ScalingFactor (raw counts are preserved)");

  const counts=[quant.length?`${quant.length} quantification`:"",
    tm.length?`${tm.length} melting`:"",geno.length?`${geno.length} genotyping`:"",
    rq.length?`${rq.length} relative quantification`:""].filter(Boolean);
  note("Stored results",counts.join(", ")||"none","per-analysis result objects");

  /* ---- how the plate was laid out ---- */
  const types=uniq(quant.concat(tm).map(w=>w.instrType).filter(Boolean));
  note("Sample roles",
    types.length?types.map(t=>SAMPLE_TYPE_LABEL[t]||t).join(", "):"none — every well is left Unknown",
    types.length?"QuantSampleTypeProperty, refined by the name rules"
      :"the file records no sample types");
  const hasRepl=ok.some(r=>Object.values(r.plate||{}).some(x=>Number.isFinite(x.replicateOf)));
  note("Replicates",hasRepl?"instrument groups":"identical sample names",
    hasRepl?"GenSampleEditReplicate / ReplicateOf":"no replicate grouping recorded");

  /* ---- which targets the operator declared as what ---- */
  const targets=new Set(),refs=new Set();let src="";
  ok.forEach(r=>Object.values(r.plate||{}).forEach(rec=>Object.values(rec.channels||{}).forEach(ch=>{
    if(!ch.targetName)return;
    if(ch.targetType==="dtTarget"){targets.add(ch.targetName);src=src||"per-well Target Type";}
    else if(ch.targetType==="dtReference"){refs.add(ch.targetName);src=src||"per-well Target Type";}
  })));
  if(targets.size||refs.size){
    if(targets.size)note("Declared targets",[...targets].join(", "),src);
    note("Endogenous reference",refs.size?[...refs].join(", "):"none declared",
      refs.size?src:"no target is marked dtReference");
  }else{
    note("Target / reference roles","not declared",
      "the file marks no target as dtTarget or dtReference");
    const names=uniq(ok.flatMap(r=>Object.values(r.plate||{}).flatMap(rec=>
      Object.values(rec.channels||{}).map(ch=>ch.targetName))).filter(Boolean));
    if(names.length)note("Target names",names.join(", "),"per-well TargetName");
  }

  /* ---- standard curves ---- */
  const withCurve=analyses.filter(a=>a.stdCurve);
  if(withCurve.length){
    const assumed=withCurve.filter(a=>a.stdCurve.curveType==="ctEfficiency").length;
    const fitted=withCurve.length-assumed;
    note("Standard curves",
      fitted?`${fitted} fitted${assumed?`, ${assumed} efficiency-based`:""}`
        :`none on this plate${assumed?` (${assumed} efficiency-based, no line to read)`:""}`,
      fitted?"StdCurve Slope / YIntercept"
        :"no standard carries a concentration; efficiency is assumed, not fitted");
    const effs=uniq(withCurve.map(a=>Number(a.stdCurve.efficiency)).filter(e=>e>1&&e<=3)
      .map(e=>e.toFixed(4)));
    if(effs.length)note("Stored efficiencies",effs.join(", "),"StdCurve Efficiency");
  }else{
    note("Standard curves","none on this plate","no analysis carries a StdCurve object");
  }

  const subsets=uniq(top.map(a=>a.subsetName)).filter(Boolean);
  note("Study columns",subsets.join(", ")||"none","analysis subset names");

  const cc=analyses.some(a=>a.cccEnabled===true||a.cccEnabled==="1"||a.ccEnabled==="1"||a.isCCCEnabled==="1");
  note("Colour compensation",cc?"applied":"not applied","IsCCCEnabled");

  /* ---- provenance ---- */
  ok.forEach(r=>{
    const m=r.meta||{};
    note("Experiment",m.name||r.file,"HTCExperiment name");
    if(m.UID)note("Source UID",m.UID,"HTCExperiment UID");
    if(m.sourceCRC32)note("Source CRC-32",m.sourceCRC32,
      `${m.sourceBytes||"?"} source bytes`);
    if(m.sourceSHA256)note("Source SHA-256",m.sourceSHA256,
      "SHA-256 of the unmodified source .ixo bytes");
    if(m.Created)note("Experiment created",m.Created.replace("T"," ").slice(0,19),
      "HTCExperiment Created");
    if(m.LastModified&&!/^1899/.test(m.LastModified))
      note("Experiment last modified",m.LastModified.replace("T"," ").slice(0,19),
        "HTCExperiment LastModified");
    if(m.RunCreated)note("Run created",m.RunCreated.replace("T"," ").slice(0,19),
      "HTCRun Created");
    if(m.StartTime)note("Run started",m.StartTime.replace("T"," ").slice(0,19),
      "HTCRun StartTime");
    if(m.EndTime)note("Run ended",m.EndTime.replace("T"," ").slice(0,19),
      "HTCRun EndTime");
    const duration=runDurationMinutes(r);
    if(Number.isFinite(duration))note("Run duration",`${duration.toFixed(2)} minutes`,
      "HTCRun StartTime to EndTime");
    if(m.Technician||m.CreatedByName)
      note("Operator",m.Technician||m.CreatedByName,
        m.Technician?"HTCRun Technician":"HTCExperiment CreatedByName");
    if(m.CreatedByName&&m.Technician&&m.CreatedByName!==m.Technician)
      note("Experiment created by",m.CreatedByName,"HTCExperiment CreatedByName");
    if(m.LastModifiedByName&&m.LastModifiedByName!==m.CreatedByName)
      note("Last modified by",m.LastModifiedByName,"HTCExperiment LastModifiedByName");
    if(m.SWVersion)note("Software version",m.SWVersion,"HTCExperiment SWVersion");
    if(m.InstrumentName)note("Instrument",m.InstrumentName,"InstrumentName");
    if(m.SerialNumber)note("Serial number",m.SerialNumber,"SerialNumber");
    if(r.integrity)note("Container checksum",integrityLabel(r)+(r.integrity.computed?` (${r.integrity.computed})`:""),
      "trailing line after </objectstream>: MD5 of the object stream, byte-swapped words");
    if(r.format&&r.format.signature)
      note("Container","signature "+r.format.signature+", version "+r.format.version,
        "objectstream attributes");
  });

  const dup=ok.reduce((a,r)=>a+(r.duplicates||0),0);
  if(dup)note("Duplicate result records",String(dup),"same position seen twice in one analysis");
  const named=ok.reduce((a,r)=>a+(r.namedPositions||0),0);
  const analysed=uniq(ok.flatMap(r=>(r.wells||[]).map(w=>`${r.file}|${w.pos}`))).length;
  note("Plate positions","named "+named+", carrying a result "+analysed,
    "GenSampleEditName versus the analysis result lists");
  return notes;
}
