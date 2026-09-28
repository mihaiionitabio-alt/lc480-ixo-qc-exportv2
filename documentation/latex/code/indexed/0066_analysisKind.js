function analysisKind(cls,name){
  const hay=(cls||"")+" "+(name||"");
  for(const [re,kind,label] of ANALYSIS_KINDS)if(re.test(hay))return {kind,label};
  return {kind:"other",label:"Other analysis"};
}
