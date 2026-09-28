function toCSV(cols,rows){
  return [cols.map(c=>csvq(c.label)).join(","),
    ...rows.map(r=>cols.map(c=>csvq(r[c.key])).join(","))].join("\n")+"\n";
}
