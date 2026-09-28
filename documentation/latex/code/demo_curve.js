function curve(n,base,amp,cq,slope=1.6,noise=0.004,drift=0){
  const x0=Number.isFinite(cq)?cq+1.317*slope:Infinity;
  return Array.from({length:n},(_,i)=>{const c=i+1;return base*(1+drift*c/n)+(Number.isFinite(x0)?amp/(1+Math.exp(-(c-x0)/slope)):0)+base*noise*gauss();});
}