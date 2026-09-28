function drawLeveyJennings(canvas,s){
  if(!canvas)return;
  const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height,L=62,R=24,T=22,B=58,
    vals=s.points.map(p=>p.cq).filter(Number.isFinite);
  ctx.clearRect(0,0,W,H);ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);
  if(!vals.length){ctx.fillStyle="#5b6672";ctx.font="13px sans-serif";ctx.fillText(ui("No numeric Cq in this series"),L,H/2);return;}
  const spread=s.judgeable?3.5*s.sd:Math.max(.6,range(vals)*.7),lo=Math.min(...vals,s.mean-spread),
    hi=Math.max(...vals,s.mean+spread),span=Math.max(.2,hi-lo);
  const X=i=>L+(s.points.length<=1?.5:i/(s.points.length-1))*(W-L-R),
    Y=v=>T+(hi-v)/span*(H-T-B);
  ctx.font="11px sans-serif";ctx.textAlign="right";ctx.fillStyle="#64748b";
  for(let i=0;i<=5;i++){const v=lo+span*i/5,y=Y(v);ctx.strokeStyle="#e5e7eb";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(W-R,y);ctx.stroke();ctx.fillText(v.toFixed(1),L-7,y+3);}
  if(s.judgeable)[-3,-2,-1,0,1,2,3].forEach(k=>{
    const v=s.mean+k*s.sd,y=Y(v),major=Math.abs(k)>=2;
    ctx.strokeStyle=k===0?"#1b7837":Math.abs(k)===3?"#c0392b":Math.abs(k)===2?"#d97706":"#94a3b8";
    ctx.lineWidth=k===0?1.7:1;ctx.setLineDash(k?[4,4]:[]);
    ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(W-R,y);ctx.stroke();ctx.setLineDash([]);
    if(major||k===0){ctx.fillStyle=ctx.strokeStyle;ctx.fillText(k===0?ui("mean"):`${k>0?"+":""}${k}s`,W-R-3,y-4);}
  });
  ctx.strokeStyle="#1f6feb";ctx.lineWidth=1.7;ctx.beginPath();let started=false;
  s.points.forEach((p,i)=>{if(!Number.isFinite(p.cq)){started=false;return;}
    const x=X(i),y=Y(p.cq);if(!started){ctx.moveTo(x,y);started=true;}else ctx.lineTo(x,y);});ctx.stroke();
  s.points.forEach((p,i)=>{
    const x=X(i);if(!Number.isFinite(p.cq)){ctx.strokeStyle="#c0392b";ctx.beginPath();
      ctx.moveTo(x-5,H-B-6);ctx.lineTo(x+5,H-B+4);ctx.moveTo(x+5,H-B-6);ctx.lineTo(x-5,H-B+4);ctx.stroke();return;}
    ctx.fillStyle=p.flags?"#c0392b":"#1f6feb";ctx.beginPath();ctx.arc(x,Y(p.cq),p.flags?5:4,0,Math.PI*2);ctx.fill();
  });
  const step=Math.max(1,Math.ceil(s.points.length/12));ctx.textAlign="center";ctx.fillStyle="#475569";
  s.points.forEach((p,i)=>{if(i%step&&i!==s.points.length-1)return;ctx.save();ctx.translate(X(i),H-B+16);
    ctx.rotate(-.45);ctx.fillText(p.tick,0,0);ctx.restore();});
  ctx.fillStyle="#334155";ctx.fillText(ui("Experiment date (day.month)"),(L+W-R)/2,H-7);
  ctx.save();ctx.translate(15,(T+H-B)/2);ctx.rotate(-Math.PI/2);ctx.fillText("Cq",0,0);ctx.restore();
}
