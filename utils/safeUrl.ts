const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

export const ALLOWED_BACKGROUND_FETCH_HOSTS: ReadonlyArray<string> = [
  'images.unsplash.com',
  'source.unsplash.com',
  'picsum.photos',
  'fastly.picsum.photos',
];

const allowedBackgroundFetchHostSet = new Set(ALLOWED_BACKGROUND_FETCH_HOSTS);

export const isHttpUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value.trim());
    return HTTP_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
};

export const sanitizeHttpUrl = (value: unknown, fallback = ''): string => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  try {
    const url = new URL(trimmed);
    return HTTP_PROTOCOLS.has(url.protocol) ? url.toString() : fallback;
  } catch {
    return fallback;
  }
};

export const isHttpSearchTemplate = (template: unknown): template is string => {
  if (typeof template !== 'string' || !template.trim()) return false;
  try {
    const probe = new URL(template.replace(/{query}/g, 'x'));
    return HTTP_PROTOCOLS.has(probe.protocol);
  } catch {
    return false;
  }
};

export const isAllowedBackgroundFetchUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    if (!HTTP_PROTOCOLS.has(url.protocol)) return false;
    return allowedBackgroundFetchHostSet.has(url.hostname);
  } catch {
    return false;
  }
};
