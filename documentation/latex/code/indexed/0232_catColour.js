function catColour(map,key){const k=String(key||"—");if(!map.has(k))map.set(k,SERIES_PALETTE[map.size%SERIES_PALETTE.length]);return map.get(k);}
