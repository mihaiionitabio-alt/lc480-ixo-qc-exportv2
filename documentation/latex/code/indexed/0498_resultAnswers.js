function resultAnswers(w){
  if(resultCq(w)!==null)return "cq";
  if(w&&w.undetermined===true)return "undetermined";
  /* a genotype call and a melting temperature are answers in their own modules */
  if(w&&(w.kind==="genotype"||w.kind==="tm")&&((w.call&&String(w.call).trim())||Number.isFinite(Number(w.tm))))return "call";
  const st=`${(w&&w.CpState)||""} ${(w&&w.CrossingPointStatus)||""} ${(w&&w.call)||""}`;
  if(CQ_NEGATIVE_STATUS.test(st))return "undetermined";
  return "";
}
