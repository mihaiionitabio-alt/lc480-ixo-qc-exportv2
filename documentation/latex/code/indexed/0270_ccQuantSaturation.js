function ccQuantSaturation(texts){
  let n=0,bad=0;
  for(const t of texts){const q=t.split("[quant]")[1];if(!q)continue;
    for(const line of q.split(/\r?\n/)){const c=line.split("\t");if(!/^IA\d+$/.test(c[0]))continue;n++;if(+c[3]>0)bad++;}}
  return {bad,n};
}
