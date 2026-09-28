function ccSpark(res,st){
  const W=150,H=38,pts=res.type==="funnel"?[]:res.pts.filter(p=>Number.isFinite(p.y)&&!p.pre);
  if(!pts.length)return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><text x="4" y="24" font-size="10" fill="#94a3b8">no data</text></svg>`;
  const ys=pts.flatMap(p=>[p.y,p.ucl,p.lcl]).filter(Number.isFinite),lo=Math.min(...ys),hi=Math.max(...ys)||1,span=hi-lo||1;
  const X=i=>4+i*(W-8)/Math.max(1,pts.length-1),Y=v=>H-4-(v-lo)/span*(H-8);
  const line=k=>pts.every(p=>Number.isFinite(p[k]))?`<polyline fill="none" stroke="#cbd5e1" stroke-dasharray="3 2" points="${pts.map((p,i)=>`${X(i).toFixed(1)},${Y(p[k]).toFixed(1)}`).join(" ")}"/>`:"";
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${line("ucl")}${line("lcl")}
    <polyline fill="none" stroke="#64748b" stroke-width="1.2" points="${pts.map((p,i)=>`${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join(" ")}"/>
    ${pts.map((p,i)=>p.flags.length?`<circle cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="2.4" fill="${ccSignal(p)==="limit"?CC_COL.bad:CC_COL.rule}"/>`:"").join("")}
    <circle cx="${X(pts.length-1).toFixed(1)}" cy="${Y(pts[pts.length-1].y).toFixed(1)}" r="3.4" fill="${CC_COL[st.level]}"/></svg>`;
}
