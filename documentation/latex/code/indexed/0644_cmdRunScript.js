      cmdTable(RUNS.map((r,i)=>[String(i),runName(r)+"  ("+((r.wells||[]).length)+" results)"]));break;
    case "run":{
      const n=Number(arg);
      if(!RUNS.length){cmdPrint("no file has been read yet","warn");break;}
      if(!Number.isFinite(n)||n<0||n>=RUNS.length){cmdPrint(`run must be 0..${RUNS.length-1}`,"warn");break;}
      SEL_STATE.run=n;cmdPrint("run-level figures will use "+runName(RUNS[n]),"ok");break;}
    case "lab":sopLab().name=arg;sopProfileEdited(true);cmdPrint("laboratory: "+(arg||"(cleared)"),"ok");break;
    case "analyst":sopLab().analyst=arg;sopProfileEdited(true);cmdPrint("analysis by: "+(arg||"(cleared)"),"ok");break;
    case "title":SEL_STATE.title=arg;cmdPrint("report title: "+(arg||"(default)"),"ok");break;
