# -*- coding: utf-8 -*-
"""Three defect fixes: console navigation containment, pop-up pickers, CUSUM colour/scale."""
import sys, pathlib
src=pathlib.Path(sys.argv[1]); s=src.read_text(encoding='utf-8'); n0=len(s)
def rep(old,new,count=1):
    global s
    if s.count(old)<1: raise SystemExit("NOT FOUND: "+old[:120])
    s=s.replace(old,new,count)

# =====================================================================
# FIX 1 — the console's top menu must not leave the console
# =====================================================================
rep('''  document.querySelectorAll("#mg-nav [data-tab]").forEach(b=>b.onclick=()=>mgLeaveTo(b.dataset.tab));''',
'''  document.querySelectorAll("#mg-nav [data-tab]").forEach(b=>b.onclick=()=>mgScope(b.dataset.tab));''')

rep('''function mgLeaveTo(tab){mgClose();try{showTab(tab);}catch(e){}}''',
'''function mgLeaveTo(tab){mgClose();try{showTab(tab);}catch(e){}}
/* The console is a mode, not a page. Its top row selects which part of the data set the
   console is working on; it never changes the mode. Leaving is one explicit action. */
const MG_SCOPES={
  load:{label:"Load files",keeps:["intake"],empty:"Every file was read. Nothing to answer here."},
  sop:{label:"SOP",keeps:["profile"],empty:"The profile raised nothing that needs an answer."},
  results:{label:"Results",keeps:["results"],empty:"No run was rejected by the profile."},
  panel:{label:"Control panel",keeps:["chart","baseline"],empty:"No chart is outside its limits or on watch."},
  graphs:{label:"Graphs",keeps:["chart"],empty:"Charts appear here once a chart is open."},
  review:{label:"Quality & forensic review",keeps:["finding"],empty:"No error-level finding is open."},
  export:{label:"Open formats",keeps:["export"],empty:"Exports are actions, not findings."}
};
function mgScope(tab){
  MG.scope=(MG.scope===tab)?"":tab;          /* pressing the active one shows everything again */
  MG.at=0;MG.chart=false;mgRefresh();mgRender();
}
function mgScopeMark(){
  document.querySelectorAll("#mg-nav [data-tab]").forEach(b=>{
    const on=b.dataset.tab===MG.scope;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on?"true":"false");});
}''')

# the queue items get a scope kind
rep('''    q.push({sev:"alarm",code:"ERR",title:area''','''    q.push({kind:"finding",sev:"alarm",code:"ERR",title:area''')
rep('''          items.push({sev:st.level==="bad"?"alarm":"watch",code:d.code''','''          items.push({kind:"chart",sev:st.level==="bad"?"alarm":"watch",code:d.code''')
rep('''    if(rej.length)q.push({sev:"alarm",code:"SOP"''','''    if(rej.length)q.push({kind:"results",sev:"alarm",code:"SOP"''')
rep('''      if(none)q.push({sev:"none",code:"BASE"''','''      if(none)q.push({kind:"baseline",sev:"none",code:"BASE"''')

# filter the queue by scope, and never leave the operator with an empty screen
rep('''  MG.queue=MG.filter==="alarm"?all.filter(x=>x.sev==="alarm"):all;''',
'''  MG.queue=mgScopeFilter(MG.filter==="alarm"?all.filter(x=>x.sev==="alarm"):all);''')
rep('''function mgRefresh(){''','''function mgScopeFilter(all){
  const sc=MG_SCOPES[MG.scope];if(!sc)return all;
  const keep=all.filter(x=>sc.keeps.includes(x.kind||""));
  if(keep.length)return keep;
  return [{kind:"empty",sev:"ok",code:"",title:sc.label,value:"",unit:"",limits:"",
    state:sc.empty,evidence:"This view of the console has nothing outstanding.",
    actions:[{key:"3",label:"Show every item again",cmd:"everything"},
             {key:"4",label:"Open this view on the page",cmd:"open page "+MG.scope}]}];
}
function mgRefresh(){''')

