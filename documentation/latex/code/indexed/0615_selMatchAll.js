  "rec:*":{run:"run",rows:"integer",pseudo:["yes","no"]}
});
function selChartItems(){
  return (typeof CC_CHARTS==="undefined"?[]:CC_CHARTS).map(def=>({
    id:"cc:"+def.id,kind:"image",group:"Control charts · "+def.group,title:def.title||def.id,
