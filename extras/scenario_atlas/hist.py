"""Synthetic year-of-runs statistics for the historical views S9-S16.

A generated calendar of runs over twelve months. Every number is produced here
from the parameters below; nothing comes from an instrument, a laboratory file
or a laboratory procedure.
"""
import numpy as np, datetime as dt
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.lines import Line2D
from matplotlib.patches import Patch

INK, TEAL, AMBER, PAPER = '#102f4d', '#0d8790', '#e7a12c', '#ffffff'
RED, PURPLE, BLUE = '#c0392b', '#8e44ad', '#1f5f8b'
MONO = ['DejaVu Sans Mono']
GREY = '#9aa7b1'

START = dt.date(2025, 10, 1)
NRUNS = 104                                    # two runs a week for a year
DATES = [START + dt.timedelta(days=int(round(i * 364 / NRUNS))) for i in range(NRUNS)]
ANALYSTS = ['analyst A', 'analyst B', 'analyst C', 'analyst D']

def mark(fig, x=0.085, y=0.982, size=1.15):
    fig.text(x, y, 'MISSY', family=MONO, fontsize=17 * size, color=INK, weight='bold',
             ha='left', va='top')
    fig.text(x, y - 0.030 * size, 'RUO', family=MONO, fontsize=10.5 * size, color=TEAL,
             ha='left', va='top', weight='bold')
    fig.text(x + 0.030 * size, y - 0.030 * size, 'NOT VALIDATED', family=MONO,
             fontsize=10.5 * size, color=AMBER, ha='left', va='top', weight='bold')
    fig.text(0.970, y, 'synthetic data', family=MONO, fontsize=12, color='#7f8c8d',
             ha='right', va='top')

def frame(title, w=12.0, h=7.5, dpi=200, rect=(0.085, 0.145, 0.885, 0.70)):
    fig = plt.figure(figsize=(w, h), dpi=dpi, facecolor=PAPER)
    ax = fig.add_axes(rect)
    ax.set_facecolor(PAPER)
    ax.grid(True, color='#e3e8ec', lw=0.8)
    for s in ('top', 'right'):
        ax.spines[s].set_visible(False)
    for s in ('left', 'bottom'):
        ax.spines[s].set_color('#b7c1c9')
    ax.tick_params(colors='#5d6d7a', labelsize=11)
    ax.set_title(title, fontsize=15, color=INK, family=MONO, pad=10, loc='left')
    mark(fig)
    return fig, ax

def legend(fig, handles, y=0.020):
    lg = fig.legend(handles=handles, loc='lower center', ncol=len(handles), frameon=False,
                    fontsize=11, bbox_to_anchor=(0.5, y))
    for t in lg.get_texts():
        t.set_color('#5d6d7a')

def datefmt(ax):
    ax.xaxis.set_major_locator(mdates.MonthLocator(interval=2))
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%b %Y'))
    for lb in ax.get_xticklabels():
        lb.set_rotation(0)

def bands(ax, centre, sd, lo=None, hi=None):
    ax.axhspan(centre - 2 * sd, centre + 2 * sd, color='#eef6f7', zorder=0)
    ax.axhline(centre, color=TEAL, lw=1.4, zorder=2)
    for k, st in ((2, (0, (5, 4))), (3, (0, (2, 3)))):
        for s in (+1, -1):
            ax.axhline(centre + s * k * sd, color='#8fa3b0', lw=1.0, ls=st, zorder=2)

def flag(ax, x, y, msk):
    ax.plot(np.asarray(x, dtype=object)[msk], np.asarray(y)[msk], 'o', ms=11,
            mfc='none', mec=RED, mew=2.0, zorder=6)

