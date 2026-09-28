function sopLabName(){return String(sopLab().name||"").trim();}
function sopAnalystName(){return String(sopLab().analyst||"").trim();}

/* ---------- 4 . the CSV the assisted mode hands out and takes back ---------- */
function selCsvTemplate(){
  const rows=selCatalogue().map(x=>({id:x.id,kind:x.kind,group:x.group,title:x.title,
    available:x.ready()?"yes":"no",include:SEL_STATE.ids.has(x.id)?"yes":"no"}));
  return toCSV([{key:"id",label:"id"},{key:"kind",label:"kind"},{key:"group",label:"group"},
    {key:"title",label:"title"},{key:"available",label:"available"},{key:"include",label:"include"}],rows);
}
function selApplyCsv(text){
  const lines=String(text||"").split(/\r?\n/).filter(l=>l.trim().length);
  if(!lines.length)return {applied:0,unknown:[],rows:0};
  const split=l=>{const out=[];let cur="",q=false;
    for(let i=0;i<l.length;i++){const c=l[i];
      if(q){if(c==='"'){if(l[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=c;}
      else if(c==='"')q=true;else if(c===","){out.push(cur);cur="";}else cur+=c;}
    out.push(cur);return out;};
  const head=split(lines[0]).map(h=>h.trim().toLowerCase());
  const iId=head.indexOf("id"),iInc=head.indexOf("include");
