async function intake(fileList){
  const token=++APP_STATE.generation;setPhase("staging","new file selection");
  const msg=$("#loadmsg"),accepted=[],errors=[];let total=0;
  const files=[...(fileList||[])];
  const task=appTaskStart("Staging files",files.length,true);
  try{
  if(files.length>APP_STATE.limits.maxFiles){
    const msgText=`Selected ${files.length} files; the limit is ${APP_STATE.limits.maxFiles}. Remove files and try again.`;
    appNotice("intake",msgText);STAGED=[];$("#read").disabled=true;msg.innerHTML=`<span class="err">${esc(msgText)}</span>`;setPhase("idle","selection refused");return;
  }
  for(const f of files){
    if(token!==APP_STATE.generation){
      if(APP_STATE.cancelRequested){APP_STATE.cancelRequested=false;setPhase(STAGED.length?"staged":"idle","staging stopped");msg.innerHTML=`<div class="notice warn">Staging was stopped. The previous staged selection was kept.</div>`;}
      return;
    }
    const announced=Number(f&&f.size)||0;
    if(announced&&total+announced>APP_STATE.limits.maxBytes){
      const msgText=`Total staged size would exceed ${(APP_STATE.limits.maxBytes/1073741824).toFixed(0)} GiB.`;
      errors.push(`${f.name}: ${msgText}`);appNotice("intake",msgText);break;
    }
    appTaskStep(task);
    const ab=await f.arrayBuffer(),bytes=new Uint8Array(ab);
    total+=bytes.length;
    if(total>APP_STATE.limits.maxBytes){
      const msgText=`Total staged size exceeds ${(APP_STATE.limits.maxBytes/1073741824).toFixed(0)} GiB.`;
      errors.push(`${f.name}: ${msgText}`);appNotice("intake",msgText);break;
    }
    if(/\.zip$/i.test(f.name)){
      const archive={name:f.name,size:bytes.length};
      try{
        /* A QuantStudio document is itself a ZIP; recognise one that was renamed. */
        const probe=await readZip(ab,archive,/^apldbio\/sds\/experiment\.xml$/);
        if(probe.length){accepted.push({name:f.name.replace(/\.zip$/i,".eds"),path:f.name,bytes,archive:null,zip:null,kind:"eds"});continue;}
        /* An RDML file is a ZIP holding rdml_data.xml; recognise a renamed export. */
        const rprobe=await readZip(ab,archive,/^rdml_data\.xml$/i);
        if(rprobe.length){accepted.push({name:f.name.replace(/\.zip$/i,".rdml"),path:f.name,bytes,archive:null,zip:null,kind:"rdml"});continue;}
        const entries=await readZip(ab,archive,/\.(ixo|eds|edt)$/i);
        if(!entries.length)errors.push(`${f.name}: contains no .ixo, .eds or .rdml entries`);
        entries.forEach(e=>{if(isEdsName(e.name))e.kind="eds";});
        accepted.push(...entries);
// … 30 more line(s): the complete code is at lines 10033–10062 of the HTML file