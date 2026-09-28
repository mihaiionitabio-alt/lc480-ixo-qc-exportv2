function wellSignal(curve){
  if(!curve||!curve.length)return {background:NaN,end:NaN,amplitude:NaN,max:NaN};
  const bg=curve.slice(2,Math.min(10,curve.length));const b=mean(bg.length?bg:curve.slice(0,1));
  const max=Math.max(...curve),end=curve[curve.length-1];
  return {background:b,end,amplitude:max-b,max};
}
