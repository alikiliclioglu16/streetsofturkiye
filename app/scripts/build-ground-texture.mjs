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
 * Dry highland steppe.
 *
 * Written for Kars and then replaced there by the bedrock above — Ani is a rock
 * shelf, not a meadow. Kept because it is the right ground for the rest of the
 * eastern plateau, where the next province will not be a ruin on bare stone.
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
    bot = grid[np.ix_(y1, x0)] * (1 - sx) + grid[np.ix_(y1, x1)] * sx
    return top * (1 - sy) + bot * sy

def wrap_sobel(h):
    dzdx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * 0.5
    dzdy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) * 0.5
    return dzdx, dzdy

patches = wrapped_noise(5)
tufts = wrapped_noise(38) * 0.6 + wrapped_noise(74) * 0.4
turf = np.clip(patches * 0.45 + tufts * 0.55, 0, 1)

# A stone either is there or is not; grass fades in and out. That difference is
# most of what makes this read as stony ground rather than as a lawn.
stone_field = wrapped_noise(17)
stones = np.clip((stone_field - 0.72) / 0.18, 0, 1)

height = np.clip(turf * 0.7 + stones * 0.5, 0, 1)
grain = rng.normal(0.0, 0.025, (SIZE, SIZE))

albedo = np.clip(0.55 + turf * 0.26 + stones * 0.22 + grain, 0, 1)
rough = np.clip(0.97 - stones * 0.30, 0, 1)

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

/* ------------------------------------------------------------------ */

/**
 * Fractured bedrock, for Ani.
 *
 * Ani stands on a bare rock shelf. The plateau there is broken into slabs
 * sitting at slightly different levels with crevices between them, and that
 * unevenness is most of what a child is walking on.
 *
 * So this is neither the cobbles' regular cells nor the sand's continuous
 * drift. Voronoi again, but the cells are far larger and jittered hard so no
 * two are the same shape, and **each slab carries its own height offset** —
 * which is the whole difference between a paved street and a rock shelf. A
 * flat plane with cracks drawn on it reads as a floor. Crevices are cut narrow
 * and deep rather than laid as mortar joints.
 *
 * Greyscale, tinted at render time by the region's ground colour, as the others
 * are.
 */
const ROCK = `
import numpy as np
from PIL import Image

SIZE = 1024
CELLS = 5           # slabs across the tile; a 9 m repeat gives ~1.8 m plates
rng = np.random.default_rng(20260731)

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
    bot = grid[np.ix_(y1, x0)] * (1 - sx) + grid[np.ix_(y1, x1)] * sx
    return top * (1 - sy) + bot * sy

def wrap_sobel(h):
    dzdx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * 0.5
    dzdy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) * 0.5
    return dzdx, dzdy

gx, gy = np.meshgrid(np.arange(CELLS), np.arange(CELLS), indexing='ij')
seeds = np.stack([gx.ravel(), gy.ravel()], axis=1).astype(np.float64)
seeds += rng.uniform(0.05, 0.95, seeds.shape)   # paving wants regularity; rock does not
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

for index, (sx, sy) in enumerate(seeds):
    dx = np.abs(px - sx)
    dy = np.abs(py - sy)
    dx = np.minimum(dx, 1.0 - dx)       # wrapped on a torus, so the tile has no seam
    dy = np.minimum(dy, 1.0 - dy)
    dist = np.sqrt(dx * dx + dy * dy)
    closer = dist < best
    second = np.where(closer, best, np.minimum(second, dist))
    owner = np.where(closer, index, owner)
    best = np.where(closer, dist, best)

edge = (second - best).reshape(SIZE, SIZE)
owner = owner.reshape(SIZE, SIZE)

levels = rng.uniform(0.0, 1.0, len(seeds))
slab = levels[owner]
crevice = np.clip(edge / 0.022, 0, 1)
fracture = wrapped_noise(23) * 0.6 + wrapped_noise(61) * 0.4

height = np.clip(slab * 0.55 + fracture * 0.45, 0, 1) * crevice
grain = rng.normal(0.0, 0.022, (SIZE, SIZE))

albedo = np.clip(0.42 + height * 0.46 + grain, 0, 1)
rough = np.clip(0.99 - height * 0.22, 0, 1)

STRENGTH = 2.6      # the strongest of the four; rock has relief you see standing up
dzdx, dzdy = wrap_sobel(height)
nx, ny = -dzdx * STRENGTH, -dzdy * STRENGTH
nz = np.ones_like(nx)
length = np.sqrt(nx * nx + ny * ny + nz * nz)
normal = (((np.stack([nx / length, ny / length, nz / length], axis=-1)) * 0.5 + 0.5) * 255).astype(np.uint8)

Image.fromarray((albedo * 255).astype(np.uint8), mode='L').convert('RGB').save(
    'public/assets/textures/ground_rock_albedo.jpg', quality=88, optimize=True)
Image.fromarray(normal, mode='RGB').save(
    'public/assets/textures/ground_rock_normal.jpg', quality=88, optimize=True)
Image.fromarray((rough * 255).astype(np.uint8), mode='L').convert('RGB').save(
    'public/assets/textures/ground_rock_roughness.jpg', quality=85, optimize=True)

print(f'{SIZE}x{SIZE} fractured bedrock')
`;

