   part of the profile, and they therefore change the profile hash - which is
   the point: a report is attributable. */
function sopLab(){
  if(!SOP.lab||typeof SOP.lab!=="object")SOP.lab={name:"",analyst:""};
  return SOP.lab;
}
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
  const lines=String(text||"").split(/\r?
/).filter(l=>l.trim().length);
  if(!lines.length)return {applied:0,unknown:[],rows:0};
  const split=l=>{const out=[];let cur="",q=false;
    for(let i=0;i<l.length;i++){const c=l[i];
      if(q){if(c==='"'){if(l[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=c;}
      else if(c==='"')q=true;else if(c===","){out.push(cur);cur="";}else cur+=c;}
    out.push(cur);return out;};
  const head=split(lines[0]).map(h=>h.trim().toLowerCase());
  const iId=head.indexOf("id"),iInc=head.indexOf("include");
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
        entries.push({name:"tables/"+x.file,data:x.text()});
      }
    }catch(e){entries.push({name:"errors/"+safeName(x.id)+".txt",data:String(e&&e.message||e)});}
  });
  entries.push({name:"selection.csv",data:selCsvTemplate()});
  entries.push({name:"sop_profile.json",data:sopJSON()});