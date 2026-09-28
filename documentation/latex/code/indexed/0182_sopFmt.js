function sopFmt(tpl,vals){return String(tpl||"").replace(/\{(\w+)\}/g,(m,k)=>vals[k]==null||vals[k]===""?"–":String(vals[k]));}
