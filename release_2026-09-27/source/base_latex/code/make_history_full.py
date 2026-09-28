"""SYNTHETIC instrument history for the documentation — every row is made up.
Templates: the rows of the synthetic runs (rows_loaded.json); trends, a service step, seasonality,
a reagent-lot change and operator differences are written in explicitly below."""
import json, random, math, copy, datetime as dt
random.seed(42)
rows=json.load(open('rows_loaded.json'))
by={}
for r in rows: by.setdefault(r['instrument'],[]).append(r)
def ts(d): return int(dt.datetime(*d, tzinfo=dt.timezone.utc).timestamp()*1000)
def years(ms): return (ms-ts((2024,1,1)))/(365.25*864e5)
def summer(ms):
    doy=dt.datetime.fromtimestamp(ms/1000,dt.timezone.utc).timetuple().tm_yday
    return math.sin(2*math.pi*(doy-110)/365.25)          # +1 mid-July, −1 mid-January
def jit(v,rel=0.01):
    if isinstance(v,bool) or v is None: return v
    if isinstance(v,(int,float)): return v*(1+random.gauss(0,rel)) if v else v
    if isinstance(v,dict):
        if set(v)=={'bad','n'}: n=v['n']; p=max(0.002,v['bad']/n if n else 0); return {'bad':sum(random.random()<p for _ in range(n)),'n':n}
        if set(v)=={'count'}: lam=max(0.2,v['count']); return {'count':max(0,round(random.gauss(lam,math.sqrt(lam))))}
        return {k:jit(x,rel) for k,x in v.items()}
    return v
def dates(start,end,n):
    a,b=ts(start),ts(end); out=sorted(a+random.random()*(b-a) for _ in range(n))
    return [int(x-(x%864e5)+8.5*3600e3+random.randint(0,6)*3600e3) for x in out]
ops=['Analyst A','Analyst B','Analyst C']
hist=[]
def add(inst,tag,start,end,n,model):
    tpl=by[inst]
    for i,d in enumerate(dates(start,end,n)):
        t=random.choice(tpl); m=jit(copy.deepcopy(t['m'])); op=random.choice(ops)
        model(m,d,op)
        m.pop("pc_cq",None); m.pop("pc_amplitude",None)
        hist.append({'key':f'demo-hist-{tag}-{i:04d}','run':f'DEMO_{tag}_HIST_{i+1:04d}','file':f'DEMO_{tag}_HIST_{i+1:04d}','platform':t['platform'],
                     'instrument':inst,'date':d,'operator':op,'software':t['software'],'firmware':t['firmware'],'block_cycles':m.get('block_cycles'),
                     'protocol':t['protocol'],'sop':t['sop'],'m':m,'synthetic':True})
SERVICE=ts((2025,5,12)); LOT=ts((2025,10,6))
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
        for k in m['pc_cq']: m['pc_cq'][k]=m['pc_cq'][k]+(0.45 if (d>=LOT and k.startswith('35S |')) else 0)+random.gauss(0,0.12)
    if isinstance(m.get('ntc_rate'),dict):
        p=0.07 if op=='Analyst C' else 0.008
        for stage,v in m['ntc_rate'].items():
            n=v['n']; m['ntc_rate'][stage]={'bad':sum(random.random()<p for _ in range(n)),'n':n}
    if 'rep_sd' in m: m['rep_sd']=abs(random.gauss(0.26 if op=='Analyst B' else 0.14,0.04))
    if isinstance(m.get('exposure'),dict): m['exposure']={k:round(v*(1+0.05*y)) for k,v in m['exposure'].items()}
    m['edit_delay']=math.log10(max(0.02,random.lognormvariate(0,1.1)))
def lc2(m,d,op):
    m['cool_rate']=2.45+random.gauss(0,0.012); m['heat_rate']=4.76+random.gauss(0,0.015)
    m['edit_delay']=math.log10(max(0.02,random.lognormvariate(0,1)))
def qsa(m,d,op):
    y=years(d)
    m['led_current']=0.54+0.028*y+random.gauss(0,0.002)
    m['led_junction']=76+2.5*y+random.gauss(0,0.6)
    m['cover_down']=9.60+0.22*y+random.gauss(0,0.04)
    m['wheel_ms']=300+(14 if d>=ts((2025,9,1)) else 0)+random.gauss(0,2)
    m['block_cycles']=int(30000+8500*y); m['zone_spread']=0.35+0.03*y+abs(random.gauss(0,0.03))
    m['cmd_rt']=abs(random.gauss(20,1.5))
    if isinstance(m.get('ntc_rate'),dict):
        p=0.06 if op=='Analyst C' else 0.01
        for stage,v in m['ntc_rate'].items():
            n=v['n']; m['ntc_rate'][stage]={'bad':sum(random.random()<p for _ in range(n)),'n':n}
def qsb(m,d,op):
    m['led_current']=0.55+random.gauss(0,0.002); m['cover_down']=10.3+random.gauss(0,0.05)
add('LC · LC-DEMO-01','LC1',(2024,1,8),(2026,2,25),150,lc1)
add('LC · LC-DEMO-02','LC2',(2025,1,13),(2026,4,24),55,lc2)
add('QS · QS-DEMO-A','QSA',(2024,3,4),(2026,3,27),90,qsa)
add('QS · QS-DEMO-B','QSB',(2025,6,2),(2026,5,29),30,qsb)
out={'schema':'qpcr-instrument-history/1','written':'2026-09-21T00:00:00Z','note':'SYNTHETIC demonstration history — all values are made up',
     'sop':{'name':'DEMO laboratory SOP (synthetic example)','version':'1.0','sha256':''},'rows':hist}
json.dump(out,open('DEMO_history_SYNTHETIC.json','w'),ensure_ascii=False)
print(len(hist),'rows')
