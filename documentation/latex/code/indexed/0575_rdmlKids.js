function rdmlKids(el,name){
  const out=[];if(!el)return out;
  for(const c of el.children)if(c.localName===name)out.push(c);
  return out;
}