# ------------------------------------------------------------------ S9 ------
def s9(bad, out):
    rng = np.random.default_rng(9 + bad)
    centre, sd = 24.00, 0.14
    y = rng.normal(centre, sd, NRUNS)
    if bad:
        y[58:] += 0.42                                   # new calibrator lot, sustained shift
        y[58:] += np.linspace(0, 0.20, NRUNS - 58)       # and a slow drift on top
    fig, ax = frame(f"S9  calibrator crossing cycle, one year of runs  — {'abnormal' if bad else 'normal'}")
    bands(ax, centre, sd)
    ax.plot(DATES, y, '-', color='#c8d3da', lw=1.0, zorder=3)
    ax.plot(DATES, y, 'o', color=BLUE, ms=4.6, zorder=4)
    flag(ax, DATES, y, np.abs(y - centre) > 2 * sd)
    ax.set_ylim(centre - 5.2 * sd, centre + 6.8 * sd)
    ax.set_xlabel('Run date', fontsize=12, color=INK); ax.set_ylabel('Crossing cycle of the shared control', fontsize=12, color=INK)
    datefmt(ax)
    legend(fig, [Line2D([], [], color=BLUE, marker='o', ls='', label='run'),
                 Line2D([], [], color=TEAL, lw=1.4, label='year mean'),
                 Line2D([], [], color='#8fa3b0', lw=1.0, ls=(0, (5, 4)), label='2 SD'),
                 Line2D([], [], color='#8fa3b0', lw=1.0, ls=(0, (2, 3)), label='3 SD'),
                 Line2D([], [], color=RED, marker='o', ls='', mfc='none', mew=2, label='outside 2 SD')])
    fig.savefig(out, facecolor=PAPER); plt.close(fig)

# ------------------------------------------------------------------ S10 -----
def s10(bad, out):
    rng = np.random.default_rng(20 + bad)
    e = rng.normal(99.5, 2.1, NRUNS)
    if bad:
        e -= np.clip(np.linspace(-6, 14, NRUNS), 0, None)     # slow loss over the year
        e[70:] -= 3.0
    fig, ax = frame(f"S10  amplification efficiency per run  — {'abnormal' if bad else 'normal'}")
    ax.axhspan(90, 110, color='#eef6f7', zorder=0)
    ax.axhline(100, color=TEAL, lw=1.4, zorder=2)
    for v in (90, 110):
        ax.axhline(v, color='#8fa3b0', lw=1.0, ls=(0, (5, 4)), zorder=2)
    k = 7
    roll = np.convolve(e, np.ones(k) / k, mode='same')
    roll[:k] = np.nan; roll[-k:] = np.nan
    ax.plot(DATES, e, 'o', color=BLUE, ms=4.6, zorder=4)
    ax.plot(DATES, roll, '-', color=AMBER, lw=2.2, zorder=5)
    flag(ax, DATES, e, (e < 90) | (e > 110))
    ax.set_ylim(70, 118)
    ax.set_xlabel('Run date', fontsize=12, color=INK); ax.set_ylabel('Efficiency from the calibration line (%)', fontsize=12, color=INK)
    datefmt(ax)
    legend(fig, [Line2D([], [], color=BLUE, marker='o', ls='', label='run'),
                 Line2D([], [], color=AMBER, lw=2.2, label='seven-run rolling mean'),
                 Patch(facecolor='#eef6f7', label='acceptance band 90-110 %'),
                 Line2D([], [], color=RED, marker='o', ls='', mfc='none', mew=2, label='outside the band')])
    fig.savefig(out, facecolor=PAPER); plt.close(fig)

# ------------------------------------------------------------------ S11 -----
def s11(bad, out):
    rng = np.random.default_rng(31 + bad)
    months = [START.replace(day=1) + dt.timedelta(days=31 * i) for i in range(12)]
    months = [dt.date(m.year, m.month, 1) for m in months]
    n = rng.integers(60, 90, 12)
    p = np.full(12, 0.008)
    if bad:
        p = np.array([.006,.008,.005,.010,.007,.009,.031,.068,.112,.147,.089,.034])
    k = rng.binomial(n, p)
    rate = 100.0 * k / n
    base = slice(0, 6)                               # limits from the first half year
    pbar = 100.0 * k[base].sum() / n[base].sum()
    ucl = pbar + 3 * np.sqrt(max(pbar, 0.4) * (100 - pbar) / n.mean())
    fig, ax = frame(f"S11  negative controls with signal, by month  — {'abnormal' if bad else 'normal'}")
    ax.bar([m for m in months], rate, width=20,
           color=[RED if r > ucl else TEAL for r in rate], zorder=3)
    ax.axhline(pbar, color=INK, lw=1.4, zorder=4)
    ax.axhline(ucl, color=RED, lw=1.2, ls=(0, (5, 4)), zorder=4)
    for m, r, kk, nn in zip(months, rate, k, n):
        ax.text(m, r + 0.35, f'{kk}/{nn}', ha='center', va='bottom', fontsize=9,
                color='#5d6d7a', family=MONO)
    ax.set_ylim(0, max(4.0, rate.max() * 1.30))
    ax.set_xlabel('Month', fontsize=12, color=INK); ax.set_ylabel('Negative controls with signal (%)', fontsize=12, color=INK)
    datefmt(ax)
    legend(fig, [Patch(facecolor=TEAL, label='within the limit'),
                 Patch(facecolor=RED, label='above the limit'),
                 Line2D([], [], color=INK, lw=1.4, label='baseline rate, first six months'),
                 Line2D([], [], color=RED, lw=1.2, ls=(0, (5, 4)), label='upper control limit')])
    fig.savefig(out, facecolor=PAPER); plt.close(fig)

