function csvOf(rows){return toCSV(Object.keys(rows[0]||{}).map(k=>({key:k,label:k})),rows);}
