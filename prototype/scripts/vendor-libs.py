"""Fetch pinned browser bundles and their licenses; gameplay runs without npm or a CDN."""
import base64
import hashlib
import io
import json
from pathlib import Path
import tarfile
import urllib.request

destination = Path(__file__).resolve().parents[1] / 'public/vendor'
destination.mkdir(parents=True, exist_ok=True)
packages = [
    ('pixi.js', '8.22.0', 'package/dist/pixi.min.js', 'pixi.min.js'),
    ('gsap', '3.15.0', 'package/dist/gsap.min.js', 'gsap.min.js'),
]
records = []
for name, version, member, filename in packages:
    with urllib.request.urlopen(f'https://registry.npmjs.org/{name}/{version}') as response:
        metadata = json.load(response)
    with urllib.request.urlopen(metadata['dist']['tarball']) as response:
        data = response.read()
    integrity = metadata['dist']['integrity']
    algorithm, expected = integrity.split('-', 1)
    assert base64.b64encode(hashlib.new(algorithm, data).digest()).decode() == expected
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as package:
        (destination / filename).write_bytes(package.extractfile(member).read())
        if name == 'pixi.js':
            (destination / 'pixi-csp.min.js').write_bytes(package.extractfile('package/dist/packages/unsafe-eval.min.js').read())
        license_files = [p for p in package.getnames() if p.lower() in ('package/license', 'package/license.txt', 'package/license.md')]
        if license_files:
            license_name = f'{name.replace(".", "-")}-LICENSE.txt'
            (destination / license_name).write_bytes(package.extractfile(license_files[0]).read())
        else:
            license_name = f'{name}-NOTICE.txt'
            banner = (destination / filename).read_text(encoding='utf-8').split('*/', 1)[0] + '*/'
            (destination / license_name).write_text(metadata['license'] + '\n\n' + banner + '\n', encoding='utf-8')
            (destination / f'{name}-README.md').write_bytes(package.extractfile('package/README.md').read())
    record = { 'package': name, 'version': version, 'file': filename, 'licenseFile': license_name, 'integrity': integrity, 'source': metadata['dist']['tarball'], 'sha256': hashlib.sha256((destination / filename).read_bytes()).hexdigest() }
    if name == 'pixi.js':
        record['cspAddon'] = { 'file': 'pixi-csp.min.js', 'sha256': hashlib.sha256((destination / 'pixi-csp.min.js').read_bytes()).hexdigest() }
    records.append(record)
(destination / 'versions.json').write_text(json.dumps(records, indent=2) + '\n', encoding='utf-8')
print('Vendored verified PixiJS 8.22.0 and GSAP 3.15.0 bundles and licenses.')
