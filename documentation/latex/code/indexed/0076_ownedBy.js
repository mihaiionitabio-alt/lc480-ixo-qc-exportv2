function ownedBy(el,root){
  let p=el.parentElement;
  while(p&&p!==root){
    const c=p.getAttribute&&p.getAttribute("class");
    if(c&&ANALYSIS_CLASS_RE.test(c)&&p.querySelector(':scope > prop[name="name"]'))return false;
    p=p.parentElement;
  }
  return true;
}
