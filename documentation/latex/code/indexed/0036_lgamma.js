function lgamma(x){
  const g=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];
  let xx=x,y=x,tmp=xx+5.5;tmp-=(xx+0.5)*Math.log(tmp);let ser=1.000000000190015;
  for(let j=0;j<6;j++)ser+=g[j]/++y;
  return -tmp+Math.log(2.5066282746310005*ser/xx);
}
