"""Reproducible, read-only PDF extraction; generated artifacts stay in this site."""
import sys, json, hashlib
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.vendor'))
import fitz

source = ROOT.parent / '2610.08452v1.pdf'
out = ROOT / 'public' / 'research'
out.mkdir(parents=True, exist_ok=True)
doc = fitz.open(source)
pages, tables = [], []
for i, page in enumerate(doc):
    text = page.get_text(sort=True)
    pages.append({'page': i + 1, 'text': text})
    for table in page.find_tables().tables:
        tables.append({'page': i + 1, 'bbox': list(table.bbox), 'rows': table.extract()})
    page.get_pixmap(matrix=fitz.Matrix(1.4, 1.4)).save(out / f'page-{i+1:02}.png')
(out / 'extraction.json').write_text(json.dumps({'source': source.name, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'pages': pages, 'tables': tables}, ensure_ascii=False, indent=2), encoding='utf-8')
(ROOT / 'PDF_TEXT.txt').write_text('\n\n'.join(f'PAGE {p["page"]}\n{p["text"]}' for p in pages), encoding='utf-8')
print(json.dumps({'pages': len(pages), 'tables': [(t['page'], len(t['rows'])) for t in tables]}))
