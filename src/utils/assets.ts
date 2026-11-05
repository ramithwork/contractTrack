/**
 * Resolves static asset paths against Vite's base URL and runtime window location.
 * This guarantees assets load reliably across custom domains, localhost, and
 * repository subpaths like GitHub Pages (e.g. https://<username>.github.io/<repo-name>/).
 */
export function getAssetUrl(path: string): string {
  const cleanPath = path.replace(/^\//, '');
  const baseUrl = import.meta.env.BASE_URL || './';

  if (typeof window !== 'undefined' && window.location) {
    try {
      const combined = baseUrl.endsWith('/') ? `${baseUrl}${cleanPath}` : `${baseUrl}/${cleanPath}`;
      return new URL(combined, window.location.href).href;
    } catch {
      // Fallback below
    }
  }

  return baseUrl.endsWith('/') ? `${baseUrl}${cleanPath}` : `${baseUrl}/${cleanPath}`;
}