execFileSync('python3', ['-c', ROCK], { stdio: 'inherit' });

/* ------------------------------------------------------------------ */

/**
 * Forest floor, for Bolu.
 *
 * Bolu and Ordu are both Black Sea provinces and could not look less alike:
 * Ordu is a coast under hazelnut, Bolu is deep inland forest that turns red and
 * gold in autumn. Giving them the same cobbles would make the region look like
 * one place drawn twice, which is the fault the whole four-directions rule
 * exists to prevent.
 *
 * So this is not paving at all. Packed earth and needle litter underneath, with
 * fallen leaves lying on it — the leaves as broad soft blobs at a low count,
 * because a leaf you can count is a leaf, and a hundred of them are texture.
 * Tinted at render time by the city's own autumn ground colour, so the same
 * greyscale reads as leaf-fall rather than as mud.
 */
const FOREST = `
import numpy as np
from PIL import Image

SIZE = 1024
rng = np.random.default_rng(20260801)

def wrapped_noise(cells):
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
    bot = grid[np.ix_(y1, x0)] * (1 - sx) + grid[np.ix_(y1, x1)] * sx
    return top * (1 - sy) + bot * sy

def wrap_sobel(h):
    dzdx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * 0.5
    dzdy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) * 0.5
    return dzdx, dzdy

# The floor: damp earth with needle litter worked into it.
earth = wrapped_noise(6) * 0.5 + wrapped_noise(19) * 0.5
needles = wrapped_noise(83)

# Leaves: a sparse field thresholded so each one has an edge. Broad and few —
# a leaf you can pick out is a leaf; a thousand small ones are noise.
leaf_field = wrapped_noise(13)
leaves = np.clip((leaf_field - 0.60) / 0.16, 0, 1)
leaf_veins = wrapped_noise(52) * leaves

height = np.clip(earth * 0.4 + needles * 0.12 + leaves * 0.62, 0, 1)
grain = rng.normal(0.0, 0.02, (SIZE, SIZE))

# Leaves sit brighter than the earth and much smoother — wet leaves catch the
# light, and that contrast is most of what makes this read as autumn.
albedo = np.clip(0.36 + earth * 0.16 + leaves * 0.46 + leaf_veins * 0.08 + grain, 0, 1)
rough = np.clip(0.99 - leaves * 0.34, 0, 1)

STRENGTH = 1.6
dzdx, dzdy = wrap_sobel(height)
nx, ny = -dzdx * STRENGTH, -dzdy * STRENGTH
nz = np.ones_like(nx)
length = np.sqrt(nx * nx + ny * ny + nz * nz)
normal = (((np.stack([nx / length, ny / length, nz / length], axis=-1)) * 0.5 + 0.5) * 255).astype(np.uint8)

Image.fromarray((albedo * 255).astype(np.uint8), mode='L').convert('RGB').save(
    'public/assets/textures/ground_forest_albedo.jpg', quality=88, optimize=True)
Image.fromarray(normal, mode='RGB').save(
    'public/assets/textures/ground_forest_normal.jpg', quality=88, optimize=True)
Image.fromarray((rough * 255).astype(np.uint8), mode='L').convert('RGB').save(
    'public/assets/textures/ground_forest_roughness.jpg', quality=85, optimize=True)

print(f'{SIZE}x{SIZE} forest floor')
`;

