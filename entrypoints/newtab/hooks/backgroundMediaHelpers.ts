export type BackgroundMediaType = 'image' | 'video';

export interface BackgroundMedia {
  src: string;
  type: BackgroundMediaType;
}

export interface BackgroundImageCache {
  url: string;
  base64?: string;
  timestamp: number;
}

export const CUSTOM_URLS_KEY = 'customBackgroundMediaUrls';
export const CUSTOM_INDEX_KEY = 'customBackgroundMediaIndex';
export const PRELOAD_TIMEOUT_MS = 15000;
export const FETCH_TIMEOUT_MS = 10000;

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|ogv|mov|m4v)(?:[?#].*)?$/i;

export const detectMediaType = (url: string): BackgroundMediaType => (
  VIDEO_EXTENSIONS.test(url) ? 'video' : 'image'
);

export const readCustomUrls = (): string[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_URLS_KEY);
    if (!raw) return [];
    return raw.split('\n').map((u) => u.trim()).filter(Boolean);
  } catch (error) {
    console.warn('Failed to read custom background URLs', error);
    return [];
  }
};

export const readCustomIndex = (): number => {
  try {
    const raw = localStorage.getItem(CUSTOM_INDEX_KEY);
    if (!raw) return 0;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
};

export const preloadMedia = (url: string, type: BackgroundMediaType): Promise<void> => {
  if (type === 'video') {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const cleanup = () => {
        window.clearTimeout(timeoutId);
        video.onloadeddata = null;
        video.onerror = null;
        video.removeAttribute('src');
        video.load();
      };
      const timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error(`Timed out preloading video: ${url}`));
      }, PRELOAD_TIMEOUT_MS);
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.onloadeddata = () => { cleanup(); resolve(); };
      video.onerror = () => { cleanup(); reject(new Error(`Failed preloading video: ${url}`)); };
      video.src = url;
      video.load();
    });
  }
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeoutId = window.setTimeout(() => {
      window.clearTimeout(timeoutId);
      image.onload = null;
      image.onerror = null;
      reject(new Error(`Timed out preloading image: ${url}`));
    }, PRELOAD_TIMEOUT_MS);
    image.onload = () => { window.clearTimeout(timeoutId); resolve(); };
    image.onerror = () => { window.clearTimeout(timeoutId); reject(new Error(`Failed preloading image: ${url}`)); };
    image.src = url;
  });
};

export const buildDynamicRequest = () => ({
  imageUrl: `https://source.unsplash.com/2560x1440/?nature,landscape&t=${Date.now()}`,
  fallbackUrls: [
    `https://picsum.photos/2560/1440?random&t=${Date.now()}`,
    `https://fastly.picsum.photos/id/${Math.floor(Math.random() * 1000)}/2560/1440.jpg`,
  ],
});
