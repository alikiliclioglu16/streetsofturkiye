/**
 * Generates the seamless cobblestone ground texture set.
 *
 * The ground is the largest surface on screen and was a flat colour, which made
 * every prop standing on it look like it was floating in a void. It is a
 * material problem rather than a model problem, so it is generated here instead
 * of being commissioned: a Voronoi cell pattern wrapped on a torus, which makes
 * it tile without a visible seam in any direction.
 *
 * Output is greyscale on purpose. The region's own ground colour tints it at
 * render time, so one 200 KB texture serves all 81 provinces and Cappadocia
 * still looks like Cappadocia.
 *
 * Usage: node scripts/build-ground-texture.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const OUT = path.resolve('public/assets/textures');
fs.mkdirSync(OUT, { recursive: true });

const PY = `
import numpy as np
from PIL import Image

SIZE = 1024
CELLS = 9           # cobbles across the tile; a 4 m repeat gives ~44 cm stones
MORTAR = 0.055      # gap width as a fraction of cell distance
rng = np.random.default_rng(20260728)

# Seed points on a jittered grid so cobbles read as laid, not scattered.
gx, gy = np.meshgrid(np.arange(CELLS), np.arange(CELLS), indexing='ij')
seeds = np.stack([gx.ravel(), gy.ravel()], axis=1).astype(np.float64)
seeds += rng.uniform(0.18, 0.82, seeds.shape)
seeds /= CELLS

ys, xs = np.meshgrid(
    (np.arange(SIZE) + 0.5) / SIZE,
    (np.arange(SIZE) + 0.5) / SIZE,
    indexing='ij',
)
px = xs.ravel()
py = ys.ravel()

best = np.full(px.shape, 1e9)
second = np.full(px.shape, 1e9)
owner = np.zeros(px.shape, dtype=np.int32)

for i, (sx, sy) in enumerate(seeds):
    # Wrapped distance: the tile is a torus, so edges meet without a seam.
    dx = np.abs(px - sx); dx = np.minimum(dx, 1.0 - dx)
    dy = np.abs(py - sy); dy = np.minimum(dy, 1.0 - dy)
    d = np.hypot(dx, dy)
    closer = d < best
    second = np.where(closer, best, np.minimum(second, d))
    owner = np.where(closer, i, owner)
    best = np.where(closer, d, best)

edge = second - best                     # 0 at a cell border, larger inside
mortar = np.clip(edge / MORTAR, 0.0, 1.0)
mortar = mortar * mortar * (3 - 2 * mortar)   # smoothstep

# Each cobble takes its own tone, and domes very slightly towards its centre.
tone = rng.uniform(0.70, 1.0, len(seeds))[owner]
dome = np.clip(edge / (MORTAR * 5.0), 0.0, 1.0)

# Fine grain so a stone is not a flat blob up close.
grain = rng.normal(0.0, 0.035, px.shape)

# Mortar reads as a joint between stones, not as a black crack.
albedo = (0.62 + 0.38 * mortar) * tone + grain * mortar
albedo = np.clip(albedo, 0.0, 1.0).reshape(SIZE, SIZE)

height = (0.55 + 0.45 * mortar) * (0.9 + 0.1 * dome) + grain * 0.2 * mortar
height = np.clip(height, 0.0, 1.0).reshape(SIZE, SIZE)

# Rougher in the mortar, smoother on worn stone tops.
rough = np.clip(0.92 - 0.25 * mortar * tone, 0.0, 1.0).reshape(SIZE, SIZE)

def wrap_sobel(h):
    # np.roll keeps the derivative seamless across the tile edge.
    dzdx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * 0.5
    dzdy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) * 0.5
    return dzdx, dzdy

# Relief strength. The first pass used 6.0 and the street looked like cracked
# earth: every joint became a black canyon. Paving is shallow.
STRENGTH = 1.6
dzdx, dzdy = wrap_sobel(height)
nx = -dzdx * STRENGTH
ny = -dzdy * STRENGTH
nz = np.ones_like(nx)
length = np.sqrt(nx * nx + ny * ny + nz * nz)
normal = np.stack([nx / length, ny / length, nz / length], axis=-1)
normal = ((normal * 0.5 + 0.5) * 255).astype(np.uint8)

Image.fromarray((albedo * 255).astype(np.uint8), mode='L').convert('RGB').save(
    'public/assets/textures/ground_cobblestone_albedo.jpg', quality=88, optimize=True)
Image.fromarray(normal, mode='RGB').save(
    'public/assets/textures/ground_cobblestone_normal.jpg', quality=88, optimize=True)
Image.fromarray((rough * 255).astype(np.uint8), mode='L').convert('RGB').save(
    'public/assets/textures/ground_cobblestone_roughness.jpg', quality=85, optimize=True)

print(f'{SIZE}x{SIZE}, {CELLS}x{CELLS} cobbles')
`;

execFileSync('python3', ['-c', PY], { stdio: 'inherit' });

for (const file of fs.readdirSync(OUT)) {
  const bytes = fs.statSync(path.join(OUT, file)).size;
  console.log(`  ${file}  ${(bytes / 1024).toFixed(0)} KB`);
}
