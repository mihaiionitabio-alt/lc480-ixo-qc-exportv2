function distributionsFor(run,id){
  const m=run.meta||{},source={
    "@id":`${id}/source`,"@type":["DataDownload","dcat:Distribution","prov:Entity"],
    name:run.file||m.name||"Original vendor file",
    description:run.eds?"Unmodified Applied Biosystems QuantStudio experiment document used as the provenance anchor."
      :"Unmodified Roche LightCycler 480 experiment container used as the provenance anchor.",
    encodingFormat:"application/octet-stream",
    contentSize:m.sourceBytes?`${m.sourceBytes} B`:undefined,
    "spdx:checksum":m.sourceSHA256?{"@type":"spdx:Checksum",
      "spdx:algorithm":{"@id":"spdx:checksumAlgorithm_sha256"},"spdx:checksumValue":m.sourceSHA256}:undefined,
    additionalProperty:{"@type":"PropertyValue",name:"Source container format",value:run.eds?".eds (QuantStudio experiment document, ZIP container)":".ixo (Roche LightCycler 480 experiment)"},
    identifier:[m.UID?`LightCycler experiment UID: ${m.UID}`:null,m.sourceCRC32?`CRC-32: ${m.sourceCRC32}`:null].filter(Boolean),
    "rdfs:comment":"The source filename is recorded, but a local filesystem path is deliberately not published in JSON-LD."
  };
  const out=[source,
    outputDistribution(id,"cq","Stored Cq values","One row per stored result with well, sample, target, role, call and provenance.","text/csv"),
    outputDistribution(id,"settings","Experiment settings","Traceable settings with the source part or property of the vendor container.","text/csv"),
    outputDistribution(id,"metadata","Dataset metadata","This machine-readable description of the application, catalog, datasets, provenance and distributions.","application/ld+json")
  ];
  if((run.wells||[]).some(w=>w.curve))out.push(
    outputDistribution(id,"rdml","RDML 1.4 experiment","Vendor-neutral qPCR exchange representation.","application/zip","https://rdml.org/"),
    outputDistribution(id,"qpcr","qpcR curve table","Wide CSV curve table with Cycles as the first column.","text/csv"),
    outputDistribution(id,"rdes","RDES long curve table","One fluorescence observation per cycle, well and analysis.","text/tab-separated-values")
  );
  if((run.tmWells||[]).length)out.push(
    outputDistribution(id,"melting","Stored melting peaks","One row per stored peak, with call and manual-edit metadata.","text/csv"));
  return out.map(x=>Object.fromEntries(Object.entries(x).filter(([,v])=>v!==undefined)));
}
