function mgViewExport(){
  const items=mgSafe(()=>exportCatalogue(),[]);
  const ready=items.filter(it=>mgSafe(()=>it.ready(),false));
  const missing=items.filter(it=>!mgSafe(()=>it.ready(),false));
  MG.exports=ready;
  const summaryActions=ready.length
    ?[{key:"3",label:"Download "+String(ready[0].title||"first format").slice(0,36),cmd:"export 0"},
      {key:"4",label:"Open the formats view on the page",cmd:"open page export"}]
    :[{key:"3",label:"Open the formats view on the page",cmd:"open page export"}];
  const out=[mgIt({kind:"export",sev:ready.length?"ok":"none",pict:MG_PICT.summary,kindWord:"downloads",code:"OUT",
    title:"Formats this data set can produce",value:String(ready.length),unit:ready.length===1?"format":"formats",
    limits:missing.length?`${missing.length} format(s) need data this experiment does not hold`:"every format is available",
    state:ready.length?"Select a format below and press Download. Sample names follow the pseudonymisation switch on the page."
      :"Nothing is loaded yet, so no download can be produced.",
    evidence:missing.length?("not available: "+missing.map(m=>m.title).slice(0,4).join(", ")):"",
    rows:ready.slice(0,14).map(it=>[it.title,String(it.note||"").slice(0,64)]),
    actions:summaryActions})];
  ready.forEach((it,i)=>out.push(mgIt({kind:"export",sev:"ok",pict:MG_PICT.export,kindWord:"download",
    code:"D"+(i+1),title:it.title,value:"",unit:"",limits:"ready",state:it.note||"",
    evidence:`download ${i+1} of ${ready.length}`,exportIndex:i,
    rows:[["Format",it.title],["Contents",String(it.note||"").slice(0,90)],
          ["Runs included",String(RUNS.length)],["Profile",`${SOP.name} v${SOP.version}`],
          ["Sample names","as set by the pseudonymisation switch"]],
    actions:[{key:"3",label:"Download this file",cmd:"export "+i}]})));
  return out;
}
