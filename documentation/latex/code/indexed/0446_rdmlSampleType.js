function rdmlSampleType(role){
  return role==="NTC"?"ntc"
    :(role==="Positive control"||role==="Calibrator")?"pos"
    :(role==="Negative control"||role==="Blank")?"nac"
    :role==="Standard"?"std":"unkn";
}
