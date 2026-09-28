const MISSY_LOGO_OPTION=3;
const MISSY_TEXT=Object.freeze({name:"MISSY",status:"RUO",warning:"NOT VALIDATED"});
const MISSY_COLORS=Object.freeze({ink:"#102f4d",teal:"#0d8790",amber:"#e7a12c",paper:"#ffffff"});
const MISSY_FACE='"Courier New","Nimbus Mono PS","Liberation Mono",monospace';
function missyEmblem(cx,cy,r,sw){
  const c=MISSY_COLORS,k=r/100,pt=[[0,-100],[87,-50],[87,50],[0,100],[-87,50],[-87,-50]].map(([x,y])=>`${(cx+x*k).toFixed(2)},${(cy+y*k).toFixed(2)}`).join(" ");
  const S=(x,y)=>`${(cx+x*k).toFixed(2)} ${(cy+y*k).toFixed(2)}`;
  const helix=`<path d="M${S(-19,-59)}c${38*k} ${24*k} ${38*k} ${40*k} 0 ${64*k}s${-38*k} ${40*k} 0 ${64*k}M${S(19,-59)}c${-38*k} ${24*k} ${-38*k} ${40*k} 0 ${64*k}s${38*k} ${40*k} 0 ${64*k}" fill="none" stroke="${c.teal}" stroke-width="${(4.7*k*sw).toFixed(2)}" stroke-linecap="round"/>`;
  const rungs=[[-12,-42,24],[-19,-21,38],[-19,0,38],[-12,21,24],[-19,42,38],[-19,63,38]].map(([x,y,w])=>`M${S(x,y)}h${(w*k).toFixed(2)}`).join("");
  return `<polygon points="${pt}" fill="${c.paper}" stroke="${c.ink}" stroke-width="${(5.9*k*sw).toFixed(2)}" stroke-linejoin="round"/>${helix}<path d="${rungs}" stroke="${c.amber}" stroke-width="${(3.5*k*sw).toFixed(2)}" stroke-linecap="round"/>`;
}
function missyWords(x,y,size,anchor){
  const c=MISSY_COLORS,t=(s,dy,fs,ls,fill)=>`<text x="${x}" y="${(y+dy).toFixed(2)}" text-anchor="${anchor}" font-family='${MISSY_FACE}' font-size="${fs.toFixed(2)}" font-weight="700" letter-spacing="${ls.toFixed(2)}" fill="${fill}">${s}</text>`;
  return t(MISSY_TEXT.name,0,size,size*.16,c.ink)+t(MISSY_TEXT.status,size*1.04,size*.66,size*.12,c.teal)+t(MISSY_TEXT.warning,size*1.94,size*.40,size*.08,c.ink);
}
function missySvg(compact){
  if(!compact)return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 330" width="190" height="330" role="img" aria-label="MISSY RUO NOT VALIDATED">${missyEmblem(95,110,100,1)}${missyWords(95,265,26,"middle")}</svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 50" width="150" height="50" role="img" aria-label="MISSY RUO NOT VALIDATED">${missyEmblem(23,25,21,1.25)}${missyWords(52,17,14,"start")}</svg>`;
}
function missyMarkWithSvg(svgText,corner="top-right"){
  const raw=String(svgText||"");if(!raw.includes("</svg>"))return raw;
  const m=raw.match(/viewBox=["']([^"']+)["']/i),v=m?m[1].split(/\s+/).map(Number):[0,0,900,450],W=v[2]||900,H=v[3]||450,mw=150,mh=50,g=10;
  const pos={"top-left":[g,g],"top-right":[Math.max(g,W-g-mw),g],"bottom-left":[g,Math.max(g,H-g-mh)],"bottom-right":[Math.max(g,W-g-mw),Math.max(g,H-g-mh)]};
  const p=pos[corner]||pos["top-right"],mark=missySvg(true).replace(/^<svg[^>]*>|<\/svg>$/g,"");
  return raw.replace("</svg>",`<g transform="translate(${p[0]} ${p[1]})">${mark}</g></svg>`);
}