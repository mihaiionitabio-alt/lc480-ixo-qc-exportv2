    default:cmdPrint("unknown command: "+cmd+"   (help lists them)","warn");
  }
}
async function cmdRunLine(raw){
  if(CMD.busy)return;
  CMD.busy=true;
  cmdPrint("> "+raw,"echo");
  try{await cmdExec(raw);}
  catch(e){cmdPrint("error: "+(e&&e.message||e),"bad");}
  finally{CMD.busy=false;cmdEl("cmd-status").textContent=cmdStatusLine();}
}
async function cmdRunScript(text){
  const lines=String(text||"").split(/\r?\n/);
  cmdPrint("running "+lines.filter(l=>l.trim()&&!l.trim().startsWith("#")).length+" line(s) of script","ok");
  for(const l of lines){
    if(!l.trim()||l.trim().startsWith("#"))continue;
    await cmdRunLine(l.trim());
  }
  cmdPrint("script finished","ok");
}
function cmdScriptToggle(on){
  const box=cmdEl("cmd-script-wrap");if(!box)return;
  const show=on==null?box.hasAttribute("hidden"):!!on;
