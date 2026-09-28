function displayRunTick(run,index){
  return shortDate((run.meta||{}).StartTime||(run.meta||{}).Created)
    ||String(runName(run)).slice(0,11)||String(index+1);
}