# =====================================================================
# FIX 2 — chart type and X axis as pop-up pickers, not rows of buttons
# =====================================================================
rep('''  const typeActs=charting?mgChartTypeOptions(it).map((o,i)=>({key:"T"+(i+1),label:(o.current?"Chart type · ":"Use ")+o.label,cmd:"type "+o.value,cls:o.current?"selected":""})) : [];
  const axisActs=charting?mgChartAxisOptions(it).map((o,i)=>({key:"X"+(i+1),label:(o.current?"X axis · ":"Use X · ")+o.label,cmd:"x "+o.value,cls:o.current?"selected":""})) : [];''',
'''  /* One button each: the options open as a sheet, so the action row keeps its height. */
  const curType=charting?(mgChartTypeOptions(it).find(o=>o.current)||{}).label:"";
  const curAxis=charting?(mgChartAxisOptions(it).find(o=>o.current)||{}).label:"";
  const typeActs=charting&&mgChartTypeOptions(it).length>1?[{key:"4",label:"Chart type · "+curType,cmd:"chart type",cls:"sheet"}]:[];
  const axisActs=charting&&mgChartAxisOptions(it).length>1?[{key:"5",label:"X axis · "+curAxis,cmd:"x axis",cls:"sheet"}]:[];''')

# the sheet itself
rep('''  <div id="mg-actions"></div>''','''  <div id="mg-actions"></div>
  <div id="mg-sheet" role="dialog" aria-modal="true" aria-labelledby="mg-sheet-title" hidden>
    <div class="mg-sheet-box">
      <h2 id="mg-sheet-title"></h2>
      <div id="mg-sheet-list"></div>
      <div id="mg-sheet-foot">0 or Escape · close</div>
    </div>
  </div>''')

rep('''#mg-nav{flex:1 1 100%;display:flex;gap:7px;overflow-x:auto;padding-top:2px}''',
'''#mg-nav{flex:1 1 100%;display:flex;gap:7px;overflow-x:auto;padding-top:2px}
#mg-nav button.on{border-color:#4ea1ff;background:#12243c;color:#cfe4ff;font-weight:650}
#mg-sheet{position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;background:rgba(5,7,12,.93)}
#mg-sheet[hidden]{display:none}
.mg-sheet-box{width:min(760px,92vw);border:2px solid #2b3a4d;border-radius:14px;background:#0b111b;padding:22px 24px}
.mg-sheet-box h2{margin:0 0 14px;font-size:24px}
#mg-sheet-list{display:flex;flex-direction:column;gap:12px}
#mg-sheet-list button{all:unset;cursor:pointer;min-height:76px;display:flex;flex-direction:column;justify-content:center;gap:4px;
  padding:12px 18px;border:2px solid #2b3a4d;border-radius:12px;background:#0f1724;color:#e8edf5}
#mg-sheet-list button .k{font-size:14px;color:#9fb0c6;letter-spacing:.08em}
#mg-sheet-list button .l{font-size:21px;font-weight:700}
#mg-sheet-list button.current{border-color:#4ea1ff;background:#12243c}
#mg-sheet-list button:focus-visible{outline:4px solid #4ea1ff;outline-offset:3px}
#mg-sheet-foot{margin-top:16px;font-size:16px;color:#9fb0c6}''')

rep('''function mgItemSentence(it){''','''/* ---------- option sheets: one question, large targets, number-addressable ---------- */
function mgSheet(kind){
  const it=mgItem(),box=document.getElementById("mg-sheet");
  if(!it||!it.chartId)return;
  const opts=kind==="type"?mgChartTypeOptions(it):mgChartAxisOptions(it);
  if(opts.length<2)return;
  MG.sheet={kind,opts};
  document.getElementById("mg-sheet-title").textContent=kind==="type"?"Chart type":"X axis";
  document.getElementById("mg-sheet-list").innerHTML=opts.map((o,i)=>
    `<button data-i="${i}" class="${o.current?"current":""}">
       <span class="k">${i+1} · select${o.current?" · in use":""}</span>
       <span class="l">${esc(o.label)}</span></button>`).join("");
  document.querySelectorAll("#mg-sheet-list button").forEach(b=>b.onclick=()=>mgSheetPick(+b.dataset.i));
  box.hidden=false;
  const first=document.querySelector("#mg-sheet-list button");if(first)first.focus();
}
function mgSheetPick(i){
  const st=MG.sheet;if(!st||!st.opts[i])return;
  const v=st.opts[i].value;mgSheetClose();
  if(st.kind==="type")mgSetChartType(v);else mgSetChartAxis(v);
  mgRender();
}
function mgSheetClose(){MG.sheet=null;const b=document.getElementById("mg-sheet");if(b)b.hidden=true;}
function mgItemSentence(it){''')

