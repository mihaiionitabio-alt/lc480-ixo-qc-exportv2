function outputDistribution(id,key,name,description,encodingFormat,conformsTo){
  const out={"@id":`${id}/distribution/${key}`,"@type":["DataDownload","dcat:Distribution"],
    name,description,encodingFormat,
    "rdfs:comment":"Generated locally on demand. No public contentUrl is asserted because the experiment and export remain on the user's device."};
  if(conformsTo)out.conformsTo={"@id":conformsTo};
  return out;
}
