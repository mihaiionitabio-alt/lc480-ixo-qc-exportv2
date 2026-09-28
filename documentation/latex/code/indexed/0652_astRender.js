  }
  cmdEl("cmd-status").textContent=cmdStatusLine();
  const i=cmdEl("cmd-in");if(i)setTimeout(()=>i.focus(),0);
}
function cmdClose(){CMD.open=false;document.getElementById("cmdm").classList.remove("on");}
function cmdToggle(){CMD.open?cmdClose():cmdOpen();}
function cmdInit(){
  const i=cmdEl("cmd-in");if(!i)return;
  i.addEventListener("keydown",e=>{
    if(e.key==="Enter"){
      const v=i.value;i.value="";
      if(v.trim()){CMD.history.push(v);CMD.at=CMD.history.length;}
      if(/\n/.test(v))cmdRunScript(v);else cmdRunLine(v);
      e.preventDefault();return;
    }
    if(e.key==="ArrowUp"){if(CMD.at>0){CMD.at--;i.value=CMD.history[CMD.at]||"";}e.preventDefault();return;}
    if(e.key==="ArrowDown"){if(CMD.at<CMD.history.length-1){CMD.at++;i.value=CMD.history[CMD.at]||"";}else{CMD.at=CMD.history.length;i.value="";}e.preventDefault();return;}
    if(e.key==="Escape"){cmdClose();e.preventDefault();}
  });
  i.addEventListener("paste",e=>{
    const t=(e.clipboardData||window.clipboardData).getData("text");
    if(t&&/\n/.test(t)){e.preventDefault();cmdScriptToggle(true);cmdEl("cmd-script").value=t;cmdPrint("a multi-line paste went to the script box; press Run");}
  });
  const run=cmdEl("cmd-script-run");if(run)run.onclick=()=>cmdRunScript(cmdEl("cmd-script").value);
  const tgl=cmdEl("cmd-script-toggle");if(tgl)tgl.onclick=()=>cmdScriptToggle();
  document.addEventListener("keydown",e=>{if(CMD.open&&e.key==="Escape"&&e.target!==i)cmdClose();});
  const cl=cmdEl("cmd-close");if(cl)cl.onclick=cmdClose;
  const cls=cmdEl("cmd-clear");if(cls)cls.onclick=()=>{cmdEl("cmd-out").innerHTML="";};
}

/* ---------- 8 . Assisted mode ----------
   The same catalogue as a checklist, for an operator who would rather see the
   choices than remember them. The selection can leave as a CSV and come back
