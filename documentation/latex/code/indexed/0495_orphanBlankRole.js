function orphanBlankRole(rec,chRec){
  const byName=roleFromName((rec&&rec.name)||"");
  const byType=TYPE_TO_ROLE[chRec&&chRec.sampleType]||"";
  if(BLANK_ROLES.includes(byName))return byName;
  if(BLANK_ROLES.includes(byType))return byType;
  return "";
}
