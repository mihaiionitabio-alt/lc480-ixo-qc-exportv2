  if(iId<0||iInc<0)throw new Error('the file needs an "id" column and an "include" column');
  const known=new Set(selCatalogue().map(x=>x.id));
  const unknown=[];let applied=0,rows=0;
  lines.slice(1).forEach(l=>{
    const f=split(l);if(f.length<=Math.max(iId,iInc))return;
    const id=f[iId].trim(),inc=/^(y|yes|true|1|x)$/i.test(f[iInc].trim());
    if(!id)return;rows++;
    if(!known.has(id)){unknown.push(id);return;}
    if(inc)SEL_STATE.ids.add(id);else SEL_STATE.ids.delete(id);
    applied++;
  });
  return {applied,unknown,rows};
}

/* ---------- 5 . the archive ---------- */
function selZipEntries(){
  const entries=[],chosen=selSelected();
  chosen.forEach(x=>{
    try{
      if(x.kind==="image"){
        const f=x.figure();
        entries.push({name:"figures/"+safeName(x.id.slice(4))+".svg",data:missyMarkWithSvg(f.svg,"top-right")});
        if(f.rows&&f.rows.length)entries.push({name:"figures/"+safeName(x.id.slice(4))+".csv",data:csvOf(f.rows)});
      }else{
