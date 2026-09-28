function ccLzss(src,o){
  const N=4096,F=18,TH=2,ring=new Uint8Array(N).fill(32),out=[];let r=N-F,flags=0;
  while(o<src.length){
    flags>>=1;
    if(!(flags&0x100))flags=src[o++]|0xff00;
    if(o>=src.length)break;
    if(flags&1){const c=src[o++];out.push(c);ring[r]=c;r=(r+1)&(N-1);}
    else{
      if(o+1>=src.length)break;
      const i=src[o]|((src[o+1]&0xf0)<<4),len=(src[o+1]&0x0f)+TH;o+=2;
      for(let k=0;k<=len;k++){const c=ring[(i+k)&(N-1)];out.push(c);ring[r]=c;r=(r+1)&(N-1);}
    }
  }
  return Uint8Array.from(out);
}