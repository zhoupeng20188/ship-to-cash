"""Check the generated static site: run after npm run build."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids, self.links, self.assets, self.schemas = set(), [], [], []
        self.canonical, self.og, self.h1 = None, None, 0
        self.schema = None
        self.feed(path.read_text())
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'): self.ids.add(a['id'])
        if tag == 'h1': self.h1 += 1
        if tag == 'a' and a.get('href'): self.links.append(a['href'])
        if tag == 'img' and a.get('src'): self.assets.append(a['src'])
        if tag == 'link' and a.get('rel') == 'canonical': self.canonical = a.get('href')
        if tag == 'meta' and a.get('property') == 'og:image': self.og = a.get('content')
        if tag == 'script' and a.get('type') == 'application/ld+json': self.schema = ''
    def handle_data(self, data):
        if self.schema is not None: self.schema += data
    def handle_endtag(self, tag):
        if tag == 'script' and self.schema is not None:
            self.schemas.append(json.loads(self.schema))
            self.schema = None

pages = {p.relative_to(DIST).as_posix(): Page(p) for p in DIST.rglob('*.html')}
errors = []
links = anchors = 0
for name, page in pages.items():
    if not page.canonical or not page.og: errors.append(f'{name}: missing canonical/OG')
    if page.h1 != 1: errors.append(f'{name}: expected one H1, got {page.h1}')
    for value in page.links + page.assets + [page.og]:
        u = urlsplit(value)
        if u.scheme and u.netloc != 'shiptocash.com': continue
        if not u.path and not u.fragment: continue
        path = unquote(u.path)
        if path.startswith('/'):
            target = DIST / path.lstrip('/')
        elif not path: target = page.path
        else: target = page.path.parent / path
        if target.is_dir(): target /= 'index.html'
        if not target.exists(): errors.append(f'{name}: missing {value}'); continue
        links += 1
        if u.fragment and target.suffix == '.html':
            key = target.relative_to(DIST).as_posix()
            anchors += 1
            if unquote(u.fragment) not in pages[key].ids: errors.append(f'{name}: missing anchor {value}')
    if name.count('/') == 2 and name.split('/')[0] in ('deploy', 'payments', 'monetize'):
        types = {v.get('@type') for s in page.schemas for v in s.get('@graph', [s])}
        if not {'BlogPosting', 'BreadcrumbList', 'FAQPage'} <= types:
            errors.append(f'{name}: missing article schema')
    if page.canonical:
        expected = 'https://shiptocash.com/' + name.removesuffix('index.html')
        if page.canonical != expected: errors.append(f'{name}: canonical mismatch')
for p in (ROOT / 'public').glob('og-*.jpg'):
    if p.stat().st_size > 100 * 1024: errors.append(f'{p.name}: OG exceeds 100KB')
print(json.dumps({'pages': len(pages), 'local_links_and_assets': links, 'anchors': anchors, 'errors': errors}, indent=2))
sys.exit(bool(errors))
