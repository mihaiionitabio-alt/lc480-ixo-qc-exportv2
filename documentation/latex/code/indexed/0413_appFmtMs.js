function appFmtMs(ms){return ms<1000?Math.round(ms)+" ms":(ms/1000).toFixed(ms<10000?1:0)+" s";}
