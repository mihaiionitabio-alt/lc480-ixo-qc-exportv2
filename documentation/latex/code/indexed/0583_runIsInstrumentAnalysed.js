function runIsInstrumentAnalysed(run){
  const s=runProcessingState(run).state;return s==="instrument"||s==="vendor-export";
}
