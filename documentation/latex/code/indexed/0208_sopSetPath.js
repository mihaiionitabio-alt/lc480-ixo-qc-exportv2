function sopSetPath(path,value){
  /* A profile written before a field existed has no branch for it; create the branch
     rather than throwing, so an older stored profile still accepts the new fields. */
  const keys=path.split("."),last=keys.pop();let o=SOP;
  keys.forEach(k=>{if(o[k]===null||typeof o[k]!=="object")o[k]={};o=o[k];});o[last]=value;
}
