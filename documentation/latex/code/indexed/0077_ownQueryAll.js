function ownQueryAll(root,sel){return [...root.querySelectorAll(sel)].filter(e=>ownedBy(e,root));}
