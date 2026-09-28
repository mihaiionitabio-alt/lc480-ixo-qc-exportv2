function heatColour(value,lo,hi){
  if(!Number.isFinite(value))return "#f8fafc";
  const t=hi>lo?Math.max(0,Math.min(1,(value-lo)/(hi-lo))):0.5;
  const r=Math.round(222+28*t),g=Math.round(245-83*t),b=Math.round(255-103*t);
  return `rgb(${r},${g},${b})`;
}
