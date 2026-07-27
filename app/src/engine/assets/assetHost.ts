/**
 * Where binary assets are served from.
 *
 * Models live under `/assets/...` in the repository by default, which is fine
 * while the total is small. Once it is not, set `NEXT_PUBLIC_ASSET_BASE_URL` to
 * a CDN or release-asset host and the same paths resolve there instead — no
 * code change, no rebuild of the registry.
 *
 * Deliberately NOT Git LFS: Vercel refetches LFS objects on every build, and at
 * ~35 MB of heroes that exhausts the 1 GB monthly free allowance in under
 * thirty deployments, after which builds fail outright. See
 * docs/ASSET_HOSTING.md.
 */

const RAW_BASE = process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? '';

/** Base URL with any trailing slash removed; empty means "serve from this app". */
export const ASSET_BASE_URL = RAW_BASE.replace(/\/+$/, '');

/**
 * Resolves a repository-relative asset path to the URL the browser should use.
 * Absolute URLs are passed through untouched, so a single asset can be pinned
 * to a specific host without moving the rest.
 */
export function assetUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (!ASSET_BASE_URL) return path;
  return `${ASSET_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** True when binaries are being served from somewhere other than this app. */
export function usesExternalAssetHost(): boolean {
  return ASSET_BASE_URL.length > 0;
}
