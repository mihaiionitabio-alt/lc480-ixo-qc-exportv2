function pv(el,name){const e=el?el.querySelector(':scope > prop[name="'+name+'"]'):null;return e&&e.textContent?e.textContent.trim():"";}
