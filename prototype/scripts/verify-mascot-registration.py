from pathlib import Path
import json
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[1]
settings = json.loads((root / 'public/style-2/manifest.json').read_text())['mascot']
reference = settings['registration']['idle']


def anchor(frame):
    ys, xs = np.where(frame[:, :, 3] > 180)
    bottom = int(ys.max())
    return [float(xs[ys > bottom - 36].mean()), bottom, int(ys.min())]


def verify(name, frames, registration):
    measured = np.array([anchor(frame) for frame in frames])
    expected = [registration['footX'], registration['footY'], registration['headY']]
    assert np.max(np.abs(measured[0] - expected)) < .01, f'{name}: stale registration'
    scale = (reference['footY'] - reference['headY']) / (registration['footY'] - registration['headY'])
    # Natural contour changes are tolerated; a moving standing position is not.
    drift = np.ptp(measured[:, :2], axis=0) * scale
    assert drift[0] < 4 and drift[1] <= 1, f'{name}: feet drift {drift}'
    print(f'{name}: {len(frames)} frames, foot drift {drift.round(3).tolist()} at 960px height')


def video(path, registration):
    width, height = registration['canvas']
    raw = subprocess.check_output([
        imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-c:v', 'libvpx-vp9',
        '-i', str(path), '-f', 'rawvideo', '-pix_fmt', 'rgba', '-',
    ])
    return np.frombuffer(raw, np.uint8).reshape(-1, height, width, 4)


verify('idle', video(root / 'public/style-2/media/priest-motion.webm', reference), reference)
for name, spec in settings['reactions'].items():
    poster = np.asarray(Image.open(root / ('public' + spec['poster'])).convert('RGBA'))
    verify(name + ' poster', [poster], spec['registration']['poster'])
    if spec.get('src'):
        path = root / ('public' + spec['src'].split('?')[0])
        verify(name, video(path, spec['registration']['video']), spec['registration']['video'])
