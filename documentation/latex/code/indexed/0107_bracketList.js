const bracketList=s=>String(s||"").replace(/^\s*\[|\]\s*$/g,"").split(",").map(x=>x.trim()).filter(Boolean);
