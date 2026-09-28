function MD5(){
  const K=new Uint32Array(64),S=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21];
  for(let i=0;i<64;i++)K[i]=Math.floor(Math.abs(Math.sin(i+1))*2**32)>>>0;
  let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
  const buf=new Uint8Array(64);let bl=0,total=0;const M=new Uint32Array(16);
  function block(b,o){
    for(let i=0;i<16;i++)M[i]=b[o+i*4]|b[o+i*4+1]<<8|b[o+i*4+2]<<16|b[o+i*4+3]<<24;
    let A=a0,B=b0,C=c0,D=d0;
    for(let i=0;i<64;i++){
      let F,g;
      if(i<16){F=(B&C)|(~B&D);g=i}else if(i<32){F=(D&B)|(~D&C);g=(5*i+1)%16}
      else if(i<48){F=B^C^D;g=(3*i+5)%16}else{F=C^(B|~D);g=(7*i)%16}
      const s=S[(i>>4)*4+(i&3)];
      F=(F+A+K[i]+M[g])|0;A=D;D=C;C=B;B=(B+((F<<s)|(F>>>(32-s))))|0;
    }
    a0=(a0+A)|0;b0=(b0+B)|0;c0=(c0+C)|0;d0=(d0+D)|0;
  }
  return{
    update(u8){let i=0;total+=u8.length;
      if(bl){while(bl<64&&i<u8.length)buf[bl++]=u8[i++];if(bl===64){block(buf,0);bl=0}}
      for(;i+64<=u8.length;i+=64)block(u8,i);
      while(i<u8.length)buf[bl++]=u8[i++];},
    digest(){const bits=total*8;const pad=new Uint8Array(((bl<56)?56-bl:120-bl)+8);pad[0]=0x80;
      const dv=new DataView(pad.buffer);dv.setUint32(pad.length-8,bits>>>0,true);dv.setUint32(pad.length-4,Math.floor(bits/2**32),true);
      this.update(pad);const out=new Uint8Array(16),dv2=new DataView(out.buffer);
      [a0,b0,c0,d0].forEach((w,k)=>dv2.setUint32(k*4,w>>>0,true));return hex(out)}
  };
}
