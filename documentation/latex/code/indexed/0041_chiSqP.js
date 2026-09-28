function chiSqP(chi,df){if(!Number.isFinite(chi)||chi<0)return NaN;return 1-gammap(df/2,chi/2);}
