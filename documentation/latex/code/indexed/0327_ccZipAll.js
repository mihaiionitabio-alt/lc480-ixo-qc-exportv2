async function ccZipAll(withPng,onProgress){
  const entries=[],insts=ccInstruments(),proto=CC_STATE.protocol,sha=sopHash(),stamp=new Date().toISOString().slice(0,16).replace(/[:T]/g,"-");
  const fname=(def,v,ext)=>safeName(`${def.code}_${def.id}${v?"_"+v.replace(/[0-9a-f]{40,64}/gi,h=>h.slice(0,8)).replace(/\s*°C/g,"").replace(/\s*→\s*/g,"-to-"):""}`).slice(0,100)+ext;
  const readme=[`Control charts exported ${new Date().toISOString()} from the qPCR page (Control panel).`,
    `SOP profile ${SOP.name} v${SOP.version}, SHA-256 ${sha}.`,proto?`Protocol filter: ${proto} (instruments that never ran it: all runs).`:"Protocol filter: all protocols.",
    "One folder per instrument (platform_serial). In each folder:",
    "  00_summary.csv          status of every chart on the latest run (in control / watch / alarm / not enough data)",
    "  <code>_<title>[_<channel or transition>].svg   the chart as shown on the chart page",
    "  ... .csv                the numbers behind it: value, centre, limits, alarm rule and direction for every run",
    withPng?"  ... .png                the same chart as an image (2x)":"",
    "  history.json / .csv     the instrument history (one row per run); import the JSON on the Control panel next time","",
    "Instruments:"];
  let done=0;const total=insts.reduce((n,i)=>n+CC_CHARTS.filter(d=>d.inst.includes(i.platform)).length,0);
  for(const inst of insts){
    const folder=safeName(inst.key.replace(/\s*·\s*/,"_"))+"/";
    const hasProto=proto&&ccAllRows().some(r=>r.instrument===inst.key&&r.protocol===proto);
    const keep=CC_STATE.protocol;CC_STATE.protocol=hasProto?proto:"";
    let rows;try{rows=ccRowsFor(inst.key);}finally{CC_STATE.protocol=keep;}
    if(!rows.length)continue;
    const pf=rows[0].platform,summary=[];
    readme.push(`  ${folder}  ${rows.length} run(s)${hasProto?" of the selected protocol":""}, ${sopFmtTime(rows[0].date).slice(0,10)} → ${sopFmtTime(rows[rows.length-1].date).slice(0,10)}`);
    for(const def of CC_CHARTS.filter(d=>d.inst.includes(pf))){
      const vs=ccVariants(def,rows);
      for(const v of (vs.length?vs:[""])){
        try{const res=ccCompute(def,rows,v),st=ccStatus(res);
          summary.push({code:def.code,chart:def.title,group:def.group,variant:v,runs:res.type==="funnel"?res.nRows:res.n,status:st.level==="ok"?"in control":st.level==="warn"?"watch":st.level==="bad"?"alarm":"not enough data",
            detail:st.text,latest:Number.isFinite(st.last)?st.last:"",unit:def.unit,alarms:res.pts.filter(p=>p.flags.length).length,chart_type:res.type,file:fname(def,v,".svg")});
          if(!res.pts.some(p=>Number.isFinite(p.y)))continue;
          let svg=ccChartSvg(res,`${inst.key} · ${def.code} ${def.title}${v?" · "+v:""}`)+(res.type==="xbars"?ccSChartSvg(res):"");
          if(res.type==="xbars"){const a=ccChartSvg(res,`${inst.key} · ${def.code} ${def.title}${v?" · "+v:""}`),b=ccSChartSvg(res);svg=a;
            if(b)entries.push({name:folder+fname(def,v,"_S-chart.svg"),data:b.replace("<svg ",`<svg data-sop="sha256:${sha}" `)});}
          svg=svg.replace("<svg ",`<svg data-sop="${svgEsc(SOP.name)} v${svgEsc(SOP.version)} sha256:${sha}" data-instrument="${svgEsc(inst.key)}" `);
          entries.push({name:folder+fname(def,v,".svg"),data:svg});
          const cr=ccChartRows(def,res,v);if(cr.length)entries.push({name:folder+fname(def,v,".csv"),data:csvOf(cr)});
          if(withPng){const png=await ccSvgToPng(svg);if(png)entries.push({name:folder+fname(def,v,".png"),data:png});}
        }catch(e){entries.push({name:folder+fname(def,v,"_error.txt"),data:String(e&&e.message||e)});}
      }
      done++;if(onProgress&&done%6===0){onProgress(done,total);await new Promise(r=>setTimeout(r,0));}
    }
    const order={alarm:0,watch:1,"in control":2,"not enough data":3};summary.sort((a,b)=>order[a.status]-order[b.status]||a.code.localeCompare(b.code));
    entries.push({name:folder+"00_summary.csv",data:csvOf(summary)});
    const keepI=CC_STATE.instrument;CC_STATE.instrument=inst.key;
    try{entries.push({name:folder+"history.json",data:ccHistoryJSON(true)});entries.push({name:folder+"history.csv",data:ccHistoryCSV()});}finally{CC_STATE.instrument=keepI;}
  }
  entries.push({name:"sop_profile.json",data:sopJSON()});
  entries.push({name:"README.txt",data:readme.filter(l=>l!=="").join("\n")+"\n"});
  download(`control_charts_all_instruments_${stamp}.zip`,makeStoredZip(entries),"application/zip");
  return entries.length;
}
