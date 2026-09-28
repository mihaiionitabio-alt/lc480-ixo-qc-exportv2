function fmtTick(v){const a=Math.abs(v);return a>=1e5||(a>0&&a<1e-3)?v.toExponential(1):String(+v.toPrecision(6));}
