function mgScope(tab){
  MG.scope=(MG.scope===tab)?"":tab;          /* pressing the active one returns to the attention queue */
  MG.at=0;MG.chart=false;MG.filter="";MG.zoom=1;MG.panX=0;MG.panY=0;mgSheetClose();mgRefresh();mgRender();
}
