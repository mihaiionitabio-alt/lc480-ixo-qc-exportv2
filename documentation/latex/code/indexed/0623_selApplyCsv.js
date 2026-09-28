  const re=new RegExp("^"+p.replace(/[.+^${}()|[\]\\]/g,"\\$&").replace(/\*/g,".*").replace(/\?/g,".")+"$","i");
  return selCatalogue().filter(x=>re.test(x.id)||re.test(x.id.replace(/^[a-z]+:/,""))).map(x=>x.id);
}
function selSelected(){
  const ids=SEL_STATE.ids;
  return selCatalogue().filter(x=>ids.has(x.id));
}
/* One line may name several patterns: "select img:plate data:cq_values" is two. */
function selMatchAll(patterns){
  const out=[];
  String(patterns||"").split(/[\s,]+/).filter(Boolean).forEach(p=>selMatch(p).forEach(id=>{if(!out.includes(id))out.push(id);}));
  return out;
}
function selAdd(patterns){const m=selMatchAll(patterns);m.forEach(id=>SEL_STATE.ids.add(id));return m;}
function selRemove(patterns){const m=selMatchAll(patterns);m.forEach(id=>SEL_STATE.ids.delete(id));return m;}
function selClear(){SEL_STATE.ids.clear();}

/* ---------- 3 . the two laboratory fields ----------
   The profile carries who did the work. They appear on the report, they are
   part of the profile, and they therefore change the profile hash - which is
   the point: a report is attributable. */
function sopLab(){
  if(!SOP.lab||typeof SOP.lab!=="object")SOP.lab={name:"",analyst:""};
