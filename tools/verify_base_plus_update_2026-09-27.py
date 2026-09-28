"""Verification of qPCR_QC_forensics_documentation_2026-09-27_base_plus_update.pdf
   (integrated build, 28 September 2026)

The document is no longer a base PDF with an addendum appended: the function
diagrams are built into Chapter 18 next to each symbol's validation record, and
the whole document was recompiled from the LaTeX sources. This script checks
what that build must contain.
"""
from pathlib import Path
from pypdf import PdfReader
from hashlib import sha256

D = Path(__file__).resolve().parent
out = D / 'qPCR_QC_forensics_documentation_2026-09-27_base_plus_update.pdf'
ro = PdfReader(str(out))
n = len(ro.pages)
assert n == 1409, n                      # 1401 compiled + the 8-page 25 September addendum

text = [ro.pages[i].extract_text() or '' for i in range(n)]
flat = ['' .join(t.split()) for t in text]

# the manual is still the manual
assert 'qPCR raw values' in text[0] and 'MISSY TECHNICAL DOCUMENTATION' in text[0]
assert any('Function by function' in t for t in text[:12])          # in the contents
assert any('Software diagrams: method and legend' in t for t in text[:12])
assert any('The page in use, on demonstration data' in t for t in text[:12])
# an index of figures and an index of tables
assert any('List of Figures' in t for t in text[:60])
assert any('List of Tables' in t for t in text[:60])

# every symbol's record states where that symbol sits in the current build,
# and carries a diagram
cur = sum(1 for t in text if 'Current build:' in t)
dia = sum(1 for t in text if 'Software diagram' in t)
assert cur >= 500, cur
assert dia >= 500, dia

# the statement of what has drifted since the harness ran
assert any('State of this record' in t for t in text), 'state statement missing'

# the symbols the harness never saw are documented and marked
assert any('Symbols present in the page and not covered' in t for t in text)
for name in ['ixMount', 'ixTraces', 'plotArm', 'selChartItems', 'missyEmblem']:
    assert any(name in t for t in text), name

# a listing keeps the manual's numbered gutter inside the new box
west = [i for i, f in enumerate(flat)
        if 'functionccWestgard' in f and 'Currentbuild:' in f]
assert west, 'no Chapter 18 listing page for ccWestgard'
wt = flat[west[0]]
for term in ['6288', '6298', 'functionccWestgard(res)']:
    assert term in wt, term

# every diagram is a numbered figure with its own description
diagcap = sum(t.count('Software diagram of') for t in text)
assert diagcap >= 700, diagcap
# every recorded table carries a caption
tabcap = sum(t.count('Input to') for t in text)
assert tabcap >= 350, tabcap

# the indexes must not collide with their own numbers: a table number reads 19.374
lot = [i for i, t in enumerate(text[:80]) if 'List of Tables' in t]
assert lot, 'no list of tables'
sample = '\n'.join(text[lot[0]:lot[0] + 3])
assert 'Input to' in sample, 'the list of tables carries no entries'
import re as _re
assert _re.search(r'19\.\d{3}\s+\S', sample), 'a table number and its title do not separate'

# the gallery: every figure names the functions it exercises, and both states are shown
gal = sum(t.count('Exercises') for t in text)   # captions, not pages
assert gal >= 60, gal
assert any('scenario S9' in t or 'Scenario S9' in t for t in text), 'the out-of-control set is missing'
assert any('out of control' in t for t in text)
assert any('in control throughout' in t for t in text)

# the unidentified corpus file stays withdrawn
whole = '\n'.join(text)
assert 'PLATE-384' not in whole, 'the withdrawn corpus file is named again'
assert 'b2da31fb' not in whole, 'the withdrawn checksum is printed again'
assert any('identification withdrawn' in t for t in text), 'the withdrawal note is missing'

# the 25 September revision addendum is still at the end
tail = '\n'.join(text[-8:])
for term in ['MISSY technical documentation', 'Validation record']:
    assert term in tail, term

print('pages', n)
print('pages with a current-build line', cur, ' pages with a diagram', dia)
print('figures naming the functions they exercise', gal)
print('diagram captions', diagcap, ' table captions of one kind', tabcap)
print('final_sha256', sha256(out.read_bytes()).hexdigest().upper())
