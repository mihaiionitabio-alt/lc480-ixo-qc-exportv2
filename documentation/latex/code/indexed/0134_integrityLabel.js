function integrityLabel(run){
  const g=run&&run.integrity;if(!g)return "not checked";
  if(g.kind==="eds")return `${g.zipCrcOk?"CRC-32 valid":"CRC-32 FAILED"}; ${g.ok===true?"Tamper MD5 matches":g.ok===false?"Tamper MD5 MISMATCH":"no Tamper record"}`;
  return g.ok===true?"container checksum matches":g.ok===false?"container checksum MISMATCH":"no container checksum";
}