# commands for the sheets and the scope
rep('''  {re:/^type (i|ewma|cusum|trend|xbars|p|u|c|funnel)$/, id:"chart type", act:t=>mgSetChartType(t.slice(5))},''',
'''  {re:/^(chart type|type menu|change chart type)$/, id:"chart type menu", act:()=>mgSheet("type")},
  {re:/^(x axis|axis menu|change x axis)$/, id:"x axis menu", act:()=>mgSheet("axis")},
  {re:/^(close|close menu|dismiss)$/, id:"close menu", act:()=>mgSheetClose()},
  {re:/^open page (load|sop|results|panel|graphs|review|export)$/, id:"leave for a page", act:m=>mgLeaveTo(m[1])},
  {re:/^(view )?(load files|load view|sop view|results view|panel view|charts view|review view|formats view)$/, id:"console view",
    act:m=>{const k={"load files":"load","load view":"load","sop view":"sop","results view":"results","panel view":"panel","charts view":"panel","review view":"review","formats view":"export"}[m[2]];if(k)mgScope(k);}},
  {re:/^type (i|ewma|cusum|trend|xbars|p|u|c|funnel)$/, id:"chart type", act:t=>mgSetChartType(t.slice(5))},''')

# the sheet takes the digits while it is open; Escape closes it first
rep('''  document.querySelectorAll("#mg-nav [data-tab]").forEach(b=>b.onclick=()=>mgScope(b.dataset.tab));''',
'''  document.querySelectorAll("#mg-nav [data-tab]").forEach(b=>b.onclick=()=>mgScope(b.dataset.tab));
  document.addEventListener("keydown",e=>{                 /* a sheet answers the number keys */
    if(!MG.open||!MG.sheet)return;
    if(e.key==="Escape"||e.key==="0"){mgSheetClose();e.preventDefault();return;}
    if(/^[1-9]$/.test(e.key)){mgSheetPick(+e.key-1);e.preventDefault();}
  });''')
rep('''function mgCommand(text,source){
  const t=String(text||"").toLowerCase().trim();''','''function mgCommand(text,source){
  const t=String(text||"").toLowerCase().trim();
  if(MG.sheet){                                   /* while a sheet is open, a number or its name picks */
    const t0=t;
    if(/^[1-9]$/.test(t0)){mgSheetPick(+t0-1);return true;}
    const i=MG.sheet.opts.findIndex(o=>o.label.toLowerCase()===t0||o.value===t0);
    if(i>=0){mgSheetPick(i);return true;}
    if(/^(close|cancel|back|dismiss)$/.test(t0)){mgSheetClose();return true;}
  }''')