execFileSync('python3', ['-c', FOREST], { stdio: 'inherit' });

/* ------------------------------------------------------------------ */

/**
 * Grass, and it exists for the geese.
 *
 * Rock is right for the whole site except the one corner where a flock stands.
 * Geese graze; they do not stand on bare stone. This is drawn as a patch over
 * the rock rather than as a city surface, so it is the only ground texture with
 * an alpha channel — a radial falloff, so the patch fades into the rock instead
 * of ending on a rectangle a child can see the corner of.
 *
 * PNG for the colour map, because the alpha is the point and JPEG has none.
 */
const GRASS = `
import numpy as np
from PIL import Image

SIZE = 1024
rng = np.random.default_rng(20260732)

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
    bot = grid[np.ix_(y1, x0)] * (1 - sx) + grid[np.ix_(y1, x1)] * sx
    return top * (1 - sy) + bot * sy

def wrap_sobel(h):
    dzdx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * 0.5
    dzdy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) * 0.5
    return dzdx, dzdy

blades = wrapped_noise(46) * 0.55 + wrapped_noise(97) * 0.45
clumps = wrapped_noise(7)
height = np.clip(clumps * 0.35 + blades * 0.65, 0, 1)
grain = rng.normal(0.0, 0.02, (SIZE, SIZE))

albedo = np.clip(0.58 + height * 0.34 + grain, 0, 1)
rough = np.clip(0.97 - height * 0.05, 0, 1)

# Radial falloff with the edge broken up by noise, so the patch does not end on
# a clean circle either.
yy, xx = np.mgrid[0:SIZE, 0:SIZE]
r = np.sqrt(((xx - SIZE / 2) / (SIZE / 2)) ** 2 + ((yy - SIZE / 2) / (SIZE / 2)) ** 2)
ragged = r + (wrapped_noise(9) - 0.5) * 0.22
alpha = np.clip((0.95 - ragged) / 0.42, 0, 1)

STRENGTH = 1.1
dzdx, dzdy = wrap_sobel(height)
nx, ny = -dzdx * STRENGTH, -dzdy * STRENGTH
nz = np.ones_like(nx)
length = np.sqrt(nx * nx + ny * ny + nz * nz)
normal = (((np.stack([nx / length, ny / length, nz / length], axis=-1)) * 0.5 + 0.5) * 255).astype(np.uint8)

rgba = np.dstack([
    (albedo * 255).astype(np.uint8),
    (albedo * 255).astype(np.uint8),
    (albedo * 255).astype(np.uint8),
    (alpha * 255).astype(np.uint8),
])
Image.fromarray(rgba, mode='RGBA').resize((SIZE // 2, SIZE // 2), Image.LANCZOS).save(
    'public/assets/textures/ground_grass_albedo.png', optimize=True)
Image.fromarray(normal, mode='RGB').resize((SIZE // 2, SIZE // 2), Image.LANCZOS).save(
    'public/assets/textures/ground_grass_normal.jpg', quality=88, optimize=True)
Image.fromarray((rough * 255).astype(np.uint8), mode='L').convert('RGB').resize(
    (SIZE // 2, SIZE // 2), Image.LANCZOS).save(
    'public/assets/textures/ground_grass_roughness.jpg', quality=85, optimize=True)

print(f'{SIZE}x{SIZE} grass patch with a soft edge')
`;

execFileSync('python3', ['-c', GRASS], { stdio: 'inherit' });


