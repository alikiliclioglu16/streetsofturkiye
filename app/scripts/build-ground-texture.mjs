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

/* ------------------------------------------------------------------ */

/**
 * Red volcanic sand, for the Anatolian plateau.
 *
 * No cells and no mortar: dust has no joints. The structure is layered noise at
 * three scales plus faint wind ripples, which is what reads as sand rather than
 * as a flat colour with grain on it.
 */
const SAND = `
import numpy as np
from PIL import Image

SIZE = 1024
rng = np.random.default_rng(20260729)

def wrapped_noise(cells):
    """Value noise on a torus, so it tiles."""
    grid = rng.random((cells, cells))
    ys = (np.arange(SIZE) / SIZE * cells)
    xs = (np.arange(SIZE) / SIZE * cells)
    y0 = np.floor(ys).astype(int) % cells
    x0 = np.floor(xs).astype(int) % cells
    y1 = (y0 + 1) % cells
    x1 = (x0 + 1) % cells
    fy = (ys - np.floor(ys))[:, None]
    fx = (xs - np.floor(xs))[None, :]
    sy = fy * fy * (3 - 2 * fy)
    sx = fx * fx * (3 - 2 * fx)
    top = grid[np.ix_(y0, x0)] * (1 - sx) + grid[np.ix_(y0, x1)] * sx
    bottom = grid[np.ix_(y1, x0)] * (1 - sx) + grid[np.ix_(y1, x1)] * sx
    return top * (1 - sy) + bottom * sy

# Three scales: broad drifts, dune texture, then grain.
field = (
    wrapped_noise(4) * 0.5
    + wrapped_noise(11) * 0.3
    + wrapped_noise(29) * 0.2
)
field = (field - field.min()) / (field.max() - field.min())

# Wind ripples, faint and roughly parallel, the way sand actually lies.
yy, xx = np.mgrid[0:SIZE, 0:SIZE]
ripple = np.sin((xx * 0.16 + yy * 0.05) + wrapped_noise(6) * 7.0) * 0.5 + 0.5

height = np.clip(field * 0.78 + ripple * 0.22, 0, 1)
grain = rng.normal(0.0, 0.02, (SIZE, SIZE))

# Greyscale: the region's own ground colour tints it, exactly as the cobbles are
# tinted, so one set serves every dry province.
albedo = np.clip(0.62 + height * 0.34 + grain, 0, 1)
rough = np.clip(0.94 - height * 0.06, 0, 1)

def wrap_sobel(h):
    dzdx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * 0.5
    dzdy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) * 0.5
    return dzdx, dzdy

# Gentler than paving: sand has relief you can see and not relief you trip on.
STRENGTH = 0.9
dzdx, dzdy = wrap_sobel(height)
nx, ny = -dzdx * STRENGTH, -dzdy * STRENGTH
nz = np.ones_like(nx)
length = np.sqrt(nx * nx + ny * ny + nz * nz)
normal = (((np.stack([nx / length, ny / length, nz / length], axis=-1)) * 0.5 + 0.5) * 255).astype(np.uint8)

Image.fromarray((albedo * 255).astype(np.uint8), mode='L').convert('RGB').save(
    'public/assets/textures/ground_redsand_albedo.jpg', quality=88, optimize=True)
Image.fromarray(normal, mode='RGB').save(
    'public/assets/textures/ground_redsand_normal.jpg', quality=88, optimize=True)
Image.fromarray((rough * 255).astype(np.uint8), mode='L').convert('RGB').save(
    'public/assets/textures/ground_redsand_roughness.jpg', quality=85, optimize=True)

print(f'{SIZE}x{SIZE} red sand')
`;

execFileSync('python3', ['-c', SAND], { stdio: 'inherit' });

/* ------------------------------------------------------------------ */

