# -*- coding: utf-8 -*-
"""Shrink an already-built PDF to fit a size budget, without touching the LaTeX source.

Built for the qPCR documentation: thousands of vector graphs, a few rasters, and a
page count in the thousands. Nothing here re-runs LaTeX; the input PDF is the input.

Strategy, cheapest first. Each stage is tried in order and the first result under the
budget wins, so quality is never thrown away for nothing:

  0  qpdf lossless      object streams, flate recompression. No pixels change at all.
                        On a vector-heavy document this alone is often 30-60%.
  1  gs /ebook          150 dpi images, fonts subset and deduplicated, duplicate
                        images detected and shared. Vector art stays vector.
  2  gs /screen         72 dpi images. Still vector art, but rasters go soft.
  3  gs /screen + 50dpi  last resort for a document that is mostly photographs.

Why not just downsample images: in a document of plotted curves the bytes are in the
vector content streams and the embedded fonts, not in pixels. -dDetectDuplicateImages
and font subsetting do the real work; the stages above only differ in how hard they
push the raster path.

Long documents are processed in chunks so that a single run can be interrupted and
resumed, and so that no single external process has to survive for many minutes:
chunks already compressed are skipped on the next run. Use --time-budget to stop
cleanly before a shell timeout and re-run until it prints DONE.

Usage:
  python compress_pdf.py INPUT.pdf
  python compress_pdf.py INPUT.pdf -o OUT.pdf --budget-mb 95 --chunk-pages 400
  python compress_pdf.py INPUT.pdf --quality screen --time-budget 150
  python compress_pdf.py INPUT.pdf --no-ghostscript     # pypdf-only fallback
"""
from pathlib import Path
import argparse, shutil, subprocess, sys, time

MB = 1024 * 1024
QUALITY_ORDER = ['lossless', 'ebook', 'screen', 'screen-50']


def ghostscript():
    for name in ('gswin64c', 'gswin32c', 'gs'):
        found = shutil.which(name)
        if found:
            return found
    return None


def page_count(path):
    from pypdf import PdfReader
    return len(PdfReader(str(path)).pages)


def gs_args(binary, stage, source, target):
    common = [binary, '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.5', '-dNOPAUSE',
              '-dBATCH', '-dQUIET', '-dSAFER',
              # The three switches that matter on a vector-heavy document.
              '-dDetectDuplicateImages=true', '-dSubsetFonts=true', '-dCompressFonts=true',
              '-dCompressStreams=true', '-dOptimize=true',
              # Keep plotted curves as curves.
              '-dAutoRotatePages=/None', '-dColorConversionStrategy=/LeaveColorUnchanged',
              '-dPreserveHalftoneInfo=false', '-dPreserveOPIComments=false']
    if stage == 'ebook':
        # /ebook is 150 dpi; the explicit switches state it rather than implying it.
        extra = ['-dPDFSETTINGS=/ebook',
                 '-dDownsampleColorImages=true', '-dColorImageResolution=150',
                 '-dDownsampleGrayImages=true', '-dGrayImageResolution=150',
                 '-dDownsampleMonoImages=true', '-dMonoImageResolution=300']
    elif stage == 'screen':
        extra = ['-dPDFSETTINGS=/screen']
    else:  # screen-50: push the raster path as far as it goes
        extra = ['-dPDFSETTINGS=/screen',
                 '-dDownsampleColorImages=true', '-dColorImageResolution=50',
                 '-dDownsampleGrayImages=true', '-dGrayImageResolution=50',
                 '-dDownsampleMonoImages=true', '-dMonoImageResolution=100',
                 '-dColorImageDownsampleType=/Average', '-dGrayImageDownsampleType=/Average']
    return common + extra + ['-sOutputFile=' + str(target), str(source)]


def qpdf_lossless(source, target):
    binary = shutil.which('qpdf')
    if not binary:
        return False
    result = subprocess.run([binary, '--object-streams=generate', '--compress-streams=y',
                             '--recompress-flate', '--compression-level=9',
                             '--stream-data=compress', str(source), str(target)],
                            capture_output=True)
    # qpdf exit code 3 is "warnings only" and still writes a usable file.
    return result.returncode in (0, 3) and Path(target).is_file()


def pypdf_lossless(source, target):
    """Fallback when no external binary exists. Lossless, and slower."""
    from pypdf import PdfReader, PdfWriter
    reader = PdfReader(str(source))
    writer = PdfWriter()
    for page in reader.pages:
        page.compress_content_streams()
        writer.add_page(page)
    writer.compress_identical_objects(remove_identicals=True, remove_orphans=True)
    with open(target, 'wb') as handle:
        writer.write(handle)
    return True


def looks_complete(path):
    """A PDF killed mid-write has no trailer. Cheap check, no parsing."""
    try:
        if path.stat().st_size < 1024:
            return False
        with open(path, 'rb') as handle:
            handle.seek(-2048, 2)
            return b'%%EOF' in handle.read()
    except OSError:
        return False


def compress_one(source, target, stage, binary):
    """Write through a temporary name so an interrupted run leaves no half file."""
    target = Path(target)
    staging = target.with_name(target.name + '.partial')
    if stage == 'lossless':
        made = qpdf_lossless(source, staging) or pypdf_lossless(source, staging)
    elif not binary:
        made = pypdf_lossless(source, staging)
    else:
        subprocess.run(gs_args(binary, stage, source, staging), check=True, capture_output=True)
        made = staging.is_file()
    if not (made and looks_complete(staging)):
        staging.unlink(missing_ok=True)
        raise RuntimeError('Compression produced no complete file for ' + str(source))
    staging.replace(target)
    return True


