function acquisitionStats(channels){
  if(!channels)return [];
  return Object.keys(channels).map(key=>{
    const cycles=Object.keys(channels[key]).map(Number).sort((a,b)=>a-b),lengths=uniq(cycles.map(c=>channels[key][c].length));
    const continuous=cycles.every((c,i)=>i===0||c===cycles[i-1]+1);
    return {channel:Number(key),cycles:cycles.length,firstCycle:cycles[0],lastCycle:cycles.at(-1),wellCounts:lengths,continuous};
  });
}
