function renderCcDetail(){
  const card=$("#cc-detail"),def=CC_BY_ID[CC_STATE.open];if(!card||!def){if(card)card.hidden=true;return;}
  const rows=ccRowsFor(CC_STATE.instrument);if(!rows.length){card.hidden=true;return;}
  const platform=rows[0].platform,vs=ccVariants(def,rows);
  if(!vs.includes(CC_STATE.variant))CC_STATE.variant=vs[0]||"";
  const res=ccCompute(def,rows,CC_STATE.variant),st=ccStatus(res),cfg=res.cfg;
  const types=def.type==="funnel"?["funnel"]:["p","u","c"].includes(def.type)?[def.type]:def.type==="xbars"?["xbars","i","ewma","cusum","trend"]:["i","ewma","cusum","trend"];
  const TL={i:"Individuals (I) with run rules",ewma:"EWMA (slow drift)",cusum:"CUSUM (small persistent shift)",trend:"Trend / wear line with prediction",
    xbars:"X̄–S (within-run subgroups)",p:"p-chart (proportion)",u:"u-chart (events per hour)",c:"c-chart (count)",funnel:"Funnel plot by operator"};
  const flagged=res.type==="funnel"?res.pts.filter(p=>p.flags.length):res.pts.filter(p=>p.flags.length&&Number.isFinite(p.y));
  const n=v=>v===""||v==null?"":v;
  card.hidden=false;
  card.innerHTML=`<div class="cc-head"><div><span class="tag">${esc(def.code)}</span> <b style="font-size:16px">${esc(ui(def.title))}</b>
      <div class="hint">${esc(ui(CC_GROUPS.find(g=>g.id===def.group).title))} · ${esc(CC_STATE.instrument)} · ${esc(ui("source"))}: ${esc(def.source)}</div></div>
      <div><span class="cc-pill" style="background:${CC_COL[st.level]}">${esc(ui(st.level==="ok"?"in control":st.level==="warn"?"watch":st.level==="bad"?"alarm":"no data"))}</span>
      <button class="ghost" id="cc-close" type="button">✕ ${esc(ui("Close"))}</button></div></div>
    <p class="sub">${esc(ui(def.idea))}</p>
    <div class="toolbar">
      ${vs.length>1?`<label>${esc(ui("Channel / target"))}<select id="cc-variant">${vs.map(v=>`<option${v===CC_STATE.variant?" selected":""}>${esc(v)}</option>`).join("")}</select></label>`:""}
      <label>${esc(ui("Chart type"))}<select id="cc-type">${types.map(t=>`<option value="${t}"${t===res.type?" selected":""}>${esc(ui(TL[t]))}</option>`).join("")}</select></label>
      ${res.type!=="funnel"?`<label>${esc(ui("X axis"))}<select id="cc-x">${[["order","Run order"],["date","Date"],["hours","Cumulative run hours"],["cycles","Block cycles (QuantStudio)"]].map(([v,l])=>`<option value="${v}"${(cfg.x||def.x||"order")===v?" selected":""}>${esc(ui(l))}</option>`).join("")}</select></label>`:""}
      <button class="ghost" id="cc-svg" type="button">SVG</button><button class="ghost" id="cc-png" type="button">PNG</button><button class="ghost" id="cc-csv" type="button">${esc(ui("Data (CSV)"))}</button>
    </div>
    <div id="cc-chart" class="chart-wrap">${ccChartSvg(res,`${def.code} ${def.title}${CC_STATE.variant?" · "+CC_STATE.variant:""}`)}${res.type==="xbars"?ccSChartSvg(res):""}</div>
    <div class="notice ${st.level==="bad"?"bad":st.level==="warn"?"warn":"ok"}"><b>${esc(st.text)}</b>${res.shift&&res.shift.date&&!SOP.locked&&/sustained shift/.test(st.text)?` <button class="ghost" id="cc-rebase" data-date="${esc(new Date(res.shift.date).toISOString().slice(0,10))}">${esc(ui("Start a new baseline on"))} ${esc(new Date(res.shift.date).toISOString().slice(0,10))}</button>`:""}${res.reach?` — ${esc(ui("the fitted line reaches"))} ${fmtTick(+res.reach.limit.toPrecision(3))} ${esc(def.unit)} ${res.X.kind==="date"?`${esc(ui("around"))} ${esc(sopFmtTime(res.reach.at*864e5).slice(0,10))}`:`${esc(ui("at"))} ${esc(res.X.label.toLowerCase())} ≈ ${fmtTick(+res.reach.at.toPrecision(4))}`}.`:""}</div>
    <h3>${esc(ui("How to read it"))}</h3><p class="sub">${esc(ui(def.reading))}</p>
    ${CC_LIMIT_TEXT[def.id]?`<h3>${esc(ui("What a result outside the limits means"))}</h3>
      <div class="cc-lim"><div><b>${esc(ui("▼ Below the lower limit"))}</b><p>${esc(ui(CC_LIMIT_TEXT[def.id].lo))}</p></div>
      <div><b>${esc(ui("▲ Above the upper limit"))}</b><p>${esc(ui(CC_LIMIT_TEXT[def.id].hi))}</p></div></div>`:""}
    ${flagged.length?`<h3>${esc(ui("Alarms"))} (${flagged.length})</h3><div class="scroll" style="max-height:220px">${table(
      res.type==="funnel"?[{key:"operator",label:"Operator"},{key:"n",label:"n",n:1},{key:"rate",label:"Rate",n:1},{key:"flags",label:"Rule"}]
        :[{key:"run",label:"Experiment"},{key:"date",label:"Date"},{key:"operator",label:"Operator"},{key:"value",label:"Value",n:1},{key:"dir",label:"Direction"},{key:"flags",label:"Rule"}],
      flagged.slice(-60).reverse().map(p=>res.type==="funnel"?{operator:p.operator,n:p.n,rate:(100*p.y).toFixed(1)+" %",flags:p.flags.join(", ")}
        :{run:p.row.run,date:sopFmtTime(p.row.date),operator:p.row.operator,value:fmtTick(+Number(p.raw!==undefined?p.raw:p.y).toPrecision(4)),dir:ui(ccAlarmDir(p,res)==="lo"?"▼ below":"▲ above"),flags:p.flags.join(", ")}))}</div>`:""}
    <details class="sop-sec" ${SOP.locked?"":"open"}><summary>${esc(ui("Settings for this chart (saved in the SOP profile)"))}</summary>
      <div class="sop-grid">
        <label class="sop-field"><span>${esc(ui("Alarm action"))}</span><select data-cc-cfg="action">${["review","reject","off"].map(a=>`<option value="${a}"${cfg.action===a?" selected":""}>${esc(ui(a==="review"?"Flag for review in the forensic log":a==="reject"?"Error in the forensic log":"No alarm (chart only)"))}</option>`).join("")}</select></label>
        <label class="sop-field"><span>${esc(ui("Baseline runs (Phase I)"))}</span><input type="number" min="5" step="1" data-cc-cfg="phase1" value="${n(cfg.phase1)}"></label>
        <label class="sop-field"><span>${esc(ui("Baseline starts on (after a repair or service)"))}</span><input type="date" data-cc-cfg="baseFrom" value="${esc(cfg.baseFrom||"")}"></label>
        <label class="sop-field"><span>${esc(ui("Lower specification"))} (${esc(def.unit)})</span><input type="number" step="any" data-cc-cfg="specLo" value="${n(cfg.specLo)}" placeholder="${Number.isFinite(res.spec.lo)?fmtTick(+res.spec.lo.toPrecision(4)):""}"></label>
        <label class="sop-field"><span>${esc(ui("Upper specification"))} (${esc(def.unit)})</span><input type="number" step="any" data-cc-cfg="specHi" value="${n(cfg.specHi)}" placeholder="${Number.isFinite(res.spec.hi)?fmtTick(+res.spec.hi.toPrecision(4)):""}"></label>
        ${res.type==="ewma"?`<label class="sop-field"><span>EWMA λ</span><input type="number" step="0.05" min="0.05" max="1" data-cc-cfg="lambda" value="${n(cfg.lambda)}"></label>
          <label class="sop-field"><span>EWMA L</span><input type="number" step="0.1" data-cc-cfg="L" value="${n(cfg.L)}"></label>`:""}
        ${res.type==="cusum"?`<label class="sop-field"><span>CUSUM k (σ)</span><input type="number" step="0.1" data-cc-cfg="k" value="${n(cfg.k)}"></label>
          <label class="sop-field"><span>CUSUM h (σ)</span><input type="number" step="0.5" data-cc-cfg="h" value="${n(cfg.h)}"></label>`:""}
        ${res.type==="trend"?`<label class="sop-field"><span>${esc(ui("Warn when the limit is closer than (runs)"))}</span><input type="number" step="1" data-cc-cfg="warnAhead" value="${n(cfg.warnAhead)}"></label>
          <label class="sop-field"><span>${esc(ui("Fit the wear line on"))}</span><select data-cc-cfg="trendFit">${[["all","All runs since the baseline (updates with every run)"],["phase1","Only the baseline runs (Phase I, fixed)"]].map(([v,l])=>`<option value="${v}"${cfg.trendFit===v?" selected":""}>${esc(ui(l))}</option>`).join("")}</select></label>`:""}
        ${res.type==="i"&&!def.westgard?`<div class="sop-field"><span>${esc(ui("Run rules (Western Electric)"))}</span>${[["r2","2 of 3 beyond 2σ"],["r3","4 of 5 beyond 1σ"],["r4","8 on one side"],["r5","6 rising/falling"]].map(([k,l])=>`<label style="margin:0"><span><input type="checkbox" data-cc-rule="${k}" style="width:auto"${cfg.rules[k]?" checked":""}> ${esc(ui(l))}</span></label>`).join("")}</div>`:""}
      </div>
      <div class="toolbar"><button class="ghost" id="cc-reset" type="button">${esc(ui("Reset this chart to defaults"))}</button>
        <span class="hint">${esc(ui("Changes update the profile SHA-256 like any other SOP rule; save the profile on the SOP page to keep them."))}</span></div>
    </details>`;
  const re=()=>{CC_STATE.cache=null;markDirty("sop","review");renderPanel();};
  $("#cc-close").onclick=()=>{CC_STATE.open=null;card.hidden=true;};
  if($("#cc-variant"))$("#cc-variant").onchange=e=>{CC_STATE.variant=e.target.value;renderCcDetail();};
  $("#cc-type").onchange=e=>{ccSetCfg(def.id,{type:e.target.value===def.type?"":e.target.value});re();};
  if($("#cc-x"))$("#cc-x").onchange=e=>{ccSetCfg(def.id,{x:e.target.value});re();};
  card.querySelectorAll("[data-cc-cfg]").forEach(el=>{if(SOP.locked)el.disabled=true;el.onchange=()=>{
    const k=el.dataset.ccCfg;ccSetCfg(def.id,{[k]:el.type==="number"?(el.value===""?"":Number(el.value)):el.value});re();};});
  card.querySelectorAll("[data-cc-rule]").forEach(el=>{if(SOP.locked)el.disabled=true;el.onchange=()=>{
    const r=Object.assign({},ccCfg(def.id).rules,{[el.dataset.ccRule]:el.checked});ccSetCfg(def.id,{rules:r});re();};});
  if($("#cc-rebase"))$("#cc-rebase").onclick=e=>{ccSetCfg(def.id,{baseFrom:e.target.dataset.date});re();};
  $("#cc-reset").onclick=()=>{if(SOP.locked)return;if(SOP.controlCharts)delete SOP.controlCharts[def.id];sopChanged();re();};
  const base=()=>safeName(`${CC_STATE.instrument}_${def.code}_${def.id}${CC_STATE.variant?"_"+CC_STATE.variant:""}`);
  const svgText=()=>{const s=$("#cc-chart svg");return s?s.outerHTML.replace("<svg ",`<svg data-sop="${esc(SOP.name)} v${esc(SOP.version)} sha256:${sopHash()}" `):"";};
  $("#cc-svg").onclick=()=>download(base()+".svg",svgText(),"image/svg+xml");
  $("#cc-png").onclick=()=>ccPng(svgText(),base()+".png");
  $("#cc-csv").onclick=()=>{const rowsOut=ccChartRows(def,res,CC_STATE.variant);if(rowsOut.length)download(base()+".csv",csvOf(rowsOut),"text/csv");};
  localizeDOM(card);
}
