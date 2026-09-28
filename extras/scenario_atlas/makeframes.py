import os, sys
sys.path.insert(0, '/home/claude/gif')
from multiprocessing import Pool
import scen, render
from scen import NCYC

S = {s['code']: s for s in scen.scenarios()}
SEGMENTS = [('S1','S2'), ('S3','S4'), ('S5','S6'), ('S7','S8')]
FPS_FRAMES = 150                     # frames per 15 s segment  (150 x 100 ms)
OUT = '/home/claude/gif/frames'

def job(t):
    seg, i = t
    a, b = SEGMENTS[seg]
    pos = 1.0 + (NCYC - 1) * i / (FPS_FRAMES - 1)
    if i == FPS_FRAMES - 1:
        pos = NCYC + 0.999
    render.frame(None, None, S[a], S[b], pos,
                 os.path.join(OUT, f'f{seg*FPS_FRAMES + i:04d}.png'))
    return 1

if __name__ == '__main__':
    tasks = [(s, i) for s in range(len(SEGMENTS)) for i in range(FPS_FRAMES)]
    with Pool(8) as p:
        for _ in p.imap_unordered(job, tasks, chunksize=4):
            pass
    print('frames', len(os.listdir(OUT)))
