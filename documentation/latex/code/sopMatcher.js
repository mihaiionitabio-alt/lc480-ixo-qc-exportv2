function sopMatcher(pattern){
  const p=String(pattern??"").trim();
  if(!p||p==="*")return ()=>true;
  if(/^\/.+\/[a-z]*$/.test(p)){try{const m=p.match(/^\/(.+)\/([a-z]*)$/);const re=new RegExp(m[1],m[2].includes("i")?m[2]:m[2]+"i");return s=>re.test(String(s||""));}catch(e){return ()=>false;}}
  const parts=p.split("|").map(x=>x.trim()).filter(Boolean).map(x=>new RegExp("^"+x.replace(/[.+^${}()[\]\\]/g,"\\$&").replace(/\*/g,".*").replace(/\?/g,".")+"$","i"));
  return s=>parts.some(re=>re.test(String(s||"").trim()));
}