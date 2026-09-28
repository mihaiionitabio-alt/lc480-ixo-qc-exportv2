function mgChooseFiles(){
  const f=document.getElementById("file");
  if(!f){appError("console:load",new Error("The experiment file control is not available."));return;}
  f.click();
}
