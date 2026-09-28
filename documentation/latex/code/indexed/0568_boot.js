function boot(){
  setPhase("booting","page boot");
  CLEAN_PAGE_SOURCE="<!doctype html>\n"+document.documentElement.outerHTML;
  UI_LANG=rememberedLanguage();
  const languageObserver=new MutationObserver(()=>localizeDOM(document.body));
  languageObserver.observe(document.body,{subtree:true,childList:true,characterData:true});
  $$("nav button").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
  wireQualityReview();
  wireSop();wireGraphs();wirePanel();
  $("#derived-run").onchange=renderDerived;
  const drop=$("#drop"),file=$("#file");
  drop.onclick=()=>file.click();
  file.onchange=()=>{
    const task=intake([...file.files]);
    Promise.resolve(task).finally(()=>{
      if(typeof MG!=="undefined"&&MG.open){mgRefresh();mgRender();}
    });
  };
  ["dragenter","dragover"].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.add("hot");}));
  ["dragleave","drop"].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.remove("hot");}));
  drop.addEventListener("drop",ev=>{if(ev.dataTransfer&&ev.dataTransfer.files.length)intake([...ev.dataTransfer.files]);});
  $("#read").onclick=()=>{readStaged();};

  $("#csvread").onclick=()=>acceptPasted($("#csvin").value,"pasted text");
  $("#csvdemo").onclick=()=>{$("#csvin").value=CSV_EXAMPLE;acceptPasted(CSV_EXAMPLE,"the worked example");showTab("results");};
  $("#csvfilebtn").onclick=()=>$("#csvfile").click();
  $("#csvfile").onchange=async()=>{
    const f=$("#csvfile").files[0];if(!f)return;
    acceptPasted(await f.text(),f.name);
  };

  $("#language-select").onchange=e=>setLanguage(e.target.value,true);
  $("#dl-site-en").onclick=()=>downloadWebsiteArchive("en");
  $("#dl-site-zh").onclick=()=>downloadWebsiteArchive("zh");
  $("#dl-pseudo-map").onclick=()=>{const m=pseudonymMap();if(!m.size)return;
    download(baseName()+"_pseudonym_map.csv","stored_name,pseudonym\n"+[...m].map(([a,b])=>`${csvq(a)},${csvq(b)}`).join("\n")+"\n","text/csv");};
  $("#dl-metadata").onclick=()=>download((RUNS.length?baseName():"lightcycler480")+"_metadata.jsonld",machineMetadataJSON(),"application/ld+json");
  document.addEventListener("change",e=>{
    if(UI_LANG!=="zh"||e.target.id==="language-select")return;
    if(e.target.matches("select")){
      const chosen=e.target.selectedOptions&&e.target.selectedOptions[0];
      if(chosen)showCuteToast(`已选择：${chosen.textContent.trim()} ✨`);
    }else if(e.target.matches('input[type="file"]')&&e.target.files&&e.target.files.length)
      showCuteToast(`已选择 ${e.target.files.length} 个文件，马上为你读取！`);
  });
  document.addEventListener("click",e=>{
    if(UI_LANG!=="zh")return;
    const button=e.target.closest("button[data-tab],button[data-review]");
    if(button)showCuteToast(`已打开：${button.textContent.trim()} 🌸`);
  });
  renderMachineMetadata();
  const missyHeader=document.getElementById("missy-header-logo");
  if(missyHeader)missyHeader.innerHTML=missySvg(true);
  setLanguage(UI_LANG,false);
  setPhase("idle","page ready");
  appStatusInit();
  renderTab("load");
}
