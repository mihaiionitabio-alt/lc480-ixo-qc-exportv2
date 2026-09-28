function drawTemperatureTrace(canvas,run){
  const L=run&&run.eds&&run.eds.log;if(!canvas||!L||!L.temps.length)return;
  const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height,Lm=60,R=20,T=18,B=44,t0=L.temps[0][0];
  const xs=L.temps.map(t=>(t[0]-t0)/60000),xmax=Math.max(...xs)||1,vals=L.temps.flatMap(t=>[t[1],t[2]]).filter(Number.isFinite);
  const lo=Math.min(0,...vals),hi=Math.max(...vals)+2,X=x=>Lm+x/xmax*(W-Lm-R),Y=v=>T+(hi-v)/(hi-lo)*(H-T-B);
  ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);ctx.font="11px sans-serif";ctx.fillStyle="#64748b";ctx.textAlign="right";
  for(let i=0;i<=5;i++){const v=lo+(hi-lo)*i/5,y=Y(v);ctx.strokeStyle="#e5e7eb";ctx.beginPath();ctx.moveTo(Lm,y);ctx.lineTo(W-R,y);ctx.stroke();ctx.fillText(v.toFixed(0),Lm-6,y+3);}
  ctx.textAlign="center";for(let i=0;i<=6;i++){const x=xmax*i/6;ctx.fillText(x.toFixed(0),X(x),H-B+16);}
  ctx.fillText(ui("Minutes from the first log record"),(Lm+W-R)/2,H-8);
  ctx.save();ctx.translate(14,(T+H-B)/2);ctx.rotate(-Math.PI/2);ctx.fillText("°C",0,0);ctx.restore();
  [[1,"#1f6feb"],[2,"#d97706"],[4,"#6f42c1"]].forEach(([k,c])=>{ctx.strokeStyle=c;ctx.lineWidth=1.3;ctx.beginPath();
    L.temps.forEach((t,i)=>{const v=t[k];if(!Number.isFinite(v))return;const x=X(xs[i]),y=Y(v);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();});
}
