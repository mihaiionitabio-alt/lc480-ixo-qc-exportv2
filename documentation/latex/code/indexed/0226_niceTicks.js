function niceTicks(lo,hi,n){
  if(!Number.isFinite(lo)||!Number.isFinite(hi))return [];
  if(lo===hi){lo-=1;hi+=1;}
  const step0=(hi-lo)/(n||5),mag=Math.pow(10,Math.floor(Math.log10(step0))),err=step0/mag;
  const step=(err>=7.5?10:err>=3.5?5:err>=1.5?2:1)*mag,out=[];
  for(let k=Math.ceil(lo/step);k*step<=hi+step*1e-9;k++)out.push(+(k*step).toPrecision(12));
  return out;
}
