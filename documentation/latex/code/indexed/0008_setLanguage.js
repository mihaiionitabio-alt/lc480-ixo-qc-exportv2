function setLanguage(lang,announce){
  UI_LANG=lang==="zh"?"zh":"en";document.documentElement.lang=UI_LANG==="zh"?"zh-CN":"en";
  document.body.classList.toggle("lang-zh",UI_LANG==="zh");
  document.title=UI_LANG==="zh"?ZH_TERMS["qPCR raw values, open formats, quality control and forensics — LightCycler 480 · QuantStudio 3/5"]
    :"qPCR raw values, open formats, quality control and forensics — LightCycler 480 · QuantStudio 3/5";
  const select=document.querySelector("#language-select");if(select)select.value=UI_LANG;
  try{localStorage.setItem(languageStorageKey(),UI_LANG);}catch{}
  if(typeof refreshAll==="function")refreshAll();
  localizeDOM(document,true);
  if(announce&&UI_LANG==="zh")showCuteToast("中文界面已开启，开始愉快地检查数据吧！");
}
