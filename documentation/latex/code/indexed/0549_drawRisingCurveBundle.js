function drawRisingCurveBundle(canvas,rows){
  if(!canvas)return;
  const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height,L=68,R=24,T=28,B=52;
  ctx.clearRect(0,0,W,H);ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);
  if(!rows.length){ctx.fillStyle="#64748b";ctx.font="14px sans-serif";ctx.fillText("No rising curves selected",L,H/2);return;}
  const colourBy=new Map();rows.forEach(o=>{const k=`${o.experiment}|${o.channel}`;if(!colourBy.has(k))colourBy.set(k,hashColour(k));});
  const cycles=Math.max(...rows.map(o=>o.curve.length));
  const X=i=>L+i/Math.max(1,cycles-1)*(W-L-R),Y=v=>T+(1-v)*(H-T-B);
  ctx.font="11px sans-serif";ctx.textAlign="right";ctx.fillStyle="#64748b";
  for(let i=0;i<=4;i++){const v=i/4,y=Y(v);ctx.strokeStyle="#e5e7eb";ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(W-R,y);ctx.stroke();ctx.fillText(v.toFixed(2),L-8,y+3);}
  rows.forEach(o=>{
    const finite=o.curve.filter(Number.isFinite),mn=finite.length?Math.min(...finite):0,mx=finite.length?Math.max(...finite):1,span=mx-mn||1;
    const col=colourBy.get(`${o.experiment}|${o.channel}`)||"#1f6feb";
    ctx.strokeStyle=col;ctx.globalAlpha=.72;ctx.lineWidth=1.25;ctx.beginPath();
    o.curve.forEach((v,i)=>{if(!Number.isFinite(v))return;const x=X(i),y=Y((v-mn)/span);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();
  });ctx.globalAlpha=1;
  ctx.textAlign="center";ctx.fillStyle="#334155";
  for(let i=0;i<=5;i++){const c=Math.round(1+(cycles-1)*i/5);ctx.fillText(String(c),X(c-1),H-B+18);}
  ctx.fillText("Cycle",(L+W-R)/2,H-9);ctx.save();ctx.translate(16,(T+H-B)/2);ctx.rotate(-Math.PI/2);ctx.fillText("Normalised signal",0,0);ctx.restore();
  canvas._risingLegend=[...colourBy];
}
