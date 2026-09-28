function tTest(xs,ys,type){
  if(type==="paired"){
    const d=[];for(let i=0;i<Math.min(xs.length,ys.length);i++){if(Number.isFinite(xs[i])&&Number.isFinite(ys[i]))d.push(xs[i]-ys[i]);}
    const n=d.length;if(n<2)return {p:NaN,t:NaN,df:NaN,n,method:"paired"};
    const s=sd(d);if(!Number.isFinite(s)||s===0)return {p:mean(d)===0?1:0,t:mean(d)===0?0:Infinity,df:n-1,n,method:"paired"};
    const t=mean(d)/(s/Math.sqrt(n));
    return {p:tDistTwoTail(t,n-1),t,df:n-1,n,method:"paired"};
  }
  const a=xs.filter(Number.isFinite),b=ys.filter(Number.isFinite);
  const n1=a.length,n2=b.length;
  if(n1<2||n2<2)return {p:NaN,t:NaN,df:NaN,n:Math.min(n1,n2),method:type};
  const m1=mean(a),m2=mean(b),v1=sd(a)**2,v2=sd(b)**2;
  let t,df;
  if(type==="equal"){
    const sp2=((n1-1)*v1+(n2-1)*v2)/(n1+n2-2);
    t=(m1-m2)/Math.sqrt(sp2*(1/n1+1/n2));df=n1+n2-2;
  }else{
    const se2=v1/n1+v2/n2;
    t=(m1-m2)/Math.sqrt(se2);
    df=se2**2/((v1/n1)**2/(n1-1)+(v2/n2)**2/(n2-1));
  }
  if(!Number.isFinite(t))return {p:1,t:0,df,n:Math.min(n1,n2),method:type};
  return {p:tDistTwoTail(t,df),t,df,n:Math.min(n1,n2),method:type};
}
