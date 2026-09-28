function recalcCt(drn,thr){
  if(!drn||!drn.length||thr==null)return null;let ct=null;
  for(let i=1;i<drn.length;i++)if(drn[i-1]<thr&&drn[i]>=thr)ct=i+(thr-drn[i-1])/(drn[i]-drn[i-1]);
  return ct;
}