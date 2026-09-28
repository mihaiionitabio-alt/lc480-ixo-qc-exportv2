function mgOpen(){
  MG.open=true;MG.filter="";mgRefresh();MG.at=0;MG.chart=false;
  document.getElementById("mg").classList.add("on");
  mgRender();
}
