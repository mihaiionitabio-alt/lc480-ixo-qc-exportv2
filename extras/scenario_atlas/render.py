import os, sys
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scen
from scen import CYC, NCYC, THRESHOLD, COL

MONO = ['DejaVu Sans Mono']
SANS = ['DejaVu Sans']
INK, TEAL, AMBER, PAPER = '#102f4d', '#0d8790', '#e7a12c', '#ffffff'

def partial(y, pos):
    """Curve truncated at fractional cycle position pos, with an interpolated tip."""
    n = int(np.floor(pos))
    if n < 1:
        return np.array([]), np.array([])
    xs = CYC[:n]; ys = y[:n]
    frac = pos - n
    if 0 < frac and n < NCYC:
        xt = n + frac
        yt = y[n - 1] + frac * (y[n] - y[n - 1])
        xs = np.append(xs, xt); ys = np.append(ys, yt)
    return xs, ys

def draw_panel(ax, wells, pos, title, ymax):
    ax.set_facecolor(PAPER)
    ax.axhline(THRESHOLD, color='#7f8c8d', lw=1.1, ls=(0, (5, 4)), zorder=2)
    for w in wells:
        xs, ys = partial(w['y'], pos)
        if len(xs) < 2:
            continue
        c = COL[w['role']]
        lw = 1.9 if w['role'] in ('ntc', 'bad', 'pos') else 1.6
        ax.plot(xs, ys, color=c, lw=lw, solid_capstyle='round', zorder=4)
        ax.plot(xs[-1:], ys[-1:], 'o', color=c, ms=3.4, zorder=5)
    ax.set_xlim(1, NCYC); ax.set_ylim(-0.09, ymax)
    ax.set_xticks([1, 5, 10, 15, 20, 25, 30, 35, 40, 45])
    ax.grid(True, color='#e3e8ec', lw=0.8)
    for s in ('top', 'right'):
        ax.spines[s].set_visible(False)
    for s in ('left', 'bottom'):
        ax.spines[s].set_color('#b7c1c9')
    ax.tick_params(colors='#5d6d7a', labelsize=11)
    ax.set_xlabel('Cycle', fontsize=12, color=INK, family=SANS)
    ax.set_ylabel('Normalised fluorescence', fontsize=12, color=INK, family=SANS)
    ax.set_title(title, fontsize=14, color=INK, family=MONO, pad=9, loc='left')

def missy_mark(fig, x, y, size=1.0):
    fig.text(x, y, 'MISSY', family=MONO, fontsize=17 * size, color=INK,
             weight='bold', ha='left', va='top')
    fig.text(x, y - 0.026 * size, 'RUO', family=MONO, fontsize=10.5 * size,
             color=TEAL, ha='left', va='top', weight='bold')
    fig.text(x + 0.030 * size, y - 0.026 * size, 'NOT VALIDATED', family=MONO,
             fontsize=10.5 * size, color=AMBER, ha='left', va='top', weight='bold')

def legend(fig, roles, y=0.028):
    names = {'unk': 'sample', 'unk2': 'sample, second target', 'std': 'calibrator level',
             'pos': 'positive control', 'ntc': 'negative control',
             'bad': 'flagged trace', 'dim': 'reference'}
    seen, handles = [], []
    for r in roles:
        if r in seen:
            continue
        seen.append(r)
        handles.append(Line2D([], [], color=COL[r], lw=2.4, label=names[r]))
    handles.append(Line2D([], [], color='#7f8c8d', lw=1.1, ls=(0, (5, 4)), label='threshold'))
    lg = fig.legend(handles=handles, loc='lower center', ncol=len(handles), frameon=False,
                    fontsize=11, bbox_to_anchor=(0.5, y))
    for t in lg.get_texts():
        t.set_color('#5d6d7a')

def ymax_for(*groups):
    m = 0.0
    for g in groups:
        for w in g:
            m = max(m, float(np.max(w['y'])))
    return max(1.15, m * 1.10)

