function controlRootName(name){
  const original=String(name||"").trim();
  return stripLotDate(original).replace(/[\s._,:;/-]+$/g,"").replace(/\s+/g," ").trim()||original;
}
