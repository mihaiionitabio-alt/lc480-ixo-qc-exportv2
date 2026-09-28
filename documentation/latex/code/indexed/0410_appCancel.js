function appCancel(){
  if(!APP_STATS.tasks.some(t=>t.cancellable))return;
  APP_STATE.cancelRequested=true;APP_STATE.generation++;            /* the running loops test this token and stop */
  appNotice("operator","the operation was stopped from the status bar");
}
