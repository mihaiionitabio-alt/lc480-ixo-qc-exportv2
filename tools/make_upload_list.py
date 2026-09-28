import os,fnmatch,re,sys
# The source paths below are relative to the release root.  Anchor on this file's own
# location instead of the caller's working directory: run from anywhere else, the walk
# finds nothing and the scan prints a cheerful "CLEAN" over 8 files.
CALLER_CWD=os.getcwd()   # --csv is resolved against it: after the chdir below, a bare
                         # file name would land in the release root, not where it was asked for
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# withdrawal backups are not litter to keep - they are the PRE-withdrawal text
LITTER=('*.before_20260928_identifier_withdrawal','*.pass2','*.pass3','*.aux','*.log','*.out','*.toc','*.lof','*.lot','*.synctex.gz','*.pyg','*.minted','*.fls','*.fdb_latexmk','*.bak*','*.bbl','*.blg','.DS_Store','Thumbs.db')
EXCLUDE_DEST={  # withheld because the scan found something in them
 # build leftovers, 0-6 bytes each
 'documentation/latex/main.xdv','documentation/latex/main.w18',
 'documentation/latex/tmp1.tmp','documentation/latex/tmp2.tmp',
 # the only RDML in the corpus with no public counterpart: its five siblings are
 # byte-identical to the public reader-workshop files, this one matches nothing on
 # disk.  Contents read as the RDML consortium's own 2011 example (a named
 # experimenter, VHL assays, cell-line samples), but "reads as" is not provenance.
 'extras/rdml_2026-09-24/validation_20260924/rdml/example_1_3.rdml',
 'validation/whole_page/texlib.py','validation/verification/missy_smoke_2026-09-25.cjs',
 'validation/whole_page/validation_full.json'}
def litter(f): return any(fnmatch.fnmatch(f,p) for p in LITTER)
rows=[]
def add(src,dest,skip_dirs=(),skip_files=(),optional=False):
    # A source that is not here is NOT a quiet skip.  A folder missing from this list is
    # missing from the CSV too, so the repository keeps its old copy, nothing shows as
    # changed, and the run still prints a cheerful total.  Fail loudly instead; pass
    # optional=True only where absence is genuinely allowed.
    if not os.path.exists(src):
        if optional: return
        sys.exit('missing source: '+src)
    if os.path.isfile(src):
        if dest not in EXCLUDE_DEST: rows.append((dest,os.path.getsize(src),src))
        return
    for dp,dn,fn in os.walk(src):
        dn[:]=[d for d in dn if d not in skip_dirs and not d.startswith('__pycache__')]
        for f in sorted(fn):
            p=os.path.join(dp,f); rel=os.path.relpath(p,src).replace('\\','/')
            d=dest+'/'+rel
            if litter(f) or rel in skip_files or f in skip_files or d in EXCLUDE_DEST: continue
            rows.append((d,os.path.getsize(p),p))
add('index.html','index.html')
# The source of record is now the tree that actually builds the 28 September document:
# main.tex there loads chV2a_diagrams / chV2_functions / chV2b_gallery and compiles to the
# 1,401 pages.  The older tree built the 25 September document and could not rebuild this one.
add('documentation/documentation_sources/latex_2026-09-28','documentation/latex',
    skip_dirs={'fonts','_minted-main','out'},
    skip_files={'main.pdf'})
# the 28 September document and the re-validation it carries
add('documentation/qPCR_QC_forensics_documentation_2026-09-28.pdf',
    'documentation/qPCR_QC_forensics_documentation_2026-09-28.pdf')
add('documentation/revalidation_2026-09-28','documentation/revalidation_2026-09-28')
for f in ('BASE_PDF_UPDATE_2026-09-25.md','DOCUMENTATION_REBUILD_2026-09-28.md','DOCUMENTATION_UPDATE_2026-09-27.md',
          'README.md','RDML_SUPPORT_PLAN_2026-09-24.md','RDML_SUPPORT_IMPLEMENTED_2026-09-24.md'):
    # the 25 September PDF is superseded by the 28 September one and no longer published
    add('documentation/'+f,'documentation/'+f)
