function showTab(name){
  APP_STATE.activeTab=name;
  $$("nav button").forEach(b=>b.classList.toggle("on",b.dataset.tab===name));
  $$("main section").forEach(s=>s.classList.toggle("on",s.id==="tab-"+name));
  renderTab(name);
  window.scrollTo({top:0,behavior:"smooth"});
}