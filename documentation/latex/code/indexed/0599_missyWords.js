function missyWords(x,y,size,anchor){
  const c=MISSY_COLORS,t=(s,dy,fs,ls,fill)=>`<text x="${x}" y="${(y+dy).toFixed(2)}" text-anchor="${anchor}" font-family='${MISSY_FACE}' font-size="${fs.toFixed(2)}" font-weight="700" letter-spacing="${ls.toFixed(2)}" fill="${fill}">${s}</text>`;
  return t(MISSY_TEXT.name,0,size,size*.16,c.ink)+t(MISSY_TEXT.status,size*1.04,size*.66,size*.12,c.teal)+t(MISSY_TEXT.warning,size*1.94,size*.40,size*.08,c.ink);
}
