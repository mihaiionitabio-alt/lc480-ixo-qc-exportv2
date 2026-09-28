function fitLin(xs,ys){
  const n=xs.length,mx=mean(xs),my=mean(ys);let sxx=0,sxy=0,syy=0;
  for(let i=0;i<n;i++){sxx+=(xs[i]-mx)**2;sxy+=(xs[i]-mx)*(ys[i]-my);syy+=(ys[i]-my)**2;}
  if(!sxx)return {slope:0,inter:my,r2:0};
  const slope=sxy/sxx,inter=my-slope*mx;let ssr=0;
  for(let i=0;i<n;i++)ssr+=(ys[i]-(slope*xs[i]+inter))**2;
  return {slope,inter,r2:syy>0?1-ssr/syy:0};
}
