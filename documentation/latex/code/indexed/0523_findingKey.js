function findingKey(e){
  const text=findingTextKey(e.finding).replace(/\b[a-h](?:[0-9]|1[0-9]|2[0-4])\b/gi,"<well>")
    .replace(/\b\d+(?:\.\d+)?\b/g,"<n>");
  return [findingTextKey(e.area),findingTextKey(e.severity),text].join("|");
}
