  if(!p)return [];
  if(p==="all"||p==="*")return selCatalogue().map(x=>x.id);
  if(p==="images")return selImageItems().map(x=>x.id);
  if(p==="data"||p==="tables")return selDataItems().map(x=>x.id);
  if(p==="cc:all")return selChartItems().map(x=>x.id);
  if(/^cc:(hardware|software|method|operator)$/i.test(p))return selChartItems().filter(x=>x.group.toLowerCase().endsWith(p.slice(3).toLowerCase())).map(x=>x.id);
