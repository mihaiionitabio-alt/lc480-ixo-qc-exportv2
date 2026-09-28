function derivedSettingsFor(run){
  const keep=RUNS;RUNS=run?[run]:keep;
  try{return derivedSettings();}finally{RUNS=keep;}
}
