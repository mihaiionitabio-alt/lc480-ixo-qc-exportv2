function appError(area,error,context){
  const e=error instanceof Error?error:new Error(String(error));
  const item={time:new Date().toISOString(),area:String(area||"unknown"),message:e.message||String(e),context:context||null};
  APP_STATE.lastError=item;APP_STATE.errorLog.push(item);
  if(APP_STATE.errorLog.length>APP_LIMITS.maxFaults)APP_STATE.errorLog.splice(0,APP_STATE.errorLog.length-APP_LIMITS.maxFaults);
  console.error(`[qPCR ${item.area}]`,e,context||"");
  return item;
}
