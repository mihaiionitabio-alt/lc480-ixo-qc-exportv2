function cv(a){const m=mean(a);return Number.isFinite(m)&&m!==0?sd(a)/Math.abs(m)*100:NaN;}
