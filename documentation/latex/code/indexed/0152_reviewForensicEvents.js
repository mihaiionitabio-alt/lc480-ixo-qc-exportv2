function reviewForensicEvents(){
  let base=[];try{base=reviewForensicEventsCore();}catch(e){console.error(e);}
  let extra=[],sop=[];try{extra=extraForensicEvents();}catch(e){console.error(e);}
  try{sop=sopEvents();}catch(e){console.error(e);}
  // Control-chart alarms are displayed and exported from Tab 2. Keep the forensic log
  // focused on file, result, timeline and interpretation evidence.
  return base.concat(extra,sop);
}
