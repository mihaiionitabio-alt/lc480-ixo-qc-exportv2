function propValues(root,name){return [...root.querySelectorAll('prop[name="'+name+'"]')].map(e=>(e.textContent||"").trim()).filter(Boolean);}
