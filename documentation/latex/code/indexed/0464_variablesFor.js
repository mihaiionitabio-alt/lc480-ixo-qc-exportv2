function variablesFor(run){
  const out=[];
  if((run.wells||[]).length)out.push({"@type":"PropertyValue",name:"Stored quantification cycle",propertyID:"Cq",unitText:"PCR cycle"},
    {"@type":"PropertyValue",name:"Instrument result call",propertyID:"Call"});
  if((run.wells||[]).some(w=>w.curve))out.push({"@type":"PropertyValue",name:"Raw fluorescence",propertyID:"Fluorescence",unitText:"instrument raw unit"});
  if((run.tmWells||[]).length)out.push({"@type":"PropertyValue",name:"Stored melting temperature",propertyID:"Tm",unitCode:"CEL"});
  return out;
}
