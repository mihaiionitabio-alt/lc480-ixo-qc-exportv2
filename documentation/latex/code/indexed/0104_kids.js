const kids=(el,tag)=>el?Array.from(el.children).filter(c=>c.tagName===tag):[];
