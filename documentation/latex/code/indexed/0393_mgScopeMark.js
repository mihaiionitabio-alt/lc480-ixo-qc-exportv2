function mgScopeMark(){
  document.querySelectorAll("#mg-nav [data-tab]").forEach(b=>{
    const on=b.dataset.tab===MG.scope;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on?"true":"false");});
}
