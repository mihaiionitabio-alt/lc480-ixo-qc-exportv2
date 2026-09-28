function appTaskEnd(t,note){
  if(!t)return;const i=APP_STATS.tasks.indexOf(t);if(i>=0)APP_STATS.tasks.splice(i,1);
  t.ms=(performance.now?performance.now():Date.now())-t.t0;if(note)t.note=note;
  APP_STATS.lastTask={label:t.label,ms:t.ms,note:t.note||"",at:new Date().toISOString()};appStatusPaint();
}
