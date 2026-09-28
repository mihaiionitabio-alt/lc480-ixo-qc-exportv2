function byKey(arr,fn){const m=new Map();for(const x of arr){const k=fn(x);if(!m.has(k))m.set(k,[]);m.get(k).push(x);}return m;}