# ------------------------------------------------------------------ frames ---
def frame(pathA, pathB, sa, sb, pos, out, w_in=16.0, h_in=9.0, dpi=120):
    fig = plt.figure(figsize=(w_in, h_in), dpi=dpi, facecolor=PAPER)
    ym1 = ymax_for(sa['normal'], sa['abnormal'])
    ym2 = ymax_for(sb['normal'], sb['abnormal'])
    axes = [fig.add_axes([0.075 + c * 0.475, 0.575 - r * 0.455, 0.385, 0.315])
            for r in (0, 1) for c in (0, 1)]
    draw_panel(axes[0], sa['normal'],   pos, f"{sa['code']}  normal",   ym1)
    draw_panel(axes[1], sa['abnormal'], pos, f"{sa['code']}  abnormal", ym1)
    draw_panel(axes[2], sb['normal'],   pos, f"{sb['code']}  normal",   ym2)
    draw_panel(axes[3], sb['abnormal'], pos, f"{sb['code']}  abnormal", ym2)
    missy_mark(fig, 0.070, 0.975)
    fig.text(0.985, 0.975, f"cycle {int(np.floor(pos)):>2d} / {NCYC}", family=MONO,
             fontsize=15, color=INK, ha='right', va='top')
    fig.text(0.985, 0.947, 'synthetic data', family=MONO, fontsize=10.5,
             color='#7f8c8d', ha='right', va='top')
    roles = [w['role'] for g in (sa['normal'], sa['abnormal'], sb['normal'], sb['abnormal'])
             for w in g]
    legend(fig, roles)
    fig.savefig(out, facecolor=PAPER)
    plt.close(fig)

# ------------------------------------------------------------------- still ---
def still(s, key, out, w_in=12.0, h_in=7.5, dpi=200):
    fig = plt.figure(figsize=(w_in, h_in), dpi=dpi, facecolor=PAPER)
    ym = ymax_for(s['normal'], s['abnormal'])
    ax = fig.add_axes([0.085, 0.145, 0.885, 0.70])
    draw_panel(ax, s[key], NCYC + 1, f"{s['code']}  {key}", ym)
    missy_mark(fig, 0.085, 0.982, size=1.15)
    fig.text(0.970, 0.982, 'synthetic data', family=MONO, fontsize=12,
             color='#7f8c8d', ha='right', va='top')
    legend(fig, [w['role'] for w in s[key]], y=0.018)
    fig.savefig(out, facecolor=PAPER)
    plt.close(fig)

# --------------------------------------------------- single-scenario frame ---
def frame_one(s, pos, out, w_in=16.0, h_in=9.0, dpi=120):
    """One scenario, two large panels: normal on the left, abnormal on the right."""
    fig = plt.figure(figsize=(w_in, h_in), dpi=dpi, facecolor=PAPER)
    ym = ymax_for(s['normal'], s['abnormal'])
    axL = fig.add_axes([0.070, 0.175, 0.405, 0.665])
    axR = fig.add_axes([0.565, 0.175, 0.405, 0.665])
    draw_panel(axL, s['normal'],   pos, f"{s['code']}  normal",   ym)
    draw_panel(axR, s['abnormal'], pos, f"{s['code']}  abnormal", ym)
    for ax in (axL, axR):
        ax.tick_params(labelsize=13)
        ax.xaxis.label.set_size(14); ax.yaxis.label.set_size(14)
        ax.title.set_size(19)
    missy_mark(fig, 0.070, 0.975, size=1.2)
    fig.text(0.970, 0.975, f"cycle {int(np.floor(pos)):>2d} / {NCYC}", family=MONO,
             fontsize=18, color=INK, ha='right', va='top')
    fig.text(0.970, 0.941, 'synthetic data', family=MONO, fontsize=12.5,
             color='#7f8c8d', ha='right', va='top')
    roles = [w['role'] for g in (s['normal'], s['abnormal']) for w in g]
    legend(fig, roles, y=0.030)
    fig.savefig(out, facecolor=PAPER)
    plt.close(fig)
