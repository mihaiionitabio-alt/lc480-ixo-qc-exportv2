function dosStamp(date){
  const t=((date.getHours()&31)<<11)|((date.getMinutes()&63)<<5)|((date.getSeconds()/2)&31);
  const d=(((date.getFullYear()-1980)&127)<<9)|(((date.getMonth()+1)&15)<<5)|(date.getDate()&31);
  return {t,d};
}
