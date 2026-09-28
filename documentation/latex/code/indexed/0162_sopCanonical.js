function sopCanonical(p){
  const sortKeys=v=>Array.isArray(v)?v.map(sortKeys):v&&typeof v==="object"?Object.keys(v).sort().reduce((a,k)=>(a[k]=sortKeys(v[k]),a),{}):v;
  const c=Object.assign({},p);delete c.sha256;delete c.locked;return JSON.stringify(sortKeys(c));
}
