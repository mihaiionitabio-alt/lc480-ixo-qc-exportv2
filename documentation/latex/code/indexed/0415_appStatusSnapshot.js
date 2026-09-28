function appStatusSnapshot(){
  const heap=appHeapMB(),staged=appStagedBytes()/1048576;
  if(isFinite(heap))APP_STATS.heapPeak=Math.max(APP_STATS.heapPeak,heap);
  APP_STATS.stagedPeak=Math.max(APP_STATS.stagedPeak,staged);APP_STATS.runsPeak=Math.max(APP_STATS.runsPeak,RUNS.length);
  const task=APP_STATS.tasks[APP_STATS.tasks.length-1]||null;
  return {version:APP_VERSION,phase:APP_STATE.phase,activeTab:APP_STATE.activeTab,generation:APP_STATE.generation,
    runs:RUNS.length,wells:RUNS.reduce((a,r)=>a+(r.wells?r.wells.length:0),0),
    staged:STAGED.length,stagedMB:staged,heapMB:heap,heapPeakMB:APP_STATS.heapPeak,
    historyRows:(typeof CC_STATE==="object"&&CC_STATE&&CC_STATE.imported?CC_STATE.imported.length:0),
    task:task?{label:task.label,detail:task.detail,done:task.done,total:task.total,
      ms:(performance.now?performance.now():Date.now())-task.t0,cancellable:task.cancellable}:null,
    lastTask:APP_STATS.lastTask,lastRender:APP_STATS.lastRender,maxRenderMs:APP_STATS.maxRenderMs,
    faults:APP_STATE.errorLog.length,lastError:APP_STATE.lastError,limits:APP_STATE.limits};
}
