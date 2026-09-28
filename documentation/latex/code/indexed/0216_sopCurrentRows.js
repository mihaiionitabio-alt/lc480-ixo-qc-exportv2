function sopCurrentRows(){
  const view=$("#sop-view").value,ri=$("#sop-run").value;
  return view==="runs"?sopRunRows():view==="criteria"?sopCriteriaRows():view==="samples"?sopSampleRows(ri,true):sopInterpretationRows(ri,true);
}