add('validation_2026-09-24','validation')
# lab12_fixture_20260923 holds 12 REAL laboratory .ixo runs (30 MB).  Binary, so a
# text-only scan never opened them; the names alone are sample identifiers.
add('documentation/function_tests_2026-09-23','validation/function_tests_2026-09-23',
    skip_dirs={'lab12_fixture_20260923'})
add('documentation/verification','validation/verification')
add('documentation/verify_base_plus_update_2026-09-27.py','tools/verify_base_plus_update_2026-09-27.py')
# make_upload_list.py itself goes in: the scan it performs is an assertion about the
# tree, and an assertion nobody can inspect is worth nothing.
for f in ('publish_check.py','no_real_data_check.py','make_upload_list.py','build.sh','build.ps1','fonts_README.md','gitignore_repo_root.txt','gitattributes.txt','README_template.md'):
    add('github_publishing/'+f,'tools/'+f)
# stagecheck.py is written in the other session and lives in the repository's tools/.
# It is the one genuinely optional source here: picked up if it has been copied into
# github_publishing/, absent without complaint if it has not.
add('github_publishing/stagecheck.py','tools/stagecheck.py',optional=True)
# Root notes are named one by one, not globbed.  A glob publishes whatever .md happens to
# sit in the release root on the day the list is built - including a note written later
# that nobody read for identifiers.  Four root notes are deliberately absent:
# CONTROL_CHARTS.md, CONTROLS_FROM_2025_2.md, SOP_UI_PROPOSAL.md and
# CLAUDE_DATA_CONSOLE_ARCHITECTURE_PLAN_2026-09-23.md - the scan found laboratory content
# in them.  A new note joins this list only after it has been read.
NOTES=('CATALOGUE_BY_VENDOR.md','CHARTING_LIBRARY_CHOICE.md','DOWNLOAD_COUNT_ESTIMATE.md',
       'ENGINEERING_HARDENING_2026-09-22.md','INTERACTIVE_CHARTS_IMPLEMENTATION.md',
       'LISTA_DESCARCARI.md','ORDINEA_SLIDE_RO.md','PERFORMANCE_2026-09-22.md',
       'PLOTLY_BASIC_25_GRAPHS_VERIFICATION.md','PROPUNERE_UI_SOP.md','RESOURCES_2026-09-28.md',
       'SLIDE_ORDER.md','SOP_1-5_VALORI_HTML.md','SPECIFICATII_SOP.md','UI_HISTORY_2026-09-25.md')
for f in NOTES: add(f,'notes/'+f)
for d,dest in (('documentation/roche_demo_reconstructed','extras/roche_demo_reconstructed'),
               ('documentation/export_atlas','extras/export_atlas'),
               ('documentation/scenario_atlas','extras/scenario_atlas'),
               ('documentation/catalogue_limits','extras/catalogue_limits'),
               ('rdml_2026-09-24','extras/rdml_2026-09-24'),
               ('console_data_views_2026-09-23','extras/console_data_views_2026-09-23'),
               ('console_fixes_2026-09-23','extras/console_fixes_2026-09-23'),
               ('console_micro_2026-09-23','extras/console_micro_2026-09-23'),
               ('fix_module_scope_2026-09-23','extras/fix_module_scope_2026-09-23'),
               ('fix_review_2026-09-23','extras/fix_review_2026-09-23')):
    add(d,dest)
