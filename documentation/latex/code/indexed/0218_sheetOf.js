function sheetOf(name,rows){const keys=Object.keys(rows[0]||{});return {name,rows:[keys,...rows.map(r=>keys.map(k=>r[k]))]};}
