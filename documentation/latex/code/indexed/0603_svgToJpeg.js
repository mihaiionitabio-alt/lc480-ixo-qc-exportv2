      chunks.forEach(c=>{out.set(c,at);at+=c.length;});
      return out;
    }
  };
  d.page();
  return d;
}
/* An SVG figure becomes a JPEG the PDF can carry. The drawing is rasterised at
   twice the nominal size so a printed page keeps the line weights readable. */
function svgToJpeg(svgText,scale){
  return new Promise(resolve=>{
    const m=String(svgText).match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    const W=m?+m[1]:900,H=m?+m[2]:450,s=scale||2;
    const img=new Image();
    img.onload=()=>{
      const cv=document.createElement("canvas");cv.width=Math.round(W*s);cv.height=Math.round(H*s);
      const ctx=cv.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,cv.width,cv.height);
