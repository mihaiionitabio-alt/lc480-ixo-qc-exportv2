const SOP_PRESETS={
  generic:()=>sopBase(),
  gmo:()=>Object.assign(sopBase(),{
    name:"GMO screening — qualitative (example)",assay:"P35S / T-NOS screening with taxon reference",
    notes:"Example structure for element screening with a plant reference gene. Replace cut-offs and control names with the validated values from your SOP.",
    targets:[
      {match:"HMG|hmg|lec|Le1|ADH|adh1|SSIIb|zSSIIb|Cru|cruA|GLP",kind:"reference",cqMax:40,cqLate:36,quantMin:"",lateOutcome:"Inconclusive"},
      {match:"*",kind:"target",cqMax:40,cqLate:38,quantMin:"",lateOutcome:"Repeat"}],
    controls:[
      {name:"NTC",matchBy:"name",match:"NTC|H2O|water|NTC*",expect:"negative",cqLo:"",cqHi:"",targets:"*",minPerRun:1,onFail:"reject"},
      {name:"Extraction blank",matchBy:"name",match:"EB|BLANK|blank*|MB*",expect:"negative",cqLo:"",cqHi:"",targets:"*",minPerRun:0,onFail:"reject"},
      {name:"Positive control",matchBy:"role",match:"Positive control|Calibrator",expect:"positive",cqLo:"",cqHi:"",targets:"*",minPerRun:1,onFail:"reject"}],
    replicates:{min:2,positiveMin:2,partialOutcome:"Repeat",maxSd:0.5,sdOutcome:"Repeat"}
  }),
  forensic:()=>Object.assign(sopBase(),{
    name:"Forensic DNA quantification triage (example)",assay:"Autosomal / Y / IPC quantification",
    notes:"Example triage in the spirit of Onofri et al. 2024: IPC shift flags inhibition, a low quantity flags the stochastic zone. Replace every value with your validated limits.",
    targets:[
      {match:"IPC|IC",kind:"ic",cqMax:40,cqLate:"",quantMin:"",lateOutcome:"Inconclusive"},
      {match:"*",kind:"target",cqMax:40,cqLate:"",quantMin:0.005,lateOutcome:"Inconclusive"}],
    controls:[
      {name:"NTC",matchBy:"role",match:"NTC|Blank",expect:"negative",cqLo:"",cqHi:"",targets:"*",minPerRun:1,onFail:"reject"},
      {name:"Reagent blank",matchBy:"name",match:"RB*|reagent blank*",expect:"negative",cqLo:"",cqHi:"",targets:"*",minPerRun:0,onFail:"reject"},
      {name:"Standards",matchBy:"role",match:"Standard",expect:"standard",cqLo:"",cqHi:"",targets:"*",minPerRun:0,onFail:"review"}],
    replicates:{min:1,positiveMin:1,partialOutcome:"Inconclusive",maxSd:0.3,sdOutcome:"Repeat"},
    ic:{maxShift:1,shiftOutcome:"Inconclusive",missingOutcome:"Invalid"}
  })
};
