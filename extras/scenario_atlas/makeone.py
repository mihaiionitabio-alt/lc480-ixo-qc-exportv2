import os, sys, shutil
sys.path.insert(0, '/home/claude/gif')
from multiprocessing import Pool
import scen, render
from scen import NCYC

S = {s['code']: s for s in scen.scenarios()}
CODES = ['S1','S2','S3','S4','S5','S6','S7','S8']
NF = 150                                  # 150 x 100 ms = 15.000 s per build
ROOT = '/home/claude/gif/seq'

def job(t):
    code, i = t
    pos = 1.0 + (NCYC - 1) * i / (NF - 1)
    if i == NF - 1:
        pos = NCYC + 0.999
    render.frame_one(S[code], pos, f'{ROOT}/{code}/f{i:03d}.png')
    return 1

if __name__ == '__main__':
    shutil.rmtree(ROOT, ignore_errors=True)
    for c in CODES:
        os.makedirs(f'{ROOT}/{c}', exist_ok=True)
    tasks = [(c, i) for c in CODES for i in range(NF)]
    with Pool(8) as p:
        for _ in p.imap_unordered(job, tasks, chunksize=4):
            pass
    print('frames', sum(len(os.listdir(f'{ROOT}/{c}')) for c in CODES))
