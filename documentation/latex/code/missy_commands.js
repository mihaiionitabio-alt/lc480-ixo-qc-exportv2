  ["show <pattern>","show options in force"],
  ["reset <pattern>","return selected options to defaults"],
  ["deselect <pattern>","remove from the selection"],
  ["only <pattern>","clear the selection, then add the pattern"],
  ["clear","empty the selection"],
  ["selection","what is selected now"],
  ["run <number>","which loaded run the run-level figures use"],
  ["runs","the loaded runs and their numbers"],
  ["lab <text>","the laboratory name for the report and the profile"],
  ["analyst <text>","who is doing the analysis"],
  ["title <text>","the report title"],
  ["profile","the active profile, its version and checksum"],
  ["pdf [name]","build the report and download it"],
  ["zip [name]","build the archive and download it"],
  ["template","download the selection as a CSV"],
  ["status","files read, results, selection, profile"],
  ["script","open the box for a pasted procedure"],
  ["close","leave command mode"]
];
function cmdEl(id){return document.getElementById(id);}
function cmdPrint(text,cls){
  const out=cmdEl("cmd-out");if(!out)return;
  const div=document.createElement("div");
  div.className="cmd-line"+(cls?" "+cls:"");
  div.textContent=String(text==null?"":text);
  out.appendChild(div);out.scrollTop=out.scrollHeight;
}
function cmdTable(rows){
  if(!rows.length){cmdPrint("  (nothing)");return;}
  const w=rows.reduce((a,r)=>Math.max(a,String(r[0]).length),0);
  rows.forEach(r=>cmdPrint("  "+String(r[0]).padEnd(w+2)+String(r[1]==null?"":r[1])));
}
function cmdStatusLine(){
  return `files ${RUNS.length} · results ${RUNS.reduce((a,r)=>a+((r.wells||[]).length),0)} · selected ${SEL_STATE.ids.size} · profile ${SOP.name} v${SOP.version}`;
}
function selOptionRule(id,key){
  const exact=SEL_OPTION_RULES[id];
  return (exact&&exact[key])||(id.startsWith("cc:")&&SEL_OPTION_RULES["cc:*"][key])||(id.startsWith("data:")&&SEL_OPTION_RULES["data:*"][key])||(id.startsWith("rec:")&&SEL_OPTION_RULES["rec:*"][key])||(id.startsWith("img:")&&(SEL_OPTION_RULES[id]||SEL_OPTION_RULES["img:*"])[key]);
}
function selValidateOption(id,key,value){
  const rule=selOptionRule(id,key);if(!rule)throw new Error(`${id} does not accept option ${key}`);
  if(rule==="number"&&!Number.isFinite(Number(value)))throw new Error(`${key} must be numeric`);
  if(rule==="numberOrEmpty"&&(value!==""&&!Number.isFinite(Number(value))))throw new Error(`${key} must be numeric or empty`);
  if(rule==="integer"&&(!/^\d+$/.test(value)||Number(value)<0))throw new Error(`${key} must be a non-negative integer`);
  if(rule==="run"&&!(/^(all|\d+)$/.test(value)||RUNS.some(r=>runName(r)===value)))throw new Error(`${key} must identify a loaded run or all`);
  if(rule==="chartSet"&&value!=="*"&&!/^[A-Za-z0-9_,-]+$/.test(value))throw new Error(`${key} must be * or a chart/group list`);
  if(Array.isArray(rule)&&!rule.includes(value))throw new Error(`${key} must be one of ${rule.join(", ")}`);
}
function selParseCommand(arg){
  const tokens=String(arg||"").trim().split(/\s+/).filter(Boolean),patterns=[],opts={};
  for(const t of tokens){const i=t.indexOf("=");if(i<1)patterns.push(t);else{const k=t.slice(0,i),v=t.slice(i+1);if(k in opts)throw new Error(`duplicate option ${k}`);opts[k]=v;}}
  if(!patterns.length)throw new Error("an item pattern is required");
  const ids=selMatchAll(patterns.join(" "));if(!ids.length)throw new Error(`nothing matches ${patterns.join(" ")}`);
  for(const id of ids)for(const [k,v] of Object.entries(opts))selValidateOption(id,k,v);
  return {ids,opts};
}
function selApplyOptions(ids,opts){ids.forEach(id=>{SEL_STATE.options[id]=Object.assign({},SEL_STATE.options[id]||{},opts);});}
async function cmdExec(raw){
  const line=String(raw||"").trim();
  if(!line||line.startsWith("#"))return;
  const sp=line.indexOf(" "),cmd=(sp<0?line:line.slice(0,sp)).toLowerCase(),arg=sp<0?"":line.slice(sp+1).trim();
  switch(cmd){
    case "help":case "?":cmdTable(CMD_HELP);break;
    case "list":{
      const which=(arg||"all").toLowerCase();
      const items=which==="images"?selImageItems():which==="data"||which==="tables"?selDataItems():selCatalogue();
      cmdPrint(items.length+" item(s):");
      cmdTable(items.map(x=>[x.id,(x.ready()?"":"(not available yet) ")+x.title]));
      break;}
    case "select":case "add":{
      if(!arg){cmdPrint("select what? try: select img:*","warn");break;}
      const plan=selParseCommand(arg);selAdd(plan.ids.join(" "));selApplyOptions(plan.ids,plan.opts);
      cmdPrint(`selected ${plan.ids.length}: ${plan.ids.join(", ")}`,"ok");break;}
    case "deselect":case "remove":{
      const m=selRemove(arg);
      cmdPrint(m.length?`deselected ${m.length}`:`nothing matches ${arg}`,m.length?"ok":"warn");break;}
    case "only":{const plan=selParseCommand(arg);selClear();selAdd(plan.ids.join(" "));selApplyOptions(plan.ids,plan.opts);cmdPrint(`selection is now ${plan.ids.length} item(s)`,"ok");break;}
    case "set":{const plan=selParseCommand(arg);if(plan.ids.some(id=>!SEL_STATE.ids.has(id)))throw new Error("set requires selected items");selApplyOptions(plan.ids,plan.opts);cmdPrint(`options updated for ${plan.ids.length} item(s)`,"ok");break;}
    case "show":{const plan=selParseCommand(arg);plan.ids.forEach(id=>cmdPrint(`${id}: ${JSON.stringify(SEL_STATE.options[id]||{})}`));break;}
    case "reset":{const plan=selParseCommand(arg);plan.ids.forEach(id=>delete SEL_STATE.options[id]);cmdPrint(`options reset for ${plan.ids.length} item(s)`,"ok");break;}
    case "clear":selClear();SEL_STATE.options=Object.create(null);cmdPrint("selection emptied","ok");break;
    case "selection":{
      const s=selSelected();
      cmdPrint(s.length+" selected:");cmdTable(s.map(x=>[x.id,x.title]));break;}
    case "runs":
      cmdPrint(RUNS.length?"loaded runs:":"no file has been read yet");
      cmdTable(RUNS.map((r,i)=>[String(i),runName(r)+"  ("+((r.wells||[]).length)+" results)"]));break;
    case "run":{
      const n=Number(arg);
      if(!RUNS.length){cmdPrint("no file has been read yet","warn");break;}
      if(!Number.isFinite(n)||n<0||n>=RUNS.length){cmdPrint(`run must be 0..${RUNS.length-1}`,"warn");break;}
      SEL_STATE.run=n;cmdPrint("run-level figures will use "+runName(RUNS[n]),"ok");break;}
    case "lab":sopLab().name=arg;sopProfileEdited(true);cmdPrint("laboratory: "+(arg||"(cleared)"),"ok");break;
    case "analyst":sopLab().analyst=arg;sopProfileEdited(true);cmdPrint("analysis by: "+(arg||"(cleared)"),"ok");break;
    case "title":SEL_STATE.title=arg;cmdPrint("report title: "+(arg||"(default)"),"ok");break;
    case "profile":
      cmdTable([["name",SOP.name],["version",SOP.version],["laboratory",sopLabName()||"not stated"],
        ["analyst",sopAnalystName()||"not stated"],["checksum","sha256:"+sopHash()]]);break;
    case "status":cmdPrint(cmdStatusLine());break;
    case "template":cmdPrint("writing selection.csv…");download("selection_template.csv",selCsvTemplate(),"text/csv");cmdPrint("selection_template.csv written","ok");break;
    case "pdf":{
      if(!SEL_STATE.ids.size){cmdPrint("nothing is selected — try: select images","warn");break;}
      cmdPrint("building the report…");
      const n=await selDownloadReport(arg);
      cmdPrint(`report written, ${n.toLocaleString()} bytes`,"ok");break;}
    case "zip":{
      if(!SEL_STATE.ids.size){cmdPrint("nothing is selected — try: select all","warn");break;}
      cmdPrint("building the archive…");
      const n=selDownloadZip(arg);
      cmdPrint(`archive written, ${n} entries`,"ok");break;}
    case "script":cmdScriptToggle(true);cmdPrint("paste the procedure, then press Run");break;
    case "close":case "quit":case "exit":cmdClose();break;
    default:cmdPrint("unknown command: "+cmd+"   (help lists them)","warn");
  }
}