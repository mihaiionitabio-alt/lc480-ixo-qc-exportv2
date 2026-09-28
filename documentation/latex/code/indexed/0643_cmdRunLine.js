    case "show":{const plan=selParseCommand(arg);plan.ids.forEach(id=>cmdPrint(`${id}: ${JSON.stringify(SEL_STATE.options[id]||{})}`));break;}
    case "reset":{const plan=selParseCommand(arg);plan.ids.forEach(id=>delete SEL_STATE.options[id]);cmdPrint(`options reset for ${plan.ids.length} item(s)`,"ok");break;}
    case "clear":selClear();SEL_STATE.options=Object.create(null);cmdPrint("selection emptied","ok");break;
    case "selection":{
      const s=selSelected();
      cmdPrint(s.length+" selected:");cmdTable(s.map(x=>[x.id,x.title]));break;}
    case "runs":
      cmdPrint(RUNS.length?"loaded runs:":"no file has been read yet");
