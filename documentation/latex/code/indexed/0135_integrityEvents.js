function integrityEvents(run,push){
  const g=run.integrity;if(!g)return;
  if(g.kind==="ixo"){
    if(g.ok===true)push("info","Integrity","Container checksum matches the object stream",g.computed);
    else if(g.ok===false)push("error","Integrity","Container checksum does not match — the file was changed after the software sealed it",
      `stored ${g.stored}; recomputed ${g.computed}`);
    else push("review","Integrity","No container checksum could be verified",g.note||"");
    return;
  }
  if(g.zipCrcOk)push("info","Integrity",`ZIP CRC-32 valid for all ${g.entries} entries`,"");
  else push("error","Integrity","ZIP CRC-32 failed",(g.zipCrcBad||[]).join(", "));
  if(g.ok===true)push("info","Integrity","Tamper MD5 matches the stored value",g.computed);
  else if(g.ok===false)push("error","Integrity","Tamper MD5 does not match — the file was changed after the software sealed it",
    `stored ${g.stored}; recomputed ${g.computed}`);
  else push(run.isTemplate?"info":"review","Integrity","No Tamper record in the container",run.isTemplate?"expected for a template":"");
}
