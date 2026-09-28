function ccCalibSummary(name,text){
  const block=key=>{const m=text.match(new RegExp("\\["+key+"\\][\\s\\S]*?x1-m1=<<eof\\r?\\n([\\s\\S]*?)\\r?\\neof"));
    return m?m[1].trim().split(/\r?\n/).map(r=>r.split(",").map(Number)):null;};
  if(/UniformityCalibration/.test(text)){const g=block("uniformity");if(!g)return null;
    const edge=[],centre=[];g.forEach((r,i)=>r.forEach((v,j)=>((i===0||j===0||i===g.length-1||j===r.length-1)?edge:centre).push(v)));
    return {calib_uniformity:mean(edge)/mean(centre)};}
  if(/BackgroundCalibration/.test(text)){const g=block("background_offset");return g?{calib_background:mean(g.flat().map(Math.abs))}:null;}
  if(/ROICalibration/.test(text)){const m=text.match(/\[roi_diameter\]([\s\S]*?)\n\[/);if(!m)return null;
    const v=[...m[1].matchAll(/=([\d.]+)/g)].map(x=>+x[1]);return {calib_roi:mean(v)};}
  return null;
}
