function resultKindOf(d,lists){
  if("CrossingPoint" in d)return "quant";
  if("TargetCpMedian" in d||"NormRatio" in d||"ConcRatio" in d)return "relquant";
  /* Gene Scanning and Melt Curve Genotype records also contain TmCount and Tms
     placeholders. Roche's LIMS guide distinguishes them by GroupName / Res /
     Score, so classify those fields before the Tm Calling fields. */
  if("PeakWtFluor" in d||"PeakMutFluor" in d||"Score" in d)return "genotype";
  if("GroupName" in d||"Res" in d)return "genotype";
  if("TmCount" in d||(lists.Tms&&lists.Tms.length))return "tm";
  return "other";
}
