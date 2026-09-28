function mgStage(){
  const ch=document.getElementById("mg-chart");if(!ch)return null;
  let st=document.getElementById("mg-chart-stage");
  if(!st||st.parentNode!==ch){st=document.createElement("div");st.id="mg-chart-stage";ch.innerHTML="";ch.appendChild(st);}
  return st;
}
