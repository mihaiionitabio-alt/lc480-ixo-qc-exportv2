function mgInit(){
  document.querySelectorAll("#mg-nav [data-tab]").forEach(b=>b.onclick=()=>mgScope(b.dataset.tab));
  document.addEventListener("keydown",e=>{                 /* a sheet answers the number keys */
    if(!MG.open||!MG.sheet)return;
    if(e.key==="Escape"||e.key==="0"){mgSheetClose();e.preventDefault();return;}
    if(/^[1-9]$/.test(e.key)){mgSheetPick(+e.key-1);e.preventDefault();}
  });
  /* the console follows the data: rebuild when a read finishes or the profile changes */
  const tick=()=>{if(MG.open){const before=MG.queue.map(mgItemKey).join("\u001f")+"|"+MG.at;mgRefresh();const after=MG.queue.map(mgItemKey).join("\u001f")+"|"+MG.at;if(before!==after)mgRender();}};
  setInterval(tick,4000);
}
