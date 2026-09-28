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
      }catch(err){errors.push(`${f.name}: ${err.message}`);}
    }else if(/\.ixo$/i.test(f.name)){
      accepted.push({name:f.name,path:f.name,bytes,archive:null,zip:null});
    }else if(isEdsName(f.name)){
      accepted.push({name:f.name,path:f.name,bytes,archive:null,zip:null,kind:"eds"});
    }else if(/\.rdml$/i.test(f.name)){
      accepted.push({name:f.name,path:f.name,bytes,archive:null,zip:null,kind:"rdml"});
    }else errors.push(`${f.name}: not an .ixo, .eds, .edt, .rdml or .zip file`);
  }
  if(token!==APP_STATE.generation)return;
  // Decode XML one file at a time in readStaged; retain original bytes for provenance.
  STAGED=accepted;
  if(accepted.length){
    /* A new staged selection supersedes the previous run set immediately;
       charts must never describe files that are no longer selected. */
    const hadData=RUNS.length||PASTED;
    RUNS=[];PASTED=null;PSEUDO_MAP=null;CC_STATE.cache=null;CC_STATE.instrument="";CC_STATE.open=null;
    if(hadData){["load","sop","results","panel","graphs","review","export"].forEach(t=>markDirty(t));appNotice("intake","previous data cleared; press Read to load the new selection");}
  }
  setPhase(accepted.length?"staged":"idle","staging complete");
  $("#read").disabled=!accepted.length;
  msg.innerHTML=accepted.length
    ? `<b>${accepted.length}</b> file(s) staged: `
      +accepted.slice(0,10).map(s=>`<span>${esc(s.name)}</span> <span class="tag">${(s.bytes.length/1048576).toFixed(1)} MB</span>`).join(" ")
      +(accepted.length>10?` … <span class="tag">+${accepted.length-10} more, ${(accepted.reduce((a,s)=>a+s.bytes.length,0)/1048576).toFixed(0)} MB in total</span>`:"")
      +(errors.length?`<div class="err" style="margin-top:6px">${errors.map(esc).join("<br>")}</div>`:"")
    : `<span class="err">${esc(errors.join("; "))||"Nothing usable was selected."}</span>`;
  }catch(e){appError("intake",e);msg.innerHTML=`<span class="err">${esc(e.message||String(e))}</span>`;setPhase("idle","staging failed");}
  finally{appTaskEnd(task);appStatusPaint();}
}