/**
 * Snow.
 *
 * Erzurum is the first city in the project drawn in winter, and there was no
 * surface for it — five existed, and steppe is Van's and rock is Kars's, so
 * without a sixth the coldest city in the country would walk on a neighbour's
 * summer ground.
 *
 * Snow is the hardest of the six to write, because what makes the others
 * readable is contrast and snow has almost none. Three things are stacked here,
 * in the order the eye finds them:
 *
 *  1. **Wind drift** — long, low, smooth ridges running one way. Snow that has
 *     lain a while is never flat and never random; the wind combs it.
 *  2. **Packed tracks** — darker, smoother, slightly lower, where people have
 *     walked. Without these it reads as a bedsheet.
 *  3. **Sparkle** — fine grain at very small amplitude. It is what says the
 *     surface is crystalline rather than painted.
 *
 * The albedo sits high and narrow, roughly 0.7 to 1.0. That is the whole point:
 * a snow texture with the contrast of a cobble texture is a picture of gravel.
 */
const SNOW = `
import numpy as np
from PIL import Image

SIZE = 1024
rng = np.random.default_rng(11)

ax = np.arange(SIZE)
gx, gy = np.meshgrid(ax, ax, indexing='xy')

def wrapped_noise(cells):
    """Value noise on a torus, so the tile has no seam in any direction."""
    grid = rng.random((cells, cells))
    fx = gx / SIZE * cells
    fy = gy / SIZE * cells
    x0 = np.floor(fx).astype(int) % cells
    y0 = np.floor(fy).astype(int) % cells
    x1 = (x0 + 1) % cells
    y1 = (y0 + 1) % cells
    tx = fx - np.floor(fx)
    ty = fy - np.floor(fy)
    sx = tx * tx * (3 - 2 * tx)
    sy = ty * ty * (3 - 2 * ty)
    top = grid[y0, x0] * (1 - sx) + grid[y0, x1] * sx
    bot = grid[y1, x0] * (1 - sx) + grid[y1, x1] * sx
    return top * (1 - sy) + bot * sy

# 1 - wind drift. The wave count is whole so the ridges wrap with the tile.
drift = 0.5 + 0.5 * np.sin((gx * 0.35 + gy) / SIZE * np.pi * 2 * 5 + wrapped_noise(6) * 3.4)
drift = drift ** 1.6

# 2 - packed tracks, broad and soft
packed = np.clip((wrapped_noise(5) - 0.42) * 3.2, 0.0, 1.0)

# 3 - sparkle
sparkle = wrapped_noise(180) * 0.5 + wrapped_noise(320) * 0.5

height = drift * 0.62 + (1.0 - packed) * 0.24 + sparkle * 0.14

grain = rng.normal(0.0, 0.012, (SIZE, SIZE))
albedo = np.clip(0.86 + drift * 0.14 - packed * 0.16 + sparkle * 0.03 + grain, 0.0, 1.0)

def wrap_sobel(h):
    return (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1),
            np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0))

STRENGTH = 4.5
dzdx, dzdy = wrap_sobel(height)
nx, ny = -dzdx * STRENGTH, -dzdy * STRENGTH
nz = np.ones_like(nx)
length = np.sqrt(nx * nx + ny * ny + nz * nz)
normal = (((np.stack([nx / length, ny / length, nz / length], axis=-1)) * 0.5 + 0.5) * 255).astype(np.uint8)

# Fresh snow is matte and trodden snow is polished, so the packed tracks are
# the only thing on this surface that catches a highlight. That is what makes
# a path read as a path.
rough = np.clip(0.93 - packed * 0.45 - sparkle * 0.06, 0.2, 1.0)

Image.fromarray((albedo * 255).astype(np.uint8), mode='L').convert('RGB').save(
    'public/assets/textures/ground_snow_albedo.jpg', quality=88, optimize=True)
Image.fromarray(normal, mode='RGB').save(
    'public/assets/textures/ground_snow_normal.jpg', quality=88, optimize=True)
Image.fromarray((rough * 255).astype(np.uint8), mode='L').convert('RGB').save(
    'public/assets/textures/ground_snow_roughness.jpg', quality=85, optimize=True)

print(f'{SIZE}x{SIZE} wind-drifted snow with packed tracks')
`;

execFileSync('python3', ['-c', SNOW], { stdio: 'inherit' });


for (const file of fs.readdirSync(OUT)) {
  const bytes = fs.statSync(path.join(OUT, file)).size;
  console.log(`  ${file}  ${(bytes / 1024).toFixed(0)} KB`);
}