# ------------------------------------------------------------------ S12 -----
def s12(bad, out):
    rng = np.random.default_rng(42 + bad)
    sd = np.abs(rng.normal(0.11, 0.035, NRUNS))
    if bad:
        sd += np.clip(np.linspace(-0.05, 0.30, NRUNS), 0, None)
        sd[np.array([63, 71, 84, 92, 99])] += 0.22
    lim = 0.30
    fig, ax = frame(f"S12  spread between replicates, run by run  — {'abnormal' if bad else 'normal'}")
    ax.axhspan(0, lim, color='#eef6f7', zorder=0)
    ax.axhline(lim, color='#8fa3b0', lw=1.0, ls=(0, (5, 4)), zorder=2)
    ax.vlines(DATES, 0, sd, color='#ccd6dd', lw=1.0, zorder=3)
    ax.plot(DATES, sd, 'o', color=BLUE, ms=4.6, zorder=4)
    flag(ax, DATES, sd, sd > lim)
    ax.set_ylim(0, max(0.45, sd.max() * 1.15))
    ax.set_xlabel('Run date', fontsize=12, color=INK); ax.set_ylabel('Standard deviation within replicates (cycles)', fontsize=12, color=INK)
    datefmt(ax)
    legend(fig, [Line2D([], [], color=BLUE, marker='o', ls='', label='run'),
                 Patch(facecolor='#eef6f7', label='acceptable spread'),
                 Line2D([], [], color=RED, marker='o', ls='', mfc='none', mew=2, label='above the limit')])
    fig.savefig(out, facecolor=PAPER); plt.close(fig)

# ------------------------------------------------------------------ S13 -----
def s13(bad, out):
    rng = np.random.default_rng(53 + bad)
    off = [0.0, 0.03, -0.02, 0.01] if not bad else [0.0, 0.02, -0.01, 0.84]
    spread = [0.13, 0.14, 0.12, 0.13] if not bad else [0.13, 0.14, 0.12, 0.29]
    data = [rng.normal(24.0 + o, s, 26) for o, s in zip(off, spread)]
    fig, ax = frame(f"S13  the same control, by analyst  — {'abnormal' if bad else 'normal'}")
    bp = ax.boxplot(data, patch_artist=True, widths=0.55, medianprops=dict(color=INK, lw=2),
                    flierprops=dict(marker='o', ms=4, mfc=RED, mec='none'))
    for i, b in enumerate(bp['boxes']):
        b.set(facecolor='#e8f3f4' if not (bad and i == 3) else '#f6ecf7',
              edgecolor=TEAL if not (bad and i == 3) else PURPLE, lw=1.6)
    for i, d in enumerate(data):
        ax.plot(rng.normal(i + 1, 0.055, len(d)), d, 'o', ms=3.4,
                color=BLUE if not (bad and i == 3) else PURPLE, alpha=.55, zorder=5)
    ax.axhline(np.mean(np.concatenate(data[:3])), color=TEAL, lw=1.3, ls=(0, (5, 4)), zorder=2)
    ax.set_xticks(range(1, 5)); ax.set_xticklabels(ANALYSTS)
    ax.set_xlabel('', fontsize=12); ax.set_ylabel('Crossing cycle of the shared control', fontsize=12, color=INK)
    legend(fig, [Line2D([], [], color=BLUE, marker='o', ls='', label='one run'),
                 Line2D([], [], color=TEAL, lw=1.3, ls=(0, (5, 4)), label='mean of the other analysts'),
                 Patch(facecolor='#f6ecf7', edgecolor=PURPLE, label='group that differs')])
    fig.savefig(out, facecolor=PAPER); plt.close(fig)

