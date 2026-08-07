export interface RuntimeConfig {
  donationApiUrl?: string;
}

declare global {
  interface Window {
    __YAZHSIV_CONFIG__?: RuntimeConfig;
  }
}

export function donationApiUrl(): string | null {
  if (typeof window === 'undefined') return null;

  const configuredUrl = window.__YAZHSIV_CONFIG__?.donationApiUrl?.trim();
  if (!configuredUrl) return null;

  try {
    const url = new URL(configuredUrl, window.location.origin);
    if (url.protocol !== 'https:' && url.origin !== window.location.origin) return null;
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}
