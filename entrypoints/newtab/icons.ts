const MAX_INLINE_SVG_ICON_LENGTH = 12000;

export const getSafeIconImageSrc = (icon?: string | null): string | null => {
  const trimmed = icon?.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith('<svg') &&
    trimmed.length <= MAX_INLINE_SVG_ICON_LENGTH &&
    !/<script[\s>]/i.test(trimmed) &&
    !/\son[a-z]+\s*=/i.test(trimmed) &&
    !/javascript:/i.test(trimmed)
  ) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(trimmed)}`;
  }

  if (/^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
};