# ------------------------------------------------------------------ S14 -----
def s14(bad, out):
    rng = np.random.default_rng(64 + bad)
    g = rng.normal(0, 0.06, (8, 12))
    if bad:
        r, c = np.mgrid[0:8, 0:12]
        edge = ((r == 0) | (r == 7) | (c == 0) | (c == 11)).astype(float)
        g += edge * 0.58
        g[:, 11] += 0.30
    fig = plt.figure(figsize=(12.0, 7.5), dpi=200, facecolor=PAPER)
    ax = fig.add_axes([0.085, 0.165, 0.80, 0.665])
    v = max(0.35, np.abs(g).max())
    im = ax.imshow(g, cmap='RdBu_r', vmin=-v, vmax=v, aspect='auto')
    ax.set_xticks(range(12)); ax.set_xticklabels(range(1, 13))
    ax.set_yticks(range(8)); ax.set_yticklabels(list('ABCDEFGH'))
    ax.set_xlabel('Plate column', fontsize=12, color=INK)
    ax.set_ylabel('Plate row', fontsize=12, color=INK)
    ax.tick_params(colors='#5d6d7a', labelsize=11)
    ax.set_title(f"S14  mean deviation by well position, one year of runs  — {'abnormal' if bad else 'normal'}",
                 fontsize=15, color=INK, family=MONO, pad=10, loc='left')
    cb = fig.colorbar(im, ax=ax, fraction=0.045, pad=0.02)
    cb.set_label('Deviation from the plate mean (cycles)', fontsize=11, color=INK)
    cb.ax.tick_params(colors='#5d6d7a', labelsize=10)
    mark(fig)
    fig.text(0.5, 0.045, 'red: crosses later than the plate mean   ·   blue: crosses earlier',
             ha='center', fontsize=11, color='#5d6d7a')
    fig.savefig(out, facecolor=PAPER); plt.close(fig)

# ------------------------------------------------------------------ S15 -----
def s15(bad, out):
    rng = np.random.default_rng(75 + bad)
    logq = np.array([6, 5, 4, 3, 2], dtype=float)
    fig, ax = frame(f"S15  every calibration line of the year, overlaid  — {'abnormal' if bad else 'normal'}",
                    rect=(0.085, 0.145, 0.695, 0.70))
    cmap = plt.get_cmap('viridis')
    for m in range(12):
        slope = -3.32 + (rng.normal(0, 0.04) if not bad else rng.normal(0, 0.28) - 0.02 * m)
        icept = 40.0 + (rng.normal(0, 0.10) if not bad else rng.normal(0, 0.55) + 0.12 * m)
        y = icept + slope * logq + rng.normal(0, 0.05, len(logq))
        ax.plot(logq, y, '-o', color=cmap(m / 11.0), lw=1.7, ms=4.6, alpha=.92, zorder=3)
    ax.invert_xaxis()
    ax.set_xlabel('Log of the assigned amount', fontsize=12, color=INK)
    ax.set_ylabel('Crossing cycle', fontsize=12, color=INK)
    sm = plt.cm.ScalarMappable(cmap=cmap, norm=plt.Normalize(0, 11))
    cax = fig.add_axes([0.815, 0.145, 0.016, 0.70])
    cb = fig.colorbar(sm, cax=cax, ticks=[0, 5, 11])
    cb.ax.set_yticklabels(['month 1', 'month 6', 'month 12'], fontsize=10, color='#5d6d7a')
    fig.savefig(out, facecolor=PAPER); plt.close(fig)

