function rdmlAttrId(el,name){const k=rdmlKid(el,name);return k?String(k.getAttribute("id")||"").trim():"";}
