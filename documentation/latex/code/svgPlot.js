function svgPlot(o){
  const W=o.width||880,H=o.height||440,L=o.left||70,Rm=o.right||(o.legend&&o.legend.length?170:20),T=o.top||30,B=o.bottom||50;
  const pw=W-L-Rm,ph=H-T-B;
  const ylog=!!o.ylog;
  const fy=v=>ylog?Math.log10(v):v;
  let [x0,x1]=o.x,[y0,y1]=o.y;
  if(ylog){y0=Math.log10(Math.max(y0,1e-9));y1=Math.log10(Math.max(y1,1e-9));}
  if(x0===x1){x0-=1;x1+=1;}if(y0===y1){y0-=1;y1+=1;}
  const X=v=>L+(v-x0)/(x1-x0)*pw,Y=v=>T+(1-(fy(v)-y0)/(y1-y0))*ph;
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="system-ui,Segoe UI,Arial,sans-serif" font-size="11"><rect width="${W}" height="${H}" fill="#fff"/>`;
  if(o.title)s+=`<text x="${L}" y="18" font-size="13" font-weight="600" fill="#111827">${svgEsc(o.title)}</text>`;
  (o.bands||[]).forEach(b=>{const ya=Y(b.y1),yb=Y(b.y0);if(b.x0!=null){s+=`<rect x="${X(b.x0)}" y="${T}" width="${Math.max(0,X(b.x1)-X(b.x0))}" height="${ph}" fill="${b.colour}" opacity="${b.opacity||0.12}"/>`;}
    else s+=`<rect x="${L}" y="${Math.min(ya,yb)}" width="${pw}" height="${Math.abs(yb-ya)}" fill="${b.colour}" opacity="${b.opacity||0.12}"/>`;});
  let yt=o.yticks===false?[]:ylog?niceTicks(y0,y1,5).filter(v=>Number.isInteger(v)):niceTicks(y0,y1,6);
  if(ylog&&o.yticks!==false&&yt.length<3){                 // less than ~2 decades: also label 2× and 5×
    yt=[];for(let d=Math.floor(y0);d<=Math.ceil(y1);d++)for(const m of [1,2,5]){const v=d+Math.log10(m);if(v>=y0-1e-9&&v<=y1+1e-9)yt.push(v);}}
  const ylab10=v=>{const x=Math.pow(10,v);return x>=1e4||x<0.01?x.toExponential(0).replace("+",""):fmtTick(+x.toPrecision(2));};
  yt.forEach(v=>{const y=T+(1-(v-y0)/(y1-y0))*ph;if(y<T-0.5||y>T+ph+0.5)return;s+=`<line x1="${L}" x2="${L+pw}" y1="${y}" y2="${y}" stroke="#e5e7eb"/><text x="${L-6}" y="${y+3.5}" text-anchor="end" fill="#6b7280">${ylog?ylab10(v):fmtTick(v)}</text>`;});
  const xt=o.xticks||niceTicks(x0,x1,8).map(v=>({v,label:fmtTick(v)}));
  xt.forEach(t=>{const x=X(t.v);if(x<L-0.5||x>L+pw+0.5)return;s+=`<line x1="${x}" x2="${x}" y1="${T+ph}" y2="${T+ph+4}" stroke="#9ca3af"/><text x="${x}" y="${T+ph+16}" text-anchor="${t.anchor||"middle"}" fill="#6b7280"${t.rotate?` transform="rotate(${t.rotate} ${x} ${T+ph+16})"`:""}>${svgEsc(t.label)}</text>`;});
  s+=`<rect x="${L}" y="${T}" width="${pw}" height="${ph}" fill="none" stroke="#9ca3af"/>`;
  if(o.xlab)s+=`<text x="${L+pw/2}" y="${H-8}" text-anchor="middle" fill="#374151">${svgEsc(o.xlab)}</text>`;
  if(o.ylab)s+=`<text transform="translate(16 ${T+ph/2}) rotate(-90)" text-anchor="middle" fill="#374151">${svgEsc(o.ylab)}</text>`;
  const cid="pc"+(++SVG_CLIP_N);
  s+=`<defs><clipPath id="${cid}"><rect x="${L}" y="${T}" width="${pw}" height="${ph}"/></clipPath></defs><g clip-path="url(#${cid})">`;
  (o.series||[]).forEach(se=>{
    const pts=se.data.filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1])&&(!ylog||p[1]>0));
    if(se.type==="line"){if(pts.length<2&&!pts.length)return;
      s+=`<polyline fill="none" stroke="${se.colour}" stroke-width="${se.width||1.3}" stroke-opacity="${se.opacity||0.9}"${se.dash?` stroke-dasharray="${se.dash}"`:""} points="${pts.map(p=>`${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(" ")}"><title>${svgEsc(se.tip||se.label||"")}</title></polyline>`;}
    else if(se.type==="bar"){const bw=se.barWidth||Math.max(2,pw/((x1-x0)||1)*0.7);
      pts.forEach(p=>{const base=p[2]??(ylog?Math.pow(10,y0):Math.max(y0,0));const ya=Y(p[1]),yb=Y(base);
        s+=`<rect x="${X(p[0])-bw/2+(se.offset||0)}" y="${Math.min(ya,yb)}" width="${bw}" height="${Math.abs(yb-ya)}" fill="${p[4]||se.colour}"><title>${svgEsc(p[3]||"")}</title></rect>`;});}
    else pts.forEach(p=>{s+=`<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="${se.r||3.5}" fill="${p[3]||se.colour}" fill-opacity="${se.opacity||0.85}" stroke="#fff" stroke-width="0.6"><title>${svgEsc(p[2]||se.label||"")}</title></circle>`;});
  });
  s+=`</g>`;
  (o.hlines||[]).forEach(h=>{if(!Number.isFinite(h.y)||(ylog&&h.y<=0))return;const y=Y(h.y);if(y<T||y>T+ph)return;
    s+=`<line x1="${L}" x2="${L+pw}" y1="${y}" y2="${y}" stroke="${h.colour||"#111"}" stroke-dasharray="${h.dash||"5 4"}" stroke-width="1.2"/>${o.hlabelsOutside?`<text x="${L+pw+5}" y="${y+3.5}" text-anchor="start" fill="${h.colour||"#111"}">${svgEsc(h.label||"")}</text>`:`<text x="${L+pw-4}" y="${y-4}" text-anchor="end" fill="${h.colour||"#111"}">${svgEsc(h.label||"")}</text>`}`;});
  (o.vlines||[]).forEach(h=>{if(!Number.isFinite(h.x))return;const x=X(h.x);if(x<L||x>L+pw)return;
    s+=`<line x1="${x}" x2="${x}" y1="${T}" y2="${T+ph}" stroke="${h.colour||"#111"}" stroke-dasharray="${h.dash||"5 4"}" stroke-width="1.2"/><text x="${x>L+pw*0.75?x-4:x+4}" text-anchor="${x>L+pw*0.75?"end":"start"}" y="${T+12+(h.row||0)*13}" fill="${h.colour||"#111"}">${svgEsc(h.label||"")}</text>`;});
  if(o.texts)o.texts.forEach(t=>{s+=`<text x="${t.px!=null?t.px:X(t.x)}" y="${t.py!=null?t.py:Y(t.y)}" fill="${t.colour||"#374151"}" font-size="${t.size||11}" text-anchor="${t.anchor||"start"}">${svgEsc(t.text)}</text>`;});
  if(o.legend&&o.legend.length){let y=T+4;const shown=o.legend.slice(0,24);
    shown.forEach(l=>{s+=`<rect x="${L+pw+12}" y="${y}" width="11" height="11" rx="2" fill="${l.colour}"/><text x="${L+pw+28}" y="${y+9.5}" fill="#374151">${svgEsc(String(l.label).slice(0,o.legendChars||24))}</text>`;y+=16;});
    if(o.legend.length>24)s+=`<text x="${L+pw+12}" y="${y+9}" fill="#6b7280">+${o.legend.length-24} more</text>`;}
  return s+`</svg>`;
}