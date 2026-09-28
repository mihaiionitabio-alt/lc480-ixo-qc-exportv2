function graphPng(){
  const L=GRAPH_STATE.last;if(!L)return;
  const svgText=graphSvgText(),m=svgText.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/),W=m?+m[1]:900,H=m?+m[2]:450,scale=2;
  const img=new Image();
  img.onload=()=>{const cv=document.createElement("canvas");cv.width=W*scale;cv.height=H*scale;const ctx=cv.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,cv.width,cv.height);ctx.drawImage(img,0,0,cv.width,cv.height);
    cv.toBlob(b=>b.arrayBuffer().then(ab=>download(graphFileBase()+".png",new Uint8Array(ab),"image/png")),"image/png");};
  img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svgText);
}
