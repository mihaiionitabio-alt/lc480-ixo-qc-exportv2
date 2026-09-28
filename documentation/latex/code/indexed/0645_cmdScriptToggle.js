    case "profile":
      cmdTable([["name",SOP.name],["version",SOP.version],["laboratory",sopLabName()||"not stated"],
        ["analyst",sopAnalystName()||"not stated"],["checksum","sha256:"+sopHash()]]);break;
    case "status":cmdPrint(cmdStatusLine());break;
    case "template":cmdPrint("writing selection.csv…");download("selection_template.csv",selCsvTemplate(),"text/csv");cmdPrint("selection_template.csv written","ok");break;
