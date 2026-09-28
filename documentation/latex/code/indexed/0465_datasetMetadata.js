function datasetMetadata(run,index){
  const m=run.meta||{},id=metadataId(run,index),uid=sourceUidOf(run),sha=sourceSHA256Of(run),crc=sourceCRCOf(run),
    distributions=distributionsFor(run,id),start=m.StartTime||m.RunCreated||m.Created||"",end=m.EndTime||"",
    title=m.name||run.file||`qPCR experiment ${index+1}`,
    description=`Decoded ${run.platform||"LightCycler 480"} qPCR experiment with ${(run.wells||[]).length} stored quantification result(s), `
      +`${uniqueCurveCount(run)} result-linked amplification curve(s) and ${(run.tmWells||[]).length} melting result(s).`;
  const identifiers=[
    uid?{"@type":"PropertyValue",propertyID:"LightCycler experiment UID",value:uid}:null,
    sha?{"@type":"PropertyValue",propertyID:"SHA-256",value:sha}:null,
    crc?{"@type":"PropertyValue",propertyID:"CRC-32",value:crc}:null
  ].filter(Boolean);
  const counts=[
    ["Plate rows",run.rows],["Plate columns",run.cols],["Acquisition cycles",run.nCycles],
    ["Analyses",(run.analyses||[]).length],["Stored quantification results",(run.wells||[]).length],
    ["Result-linked curves",uniqueCurveCount(run)],["Acquired channel/well curves",acquiredCurveCount(run)],
    ["Melting results",(run.tmWells||[]).length]
  ].filter(([,v])=>v!==""&&v!=null).map(([name,value])=>({"@type":"PropertyValue",name,value}));
  const dataset={
    "@id":id,"@type":["Dataset","dcat:Dataset"],name:title,"dcterms:title":title,
    description,"dcterms:description":description,
    identifier:identifiers,"dcterms:identifier":identifiers.map(x=>x.value),
    includedInDataCatalog:{"@id":"#catalog"},measurementTechnique:"quantitative real-time PCR (qPCR)",
    keywords:["qPCR",run.platform||"LightCycler 480","primary instrument data","Cq","fluorescence","quality control","data integrity"],
    variableMeasured:variablesFor(run),additionalProperty:counts,
    distribution:distributions,"dcat:distribution":distributions.map(x=>({"@id":x["@id"]})),
    conformsTo:JSONLD_STANDARDS,"dcterms:conformsTo":JSONLD_STANDARDS.map(x=>({"@id":x["@id"]})),
    subjectOf:{"@id":"#metadata-profile"},
    conditionsOfAccess:"Processed locally from a user-selected file. Any downstream access conditions are determined by the responsible data steward.",
    "dcterms:rights":"No licence, consent, community authority or permission for future reuse is inferred by this software.",
    "prov:wasDerivedFrom":{"@id":`${id}/source`},
    "prov:wasGeneratedBy":{"@type":"prov:Activity",name:run.eds?"Read-only QuantStudio .eds decoding":"Read-only LightCycler 480 .ixo decoding",
      "prov:used":{"@id":`${id}/source`},"prov:wasAssociatedWith":{"@id":"#application"}},
    "pav:createdWith":{"@id":"#application"},
    "dcterms:provenance":"Decoded read-only from the unmodified vendor container; stored instrument values are preserved and derived review quantities remain labelled.",
    "rdfs:comment":"This Dataset record describes one locally selected experiment. It does not expose the local path or create a network endpoint."
  };
  if(m.Created)dataset.dateCreated=m.Created;
  if(m.LastModified&&!/^1899/.test(m.LastModified))dataset.dateModified=m.LastModified;
  if(start)dataset.temporalCoverage=end?`${start}/${end}`:start;
  if(m.SWVersion)dataset.softwareVersion=m.SWVersion;
  if(m.InstrumentName)dataset.instrument={"@type":"Thing",name:m.InstrumentName,
    identifier:m.InstrumentID||undefined,description:"qPCR instrument recorded in the source experiment"};
  if(operatorOf(run))dataset["prov:qualifiedAttribution"]={"@type":"prov:Attribution",
    "prov:agent":{"@type":"prov:Agent",name:operatorOf(run)},"dcterms:description":"Instrument operator recorded by the run"};
  return JSON.parse(JSON.stringify(dataset));
}