def split(source, workdir, pages_per_chunk, total):
    """Split once; reuse the split on later runs."""
    binary = shutil.which('qpdf')
    expected = [workdir / ('part-%03d.pdf' % i)
                for i in range(1, (total + pages_per_chunk - 1) // pages_per_chunk + 1)]
    if binary and not all(part.is_file() for part in expected):
        # One pass over the source instead of one pass per chunk.
        subprocess.run([binary, '--split-pages=%d' % pages_per_chunk, str(source),
                        str(workdir / 'part-%d.pdf')], check=False, capture_output=True)
        produced = sorted(workdir.glob('part-*.pdf'))
        if len(produced) == len(expected):
            for made, wanted in zip(produced, expected):
                if made != wanted:
                    made.rename(wanted)
            return expected
    chunks = []
    for index, start in enumerate(range(1, total + 1, pages_per_chunk), 1):
        stop = min(start + pages_per_chunk - 1, total)
        part = workdir / ('part-%03d.pdf' % index)
        chunks.append(part)
        if part.is_file():
            continue
        if binary:
            subprocess.run([binary, '--empty', '--pages', str(source), '%d-%d' % (start, stop),
                            '--', str(part)], check=True, capture_output=True)
        else:
            from pypdf import PdfReader, PdfWriter
            reader = PdfReader(str(source))
            writer = PdfWriter()
            for number in range(start - 1, stop):
                writer.add_page(reader.pages[number])
            with open(part, 'wb') as handle:
                writer.write(handle)
    return chunks


def merge(parts, target):
    binary = shutil.which('qpdf')
    if binary:
        command = [binary, '--empty', '--pages'] + [str(p) for p in parts] + ['--', str(target)]
        result = subprocess.run(command, capture_output=True)
        if result.returncode in (0, 3) and Path(target).is_file():
            return
    from pypdf import PdfWriter
    writer = PdfWriter()
    for part in parts:
        writer.append(str(part))
    with open(target, 'wb') as handle:
        writer.write(handle)


def report(label, size, pages=None):
    line = '%-28s %8.1f MB' % (label, size / MB)
    if pages is not None:
        line += '   %d pages' % pages
    print(line, flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('input')
    parser.add_argument('-o', '--output')
    parser.add_argument('--budget-mb', type=float, default=95.0,
                        help='stop at the first stage under this size (default 95, '
                             'which leaves headroom under GitHub\'s 100 MB limit)')
    parser.add_argument('--quality', choices=QUALITY_ORDER, default=None,
                        help='force one stage instead of walking the ladder')
    parser.add_argument('--chunk-pages', type=int, default=0,
                        help='process this many pages at a time, resumably (0 = whole file)')
    parser.add_argument('--time-budget', type=float, default=0.0,
                        help='stop cleanly after this many seconds and resume on the next run')
    parser.add_argument('--work-dir', default=None)
    parser.add_argument('--no-ghostscript', action='store_true')
    parser.add_argument('--keep-work', action='store_true')
    args = parser.parse_args()

    source = Path(args.input).resolve()
    if not source.is_file():
        raise SystemExit('No such file: ' + str(source))
    output = Path(args.output).resolve() if args.output else source.with_name(source.stem + '_compressed.pdf')
    budget = args.budget_mb * MB
    binary = None if args.no_ghostscript else ghostscript()
    stages = [args.quality] if args.quality else QUALITY_ORDER

    total_pages = page_count(source)
    report('original', source.stat().st_size, total_pages)
    print('ghostscript: %s' % (binary or 'not found, using pypdf (lossless only)'), flush=True)

    work = Path(args.work_dir) if args.work_dir else source.with_name(source.stem + '_compress_work')
    work.mkdir(parents=True, exist_ok=True)
    started = time.time()

    for stage in stages:
        staged = work / ('out-' + stage + '.pdf')
        if staged.is_file() and looks_complete(staged):
            size = staged.stat().st_size
        elif not args.chunk_pages:
            compress_one(source, staged, stage, binary)
            size = staged.stat().st_size
        else:
            # Resumable chunk mode: each part is compressed once and kept.
            parts = split(source, work, args.chunk_pages, total_pages)
            done = []
            for part in parts:
                small = part.with_name(part.stem + '-' + stage + '.pdf')
                if small.is_file() and not looks_complete(small):
                    print('discarding incomplete %s from an interrupted run' % small.name, flush=True)
                    small.unlink()
                if not small.is_file():
                    if args.time_budget and time.time() - started > args.time_budget:
                        print('PAUSED after %d/%d chunks of stage %s; run again to continue.'
                              % (len(done), len(parts), stage), flush=True)
                        return 2
                    compress_one(part, small, stage, binary)
                done.append(small)
            merge(done, staged)
            size = staged.stat().st_size
        report('stage ' + stage, size)
        if size <= budget or stage == stages[-1]:
            shutil.copyfile(staged, output)
            final_pages = page_count(output)
            report('written', output.stat().st_size, final_pages)
            if final_pages != total_pages:
                print('WARNING: page count changed (%d -> %d)' % (total_pages, final_pages))
                return 1
            if size > budget:
                print('DONE but still above the budget; the remaining bytes are vector '
                      'content and fonts, not images. Split the document or drop the '
                      'figure atlas into a separate release asset.', flush=True)
            else:
                print('DONE at stage %s, %.1f%% of the original.'
                      % (stage, 100.0 * size / source.stat().st_size), flush=True)
            if not args.keep_work:
                shutil.rmtree(work, ignore_errors=True)
            return 0
    return 1


if __name__ == '__main__':
    sys.exit(main())
