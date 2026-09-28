"""Synthetic qPCR scenario generator for the Missy scenario animation.

Every value here is computed from the parameters below. No measured value and no
identifier from any laboratory file or procedure is used.
"""
import numpy as np

NCYC = 45
CYC = np.arange(1, NCYC + 1, dtype=float)
THRESHOLD = 0.20

def sig(c, mid, plateau, k=1.15, base=0.015, drift=0.0, noise=0.0035, rng=None,
        dip=None, gain=None):
    y = base + drift * (c - 1) + plateau / (1.0 + np.exp(-(c - mid) / k))
    if rng is not None:
        y = y + rng.normal(0.0, noise, size=c.shape)
    if dip is not None:                      # optical drop-out over a cycle window
        a, b, d = dip
        m = (c >= a) & (c <= b)
        y = y.copy(); y[m] -= d
    if gain is not None:                     # abrupt detector gain change
        a, f = gain
        y = y.copy(); y[c >= a] *= f
    return y

def crossing(y, thr=THRESHOLD):
    """Fractional cycle where the curve first crosses the threshold."""
    for i in range(1, len(y)):
        if y[i - 1] < thr <= y[i]:
            f = (thr - y[i - 1]) / (y[i] - y[i - 1])
            return CYC[i - 1] + f
    return None

# colour roles
COL = {
    'unk':  '#1f5f8b',
    'unk2': '#3b8ea5',
    'std':  '#0d8790',
    'ntc':  '#c0392b',
    'pos':  '#e7a12c',
    'bad':  '#8e44ad',
    'dim':  '#9aa7b1',
}

def W(label, mid, plateau, role, **kw):
    return dict(label=label, mid=mid, plateau=plateau, role=role, kw=kw)

def build(seed, wells):
    rng = np.random.default_rng(seed)
    out = []
    for w in wells:
        y = sig(CYC, w['mid'], w['plateau'], rng=rng, **w['kw'])
        out.append(dict(label=w['label'], role=w['role'], y=y, cq=crossing(y)))
    return out

def triplicate(base_mid, plateau, spread, role, tag, rng_offsets):
    return [W(f'{tag}{i+1}', base_mid + o, plateau, role) for i, o in enumerate(rng_offsets)]

