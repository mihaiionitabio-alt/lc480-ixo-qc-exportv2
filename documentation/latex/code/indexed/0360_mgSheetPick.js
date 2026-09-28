function mgSheetPick(i){
  const st=MG.sheet;if(!st||!st.opts[i])return;
  const v=st.opts[i].value;mgSheetClose();
  if(st.kind==="type")mgSetChartType(v);else mgSetChartAxis(v);
  mgRender();
}
