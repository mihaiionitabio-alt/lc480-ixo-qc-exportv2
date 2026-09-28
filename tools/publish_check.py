#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Refuse to publish a tree that carries anything it should not.

Run it over the staging folder before every commit and every push:

    python publish_check.py D:\\pub\\missy-qpcr-docs

Exit code 0 means nothing was found. Any other exit code names what was found and where.
It errs towards stopping you: a false positive costs a minute, a real identifier on GitHub
cannot be recalled.
"""
import hashlib, os, re, sys

# --- things that must not be in a published tree -----------------------------
FORBIDDEN_NAMES = {
    'leak_identifiers.txt': 'the identifier list itself',
    'msyh.ttc': 'Microsoft YaHei, a proprietary font',
    'e_jaxa-jerg-2-610b.pdf': 'a third-party standard',
    'e_jaxa-jerg-2-610b.txt': 'a third-party standard',
}
FORBIDDEN_DIRS = {'2025_2', '_minted-main', 'build_aux_backup_20260924'}
FORBIDDEN_EXT = {'.aux', '.log', '.out', '.toc', '.lof', '.lot', '.fls', '.fdb_latexmk'}

# A real run file from this laboratory is named SC, an underscore or space, a small
# number, a hyphen, a second number, GM, a two-digit year, then the acquisition date
# and the operator's initials.  No example is written out: any string of that shape is
# a sample identifier, so an illustrative one is a leak.  The pattern below is the
# only description of it that this file carries.
REAL_RUN = re.compile(r'^SC[ _]\d+[-\d_]*GM\d{2}[_ ].*\.(ixo|eds|edt|rdml)$', re.I)
# a file whose NAME says it is an exported mapping of pseudonyms to identifiers
MAP_FILE = re.compile(r'pseudonym[_ -]?map.*\.(csv|tsv|json|xlsx|txt)$', re.I)
# these files exist to CARRY the patterns; a hit inside one is the tool working, not a leak.
# they are reported separately rather than skipped silently, so the exemption stays visible.
BY_DESIGN = {'publish_check.py', 'no_real_data_check.py', 'gitignore.txt',
             'gitignore_repo_root.txt', 'verify_base_plus_update_2026-09-27.py',
             'make_upload_list.py'}
# No \b on either side of the identifier.  In a real name underscores sit exactly where
# those boundaries were asserted, so the \b form matched none of the real names - not one
# of the three tried, including the one that reached GitHub on 25 September.
IDENT_NAME = re.compile(r'\d{1,3}[-\d_ ]*GM\d{2}|2025_2|leak_identifiers', re.I)

# text patterns that suggest a real identifier or a pseudonym mapping got in
TEXT_PATTERNS = [
    (re.compile(r'\bSPECIMEN-\d{4}\b\s*[:=]\s*["\']?\s*\d', re.I), 'a pseudonym mapped to something'),
    # Deliberately NOT the bare code symbol.  The page contains a function that BUILDS the
    # mapping, and its name appears in the source, in the code appendix and in every call
    # graph -- 30 harmless hits that taught the reader to skim past the scan.  What must
    # never be published is a mapping OF VALUES: the rule above catches it in text, and
    # MAP_FILE catches a file whose name says it is one.
    (re.compile(r'\bpseudonym[ -]map\b', re.I), 'those two words in prose'),
    (re.compile(r'\d{1,3}[-\d_ ]*GM\d{2}'), 'a laboratory sample identifier'),
    (re.compile(r'\bNASA\s+F.{0,3}\s+Component\s+Design\b', re.I), 'an engineering standard named in the text'),
    (re.compile(r'\bJERG-2-610\b', re.I), 'an engineering standard named in the text'),
    # the four strings withdrawn on 28 September.  A file the upload list does not
    # overwrite survives in the repository untouched, so the tree scan - not the list -
    # is what has to catch them.
    (re.compile(r'\bPLATE-?\s*384\b', re.I), 'the withdrawn corpus file'),
    (re.compile(r'\bb2da31fb\w*', re.I), 'the withdrawn checksum'),
    (re.compile(r'RAS[-_\s]{0,2}FFPE', re.I), 'the withdrawn laboratory RDML export'),
    (re.compile(r'\bchuahm\b', re.I), "a third party's user name"),
]
# those two standards may be named in planning and review documents only
STANDARD_OK = ('notes', 'review', 'plan', 'readme', 'github_publishing')
TEXT_EXT = {'.md', '.tex', '.txt', '.py', '.js', '.mjs', '.json', '.html', '.csv', '.ps1', '.sh', '.yml', '.yaml'}

bydesign = []

def scan(root):
    findings = []
    for dirpath, dirnames, filenames in os.walk(root):
        if '.git' in dirnames: dirnames.remove('.git')
        for d in list(dirnames):
            if d.lower() in FORBIDDEN_DIRS:
                findings.append((os.path.join(dirpath, d), 'folder that must not be published'))
                dirnames.remove(d)
        for fn in filenames:
            p = os.path.join(dirpath, fn)
            low = fn.lower()
            if low in FORBIDDEN_NAMES:
                findings.append((p, FORBIDDEN_NAMES[low])); continue
            ext = os.path.splitext(low)[1]
            if ext in FORBIDDEN_EXT:
                findings.append((p, 'build litter')); continue
            if REAL_RUN.match(fn):
                findings.append((p, 'a real laboratory run')); continue
            if MAP_FILE.search(fn):
                findings.append((p, 'an exported pseudonym mapping')); continue
            # a name is evidence too, whatever the extension: the 12 real runs that reached
            # a staging folder on 28 September were binaries a text-only scan could not open
            if IDENT_NAME.search(fn):
                findings.append((p, 'a laboratory identifier in the FILE NAME')); continue
            if ext in TEXT_EXT and os.path.getsize(p) < 12_000_000:
                try:
                    txt = open(p, encoding='utf-8', errors='replace').read()
                except OSError:
                    continue
                allow_std = any(k in low for k in STANDARD_OK)
                for rx, why in TEXT_PATTERNS:
                    if 'standard named' in why and allow_std:
                        continue
                    m = rx.search(txt)
                    if m:
                        line = txt[:m.start()].count('\n') + 1
                        entry = (f'{p}:{line}', why + f' — {m.group(0)[:40]!r}')
                        (bydesign if fn in BY_DESIGN else findings).append(entry)
                        break
    return findings

def main():
    root = sys.argv[1] if len(sys.argv) > 1 else '.'
    if not os.path.isdir(root):
        print('not a folder:', root); return 2
    del bydesign[:]
    f = scan(root)
    n = sum(len(x) for _, _, x in os.walk(root))
    if bydesign:
        print(f'{len(bydesign)} hit(s) inside the scanners themselves — by design, not counted:')
        for where, why in bydesign:
            print(f'    {where}  {why}')
        print()
    if not f:
        print(f'publish check: {n} file(s) scanned under {root}')
        print('nothing found that must not be published')
        return 0
    print(f'publish check: {len(f)} finding(s) under {root} — DO NOT PUSH')
    for where, why in f:
        print(f'  {why}')
        print(f'    {where}')
    return 1

if __name__ == '__main__':
    sys.exit(main())
