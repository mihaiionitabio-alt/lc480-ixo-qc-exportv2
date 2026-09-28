function drawAmplificationCurves(canvas,rows,mode,logScale,opts){
  if(!canvas||!rows.length)return;
  opts=opts||{};
  const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height,L=70,R=20,T=20,B=48,
    raw=rows.flatMap(w=>w.curve.filter(Number.isFinite)).concat((opts.hlines||[]).map(h=>h.y)),pos=raw.filter(v=>v>0);
  const tx=v=>logScale?Math.log10(Math.max(v,pos.length?Math.min(...pos):1)):v,
    vals=raw.map(tx).filter(Number.isFinite),lo=Math.min(...vals),hi=Math.max(...vals),span=Math.max(1e-9,hi-lo),
    cycles=Math.max(...rows.map(w=>w.curve.length)),X=i=>L+i/Math.max(1,cycles-1)*(W-L-R),
    Y=v=>T+(hi-tx(v))/span*(H-T-B);
  ctx.clearRect(0,0,W,H);ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);
  ctx.font="11px sans-serif";ctx.fillStyle="#64748b";ctx.textAlign="right";
  for(let i=0;i<=5;i++){const v=lo+span*i/5,y=T+(5-i)/5*(H-T-B);ctx.strokeStyle="#e5e7eb";
    ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(W-R,y);ctx.stroke();
    ctx.fillText(logScale?`10^${v.toFixed(1)}`:v.toFixed(Math.abs(v)>100?0:2),L-7,y+3);}
  const ordinary=rows.filter(w=>!w.role||w.role==="Unknown"),controls=rows.filter(w=>w.role&&w.role!=="Unknown");
  [...ordinary,...controls].forEach(w=>{
    ctx.strokeStyle=curveColour(w,mode);ctx.globalAlpha=controls.includes(w)?.95:.38;
    ctx.lineWidth=controls.includes(w)?1.8:1;ctx.beginPath();
    w.curve.forEach((v,i)=>{const x=X(i),y=Y(v);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();
  });ctx.globalAlpha=1;
  ctx.textAlign="center";ctx.fillStyle="#334155";
  for(let i=0;i<=5;i++){const c=Math.round(1+(cycles-1)*i/5);ctx.fillText(String(c),X(c-1),H-B+17);}
  (opts.hlines||[]).forEach(h=>{const y=Y(h.y);if(!Number.isFinite(y))return;ctx.save();ctx.strokeStyle=h.colour;ctx.setLineDash([6,4]);
    ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(W-R,y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=h.colour;
    ctx.textAlign="left";ctx.fillText(h.label,L+6,y-4);ctx.restore();});
  ctx.fillText(ui("Cycle"),(L+W-R)/2,H-8);ctx.save();ctx.translate(16,(T+H-B)/2);ctx.rotate(-Math.PI/2);
  ctx.fillText(ui((opts.ylabel||"Raw fluorescence")+(logScale?" (log scale)":"")),0,0);ctx.restore();
  canvas._hit={rows,X,Y,W,H};
}
