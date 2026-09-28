"""SYNTHETIC instrument history, REAL-SCALE version (calibration_lc_realscale.json) for the documentation — every row is made up.
Templates: the rows of the synthetic runs (rows_loaded.json); trends, a service step, seasonality,
a reagent-lot change and operator differences are written in explicitly below."""
import json, random, math, copy, datetime as dt, sys
OUT=sys.argv[1] if len(sys.argv)>1 else 'DEMO_history_SYNTHETIC_realscale.json'
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
        hist.append({'key':f'demo-hist-{tag}-{i:04d}','run':f'DEMO_{tag}_HIST_{i+1:04d}','file':f'DEMO_{tag}_HIST_{i+1:04d}','platform':t['platform'],
                     'instrument':inst,'date':d,'operator':op,'software':t['software'],'firmware':t['firmware'],'block_cycles':m.get('block_cycles'),
                     'protocol':t['protocol'],'sop':t['sop'],'m':m,'synthetic':True})
SERVICE=ts((2025,5,12)); LOT=ts((2025,10,6))
CAL=json.load(open('calibration_lc_realscale.json'));Q=CAL['quant']
def qz(v,step): return round(v/step)*step if step else v
def g(mu,s): return random.gauss(mu,s)
def lc_model(cal,service=None):
    def model(m,d,op):
        y=years(d); s=summer(d); after=service is None or d>=service
        pm=cal['plate_mix']; u=random.random()
        f=random.uniform(*pm['low']) if u<pm['p_low'] else random.uniform(*pm['high']) if u<pm['p_low']+pm['p_high'] else 1.0
        # plate load: background, plateau and exposure move together (a real plate effect, not an instrument effect)
        m['bg_median']={c:g(L*f,S) for c,(L,S) in cal['bg_median'].items()}
        m['plateau_median']={c:g(L*(0.5+0.5*f),S) for c,(L,S) in cal['plateau_median'].items()}
        m['exposure']={c:int(qz(g(L*(1/f)**0.3,S),Q['exposure'])) for c,(L,S) in cal['exposure'].items()}
        m['lamp_ref']={c:int(qz(g(L,S)+(random.choice([-1,1])*random.uniform(150,350) if random.random()<0.03 else 0),Q['lamp_ref'])) for c,(L,S) in cal['lamp_ref'].items()}
        m['lamp_drift']={c:g(L,S) for c,(L,S) in cal['lamp_drift'].items()}
        L,S,top=cal['chan_switch']; m['chan_switch']=int(min(top,round(g(L,S))))
        L,S=cal['cycle_sd']; m['cycle_sd']=max(6,random.lognormvariate(math.log(L),S/L))
        h=cal['heat_rate']; m['heat_rate']=qz(g(h['after_service'] if after else h['before_service'],h['sigma'])-0.01*max(0,-s),Q['rate'])
        c=cal['cool_rate']; frac=min(1,max(0,y/2.2))
        m['cool_rate']=qz(g(c['start']+(c['end']-c['start'])*frac-c['summer']*s,c['sigma']),Q['rate'])
        L,S=cal['overshoot']; m['overshoot']=qz(g(L,S),Q['overshoot'])
        st=cal['settling']; base=st['after_service'] if after else st['before_service']
        m['settling']=round(base+(random.choice([-1,1])*Q['settling'] if random.random()<st['p_step'] else 0),3)
        ht=cal['hold_temp']; m['hold_temp']={'mean':g(ht['after_service'] if after else ht['before_service'],ht['sigma']),'sd':abs(g(ht['sd'],0.004)),'n':45}
        tr={}
        for k,(L,S,sea) in cal['transition'].items(): tr[k]=g(L+sea*s,S)
        m['transition']=tr
        L,S,p,(a,b)=cal['run_minutes']; L=L if L is not None else m.get('run_minutes',97.5)
        m['run_minutes']=g(L,S)+(random.uniform(a,b) if random.random()<p else 0)
        pc=cal['pc_cq']; m['pc_cq']={k+' | DEMO-CRM':g(L,S)+(0.45 if (k=='35S' and d>=LOT and service) else 0) for k,(L,S) in pc.items()}
        m['pc_batch']={k+' | DEMO-CRM':'extracted 2023-11-20' if d<LOT else 'extracted 2025-09-29' for k in pc}
        m['pc_amplitude']={k+' | DEMO-CRM':g(1500,120) for k in pc}
        L,S=cal['rep_sd']; m['rep_sd']=random.lognormvariate(math.log(L*(1.6 if op=='Analyst B' else 1)),S)
        L,S=cal['edit_delay']; m['edit_delay']=g(L,S)
        n=m.get('ntc_rate',{}).get('n',6) if isinstance(m.get('ntc_rate'),dict) else 6; p=0.07 if op=='Analyst C' else 0.008
        m['ntc_rate']={'bad':sum(random.random()<p for _ in range(n)),'n':n}
        n=12; m['action_rate']={'bad':sum(random.random()<0.03 for _ in range(n)),'n':n}
    return model
lc1=lc_model(CAL['LC-DEMO-01'],SERVICE)
lc2=lc_model(CAL['LC-DEMO-02'],None)
def qsa(m,d,op):
    y=years(d)
    m['led_current']=0.54+0.028*y+random.gauss(0,0.002)
    m['led_junction']=76+2.5*y+random.gauss(0,0.6)
    m['cover_down']=9.60+0.22*y+random.gauss(0,0.04)
    m['wheel_ms']=300+(14 if d>=ts((2025,9,1)) else 0)+random.gauss(0,2)
    m['block_cycles']=int(30000+8500*y); m['zone_spread']=0.35+0.03*y+abs(random.gauss(0,0.03))
    m['cmd_rt']=abs(random.gauss(20,1.5))
    if isinstance(m.get('ntc_rate'),dict):
        n=m['ntc_rate']['n']; p=0.06 if op=='Analyst C' else 0.01; m['ntc_rate']={'bad':sum(random.random()<p for _ in range(n)),'n':n}
def qsb(m,d,op):
    m['led_current']=0.55+random.gauss(0,0.002); m['cover_down']=10.3+random.gauss(0,0.05)
add('LC · LC-DEMO-01','LC1',(2024,1,8),(2026,2,25),150,lc1)
add('LC · LC-DEMO-02','LC2',(2025,1,13),(2026,4,24),55,lc2)
add('QS · QS-DEMO-A','QSA',(2024,3,4),(2026,3,27),90,qsa)
add('QS · QS-DEMO-B','QSB',(2025,6,2),(2026,5,29),30,qsb)
out={'schema':'qpcr-instrument-history/1','written':'2026-09-21T00:00:00Z','note':'SYNTHETIC demonstration history — all values are made up',
     'sop':{'name':'DEMO laboratory SOP (synthetic example)','version':'1.0','sha256':''},'rows':hist}
json.dump(out,open(OUT,'w'),ensure_ascii=False)
print(len(hist),'rows')
