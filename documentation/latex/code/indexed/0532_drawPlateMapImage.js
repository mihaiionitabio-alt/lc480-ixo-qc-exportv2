function drawPlateMapImage(){
  const run=runAt("#plate-run",0);if(!run)return null;
  const rows=plateMapRows(run,$("#plate-target").value),mode=$("#plate-colour").value,
    cq=rows.map(r=>Number(r.cq)).filter(Number.isFinite),lo=cq.length?Math.min(...cq):0,hi=cq.length?Math.max(...cq):1;
  const cw=112,ch=58,left=30,top=34,canvas=ce("canvas");
  canvas.width=left+run.cols*cw+12;canvas.height=top+run.rows*ch+28;
  const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.font="11px sans-serif";ctx.textAlign="center";ctx.fillStyle="#475569";
  for(let c=0;c<run.cols;c++)ctx.fillText(String(c+1),left+c*cw+cw/2,20);
  for(let r=0;r<run.rows;r++)ctx.fillText(String.fromCharCode(65+r),15,top+r*ch+ch/2+3);
  rows.forEach((x,i)=>{
    const r=Math.floor(i/run.cols),c=i%run.cols,x0=left+c*cw,y0=top+r*ch;
    ctx.fillStyle=plateColour(x,mode,lo,hi);ctx.strokeStyle="#cbd5e1";ctx.lineWidth=1;
    ctx.fillRect(x0+1,y0+1,cw-3,ch-3);ctx.strokeRect(x0+1,y0+1,cw-3,ch-3);
    ctx.textAlign="left";ctx.fillStyle="#111827";ctx.font="10px sans-serif";
    ctx.fillText(String(x.sample||x.well).slice(0,17),x0+5,y0+17);
    ctx.fillStyle="#475569";ctx.font="9px sans-serif";
    const sub=x.cq!==""?`Cq ${num(Number(x.cq),2)}`:(x.call||x.role||x.subsets||"");
    ctx.fillText(String(sub).slice(0,20),x0+5,y0+34);
  });
  return canvas;
}
