function tDistTwoTail(t,df){
  if(!Number.isFinite(t)||!Number.isFinite(df)||df<=0)return NaN;
  return betai(df/2,0.5,df/(df+t*t));
}
