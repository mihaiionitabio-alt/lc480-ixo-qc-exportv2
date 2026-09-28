function machineMetadataDocument(){
  const doc=clone(BASE_MACHINE_METADATA),graph=doc["@graph"],catalog=graph.find(x=>x["@id"]==="#catalog"),
    datasets=RUNS.map(datasetMetadata),pasted=pastedDatasetMetadata();
  const application=graph.find(x=>x["@id"]==="#application");
  if(application){application.softwareVersion=APP_VERSION;application.dateModified="2026-09-23";}
  if(pasted)datasets.push(pasted);
  catalog.dataset=datasets.map(x=>({"@id":x["@id"]}));
  catalog["dcat:dataset"]=catalog.dataset;
  catalog.numberOfItems=datasets.length;
  catalog.dateModified="2026-09-23";
  graph.push(...datasets);
  return doc;
}
