function localizeDOM(root,force){
  if(UI_LANG!=="zh"&&!force)return;
  if(I18N_BUSY)return;I18N_BUSY=true;
  const walker=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())){
    if(node.parentElement&&node.parentElement.closest("script,style,pre,code,[data-i18n-skip]"))continue;
    if(!I18N_ORIGINAL_TEXT.has(node))I18N_ORIGINAL_TEXT.set(node,node.nodeValue);
    const original=I18N_ORIGINAL_TEXT.get(node),next=UI_LANG==="zh"?zhPhrase(original):original;
    if(node.nodeValue!==next)node.nodeValue=next;
  }
  (root||document).querySelectorAll("[placeholder],[title],[aria-label]").forEach(el=>{
    if(el.closest("[data-i18n-skip]"))return;
    let originals=I18N_ORIGINAL_ATTR.get(el);
    if(!originals){originals={};for(const a of ["placeholder","title","aria-label"])if(el.hasAttribute(a))originals[a]=el.getAttribute(a);
      I18N_ORIGINAL_ATTR.set(el,originals);}
    for(const [a,v] of Object.entries(originals)){const next=UI_LANG==="zh"?zhPhrase(v):v;if(el.getAttribute(a)!==next)el.setAttribute(a,next);}
  });
  I18N_BUSY=false;
}
