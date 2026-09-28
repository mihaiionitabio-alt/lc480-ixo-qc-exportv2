function thermalTrace(programs,p){
  /* the block ramps at min(programmed, available) rate, runs past the target by the overshoot (heating to the
     denaturation step) or undershoot (cooling), then relaxes exponentially onto target + offset */
  const dt=p.dt||0.41,t=[],y=[];let T=p.start??28,time=0;
  const push=v=>{t.push(+time.toFixed(3));y.push(+(v+0.015*gauss()).toFixed(2));time+=dt;};
  const goTo=(target,slope,hold)=>{
    const up=target>T,cap=up?p.heat:p.cool,rate=slope>0?Math.min(cap,slope*(up?p.heat/4.4:p.cool/2.2)):cap;
    const over=up?(target>=90?p.overshoot:p.overshoot*0.35):-(p.undershoot??p.overshoot*0.5);
    const peak=target+over;
    while(up?T<peak:T>peak){T+=(up?1:-1)*rate*dt*(1+0.015*gauss());push(T);}
    const goal=target+p.offset,nh=Math.max(1,Math.round(hold/dt));
    for(let k=0;k<nh;k++){let d=(goal-T)*(1-Math.exp(-dt/p.tau));const lim=(d<0?0.8*p.cool:0.6)*dt;   // relaxation is rate-limited
      if(Math.abs(d)>lim)d=Math.sign(d)*lim;T+=d;push(T);}
  };
  programs.forEach(pr=>{for(let c=0;c<(pr.cycles||1);c++)pr.segments.forEach(s=>goTo(+s.target,+s.slope||0,+s.hold||1));});
  return {seconds:t,temp:y};
}