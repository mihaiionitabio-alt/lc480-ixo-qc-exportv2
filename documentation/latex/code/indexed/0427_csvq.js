function csvq(v){
  const s=v==null?"":String(v);
  return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
}
