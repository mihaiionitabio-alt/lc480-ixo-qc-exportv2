function appNotice(area,message){
  /* Operator actions and ordinary limits are recorded, but they are not faults. */
  APP_STATS.notices.push({time:new Date().toISOString(),area:String(area),message:String(message)});
  if(APP_STATS.notices.length>20)APP_STATS.notices.splice(0,APP_STATS.notices.length-20);
  appStatusPaint();
}
