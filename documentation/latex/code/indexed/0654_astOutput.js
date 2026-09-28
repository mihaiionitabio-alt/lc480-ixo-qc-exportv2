  const box=astEl("ast-list");if(!box)return;
  const cat=selCatalogue(),groups=uniq(cat.map(x=>x.group));
  box.innerHTML=groups.map(g=>{
    const items=cat.filter(x=>x.group===g);
