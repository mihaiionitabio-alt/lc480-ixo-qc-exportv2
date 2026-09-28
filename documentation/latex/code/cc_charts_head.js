const CC_GROUPS=[
  {id:"hardware",title:"1 · Hardware",sub:"thermal, optics, mechanics — predictive maintenance"},
  {id:"software",title:"2 · Software",sub:"embedded computer, analysis software, data integrity"},
  {id:"method",title:"3 · Method",sub:"reagents, probes, assay behaviour"},
  {id:"operator",title:"4 · Operator",sub:"pipetting skill, consistency, forensic"}];
const CC_CHARTS=[
 /* ---------------- 1. HARDWARE ---------------- */
 {id:"heat_rate",code:"B-H1",group:"hardware",inst:["LC","QS"],type:"trend",unit:"°C/s",better:"high",spec:{LC:{lo:4.3},QS:{}},
  title:"Peak heating rate (2-s window)",source:"LC TemperatureLog · QS log sample temperature",
  idea:"How fast the Peltier elements can heat the block: the steepest 2-second slope of every heating transition, median over the run (manual: 4.8 °C/s). Independent of plateau detection, so short holds do not distort it.",
  reading:"A slow fall over months is Peltier or thermal-interface ageing; the fitted line gives a conditional limit-crossing estimate, not a failure date. A single low run points to the plate or a blocked vent that day."},
 {id:"cool_rate",code:"B-H2",group:"hardware",inst:["LC","QS"],type:"trend",unit:"°C/s",better:"high",spec:{LC:{lo:2.1},QS:{}},
  title:"Peak cooling rate (2-s window)",source:"as B-H1",
  idea:"How well the heat sink and fans remove heat: steepest 2-second cooling slope of every transition, median over the run (manual: 2.5 °C/s).",
  reading:"Falling cooling with stable heating = clogged fan filter or failing fan (clean the filters, check fans) before Peltier replacement."},