if '--scan' in sys.argv:
    # No \b on either side, and no example written out.  In a real name the identifier is
    # preceded by an underscore and followed by another, both word characters, so a
    # \b-anchored rule matched NOTHING of the shape it was written for - not one of the
    # three real names tried, including the one that reached GitHub on 25 September.
    # Measured, not assumed.  An illustrative name of that shape IS an identifier, which
    # is why none appears here: the expression below is the only description of it.
    NAMEPAT={'a sample identifier in the name':r'\d{1,3}[-\d_ ]*GM\d{2}','2025_2 in the name':r'2025_2',
             'an instrument file':r'\.(ixo|eds|edt)$','a pseudonym map file':r'pseudonym[_ -]?map.*\.(csv|tsv|json|xlsx|txt)$'}
    BYTEPAT={'sample id':rb'\d{1,3}[-\d_ ]*GM\d{2}','run filename':rb'SC[ _]\d+[-\d_]*GM\d{2}','2025_2':rb'2025_2',
             'SPECIMEN-':rb'SPECIMEN-\d{3,4}','UNMAPPED-':rb'UNMAPPED-\d+','leak_identifiers':rb'leak_identifiers',
             'PLATE-384':rb'PLATE-?384','RAS/FFPE':rb'RAS.{0,4}FFPE','a user name':rb'chuahm'}
    def pdf_text(path):
        try:
            import subprocess,tempfile
            o=tempfile.mktemp(suffix='.txt')
            subprocess.run(['pdftotext','-layout',path,o],check=True,capture_output=True)
            t=open(o,encoding='utf-8',errors='replace').read(); os.unlink(o); return t
        except Exception:
            try:
                import pypdf
                return '\n'.join((pg.extract_text() or '') for pg in pypdf.PdfReader(path).pages)
            except Exception: return ''
    hits={}; pdfs_with_text=[0]; pdfs_seen=[0]
    def hit(k,dest,matched=b''):
        if isinstance(matched,bytes): matched=matched.decode('utf-8','replace')
        hits.setdefault(k,[]).append((dest,matched))
    for d,sz,src in rows:
        low=d.lower()
        # The file-NAME check runs FIRST, before any branch that can end the iteration.
        # It used to sit after the PDF arm, whose fail-closed `continue` therefore skipped
        # it: a PDF whose text would not extract was reported as unscanned and its name
        # was then never looked at at all.
        base=os.path.basename(d)
        for k,rx in NAMEPAT.items():
            m=re.search(rx,base,re.I)
            if m: hit(k,d,m.group(0))
        if low.endswith('.zip'):
            # a .zip is 161 files a byte scan sees as compressed noise
            import zipfile
            try: z=zipfile.ZipFile(src)
            except Exception: z=None
            if z:
                for n in z.namelist():
                    for k,rx in NAMEPAT.items():
                        m=re.search(rx,os.path.basename(n),re.I)
                        if m: hit(k+' (inside a zip)',d+'::'+n,m.group(0))
                    if n.endswith('/'): continue
                    try: body=z.read(n)
                    except Exception: continue
                    for k,rx in BYTEPAT.items():
                        m=re.search(rx,body)
                        if m: hit(k+' (inside a zip)',d+'::'+n,m.group(0))
        elif low.endswith('.pdf'):
            pdfs_seen[0]+=1
            raw_t=pdf_text(src)
            # FAIL CLOSED.  With neither pdftotext nor pypdf present, pdf_text() returns ''
            # and every PDF reads as empty: the run would print CLEAN having scanned none
            # of them.  A PDF that yields nothing is reported, not passed.
            if not raw_t.strip():
                hit('PDF TEXT NOT EXTRACTED - not scanned',d)
                continue
            pdfs_with_text[0]+=1
            t=raw_t.encode('utf-8','replace')
            t=re.sub(rb'\s+',b' ',t)
            for k,rx in BYTEPAT.items():
                m=re.search(rx,t,re.I)
                if m: hit(k+' (in PDF text)',d,m.group(0))
        # A raw byte scan of a COMPRESSED container is noise: deflated streams produce
        # random-looking text, and two function-diagram PDFs matched the sample-identifier
        # shape purely by chance (their text layer holds nothing but function names).  PDFs
        # are read through their text above, zips are opened entry by entry, and the other
        # compressed media carry no text to leak.
        if os.path.splitext(low)[1] in {'.pdf','.zip','.png','.jpg','.jpeg','.gif','.gz','.tgz',
                                        '.woff','.woff2','.ttf','.otf','.mp4','.webp','.ico'}:
            continue
        try: data=open(src,'rb').read()
        except OSError: continue
        for k,rx in BYTEPAT.items():
            m=re.search(rx,data)
            if m: hit(k,d,m.group(0))
    # These FIVE files exist to CARRY the patterns - the three scanners, the base-PDF
    # verifier, and the .gitignore whose rules name 2025_2.  A hit in them is the tool
    # working.  They are not exempt from the report: every hit in them is printed WITH
    # THE TEXT THAT MATCHED, so a real identifier pasted into one of them is visible on
    # the line instead of being swallowed by the file's name.  Only the exit code treats
    # them as non-blocking.
    BYDESIGN={'tools/publish_check.py','tools/no_real_data_check.py','tools/make_upload_list.py',
              'tools/verify_base_plus_update_2026-09-27.py','tools/gitignore_repo_root.txt'}
    real={k:[x for x in v if x[0] not in BYDESIGN] for k,v in hits.items()}
    real={k:v for k,v in real.items() if v}
    print(f'scanned {len(rows)} files - every file by name; text by bytes; PDFs by text; zips by entry')
    print(f'   PDFs: {pdfs_seen[0]} seen, {pdfs_with_text[0]} yielded text and were scanned')
    for k,v in sorted(hits.items()):
        byd=[x for x in v if x[0] in BYDESIGN]
        tag='' if not byd else f'  ({len(byd)} of them in the scanners themselves - by design, matched text shown)'
        print(f'  {k}: {len(v)}{tag}')
        for dest,mt in v[:12]:
            mark='   [by design]' if dest in BYDESIGN else ''
            print('      '+dest+mark+(('   matched: '+repr(mt)) if mt else ''))
    if not real: print('\n  CLEAN - every hit is a pattern inside a scanner')
    else: print(f'\n  {sum(len(v) for v in real.values())} REAL hit(s) - DO NOT PUBLISH')
    sys.exit(1 if real else 0)
