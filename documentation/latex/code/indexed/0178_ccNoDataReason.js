function ccNoDataReason(def){
  if(["pc_cq","pc_amplitude"].includes(def.id)&&!SOP.controls.some(c=>c.expect==="positive"))
    return "profile has no positive-control rule — configure controls";
  if(def.id==="ic_shift")return "requires a fixed IC reference Cq and matching IC target";
  return "no eligible measurements — check role mapping and assay applicability";
}
