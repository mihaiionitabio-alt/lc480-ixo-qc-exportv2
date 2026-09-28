function ini(text){const o={};let sec="";for(const line of text.split(/\r?\n/)){const l=line.trim();if(!l||l.startsWith("#"))continue;
  const m=l.match(/^\[(.+)\]$/);if(m){sec=m[1];o[sec]=o[sec]||{};continue}
  const kv=l.match(/^([^=]+)=(.*)$/);if(kv&&sec&&!o[sec][kv[1].trim()])o[sec][kv[1].trim()]=kv[2].trim()}return o}
