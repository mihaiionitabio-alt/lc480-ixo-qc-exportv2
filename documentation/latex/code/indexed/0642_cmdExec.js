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
