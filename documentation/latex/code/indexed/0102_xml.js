const xml=u8=>{const d=new DOMParser().parseFromString(new TextDecoder().decode(u8),"application/xml");if(d.querySelector("parsererror"))throw new Error("XML parse error");return d};
