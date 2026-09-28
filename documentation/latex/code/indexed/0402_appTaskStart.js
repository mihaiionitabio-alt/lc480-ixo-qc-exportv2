function appTaskStart(label,total,cancellable){
  const t={id:++APP_STATS.seq,label:String(label||"working"),total:Number(total)||0,done:0,t0:(performance.now?performance.now():Date.now()),
    detail:"",cancellable:!!cancellable,generation:APP_STATE.generation};
  APP_STATS.tasks.push(t);appStatusPaint();return t;
}
