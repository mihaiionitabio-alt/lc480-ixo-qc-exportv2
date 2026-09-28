function percentile(a,p){
  if(!a.length)return NaN;const s=[...a].sort((x,y)=>x-y),n=s.length;
  if(n===1)return s[0];
  const r=p*(n-1),lo=Math.floor(r),hi=Math.ceil(r);
  return lo===hi?s[lo]:s[lo]+(r-lo)*(s[hi]-s[lo]);
}
