function controlProfileRoot(w,mapped){
  const id=String((mapped||sopControlSpec(w)||{}).id||"").toLowerCase();
  if(/^crm-415b/.test(id))return "415B";
  if(/^crm-410cp/.test(id))return "410CP";
  if(/^cn-maize/.test(id))return "CN PORUMB";
  if(/^cn-soy/.test(id))return "CN SOIA";
  if(id==="ntc")return "NTC";
  if(id==="extr")return "BLANK EX";
  if(id==="grind")return "BLANK MAC";
  return mapped&&mapped.name?String(mapped.name):"";
}
