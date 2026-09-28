function rdmlKeyOf(item){
  return [rdmlStem(item.name),String(item.experimentId||"").trim().toLowerCase()].filter(Boolean);
}
