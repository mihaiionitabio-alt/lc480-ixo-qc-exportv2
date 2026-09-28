function ownsResult(an,o){
  let p=o.parentElement;
  while(p&&p!==an.el){
    const c=p.getAttribute&&p.getAttribute("class");
    if(c&&ANALYSIS_CLASS_RE.test(c)&&p.querySelector(':scope > prop[name="name"]'))return false;
    p=p.parentElement;
  }
  return true;
}
