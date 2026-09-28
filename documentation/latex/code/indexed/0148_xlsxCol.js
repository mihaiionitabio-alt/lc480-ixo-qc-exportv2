function xlsxCol(n){let t="";n++;while(n>0){const m=(n-1)%26;t=String.fromCharCode(65+m)+t;n=Math.floor((n-1)/26);}return t;}