if '--csv' in sys.argv:
    # The CSV used to be produced by a one-off script that lived nowhere.  It is the file
    # the copy is actually driven from, so it is built here, from the same rows the list
    # prints - the two cannot disagree.
    import hashlib
    out=sys.argv[sys.argv.index('--csv')+1]
    if not os.path.isabs(out): out=os.path.join(CALLER_CWD,out)
    WINROOT=r'D:\IXO\release_unified_2026-09-21_r2'
    lines=['repo_path,source_path_windows,bytes,sha256']
    for d,sz,src in rows:
        h=hashlib.sha256()
        with open(src,'rb') as fh:
            for blk in iter(lambda: fh.read(1<<20), b''): h.update(blk)
        win=WINROOT+'\\'+os.path.relpath(src,'.').replace('/','\\')
        lines.append(f'{d},{win},{sz},{h.hexdigest()}')
    body=('\n'.join(lines)+'\n').encode('utf-8')   # LF, as the existing CSV is
    # the mount refuses O_TRUNC: write in place
    fh=open(out,'r+b') if os.path.exists(out) else open(out,'wb')
    fh.write(body); fh.truncate(len(body)); fh.close()
    print(f'{out}: {len(rows)} rows, {len(body):,} bytes')
    sys.exit(0)
tot=sum(s for _,s,_ in rows)
print(f'# {len(rows)} files, {tot:,} bytes ({tot/1048576:.1f} MiB)\n')
g={}
for d,s,_ in rows:
    k=d.split('/')[0] if '/' in d else '(root)'
    g.setdefault(k,[0,0]); g[k][0]+=1; g[k][1]+=s
for k,(c,s) in sorted(g.items()): print(f'# {k:16} {c:5} files {s:12,} B')
print()
for d,s,_ in rows: print(f'{s:10d}  {d}')
