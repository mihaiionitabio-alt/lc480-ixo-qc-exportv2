function missyEmblem(cx,cy,r,sw){
  const c=MISSY_COLORS,k=r/100,pt=[[0,-100],[87,-50],[87,50],[0,100],[-87,50],[-87,-50]].map(([x,y])=>`${(cx+x*k).toFixed(2)},${(cy+y*k).toFixed(2)}`).join(" ");
  const S=(x,y)=>`${(cx+x*k).toFixed(2)} ${(cy+y*k).toFixed(2)}`;
  const helix=`<path d="M${S(-19,-59)}c${38*k} ${24*k} ${38*k} ${40*k} 0 ${64*k}s${-38*k} ${40*k} 0 ${64*k}M${S(19,-59)}c${-38*k} ${24*k} ${-38*k} ${40*k} 0 ${64*k}s${38*k} ${40*k} 0 ${64*k}" fill="none" stroke="${c.teal}" stroke-width="${(4.7*k*sw).toFixed(2)}" stroke-linecap="round"/>`;
  const rungs=[[-12,-42,24],[-19,-21,38],[-19,0,38],[-12,21,24],[-19,42,38],[-19,63,38]].map(([x,y,w])=>`M${S(x,y)}h${(w*k).toFixed(2)}`).join("");
  return `<polygon points="${pt}" fill="${c.paper}" stroke="${c.ink}" stroke-width="${(5.9*k*sw).toFixed(2)}" stroke-linejoin="round"/>${helix}<path d="${rungs}" stroke="${c.amber}" stroke-width="${(3.5*k*sw).toFixed(2)}" stroke-linecap="round"/>`;
}
