function roleFromName(name){
  const s=String(name||"");
  for(const r of NAME_ROLE_RULES)if(r.re.test(s))return r.role;
  return "Unknown";
}
