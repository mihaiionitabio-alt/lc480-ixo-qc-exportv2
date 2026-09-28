function pastedDatasetMetadata(){
  if(!PASTED||!PASTED.rows||!PASTED.rows.length)return null;
  return {"@id":"#dataset-pasted-cq","@type":["Dataset","dcat:Dataset"],
    name:"Pasted Cq table",description:`Locally parsed Cq table with ${PASTED.rows.length} numeric row(s).`,
    includedInDataCatalog:{"@id":"#catalog"},measurementTechnique:"quantitative real-time PCR (qPCR)",
    variableMeasured:[{"@type":"PropertyValue",name:"Quantification cycle",propertyID:"Cq",unitText:"PCR cycle"}],
    distribution:[outputDistribution("#dataset-pasted-cq","cq","Parsed Cq values","Normalised local CSV representation.","text/csv")],
    subjectOf:{"@id":"#metadata-profile"},
    conditionsOfAccess:"Processed locally from user-pasted values. Any downstream access conditions are determined by the responsible data steward.",
    "dcterms:rights":"No creator, licence, consent, community authority or permission for future reuse is inferred by this software.",
    "rdfs:comment":"This record has no instrument-level provenance because it was created from pasted tabular values rather than an .ixo or .eds container."};
}
