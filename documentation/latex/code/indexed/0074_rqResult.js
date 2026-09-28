function rqResult(el,isCalib){
  if(!el)return null;
  const n=t=>{const v=pv(el,t);return v===""?null:Number(v);};
  return {
    isCalib,
    pairName:pv(el,"PairName"),
    pairings:[...el.querySelectorAll(':scope > list[name="PairingList"] > item')].map(x=>(x.textContent||"").trim()),
    targetCp:n("TargetCpMedian"),targetCpSD:n("TargetCpMedianSTD"),
    refCp:n("RefCpMedian"),refCpSD:n("RefCpMedianSTD"),
    concRatio:n("ConcRatio"),concRatioSD:n("ConcRatioSTD"),
    normRatio:n("NormRatio"),normRatioSD:n("NormRatioSTD"),
    targetCall:pv(el,"TargetCall"),refCall:pv(el,"RefCall"),
    concStat:pv(el,"ConcRatioStat"),normStat:pv(el,"NormRatioStat"),
    hasConcError:pv(el,"HasConcError")==="1",hasNormError:pv(el,"HasNormError")==="1",
    externalCurve:pv(el,"ExtCurve")==="1",inChart:pv(el,"InChart")==="1"
  };
}
