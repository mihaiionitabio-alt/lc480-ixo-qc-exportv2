function edsDerived(run,note){
  const p=run.eds,e=p.exp,A=p.analysis,pr=e.props||{},tag=`${run.file}: `;
  note(tag+"Platform","QuantStudio 3/5 experiment document","Manifest.mf Implementation-Title");
  note(tag+"Experiment",e.name,"experiment.xml Name");
  note(tag+"Experiment type",`${e.typeName} (${e.typeId})`,"experiment.xml Type/Name, Type/Id");
  note(tag+"Chemistry",e.chemistry,"experiment.xml ChemistryType");
  note(tag+"Run state",`${e.runState}; final analysis ${e.finalAnalysis}`,"experiment.xml RunState, FinalAnalysisCompleted");
  if(e.created)note(tag+"Experiment created",EDS.dt(e.created),"experiment.xml CreatedTime (ms since 1970, shown in local time)");
  if(e.runStart)note(tag+"Run started",EDS.dt(e.runStart),"experiment.xml RunStartTime");
  if(e.runEnd)note(tag+"Run ended",EDS.dt(e.runEnd),"experiment.xml RunEndTime");
  if(e.runStart&&e.runEnd)note(tag+"Run duration",`${((e.runEnd-e.runStart)/60000).toFixed(2)} minutes`,"RunStartTime to RunEndTime");
  note(tag+"Instrument",pr.instrumentType||"","experiment.xml ExperimentProperty InstrumentInfo instrumentType");
  note(tag+"Serial number",pr.instrumentSerialNumber||"","InstrumentInfo instrumentSerialNumber");
  if(pr.blockSerialNumber)note(tag+"Block serial",pr.blockSerialNumber,"InstrumentInfo blockSerialNumber");
  if(p.log)note(tag+"Firmware / host",`${p.log.version||"?"} / ${p.log.props.hostname||"?"}`,"messages.log Instrument Version / Properties");
  note(tag+"Software",`${p.manifest["Implementation-Title"]||""} ${p.manifest["Implementation-Version"]||""}`,"Manifest.mf Implementation-Version");
  note(tag+"Document specification",p.manifest["Specification-Version"]||"","Manifest.mf Specification-Version");
  if(e.fileName)note(tag+"Original path",e.fileName,"experiment.xml FileName (withheld from pseudonymised exports)");
  note(tag+"Plate",`${p.plate.kind} (${p.plate.rows} x ${p.plate.cols})`,"plate_setup.xml PlateKind");
  note(tag+"Passive reference",!p.plate.passiveRef||p.plate.passiveRef==="NULL"?"none":p.plate.passiveRef,"plate_setup.xml PassiveReferenceDye");
  note(tag+"Targets",e.detectors.map(d=>`${d.name} (${d.reporter}/${d.quencher})`).join(", "),"experiment.xml Detectors");
  Object.entries(A.detectors).forEach(([t,d])=>note(tag+`Threshold and baseline — ${t}`,
    `${d.threshold} (${d.autoCt?"automatic":"manual"}); baseline ${d.autoBaseline?"automatic":`${d.bStart}–${d.bStop}`}`,
    `analysis_protocol.xml IDetectorSettings ObjectName=${t}`));
  if(A.ddct.EndogenousControl)note(tag+"Endogenous control",A.ddct.EndogenousControl,"IDDCtAnalysisSettings EndogenousControl");
  if(A.ddct.Calibrator)note(tag+"Reference sample (calibrator)",A.ddct.Calibrator,"IDDCtAnalysisSettings Calibrator");
  if(A.ddct.RQConfidence)note(tag+"RQ confidence",A.ddct.RQConfidence+" %","IDDCtAnalysisSettings RQConfidence");
  note(tag+"Signal smoothing",String(A.smoothing),"ISignalSmoothingSettings SignalSmoothing");
  if(A.dataSelect.StageNum)note(tag+"Analysed data point",`Stage ${A.dataSelect.StageNum}, Step ${A.dataSelect.StepNum}`,"IDataSelectSettings");
  note(tag+"Flag rules",A.rules.filter(r=>r.enabled==="true").map(r=>`${EDS.flagName(r.code)} ${r.criteria}`).join("; "),"analysis_protocol.xml AnalysisSetting");
  note(tag+"Thermal protocol",p.protocol.stages.map(s=>`${s.flag}×${s.reps}: `+s.steps.map(x=>`${x.temps[0]} °C ${x.hold} s${x.collect?" (read)":""}`).join(" / ")).join("; "),
    "tcprotocol.xml TCStage/TCStep");
  note(tag+"Run mode, volume, cover",`${p.protocol.runMode}; ${p.protocol.volume} µL; ${p.protocol.cover} °C`,"tcprotocol.xml RunMode, SampleVolume, CoverTemperature");
  note(tag+"Filter sets read",p.protocol.filters.join(", "),"tcprotocol.xml CollectionProfile");
  note(tag+"Dye-to-filter mapping","nominal QuantStudio table (FAM x1-m1, VIC x2-m2, ABY/NED/TAMRA x3-m3, JUN/ROX x4-m4, Cy5 x5-m5)","built into this page, not read from the file");
  if(p.calibrations.length)note(tag+"Calibrations",p.calibrations.map(c=>`${c.name} ${EDS.dt(c.ts)} → ${EDS.dt(c.exp)}`).join("; "),"calibrations/*.ini [head]");
  if(p.pureDyes.length)note(tag+"Pure dyes calibrated",p.pureDyes.join(", "),"puredyematrix.txt");
  Object.values(p.stdCurves||{}).forEach(sc=>note(tag+`Standard curve — ${sc.target}`,
    `slope ${sc.slope}, y-intercept ${sc.yIntercept}, R² ${sc.r2}; efficiency ${num(sc.efficiency,2)} % (derived: (10^(−1/slope) − 1) × 100)`,
    "analysis_result.txt Std Curve Results"));
  if(p.log&&p.log.runName)note(tag+"Run name on the instrument",p.log.runName,"messages.log Run Starting");
  if((p.provenance||{}).quantRunNames&&p.provenance.quantRunNames.length)note(tag+"Run folder in raw-data parts",p.provenance.quantRunNames.join(", "),"quant/*.xml paths");
  if((p.provenance||{}).exportSetting)note(tag+"Last export recorded",`${p.provenance.exportSetting.format} → ${p.provenance.exportSetting.location}`,"export_setting.xml");
  note(tag+"Samples",`${p.sampleSet.length}: ${p.sampleSet.join(", ")}`,"plate_setup.xml sample feature");
  note(tag+"Wells",`${p.plate.wells.filter(w=>w.sample).length} with a sample name; ${p.plate.wells.filter(w=>w.tasks.length).length} with targets`,"plate_setup.xml");
  note(tag+"Stored results",`${p.results.length} well × target rows, ${p.cycles} cycles`,"analysis_result.txt");
  note(tag+"Raw data",`${p.raw.sets.length} filter sets × ${p.raw.cycles} cycles; ${p.mc.dyes.length} multicomponent dyes; ${p.quantCount} quant files`,
    "filterdata.xml, multicomponentdata.xml, quant/*.quant");
  note(tag+"Source SHA-256",p.sha256,"SHA-256 of the unmodified .eds bytes");
  note(tag+"Container integrity",integrityLabel(run),"ZIP central directory CRC-32; extensions/Tamper (MD5 over all other entries)");
}