# ---------------------------------------------------------------- scenarios ---
def scenarios():
    S = []

    # S1 technical fault: detector gain step + one dead well
    S.append(dict(
        code='S1',
        normal=build(101, [
            *[W(f'U{i}', 24.0 + d, 0.92, 'unk') for i, d in enumerate((0.0, 0.12, -0.09))],
            *[W(f'V{i}', 27.6 + d, 0.90, 'unk2') for i, d in enumerate((0.0, -0.11, 0.14))],
            W('N1', 99, 0.0, 'ntc'), W('N2', 99, 0.0, 'ntc'),
        ]),
        abnormal=build(102, [
            *[W(f'U{i}', 24.0 + d, 0.92, 'unk', gain=(29, 1.55)) for i, d in enumerate((0.0, 0.12, -0.09))],
            W('V1', 27.6, 0.90, 'unk2', gain=(29, 1.55)),
            W('V2', 27.5, 0.90, 'bad', dip=(18, 21, -0.35), gain=(29, 1.55)),
            W('V3', 99, 0.0, 'bad', base=-0.038, noise=0.0018),   # dead well
            W('N1', 99, 0.0, 'ntc', gain=(29, 1.55)), W('N2', 99, 0.0, 'ntc', gain=(29, 1.55)),
        ])))

    # S2 human mistake: one replicate of each triplicate mispipetted
    S.append(dict(
        code='S2',
        normal=build(201, [
            *[W(f'U{i}', 23.4 + d, 0.94, 'unk') for i, d in enumerate((0.0, 0.10, -0.13))],
            *[W(f'V{i}', 26.9 + d, 0.93, 'unk2') for i, d in enumerate((0.0, -0.08, 0.11))],
            W('N1', 99, 0.0, 'ntc'),
        ]),
        abnormal=build(202, [
            W('U1', 23.4, 0.94, 'unk'), W('U2', 23.5, 0.94, 'unk'),
            W('U3', 26.1, 0.55, 'bad'),                     # short volume
            W('V1', 26.9, 0.93, 'unk2'), W('V2', 26.8, 0.93, 'unk2'),
            W('V3', 31.4, 0.48, 'bad'),                     # wrong well / half volume
            W('N1', 99, 0.0, 'ntc'),
        ])))

    # S3 wrong reference material: whole standard ladder displaced, slope intact
    def ladder(off, mid0=19.0, step=3.32, plateau=0.95, seed=0, nonpar=0.0):
        ws = []
        for i in range(5):
            ws.append(W(f'C{i+1}', mid0 + off + i * (step + i * nonpar), plateau - 0.02 * i, 'std'))
        ws.append(W('N1', 99, 0.0, 'ntc'))
        return build(seed, ws)
    S.append(dict(code='S3', normal=ladder(0.0, seed=301), abnormal=ladder(2.6, seed=302)))

    # S4 wrong dilution: 1:2 steps prepared where 1:10 were assumed
    S.append(dict(code='S4',
                  normal=ladder(0.0, step=3.32, seed=401),
                  abnormal=ladder(0.0, step=1.05, seed=402)))

    # S5 amplified controls
    S.append(dict(
        code='S5',
        normal=build(501, [
            *[W(f'U{i}', 25.0 + d, 0.93, 'unk') for i, d in enumerate((0.0, 0.11, -0.10))],
            W('P1', 21.8, 0.95, 'pos'),
            W('N1', 99, 0.0, 'ntc'), W('N2', 99, 0.0, 'ntc'), W('A1', 99, 0.0, 'ntc'),
        ]),
        abnormal=build(502, [
            *[W(f'U{i}', 25.0 + d, 0.93, 'unk') for i, d in enumerate((0.0, 0.11, -0.10))],
            W('P1', 21.8, 0.95, 'pos'),
            W('N1', 33.6, 0.62, 'ntc'), W('N2', 34.9, 0.55, 'ntc'), W('A1', 32.7, 0.70, 'ntc'),
        ])))

    # S6 wrong probe chemistry for the channel read: low delta-Rn, noisy, no plateau
    S.append(dict(
        code='S6',
        normal=build(601, [
            *[W(f'U{i}', 24.6 + d, 0.95, 'unk') for i, d in enumerate((0.0, 0.09, -0.12))],
            *[W(f'V{i}', 28.1 + d, 0.92, 'unk2') for i, d in enumerate((0.0, 0.13, -0.07))],
            W('N1', 99, 0.0, 'ntc'),
        ]),
        abnormal=build(602, [
            *[W(f'U{i}', 29.4 + d, 0.315, 'bad', k=2.9, noise=0.010, drift=0.0015)
              for i, d in enumerate((0.0, 0.5, -0.6))],
            *[W(f'V{i}', 33.0 + d, 0.245, 'bad', k=3.2, noise=0.011, drift=0.0016)
              for i, d in enumerate((0.0, 0.7, -0.5))],
            W('N1', 99, 0.0, 'ntc', noise=0.010, drift=0.0015),
        ])))

    # S7 protocol deviation: shortened annealing, late Cq and reduced plateau
    S.append(dict(
        code='S7',
        normal=build(701, [
            *[W(f'U{i}', 23.9 + d, 0.94, 'unk') for i, d in enumerate((0.0, 0.10, -0.11))],
            *[W(f'V{i}', 27.3 + d, 0.92, 'unk2') for i, d in enumerate((0.0, -0.09, 0.12))],
            W('N1', 99, 0.0, 'ntc'),
        ]),
        abnormal=build(702, [
            *[W(f'U{i}', 28.7 + d, 0.52, 'bad', k=1.9) for i, d in enumerate((0.0, 0.42, -0.35))],
            *[W(f'V{i}', 33.2 + d, 0.41, 'bad', k=2.1) for i, d in enumerate((0.0, -0.48, 0.55))],
            W('N1', 99, 0.0, 'ntc'),
        ])))

    # S8 inhibition / carry-over: dilution series not parallel, neat late
    S.append(dict(
        code='S8',
        normal=build(801, [
            W('D1', 22.0, 0.94, 'unk'), W('D2', 25.3, 0.93, 'unk'),
            W('D3', 28.6, 0.92, 'unk'), W('D4', 31.9, 0.90, 'unk'),
            W('N1', 99, 0.0, 'ntc'),
        ]),
        abnormal=build(802, [
            W('D1', 30.4, 0.44, 'bad', k=2.2, drift=0.0012),
            W('D2', 27.9, 0.72, 'bad', k=1.6),
            W('D3', 28.9, 0.90, 'unk'), W('D4', 32.2, 0.89, 'unk'),
            W('N1', 99, 0.0, 'ntc'),
        ])))
    return S

CAPTIONS = {
 'S1': ('Technical fault',
        'A detector gain step at cycle 29 lifts every amplifying trace at once, one well '
        'carries a square artefact over four cycles and one returns no signal at all. '
        'A change common to the whole block, and isolated wells that do not follow the '
        'chemistry, point at the instrument rather than at the reaction.'),
 'S2': ('Human mistake',
        'Two of the six replicates start late and plateau low: short or missed volume. '
        'The other replicates are unaffected, so the run failed at the bench, not in the mix.'),
 'S3': ('Wrong reference material',
        'The whole calibrator ladder is displaced by about 2.6 cycles while the spacing '
        'between levels is unchanged. Parallel displacement is the signature of a wrong '
        'assigned value, and every reported quantity is biased by the same factor.'),
 'S4': ('Wrong dilution',
        'Levels sit about one cycle apart instead of the 3.32 expected from a ten-fold '
        'series. The slope, and therefore the efficiency taken from it, is meaningless '
        'even though each curve looks healthy.'),
 'S5': ('Amplified controls',
        'The no-template and no-amplification controls cross late but clearly. Any result '
        'above their crossing cycle cannot be separated from contamination or carry-over.'),
 'S6': ('Probe unsuited to the channel read',
        'End-point signal falls to roughly a third of normal, the noise band widens and no '
        'plateau forms. Crossing cycles can still be computed, which is what makes this '
        'failure easy to accept by mistake.'),
 'S7': ('Deviation from the protocol',
        'A shortened annealing step pushes every crossing four to six cycles later and '
        'halves the plateau. All wells shift together, so the cause is the cycling '
        'programme, not the samples.'),
 'S8': ('Inhibition and carry-over',
        'The undiluted extract crosses later than its own ten-fold dilution and rises more '
        'slowly. A series that is not parallel means the matrix, not the target, is setting '
        'the crossing cycle.'),
}
