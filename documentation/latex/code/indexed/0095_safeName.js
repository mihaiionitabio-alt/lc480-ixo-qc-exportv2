const safeName=s=>String(s||"experiment").replace(/[^\w.\-]+/g,"_").slice(0,80);
