#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Scan a built document for anything that could carry real laboratory data.

    python no_real_data_check.py qPCR_QC_forensics_documentation_2026-09-27_base_plus_update.pdf

Reads the PDF's text and reports every hit, with page numbers. Exit 0 means the
patterns that identify a sample, a run or a person were not found. It does not
prove a document is clean — it proves these specific things are absent — so read
the categories and add your own before trusting a release.
"""
import collections, re, subprocess, sys, os, tempfile

# --- what must never appear -------------------------------------------------
BLOCKING = [
 ('a laboratory sample identifier (n GMyy)', re.compile(r'\b\d{1,3}\s*GM\s*\d{2}\b')),
 ('a real run file name (SC_..GM..)',        re.compile(r'\bSC[ _]\d+[-\d\s]*GM\s*\d{2}', re.I)),
 ('the real corpus folder 2025_2',           re.compile(r'\b2025_2\b')),
 ('a pseudonym (SPECIMEN-nnnn)',             re.compile(r'\bSPECIMEN-\d{3,4}\b')),
 ('an unmapped pseudonym (UNMAPPED-nn)',     re.compile(r'\bUNMAPPED-\d+\b')),
 ('the identifier list',                     re.compile(r'leak_identifiers', re.I)),
 ('a patient or LIMS-looking long id',       re.compile(r'\b(?:LIMS|PAT|PID)[-_ ]?\d{4,}\b', re.I)),
 ('PLATE-384, whose provenance is unknown',  re.compile(r'\bPLATE-?\s*384\b', re.I)),
 ('the PLATE-384 checksum',                  re.compile(r'\bb2da31fb\w*', re.I)),
 ('the withdrawn laboratory RDML export',    re.compile(r'RAS[-_\s]{0,2}FFPE', re.I)),
]

# --- review, not blocking: the shapes that hid a real file until 28 September ----
# A file name with a leading ISO date, a person's user path and an e-mail address are
# not identifiers in themselves.  Each one is how a real laboratory file, a real person
# or a real address has reached a document before, so each is printed for a human to
# judge rather than passed over in silence.
REVIEW = [
 ('a file name carrying a leading ISO date',
  re.compile(r'\b20\d{2}[-_]\d{2}[-_]\d{2}[-_][A-Za-z0-9_.-]{2,40}\.(?:ixo|eds|edt|rdml|zip|json|csv)\b')),
 ('a personal user path',
  re.compile(r'(?:C:\\+Users\\+|/home/|/Users/)([A-Za-z0-9_.-]{2,32})')),
 ('an e-mail address',
  re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')),
 ('operator initials beside a date',
  re.compile(r'\b[A-Z]{2}[_ ]\d{1,2}\.\d{1,2}\.\d{4}\b|\b\d{1,2}\.\d{1,2}\.\d{4}[_ ][A-Z]{2}\b')),
]
# --- what is expected, and why ----------------------------------------------
EXPECTED = [
 ('reference material names in the tool\'s own profile and source',
  re.compile(r'\b(?:415B|410CP|CN PORUMB|CN SOIA)\b', re.I)),
 ('instrument or exchange file names of the demonstration corpus',
  re.compile(r'\b(?!PLATE-?384)[A-Za-z0-9_\-]{3,40}\.(?:eds|ixo|edt|rdml)\b')),
 ('an analysis key read from a template file',
  re.compile(r'\bSVT\d{3,}\b')),
]

def text_of(pdf):
    """Page text, form-feed separated.  pdftotext when poppler is installed; otherwise
    pypdf or PyMuPDF, so the check still runs on a machine without poppler — a scan that
    cannot run is a scan nobody performs."""
    try:
        out = tempfile.mktemp(suffix='.txt')
        subprocess.run(['pdftotext', '-layout', pdf, out], check=True)
        t = open(out, encoding='utf-8', errors='replace').read()
        os.unlink(out)
        return t
    except (FileNotFoundError, OSError, subprocess.CalledProcessError):
        pass
    try:
        import pypdf
        r = pypdf.PdfReader(pdf)
        print('  (poppler not found - using pypdf)')
        return '\f'.join((pg.extract_text() or '') for pg in r.pages) + '\f'
    except ImportError:
        pass
    try:
        import pymupdf
        d = pymupdf.open(pdf)
        print('  (poppler not found - using PyMuPDF)')
        return '\f'.join(pg.get_text() for pg in d) + '\f'
    except ImportError:
        raise SystemExit('no PDF text extractor found: install poppler, or "pip install pypdf"')

def main():
    if len(sys.argv) < 2:
        print(__doc__); return 2
    pdf = sys.argv[1]
    raw = text_of(pdf).split('\f')
    # justification and line wrapping split identifiers across spaces and newlines;
    # match on a whitespace-collapsed copy, because that is exactly how one real
    # identifier survived three scans: a space had been justified into the middle of it
    pages = [re.sub(r'\\s+', ' ', p) for p in raw]
    print(f'{os.path.basename(pdf)} — {len(raw)-1} pages (whitespace-collapsed match)\n')
    bad = 0
    print('MUST NOT APPEAR')
    for name, rx in BLOCKING:
        where = [i+1 for i, p in enumerate(pages) if rx.search(p)]
        n = sum(len(rx.findall(p)) for p in pages)
        if where:
            bad += 1
            print(f'  FOUND  {name}: {n} occurrence(s), pages {where[:10]}')
            ex = collections.Counter(m for p in pages for m in rx.findall(p))
            for v, c in ex.most_common(5): print(f'           {v!r} x{c}')
        else:
            print(f'  clear  {name}')
    print('\nEXPECTED, AND WHY')
    for name, rx in EXPECTED:
        n = sum(len(rx.findall(p)) for p in pages)
        ex = collections.Counter(m for p in pages for m in rx.findall(p))
        print(f'  {n:5} {name}')
        for v, c in ex.most_common(4): print(f'           {v!r} x{c}')
    print('\nFOR REVIEW — not blocking, but a human decides')
    for name, rx in REVIEW:
        ex = collections.Counter(m if isinstance(m, str) else m[0] for p in pages for m in rx.findall(p))
        if not ex:
            print(f'  none   {name}'); continue
        where = [i+1 for i, p in enumerate(pages) if rx.search(p)]
        print(f'  {sum(ex.values()):5}  {name}, pages {where[:8]}')
        for v, c in ex.most_common(5): print(f'           {v!r} x{c}')

    print()
    if bad:
        print(f'{bad} blocking category(ies) found — DO NOT PUBLISH'); return 1
    print('no sample, run or person identifier found')
    return 0

if __name__ == '__main__':
    sys.exit(main())