# =====================================================================
# FIX 3a — CUSUM: reset after a signal, and one flag per side
# =====================================================================
rep('''function ccCUSUM(y,cfg){
  const I=ccI(y,cfg),k=+cfg.k,h=+cfg.h;let hi=0,lo=0;
  return {cl:0,pts:y.map(v=>{if(Number.isFinite(v)){const z=(v-I.cl)/I.sigma;hi=Math.max(0,hi+z-k);lo=Math.max(0,lo-z-k);}
    return {y:hi,y2:-lo,raw:v,cl:0,ucl:h,lcl:-h,flags:hi>h?["upward shift (CUSUM)"]:lo>h?["downward shift (CUSUM)"]:[]};})};
}''',
'''function ccCUSUM(y,cfg){
  /* Page's procedure. Two one-sided sums; each one signals when it passes h and is then
     restarted, so an excursion is reported once instead of marking every later run. The
     signal belongs to the sum that raised it (sigHi / sigLo), so the chart can colour the
     series that is actually outside and leave the other one alone. */
  const I=ccI(y,cfg),k=+cfg.k,h=+cfg.h;let hi=0,lo=0;
  return {cl:0,pts:y.map(v=>{
    let sigHi=false,sigLo=false;
    if(Number.isFinite(v)){const z=(v-I.cl)/I.sigma;
      hi=Math.max(0,hi+z-k);lo=Math.max(0,lo-z-k);
      sigHi=hi>h;sigLo=lo>h;}
    const p={y:hi,y2:-lo,raw:v,cl:0,ucl:h,lcl:-h,sigHi,sigLo,
      flags:sigHi?["upward shift (CUSUM)"]:sigLo?["downward shift (CUSUM)"]:[]};
    if(sigHi)hi=0;if(sigLo)lo=0;                 /* restart the sum that signalled */
    return p;})};
}''')

# =====================================================================
# FIX 3b — colour each drawn series by its own statistic
# =====================================================================
rep('''  if(res.type==="cusum")series.push({type:"line",colour:"#0891b2",width:1.2,data:pts.map(p=>[p.x,p.y2])},{type:"points",r:3,colour:"#0891b2",data:pts.map(p=>[p.x,p.y2,tip(p),ccSignal(p)==="limit"?CC_COL.bad:ccSignal(p)==="rule"?CC_COL.rule:"#0891b2"])});
  series.push({type:"points",r:4,data:pts.map(p=>[p.x,p.y,tip(p),colourOf(p)])});''',
'''  /* A point is red only on the series whose own statistic is outside its limit. On a CUSUM
     chart the upper and the lower sum are two series: a lower-sum alarm must not paint the
     upper sum, which is sitting at zero inside the band. */
  const cusumColour=(p,side)=>p.pre?"#cbd5e1":(side==="lo"?p.sigLo:p.sigHi)?CC_COL.bad:(side==="lo"?"#0891b2":CC_COL.pt);
  if(res.type==="cusum"){
    series.push({type:"line",colour:"#0891b2",width:1.2,data:pts.map(p=>[p.x,p.y2])},
      {type:"points",r:3,colour:"#0891b2",data:pts.map(p=>[p.x,p.y2,tip(p,"lo"),cusumColour(p,"lo")])});
    series.push({type:"points",r:4,data:pts.map(p=>[p.x,p.y,tip(p,"hi"),cusumColour(p,"hi")])});
  }else series.push({type:"points",r:4,data:pts.map(p=>[p.x,p.y,tip(p),colourOf(p)])});''')
rep('''  const tip=p=>`${p.row.run} · ${sopFmtTime(p.row.date)} · ${p.row.operator}''',
'''  const tip=(p,side)=>`${p.row.run} · ${sopFmtTime(p.row.date)} · ${p.row.operator}${side?" · "+(side==="lo"?"lower sum":"upper sum"):""}''')
# the tooltip's flag line must also follow the side on a CUSUM chart
rep('''${p.flags.length?"\\n"+(ccSignal(p)==="limit"?"⚠ outside the limits: ":"△ pattern inside the limits: ")+p.flags.join(", "):""}`;''',
'''${(p.flags.length&&(!side||(side==="lo"?p.sigLo:p.sigHi)))?"\\n"+(ccSignal(p)==="limit"?"⚠ outside the limits: ":"△ pattern inside the limits: ")+p.flags.join(", "):""}`;''')

