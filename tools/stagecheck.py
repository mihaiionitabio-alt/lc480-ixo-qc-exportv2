"""Check a staged release against its upload map, before committing.

Run in the clone after copying the release tree in and `git add -A`:

    python tools/stagecheck.py UPLOAD_MAP_2026-09-28.csv [--base origin/main]

It fails (exit 1) if:
  - a path in the map is not staged, or is matched by .gitignore
    (a stale ignore rule once dropped 1,047 of 1,057 new files silently);
  - a file on disk does not have the size and SHA-256 the map records
    (the copy is not the listed release);
  - a file on disk differs from what is staged (something left unstaged);
  - a binary file (.pdf .zip .png ...) is staged with different bytes than
    the map records, which would mean a line-ending filter touched it;
  - .gitignore and tools/gitignore_repo_root.txt say different things.

It then reports what the commit will do against the base: added, modified,
deleted, and for every modified path outside documentation/latex/ whether
the change is line endings only or a real edit.  Those are for a person to
read; they do not fail the check.

The comparison is made on the files on disk, not on the staged blobs,
because with core.autocrlf=true git stores text with LF and the staged
blob cannot match a hash taken on Windows.
"""
import csv, hashlib, subprocess, sys, collections

BINARY = ('.pdf', '.zip', '.png', '.jpg', '.jpeg', '.gif', '.ttc', '.ttf', '.otf', '.xlsx', '.docx', '.gz')
KEEP = ('.gitignore', '.nojekyll', 'README.md')


def git(*args, inp=None, ok=(0,)):
    r = subprocess.run(['git', *args], input=inp, capture_output=True)
    if r.returncode not in ok:
        sys.exit('git %s failed: %s' % (' '.join(args), r.stderr.decode(errors='replace')))
    return r.stdout


def sha256(b):
    return hashlib.sha256(b).hexdigest()


def main():
    args = sys.argv[1:]
    base = 'origin/main'
    if '--base' in args:
        i = args.index('--base'); base = args[i + 1]; del args[i:i + 2]
    if len(args) != 1:
        sys.exit(__doc__)
    with open(args[0], newline='', encoding='utf-8') as f:
        rows = {r['repo_path']: r for r in csv.DictReader(f)}
    fail = []

    index = set(git('ls-files', '-z').decode().split('\0')) - {''}
    missing = sorted(set(rows) - index)
    if missing:
        fail.append('NOT STAGED: %d  e.g. %s' % (len(missing), missing[:5]))
    ignored = [x for x in git('check-ignore', '--no-index', '--stdin', '-z',
                              inp='\0'.join(rows).encode(), ok=(0, 1)).decode().split('\0') if x]
    if ignored:
        fail.append('IGNORED BY .gitignore: %d  e.g. %s' % (len(ignored), ignored[:5]))

    wrong = []
    for p, r in rows.items():
        try:
            b = open(p, 'rb').read()
        except OSError:
            wrong.append(p + ' (missing on disk)'); continue
        if len(b) != int(r['bytes']) or sha256(b) != r['sha256']:
            wrong.append(p)
        elif p.lower().endswith(BINARY) and p in index and sha256(git('cat-file', 'blob', ':' + p)) != r['sha256']:
            fail.append('BINARY CHANGED BY A FILTER: ' + p)
    if wrong:
        fail.append('ON DISK != MAP: %d  e.g. %s' % (len(wrong), wrong[:5]))

    unstaged = [x for x in git('diff', '--name-only', '-z').decode().split('\0') if x]
    if unstaged:
        fail.append('UNSTAGED CHANGES: %d  e.g. %s' % (len(unstaged), unstaged[:5]))

    try:
        a = open('.gitignore', 'rb').read().replace(b'\r\n', b'\n')
        t = open('tools/gitignore_repo_root.txt', 'rb').read().replace(b'\r\n', b'\n')
        if a != t:
            fail.append('.gitignore != tools/gitignore_repo_root.txt')
    except OSError:
        pass

    status = collections.defaultdict(list)
    for line in git('diff', '--cached', '--name-status', '--no-renames', base).decode().splitlines():
        k, p = line.split('\t', 1)
        status[k].append(p)
    print('against %s:  added %d  modified %d  deleted %d' % (
        base, len(status['A']), len(status['M']), len(status['D'])))
    for k in ('A', 'M'):
        c = collections.Counter(p.split('/')[0] if '/' in p else '(root)' for p in status[k])
        print('  %s by folder: %s' % (k, dict(sorted(c.items()))))
    outside = [p for p in status['M'] if not p.startswith('documentation/latex/')]
    if outside:
        print('modified outside documentation/latex/:')
        for p in outside:
            quiet = subprocess.run(['git', 'diff', '--cached', '--quiet', '--ignore-cr-at-eol', base, '--', p])
            print('  %-10s %s' % ('eol only' if quiet.returncode == 0 else 'REAL EDIT', p))
    if status['D']:
        print('deleted:')
        for p in status['D']:
            print('  ' + p)
            if p in KEEP:
                fail.append('DELETES A FILE THAT IS NOT PART OF THE RELEASE: ' + p)

    print()
    for f in fail:
        print('FAIL  ' + f)
    print('%d paths in the map; %s' % (len(rows), 'CLEAN' if not fail else '%d problem(s)' % len(fail)))
    sys.exit(1 if fail else 0)


if __name__ == '__main__':
    main()
