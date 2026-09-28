  if(!SEL_STATE.ids.size){msg.textContent="Choose at least one figure or table first.";msg.className="ast-msg warn";return;}
  const out=astOutput();
  msg.textContent="Building…";msg.className="ast-msg";
  try{
    if(out==="pdf"||out==="both"){const n=await selDownloadReport();msg.textContent=`Report written (${n.toLocaleString()} bytes).`;}
