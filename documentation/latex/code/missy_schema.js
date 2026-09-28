const SEL_OPTION_RULES=Object.freeze({
  "img:curves":{target:"text",signal:["stored","drn"],log:["yes","no"]},
  "img:plate":{metric:["outcome","status","cq","end_fluorescence","background","amplitude"],target:"text"},
  "img:cqstrip":{colourby:["outcome","role"],target:"text"},
  "img:endpoint":{level:["end","amplitude"],target:"text"},
  "img:*":{target:"text",control:"text"},
  "cc:*":{type:["i","ewma","cusum","trend","xbars","p","u","c","funnel"],x:["order","date","hours","cycles"],phase1:"number",lambda:"number",L:"number",k:"number",h:"number",specLo:"numberOrEmpty",specHi:"numberOrEmpty",warnAhead:"integer",charts:"chartSet"},
  "data:*":{run:"run",rows:"integer",pseudo:["yes","no"]},
  "rec:*":{run:"run",rows:"integer",pseudo:["yes","no"]}
});
function selChartItems(){
  return (typeof CC_CHARTS==="undefined"?[]:CC_CHARTS).map(def=>({
    id:"cc:"+def.id,kind:"image",group:"Control charts · "+def.group,title:def.title||def.id,
    note:def.reading||def.idea||"Control chart",ready:()=>ccInstruments().length>0,
    figure:()=>{
      const insts=ccInstruments();if(!insts.length)throw new Error("no instrument history");