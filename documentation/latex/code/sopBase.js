function sopBase(){
  return {schema:SOP_SCHEMA,name:"Generic qPCR (MIQE-style defaults)",version:"1.0",author:"",assay:"",
    effective:"",notes:"Starting values only. Replace every number with the value validated in your SOP.",locked:false,
    targets:[{match:"*",kind:"auto",cqMax:40,cqLate:"",quantMin:"",lateOutcome:"Inconclusive"}],
    controls:[
      {name:"No-template control",matchBy:"role",match:"NTC|Blank",expect:"negative",cqLo:"",cqHi:"",targets:"*",minPerRun:1,onFail:"reject"},
      {name:"Positive control",matchBy:"role",match:"Positive control|Calibrator",expect:"positive",cqLo:"",cqHi:"",targets:"*",minPerRun:1,onFail:"reject"}
    ],
    replicates:{min:1,positiveMin:1,partialOutcome:"Inconclusive",maxSd:0.5,sdOutcome:"Repeat"},
    ic:{referenceCq:"",maxShift:2,shiftOutcome:"Inconclusive",missingOutcome:"Invalid"},
    run:{integrity:"reject",controlsMissing:"reject",controlsFail:"reject",stdCurve:"review",minR2:0.98,effMin:90,effMax:110,
      minLogs:3,ntcGap:3,ntcGapAction:"review",editDelayHours:72,editAction:"review",calibration:"review",
      maxZoneSpread:1.5,zoneAction:"review",runState:"reject",invalidRunOverrides:true},
    outcomes:JSON.parse(JSON.stringify(SOP_OUTCOME_DEFAULTS)),
    graphs:{showCutoffs:true,showLate:true,showSdLimit:true}
  };
}