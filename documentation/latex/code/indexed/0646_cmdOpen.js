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
