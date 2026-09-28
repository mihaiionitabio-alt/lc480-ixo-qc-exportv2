function ccPng(svgText,name){
  const m=svgText.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/),W=m?+m[1]:900,H=m?+m[2]:450,img=new Image();
  img.onload=()=>{const cv=document.createElement("canvas");cv.width=W*2;cv.height=H*2;const c=cv.getContext("2d");c.fillStyle="#fff";c.fillRect(0,0,cv.width,cv.height);
    c.drawImage(img,0,0,cv.width,cv.height);cv.toBlob(b=>b.arrayBuffer().then(ab=>download(name,new Uint8Array(ab),"image/png")),"image/png");};
  img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svgText);
}
