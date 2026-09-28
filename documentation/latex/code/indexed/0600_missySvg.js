function missySvg(compact){
  if(!compact)return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 330" width="190" height="330" role="img" aria-label="MISSY RUO NOT VALIDATED">${missyEmblem(95,110,100,1)}${missyWords(95,265,26,"middle")}</svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 50" width="150" height="50" role="img" aria-label="MISSY RUO NOT VALIDATED">${missyEmblem(23,25,21,1.25)}${missyWords(52,17,14,"start")}</svg>`;
}
