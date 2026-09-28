function sopDownloadWorkbook(){
  if(!RUNS.length)return;
  const prof=[["field","value"],["name",SOP.name],["version",SOP.version],["author",SOP.author],["assay",SOP.assay],["effective",SOP.effective],["sha256",sopHash()],["notes",SOP.notes],[],["profile JSON",sopJSON()]];
  download(baseName()+"_SOP_interpretation.xlsx",makeXlsx([
    sheetOf("Runs",sopRunRows()),sheetOf("Run acceptance",sopCriteriaRows()),sheetOf("Sample report",sopSampleRows("",true)),
    sheetOf("Results by target",sopInterpretationRows("",true)),{name:"SOP profile",rows:prof}]),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}
