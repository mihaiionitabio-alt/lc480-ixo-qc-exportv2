function qsCalDate(ms){if(!ms)return "";const d=new Date(ms);return `${pad2(d.getMonth()+1)}-${pad2(d.getDate())}-${d.getFullYear()}`;}