/**
 * Dry highland steppe, for the eastern plateau.
 *
 * Neither of the other two fits Kars. Cobbles are a street and Ani has no
 * street left; red sand is Cappadocia's tuff, and using it here would put
 * Cappadocia's ground under an Armenian cathedral for no reason but that the
 * region table happened to point at it.
 *
 * What the plateau around Ani actually is: worn basalt showing through short
 * tufted grass, with stones lying loose on it. So the structure is tufts rather
 * than dunes — clustered noise at a tight scale for the grass, a sparser field
 * of hard-edged blobs for the stones, and no ripples at all, because wind moves
 * sand and does not move turf.
 */
const STEPPE = `
import numpy as np
from PIL import Image

SIZE = 1024
rng = np.random.default_rng(20260730)

def wrapped_noise(cells):
    """Value noise on a torus, so it tiles."""
    grid = rng.random((cells, cells))
    ys = (np.arange(SIZE) / SIZE * cells)
    xs = (np.arange(SIZE) / SIZE * cells)
    y0 = np.floor(ys).astype(int) % cells
    x0 = np.floor(xs).astype(int) % cells
    y1 = (y0 + 1) % cells
    x1 = (x0 + 1) % cells
    fy = (ys - np.floor(ys))[:, None]
    fx = (xs - np.floor(xs))[None, :]
    sy = fy * fy * (3 - 2 * fy)
    sx = fx * fx * (3 - 2 * fx)
    top = grid[np.ix_(y0, x0)] * (1 - sx) + grid[np.ix_(y0, x1)] * sx
    bottom = grid[np.ix_(y1, x0)] * (1 - sx) + grid[np.ix_(y1, x1)] * sx
    return top * (1 - sy) + bottom * sy

# Broad bare patches, then the tufts themselves at a tight scale.
patches = wrapped_noise(5)
tufts = wrapped_noise(38) * 0.6 + wrapped_noise(74) * 0.4
turf = np.clip(patches * 0.45 + tufts * 0.55, 0, 1)

# Loose stones: a sparse field, thresholded so they have edges. Grass fades in
# and out; a stone either is there or is not, and that difference is most of
# what makes this read as stony ground rather than as a lawn.
stone_field = wrapped_noise(17)
stones = np.clip((stone_field - 0.72) / 0.18, 0, 1)

height = np.clip(turf * 0.7 + stones * 0.5, 0, 1)
grain = rng.normal(0.0, 0.025, (SIZE, SIZE))

# Greyscale, tinted at render time by the region ground colour, exactly as the
# other two are. Stones sit brighter and much smoother than the turf around
# them, which is what catches the light on a plateau.
albedo = np.clip(0.55 + turf * 0.26 + stones * 0.22 + grain, 0, 1)
rough = np.clip(0.97 - stones * 0.30, 0, 1)

def wrap_sobel(h):
    dzdx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * 0.5
    dzdy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) * 0.5
    return dzdx, dzdy

# Stronger than sand, weaker than paving: tufts and stones have real relief.
STRENGTH = 1.35
dzdx, dzdy = wrap_sobel(height)
nx, ny = -dzdx * STRENGTH, -dzdy * STRENGTH
nz = np.ones_like(nx)
length = np.sqrt(nx * nx + ny * ny + nz * nz)
normal = (((np.stack([nx / length, ny / length, nz / length], axis=-1)) * 0.5 + 0.5) * 255).astype(np.uint8)

Image.fromarray((albedo * 255).astype(np.uint8), mode='L').convert('RGB').save(
    'public/assets/textures/ground_steppe_albedo.jpg', quality=88, optimize=True)
Image.fromarray(normal, mode='RGB').save(
    'public/assets/textures/ground_steppe_normal.jpg', quality=88, optimize=True)
Image.fromarray((rough * 255).astype(np.uint8), mode='L').convert('RGB').save(
    'public/assets/textures/ground_steppe_roughness.jpg', quality=85, optimize=True)

print(f'{SIZE}x{SIZE} highland steppe')
`;

execFileSync('python3', ['-c', STEPPE], { stdio: 'inherit' });

for (const file of fs.readdirSync(OUT)) {
  const bytes = fs.statSync(path.join(OUT, file)).size;
  console.log(`  ${file}  ${(bytes / 1024).toFixed(0)} KB`);
}
