function missyMarkWithSvg(svgText,corner="top-right"){
  const raw=String(svgText||"");if(!raw.includes("</svg>"))return raw;
  const m=raw.match(/viewBox=["']([^"']+)["']/i),v=m?m[1].split(/\s+/).map(Number):[0,0,900,450],W=v[2]||900,H=v[3]||450,mw=150,mh=50,g=10;
  const pos={"top-left":[g,g],"top-right":[Math.max(g,W-g-mw),g],"bottom-left":[g,Math.max(g,H-g-mh)],"bottom-right":[Math.max(g,W-g-mw),Math.max(g,H-g-mh)]};
  const p=pos[corner]||pos["top-right"],mark=missySvg(true).replace(/^<svg[^>]*>|<\/svg>$/g,"");
  return raw.replace("</svg>",`<g transform="translate(${p[0]} ${p[1]})">${mark}</g></svg>`);
}
