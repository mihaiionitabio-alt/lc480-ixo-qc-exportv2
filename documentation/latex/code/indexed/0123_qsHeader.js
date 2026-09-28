function qsHeader(r,opt){
  const e=r.exp,p=e.props||{},I=qsInstrument(r),start=e.runStart||Date.now(),cal=n=>r.calibrations.find(c=>c.name===n)||{};
  const expired=c=>c&&c.exp?(c.exp<start?"Yes":"No"):"";
  const H=[["Block Type",I.block]];
  const bg=cal("BackgroundCalibration"),pd=cal("PureDyeCalibration"),roi=cal("ROICalibration"),un=cal("UniformityCalibration");
  H.push(["Calibration Background is expired ",expired(bg)],["Calibration Background performed on",qsCalDate(bg.ts)]);
  (r.pureDyes||[]).forEach(d=>H.push([`Calibration Pure Dye ${d} is expired`,expired(pd)],[`Calibration Pure Dye ${d} performed on`,qsCalDate(pd.ts)]));
  H.push(["Calibration ROI is expired ",expired(roi)],["Calibration ROI performed on",qsCalDate(roi.ts)]);
  H.push(["Calibration Uniformity is expired ",expired(un)],["Calibration Uniformity performed on",qsCalDate(un.ts)]);
  H.push(["Chemistry",e.chemistry],["Date Created",qsStamp(Date.now())]);
  if(r.plate.hasBarcode)H.push(["Experiment Barcode",r.plate.barcode||""]);
  H.push(["Experiment File Name",opt.pseudo?"(withheld)":e.fileName],["Experiment Name",e.name],
    ["Experiment Run End Time",qsStamp(e.runEnd)],["Experiment Type",e.typeNameRaw||e.typeName],
    ["Instrument Name",I.name],["Instrument Serial Number",I.serial],["Instrument Type",I.type],
    ["Passive Reference",!r.plate.passiveRef||r.plate.passiveRef==="NULL"?"":r.plate.passiveRef],
    ["Post-read Stage/Step",""],["Pre-read Stage/Step",""],["Quantification Cycle Method","Ct"],
    ["Signal Smoothing On",r.analysis.smoothing==null?"":String(r.analysis.smoothing)],
    ["Stage/ Cycle where Ct Analysis is performed",r.analysis.dataSelect.StageNum?`Stage${r.analysis.dataSelect.StageNum}, Step${r.analysis.dataSelect.StepNum}`:""]);
  return H;
}
