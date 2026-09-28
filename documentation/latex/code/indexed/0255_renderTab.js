function renderTab(name){
  if(!DIRTY.has(name))return;DIRTY.delete(name);APP_STATE.activeTab=name;
  const t0=performance.now?performance.now():Date.now();
  try{
    if(name==="load"){renderLoaded();renderDerived();}
    else if(name==="export")renderExports();
    else if(name==="sop")renderSop();
    else if(name==="results")renderResults();
    else if(name==="graphs")renderGraphs();
    else if(name==="panel")renderPanel();
    else if(name==="integrity")renderIntegrity();
    else if(name==="review"){["overview","plate","compare","statistics","controls","runs","curves","rising","instrument"].forEach(s=>DIRTY.add("review:"+s));renderReviewSheetLazy(currentReviewSheet());}
  }catch(e){
    appError(`render:${name}`,e);
    const target=document.querySelector("#tab-"+name);
    if(target)target.insertAdjacentHTML("afterbegin",`<div class="notice bad">This view could not be rendered. The diagnostic record contains the error: <code>${esc(e.message||e)}</code></div>`);
  }finally{localizeDOM(document.querySelector("#tab-"+name)||document.body);
    const ms=(performance.now?performance.now():Date.now())-t0;
    APP_STATS.lastRender={tab:name,ms};APP_STATS.renders[name]=Math.round(ms);
    if(ms>APP_STATS.maxRenderMs)APP_STATS.maxRenderMs=ms;
    appStatusPaint();}
}
