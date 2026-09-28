function ccThin(t,y,slices){
  if(t.length<=2*slices)return {seconds:t.slice(),temp:y.slice()};
  const per=t.length/slices,ts=[],ys=[];
  for(let k=0;k<slices;k++){const a=Math.floor(k*per),b=Math.min(t.length,Math.floor((k+1)*per));let lo=a,hi=a;
    for(let i=a;i<b;i++){if(y[i]<y[lo])lo=i;if(y[i]>y[hi])hi=i;}
    for(const i of lo<hi?[lo,hi]:lo>hi?[hi,lo]:[lo]){ts.push(t[i]);ys.push(y[i]);}}
  return {seconds:ts,temp:ys};
}