# ------------------------------------------------------------------ S16 -----
def s16(bad, out):
    rng = np.random.default_rng(86 + bad)
    n = 2400
    if not bad:
        d = rng.integers(0, 10, n)
    else:
        p = np.array([.26, .03, .05, .04, .05, .23, .05, .04, .05, .20])
        d = rng.choice(np.arange(10), size=n, p=p / p.sum())
    cnt = np.bincount(d, minlength=10) * 100.0 / n
    fig, ax = frame(f"S16  last reported decimal of the crossing cycle  — {'abnormal' if bad else 'normal'}")
    ax.bar(range(10), cnt, width=0.66,
           color=[RED if c > 14 else TEAL for c in cnt], zorder=3)
    ax.axhline(10.0, color=INK, lw=1.4, ls=(0, (5, 4)), zorder=4)
    for i, c in enumerate(cnt):
        ax.text(i, c + 0.4, f'{c:.1f}', ha='center', va='bottom', fontsize=10,
                color='#5d6d7a', family=MONO)
    ax.set_xticks(range(10))
    ax.set_ylim(0, max(16.0, cnt.max() * 1.20))
    ax.set_xlabel('Last decimal digit as reported', fontsize=12, color=INK)
    ax.set_ylabel('Share of all reported values (%)', fontsize=12, color=INK)
    legend(fig, [Patch(facecolor=TEAL, label='as expected'),
                 Patch(facecolor=RED, label='far above expectation'),
                 Line2D([], [], color=INK, lw=1.4, ls=(0, (5, 4)), label='even spread, 10 % each')])
    fig.savefig(out, facecolor=PAPER); plt.close(fig)

VIEWS = {'S9': s9, 'S10': s10, 'S11': s11, 'S12': s12,
         'S13': s13, 'S14': s14, 'S15': s15, 'S16': s16}

HIST_CAPTIONS = {
 'S9': ('Calibrator shift between lots',
        'Levey-Jennings chart of the shared control across a year of runs. In the normal '
        'year the points wander inside two standard deviations with no run of points on '
        'one side. In the abnormal year a new calibrator lot lifts the control by about '
        'four tenths of a cycle from one run onward and a slow drift builds on top: every '
        'result after that date is biased, although no single run looks wrong on its own.'),
 'S10': ('Efficiency falling over the year',
        'Amplification efficiency taken from each run’s calibration line. Normal stays '
        'inside the acceptance band with no direction. Abnormal leaves the band around the '
        'middle of the year and keeps falling, the pattern left by reagent or probe storage '
        'and by a master mix kept too long, and it is visible only when runs are put side by side.'),
 'S11': ('Contamination episode',
        'Share of negative controls that produced a signal, by month, against the limit '
        'computed from the year. Normal sits below one per cent. Abnormal rises over three '
        'months to about fifteen per cent and then falls back after the cause is removed — '
        'the arc of a contamination episode rather than an isolated accident.'),
 'S12': ('Repeatability getting worse',
        'Spread between replicates in each run. Normal is steady and inside the limit. '
        'Abnormal widens gradually and then produces single runs far outside it: pipette '
        'calibration going out, a worn tip cone, or a change in who prepares the plate.'),
 'S13': ('One analyst apart from the others',
        'The same control, grouped by the person who ran it. Normal shows four groups that '
        'overlap. Abnormal shows three that agree and one displaced by about eight tenths of '
        'a cycle with a wider spread: a difference in technique or in how the mix is made up, '
        'not a difference in the samples.'),
 'S14': ('Position effect on the plate',
        'Average deviation of each well position from its plate mean, over the whole year. '
        'Normal is featureless, as it should be. Abnormal shows the outer ring and the last '
        'column crossing later, the signature of evaporation or of uneven contact with the '
        'block, and it explains results that seem to depend on where the sample was put.'),
 'S15': ('Calibration lines that no longer agree',
        'Every calibration line of the year on one pair of axes, coloured from the first '
        'month to the last. Normal is a tight pencil of parallel lines. Abnormal fans out: '
        'slope and intercept both wander, so a quantity calculated in one month is not '
        'comparable with the same quantity calculated in another.'),
 'S16': ('Digits that were not measured',
        'How often each last decimal appears in the reported crossing cycles. Normal is flat '
        'at about a tenth each. Abnormal piles up on 0, 5 and 9, which is what hand '
        'transcription and rounding leave behind. It says nothing about the chemistry and '
        'everything about how the numbers reached the record.'),
}
