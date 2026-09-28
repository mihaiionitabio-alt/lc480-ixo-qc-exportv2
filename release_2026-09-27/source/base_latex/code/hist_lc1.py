def lc1(m,d,op):
    y=years(d); after=d>=SERVICE; s=summer(d)
    m['cool_rate']=2.52-0.07*y-0.02*s+random.gauss(0,0.012)
    m['heat_rate']=(4.80 if after else 4.90)-0.03*max(0,-s)+random.gauss(0,0.015)
    m['settling']=(5.74 if after else 6.15)+random.choice([0,0,0,0.41,-0.41])*(random.random()<0.08)
    m['overshoot']=(6.5 if after else 6.8)+random.gauss(0,0.05)
    m['hold_temp']={'mean':(-0.37 if after else -0.50)+random.gauss(0,0.01),'sd':abs(random.gauss(0.03,0.004)),'n':45}
    tr=m.get('transition',{})
    if '95→60 °C' in tr: tr['95→60 °C']=14.5+0.18*s+random.gauss(0,0.03)
    if '72→95 °C' in tr: tr['72→95 °C']=5.74+0.10*max(0,-s)+random.gauss(0,0.03)
    if '60→72 °C' in tr: tr['60→72 °C']=2.30+random.gauss(0,0.01)
    if isinstance(m.get('pc_cq'),dict):
        for k in m['pc_cq']: m['pc_cq'][k]=m['pc_cq'][k]+(0.45 if (d>=LOT and k=='35S') else 0)+random.gauss(0,0.12)
    if isinstance(m.get('ntc_rate'),dict):
        n=m['ntc_rate']['n']; p=0.07 if op=='Analyst C' else 0.008
        m['ntc_rate']={'bad':sum(random.random()<p for _ in range(n)),'n':n}
    if 'rep_sd' in m: m['rep_sd']=abs(random.gauss(0.26 if op=='Analyst B' else 0.14,0.04))
    if isinstance(m.get('exposure'),dict): m['exposure']={k:round(v*(1+0.05*y)) for k,v in m['exposure'].items()}
    m['edit_delay']=math.log10(max(0.02,random.lognormvariate(0,1.1)))