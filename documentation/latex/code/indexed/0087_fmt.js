const fmt=(v,d=3)=>v==null||!Number.isFinite(v)?"":(Math.abs(v)>=1e6||(Math.abs(v)<1e-3&&v!==0)?v.toExponential(3):(+v.toFixed(d)).toString());
