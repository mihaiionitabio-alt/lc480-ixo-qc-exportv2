function mgViewResults(){
  const out=[];
  if(!RUNS.length&&PASTED)return [mgIt({kind:"results",sev:"none",pict:MG_PICT.sample,kindWord:"pasted table",code:"CSV",
    title:"Pasted Cq table",value:String((PASTED.rows||[]).length),unit:"Cq values",
    state:"Open the results view on the page to inspect the pasted table.",evidence:PASTED.source||"pasted data",
    actions:[{key:"3",label:"Open the results view on the page",cmd:"open page results"}]})];
  const ev=mgSafe(()=>sopEvaluateAll(),[]);
  if(!ev.length)return [mgIt({kind:"results",sev:"none",pict:MG_PICT.sample,kindWord:"results",code:"RES",
    title:"No run has been evaluated yet",value:"0",unit:"runs",
    state:"Load an experiment file; results are recomputed as soon as the profile or the data changes."})];
  const rows=ev.flatMap(e=>e.rows||[]);
  const cnt=o=>rows.filter(r=>r.outcome===o).length;
  const rej=ev.filter(e=>e.accept&&e.accept.ok===false);
  const action=rows.filter(r=>/Invalid|Repeat|Inconclusive|Control fail/.test(r.outcome)).length;
  out.push(mgIt({kind:"summary",sev:rej.length?"alarm":action?"watch":"ok",pict:MG_PICT.summary,kindWord:"results",
    code:"RES",title:"Results under this profile",value:String(rows.length),unit:"interpreted results",
    limits:`${ev.length} run(s) · ${rej.length} rejected · ${action} result(s) need action`,
    state:rej.length?`${rej.length} run(s) were rejected by the profile; their samples are not reportable.`
      :action?`${action} result(s) need an action before the report can be signed.`
      :"Every run was accepted and no result needs an action.",
    evidence:`profile ${SOP.name} v${SOP.version}`,
    rows:[["Positive",String(cnt("Positive"))],["Negative",String(cnt("Negative"))],
          ["Inconclusive",String(cnt("Inconclusive"))],["Repeat",String(cnt("Repeat"))],
          ["Invalid",String(cnt("Invalid")+cnt("Invalid run"))],["Control failed",String(cnt("Control fail"))],
          ["Control accepted",String(cnt("Control pass"))],["Standards",String(cnt("Standard"))]],
    actions:[{key:"3",label:"Open the results view on the page",cmd:"open page results"}]}));
  if(rej.length)out.push(mgIt({kind:"results",sev:"alarm",pict:MG_PICT.run,kindWord:"rejected runs",code:"REJ",
    title:"Runs rejected by the profile",value:String(rej.length),unit:rej.length===1?"run":"runs",
    limits:`of ${ev.length} run(s) read`,
    state:((rej[0].accept&&rej[0].accept.reasons)||[]).join("; ")||"see the results view for the reasons",
    evidence:rej.map(r=>runName(r.run)).slice(0,3).join(", "),
    rows:rej.slice(0,12).map(r=>[runName(r.run),((r.accept&&r.accept.reasons)||[]).join("; ").slice(0,70)||"rejected"]),
    actions:[{key:"3",label:"Open the results view on the page",cmd:"open page results"}]}));
  /* per outcome class */
  const order=["Invalid run","Invalid","Control fail","Repeat","Inconclusive","Positive","Negative","Control pass","Standard"];
  order.forEach((o,i)=>{
    const list=rows.filter(r=>r.outcome===o);if(!list.length)return;
    const bad=/Invalid|Control fail/.test(o),warn=/Repeat|Inconclusive/.test(o);
    out.push(mgIt({kind:"results",sev:bad?"alarm":warn?"watch":"ok",pict:MG_PICT.sample,kindWord:"outcome",
      code:"O"+(i+1),title:o,value:String(list.length),unit:list.length===1?"result":"results",
      limits:`${uniq(list.map(r=>r.target)).length} target(s) · ${uniq(list.map(r=>r.sample)).length} sample(s)`,
      state:mgTxt((SOP.outcomes[o]||{}).label)+((list[0]&&list[0].reason)?" — "+list[0].reason:""),
      evidence:uniq(list.map(r=>r.target)).slice(0,6).join(", "),
      rows:list.slice(0,12).map(r=>[`${r.sample} · ${r.target}`,
        Number.isFinite(r.cqMean)?"Cq "+r.cqMean.toFixed(2):(r.reason||"—")])}));
  });
  /* per target */
  const byT=new Map();rows.forEach(r=>{const l=byT.get(r.target)||[];l.push(r);byT.set(r.target,l);});
  [...byT].forEach(([t,list],i)=>{
    const cq=list.map(r=>r.cqMean).filter(Number.isFinite);
    const need=list.filter(r=>/Invalid|Repeat|Inconclusive|Control fail/.test(r.outcome)).length;
    out.push(mgIt({kind:"results",sev:need?"watch":"ok",pict:MG_PICT.sample,kindWord:"target",code:"TG"+(i+1),
      title:t||"unnamed target",value:cq.length?cq.reduce((a,b)=>a+b,0)/cq.length:"—",
      unit:cq.length?"mean Cq":"",
      limits:`${list.length} result(s) · ${cq.length} with a Cq${need?` · ${need} need action`:""}`,
      state:cq.length?`Cq from ${Math.min(...cq).toFixed(2)} to ${Math.max(...cq).toFixed(2)} across ${uniq(list.map(r=>r.sample)).length} sample(s).`
        :"No Cq was stored for this target.",
      evidence:uniq(list.map(r=>r.role||"")).filter(Boolean).join(", ")||"—",
      rows:[["Results",String(list.length)],["Samples",String(uniq(list.map(r=>r.sample)).length)],
            ["Positive",String(list.filter(r=>r.outcome==="Positive").length)],
            ["Negative",String(list.filter(r=>r.outcome==="Negative").length)],
            ["Need action",String(need)],
            ["Lowest Cq",cq.length?Math.min(...cq).toFixed(2):"—"],
            ["Highest Cq",cq.length?Math.max(...cq).toFixed(2):"—"]]}));
  });
  /* per run */
  mgSafe(()=>sopRunRows(),[]).forEach((r,i)=>{
    out.push(mgIt({kind:"results",sev:r.rejected?"alarm":(r.review?"watch":"ok"),pict:MG_PICT.run,kindWord:"run",
      code:"R"+(i+1),title:r.experiment,value:String(r.positive),unit:"positive",
      limits:`${r.negative} negative · ${r.inconclusive} inconclusive · ${r.repeat} repeat · ${r.invalid} invalid`,
      state:r.rejected?("Rejected: "+r.rejected):r.review?("For review: "+r.review):"Accepted under this profile.",
      evidence:`${r.platform} · ${mgTxt(r.run_start)}`,
      rows:[["Status",mgTxt(r.status)],["Platform",mgTxt(r.platform)],["Run start",mgTxt(r.run_start)],
            ["Run end",mgTxt(r.run_end)],["Run minutes",mgTxt(r.run_minutes)],
            ["Last change",mgTxt(r.last_change)],["Hours end to change",mgTxt(r.hours_run_end_to_last_change)],
            ["Control failed",String(r.control_fail)]]}));
  });
  return out;
}
