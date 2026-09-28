function median(a){if(!a.length)return NaN;const s=[...a].sort((x,y)=>x-y),n=s.length,h=n>>1;return n%2?s[h]:(s[h-1]+s[h])/2;}
