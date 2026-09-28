function ccI(y,cfg){
  const base=ccPhase(y,cfg.phase1),cl=mean(base),mr=base.slice(1).map((v,i)=>Math.abs(v-base[i])),
    sig=Math.max(mr.length?mean(mr)/1.128:(sd(base)||Math.abs(cl)*0.05||1),(cfg.res||0)/2)||1;
  const dead=(cfg.res||0)/2/sig,z=y.map(v=>{const q=(v-cl)/sig;return Math.abs(q)<dead?0:q;});
  return {cl,sigma:sig,pts:y.map((v,i)=>{const f=[];if(!Number.isFinite(v))return {y:v,cl,ucl:cl+3*sig,lcl:cl-3*sig,flags:f};
    if(Math.abs(z[i])>3)f.push("beyond 3σ");
    const win=(n,k,lim)=>{if(i<n-1)return false;const w=z.slice(i-n+1,i+1).filter(Number.isFinite);return Math.sign(z[i])!==0&&w.filter(q=>Math.sign(q)===Math.sign(z[i])&&Math.abs(q)>lim).length>=k;};
    if(cfg.rules.r2&&win(3,2,2))f.push("2 of 3 beyond 2σ");
    if(cfg.rules.r3&&win(5,4,1))f.push("4 of 5 beyond 1σ");
    if(cfg.rules.r4&&i>=7&&Math.sign(z[i])!==0&&z.slice(i-7,i+1).every(q=>Number.isFinite(q)&&Math.sign(q)===Math.sign(z[i])))f.push("8 on one side");
    if(cfg.rules.r5&&i>=5){const d=y.slice(i-5,i+1).map((q,j,a)=>j?Math.sign(q-a[j-1]):0).slice(1);if(d.every(s=>s===d[0]&&s!==0))f.push("6 rising/falling");}
    return {y:v,cl,ucl:cl+3*sig,lcl:cl-3*sig,flags:f};})};
}