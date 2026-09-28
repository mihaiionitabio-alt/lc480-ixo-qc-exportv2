  doc.gap(8);
  doc.text("Contents",12,true);
  chosen.forEach((x,i)=>{doc.room(12);doc.text((i+1)+".  "+x.title+"   ["+x.id+"]",9.5,false);});

  for(const x of chosen){
