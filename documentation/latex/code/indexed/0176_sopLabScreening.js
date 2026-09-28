function sopLabScreening(){
  const p=SOP_PRESETS.gmo();p.name="GMO laboratory mapping — review scaffold";p.version="2.0";
  p.notes="Control identity scaffold from supplied procedures. Confirm historical SOP, material/dilution and sample-vs-LOD comparison before release decisions.";
  p.reviewOnly=true;
  const c=(id,name,match,targets,expect,purpose,material,lo="",hi="",reps=1)=>
    ({id,name,matchBy:"name",match,targets,expect,purpose,material,cqLo:lo,cqHi:hi,minReplicates:reps,minPerRun:0,onFail:"review"});
  p.controls=[
    c("ntc","NTC","NTC","*","negative","reaction blank",""),
    c("extr","Extraction blank","/^(BLANK|BLK)\\s*EX/i","*","negative","extraction blank",""),
    c("grind","Grinding / environment blank","/^(BLANK|BLK)\\s*MAC/i","*","negative","grinding blank",""),
    c("cn-gmo","Negative matrix — screening","/^(CN|NC)\\s+(PORUMB|SOIA)\\b/i","35S|P35S|T-NOS|TNOS","negative","negative matrix",""),
    c("cn-maize","Negative maize — reference","/^(CN|NC)\\s+PORUMB\\b/i","HMG|hmgA","positive","reference check","",20,27),
    c("cn-soy","Negative soy — reference","/^(CN|NC)\\s+SOIA\\b/i","LEC|Le1","positive","reference check","",20,27),
    c("maize-lod","Maize LOD control","/^415B(?=\\b|\\d)/i","35S|P35S|T-NOS|TNOS","positive","LOD control","415B",29,36,2),
    c("soy-lod","Soy LOD control","/^410CP(?=\\b|\\d)/i","35S|P35S|T-NOS|TNOS","positive","LOD control","410CP",29,36,2),
    c("maize-ref","Maize control reference","/^415B(?=\\b|\\d)/i","HMG|hmgA","positive","reference check","415B",20,27,2),
    c("soy-ref","Soy control reference","/^410CP(?=\\b|\\d)/i","LEC|Le1","positive","reference check","410CP",20,27,2)];
  return p;
}
