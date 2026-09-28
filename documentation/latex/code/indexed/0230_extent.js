function extent(vals,pad){const v=vals.filter(Number.isFinite);if(!v.length)return [0,1];let lo=Math.min(...v),hi=Math.max(...v);const p=(hi-lo||Math.abs(hi)||1)*(pad??0.05);return [lo-p,hi+p];}
