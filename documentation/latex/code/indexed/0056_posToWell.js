function posToWell(pos,cols){return String.fromCharCode(65+Math.floor(pos/cols))+String(pos%cols+1).padStart(2,"0");}
