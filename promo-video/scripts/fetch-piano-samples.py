"""Fetch the pinned CC BY 3.0 Salamander piano subset through GitHub CLI.

Run only when restoring the original samples. Rendering is completely offline.
"""
import base64
import json
import pathlib
import subprocess
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'audio-sources' / 'salamander'
REVISION = '3382bf9496bba2486f5ab0de55a264d1dfc38404'
OUT.mkdir(parents=True, exist_ok=True)

def fetch(relative, destination):
    route = f'repos/sfzinstruments/SalamanderGrandPiano/contents/{urllib.parse.quote(relative)}?ref={REVISION}'
    data = json.loads(subprocess.check_output(['gh', 'api', route]))
    if not data.get('content'):
        data = json.loads(subprocess.check_output(['gh', 'api', f"repos/sfzinstruments/SalamanderGrandPiano/git/blobs/{data['sha']}"]))
    destination.write_bytes(base64.b64decode(data['content']))
    print(destination.name, destination.stat().st_size)

fetch('LICENSE', OUT / 'LICENSE-CC-BY-3.0.txt')
fetch('README.md', OUT / 'UPSTREAM-README.md')
for octave in range(2, 6):
    for note in ['C', 'D#', 'F#', 'A']:
        if octave == 2 and note != 'A':
            continue
        filename = f'{note}{octave}v6.flac'
        fetch(f'Samples/{filename}', OUT / filename)

(OUT / 'provenance.json').write_text(json.dumps({
    'instrument': 'Salamander Grand Piano v3',
    'author': 'Alexander Holm',
    'mapping': 'kinwie / sfzinstruments (FLAC conversion)',
    'license': 'Creative Commons Attribution 3.0 Unported',
    'licenseUrl': 'https://creativecommons.org/licenses/by/3.0/',
    'source': 'https://github.com/sfzinstruments/SalamanderGrandPiano',
    'originalSource': 'https://archive.org/details/SalamanderGrandPianoV3',
    'revision': REVISION,
    'subset': 'A2–A5, minor-third sampling, velocity layer 6',
    'modifications': 'Pitch-shifted within two semitones, shorter performance releases, stereo room return and mastering.'
}, indent=2) + '\n', encoding='utf8')
