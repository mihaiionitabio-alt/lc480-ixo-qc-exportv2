function mgReadFiles(){
  if(!Array.isArray(STAGED)||!STAGED.length){appNotice("console","No experiment files are staged.");return;}
  const task=readStaged();
  Promise.resolve(task).finally(()=>{
    if(typeof MG!=="undefined"&&MG.open){mgRefresh();mgRender();}
  });
}
