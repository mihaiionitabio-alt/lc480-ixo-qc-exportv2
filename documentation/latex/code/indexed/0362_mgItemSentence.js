function mgItemSentence(it){
  if(!it)return "Nothing to report.";
  const sev=MG_WORD[it.sev]||"";
  return `${it.code?it.code+". ":""}${it.title}. ${it.value?it.value+" "+(it.unit||"")+". ":""}${sev}. ${it.state||""}`;
}