# =====================================================================
# FIX 3c — the scale follows the plotted data; a far-away specification is a note
# =====================================================================
rep('''  const ys=pts.flatMap(p=>[p.y,p.y2,p.ucl,p.lcl]).concat(hl.map(h=>h.y)).concat(res.reach&&!clipped?[res.reach.limit]:[]).filter(Number.isFinite);''',
'''  /* The y-scale is set by what is plotted — the values and their control limits. A
     specification far outside that range would squeeze the data into a sliver, so it is
     drawn only when it is near the data and is otherwise reported in words. */
  const core=pts.flatMap(p=>[p.y,p.y2,p.ucl,p.lcl]).filter(Number.isFinite);
  const cLo=Math.min(...core),cHi=Math.max(...core),cSpan=Math.max(1e-9,cHi-cLo);
  const nearScale=v=>Number.isFinite(v)&&v>=cLo-0.6*cSpan&&v<=cHi+0.6*cSpan;
  const hlFar=hl.filter(h=>!nearScale(h.y));
  const hlNear=hl.filter(h=>nearScale(h.y));
  const ys=core.concat(hlNear.map(h=>h.y)).concat(res.reach&&!clipped&&nearScale(res.reach.limit)?[res.reach.limit]:[]).filter(Number.isFinite);''')
rep('''  const tx=[];if(res.reach&&clipped)''','''  const tx=[];
  hlFar.forEach((h,i)=>tx.push({px:null,x:pts[0].x,y:(h.y<cLo?cLo:cHi),
    text:`${h.label} — ${h.y<cLo?"below":"above"} this scale`,anchor:"start",size:11,colour:"#7f1d1d"}));
  if(res.reach&&clipped)''')
rep('''  return svgPlot({title,x:[xa,xb],y:extent(ys,0.08),xticks,xlab:res.X.label,ylab,series,hlines:hl,vlines:vl,legend,texts:tx});''',
'''  return svgPlot({title,x:[xa,xb],y:extent(ys,0.08),xticks,xlab:res.X.label,ylab,series,hlines:hlNear,vlines:vl,legend,texts:tx});''')

# =====================================================================
# FIX 3d — the chart CSV carries both sums and the side that signalled
# =====================================================================
rep('''centre:p.cl,ucl:p.ucl,lcl:p.lcl,s:p.s??"",direction:p.flags.length?ccAlarmDir(p,res):"",signal:ccSignal(p),extract:p.segment||"",flags:p.flags.join("; "),''',
'''centre:p.cl,ucl:p.ucl,lcl:p.lcl,s:p.s??"",direction:p.flags.length?ccAlarmDir(p,res):"",signal:ccSignal(p),
      plotted_lower:res.type==="cusum"?p.y2:"",signal_side:res.type==="cusum"?(p.sigHi?"upper":p.sigLo?"lower":""):"",
      extract:p.segment||"",flags:p.flags.join("; "),''')

# keep the nav marks in step with the scope
rep('''  document.getElementById("mg-body").scrollTop=0;''','''  mgScopeMark();
  document.getElementById("mg-body").scrollTop=0;''')
# Scope completeness: classify intake, pasted results, gallery and empty states so every
# console tab has a truthful queue. The main alarm/error items were classified above.
s=s.replace('q.push({sev:"none",code:"",title:"No experiment files are loaded"', 'q.push({kind:"intake",sev:"none",code:"",title:"No experiment files are loaded"')
s=s.replace('q.push({sev:"none",code:"CSV",title:"Pasted Cq table loaded"', 'q.push({kind:"results",sev:"none",code:"CSV",title:"Pasted Cq table loaded"')
s=s.replace('gallery.push({sev:st.level==="ok"', 'gallery.push({kind:"chart",sev:st.level==="ok"')
s=s.replace('if(!q.length)q.push({sev:"ok",code:"",title:"Nothing needs attention"', 'if(!q.length)q.push({kind:"empty",sev:"ok",code:"",title:"Nothing needs attention"')
s=s.replace('sop:{label:"SOP",keeps:["profile"]', 'sop:{label:"SOP",keeps:["profile","results"]')
s=s.replace('const MG={open:false,queue:[],at:0,chart:false,theme:"light",pending:null};', 'const MG={open:false,queue:[],at:0,chart:false,theme:"light",pending:null,scope:"",sheet:null};')
pathlib.Path(sys.argv[2]).write_text(s,encoding='utf-8');print('patched',n0,'->',len(s))
