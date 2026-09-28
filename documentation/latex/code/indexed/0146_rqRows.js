function rqRows(){
  return RUNS.flatMap(r=>(r.rqResults||[]).map(q=>({experiment:runName(r),platform:r.platform||"LightCycler 480",
    sample:q.sample,target:q.target||q.targetTargetName,reference:q.referenceName,calibrator:q.isCalibrator?"yes":"",
    n:q.n??"",target_cq_mean:q.targetCp??"",target_cq_sd:q.targetCpSD??"",reference_cq_mean:q.refCp??"",reference_cq_sd:q.refCpSD??"",
    delta_cq_mean:q.dctMean??"",delta_cq_sd:q.dctSd??"",delta_cq_se:q.dctSe??"",delta_delta_cq:q.ddct??"",
    ratio:q.normRatio??q.concRatio??"",ratio_min:q.rqMin??"",ratio_max:q.rqMax??"",ratio_sd:q.normRatioSD??q.concRatioSD??"",
    pairing:q.pairingName||"",rule:q.rule||""})));
}
