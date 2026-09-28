function javaHashOrder(names){
  const cap=(()=>{let c=16;while(names.length>c*0.75)c*=2;return c;})();
  const h=s=>{let x=0;for(const ch of s)x=(Math.imul(31,x)+ch.charCodeAt(0))|0;return x>>>0;};
  return names.map((n,i)=>({n,i,b:((h(n)^(h(n)>>>16))&(cap-1))})).sort((a,b)=>a.b-b.b||a.i-b.i).map(x=>x.n);
}
