import React from 'react';
import { sendMessage } from '@/utils/browser';
import {
  type BackgroundImageCache,
  type BackgroundMedia,
  CUSTOM_INDEX_KEY,
  CUSTOM_URLS_KEY,
  FETCH_TIMEOUT_MS,
  buildDynamicRequest,
  detectMediaType,
  preloadMedia,
  readCustomIndex,
  readCustomUrls,
} from './backgroundMediaHelpers';

export type { BackgroundMedia, BackgroundMediaType } from './backgroundMediaHelpers';

export interface BackgroundMediaApi {
  media: BackgroundMedia | null;
  isSwitching: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  ensureVideoPlayback: () => void;
  switchMedia: () => void;
  handleError: () => void;
}

export const useBackgroundMedia = (): BackgroundMediaApi => {
  const [media, setMedia] = React.useState<BackgroundMedia | null>(null);
  const [isSwitching, setIsSwitching] = React.useState(false);
  const [customUrls, setCustomUrls] = React.useState<string[]>(() => readCustomUrls());
  const [customIndex, setCustomIndex] = React.useState<number>(() => readCustomIndex());
  const requestIdRef = React.useRef(0);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const loadDynamic = React.useCallback(async (forceRefresh: boolean): Promise<boolean> => {
    const requestId = ++requestIdRef.current;
    if (!forceRefresh) {
      try {
        const stored = localStorage.getItem('backgroundImage');
        if (stored) {
          const parsed: BackgroundImageCache = JSON.parse(stored);
          const cachedSource = parsed?.base64 || parsed?.url;
          if (typeof cachedSource === 'string' && cachedSource) {
            setMedia({ src: cachedSource, type: 'image' });
            if (new Date(parsed.timestamp).toDateString() === new Date().toDateString()) return true;
          }
        }
      } catch (error) {
        console.warn('Failed to read background cache', error);
      }
    }
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const { imageUrl, fallbackUrls } = buildDynamicRequest();
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Background script response timeout')), FETCH_TIMEOUT_MS);
      });
      const fetchPromise = sendMessage({ action: 'fetchBackgroundImage', url: imageUrl, fallbackUrls });
      const response = await Promise.race([fetchPromise, timeoutPromise]) as { success?: boolean; data?: string };
      clearTimeout(timeoutId);
      if (requestIdRef.current !== requestId) return false;
      if (response?.success && typeof response.data === 'string' && response.data) {
        const base64Image = response.data;
        await preloadMedia(base64Image, 'image');
        if (requestIdRef.current !== requestId) return false;
        setMedia({ src: base64Image, type: 'image' });
        try {
          localStorage.setItem('backgroundImage', JSON.stringify({
            url: imageUrl, base64: base64Image, timestamp: Date.now(),
          } satisfies BackgroundImageCache));
        } catch (error) {
          // Quota failure should not discard an image that is already usable.
          console.warn('Failed to cache background image', error);
        }
        return true;
      }
      console.warn('Background script returned no image', response);
    } catch (error) {
      console.warn('Failed to fetch background image:', error);
    } finally {
      clearTimeout(timeoutId);
    }
    // Keep the old image visible when refresh fails.
    return false;
  }, []);

  const loadCustom = React.useCallback(async (startIndex: number): Promise<boolean> => {
    if (!customUrls.length) return false;
    const requestId = ++requestIdRef.current;
    for (let attempt = 0; attempt < customUrls.length; attempt += 1) {
      const idx = (startIndex + attempt + customUrls.length) % customUrls.length;
      const url = customUrls[idx];
      const type = detectMediaType(url);
      try {
        await preloadMedia(url, type);
        if (requestIdRef.current !== requestId) return true;
        setMedia({ src: url, type });
        setCustomIndex(idx);
        try { localStorage.setItem(CUSTOM_INDEX_KEY, String(idx)); } catch { /* Keep the loaded media. */ }
        return true;
      } catch (error) {
        console.error(`Failed to load custom background: ${url}`, error);
      }
    }
    return false;
  }, [customUrls]);

  React.useEffect(() => {
    let active = true;
    const init = async () => {
      if (customUrls.length > 0) {
        const ok = await loadCustom(readCustomIndex());
        if (ok || !active) return;
      }
      if (active) await loadDynamic(false);
    };
    void init();
    return () => {
      active = false;
      requestIdRef.current += 1;
    };
  }, [customUrls, loadCustom, loadDynamic]);

  React.useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === CUSTOM_URLS_KEY || event.key === CUSTOM_INDEX_KEY) {
        setCustomUrls(readCustomUrls());
        setCustomIndex(readCustomIndex());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const ensureVideoPlayback = React.useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.play().catch((error) => console.warn('Failed to start video playback', error));
  }, []);

  React.useEffect(() => {
    if (media?.type === 'video') ensureVideoPlayback();
  }, [media, ensureVideoPlayback]);

  const switchMedia = React.useCallback(() => {
    setIsSwitching(true);
    void (async () => {
      try {
        if (customUrls.length > 0) {
          const ok = await loadCustom(customIndex + 1);
          if (!ok) await loadDynamic(true);
        } else {
          await loadDynamic(true);
        }
      } finally {
        setIsSwitching(false);
      }
    })();
  }, [customUrls.length, customIndex, loadCustom, loadDynamic]);

  React.useEffect(() => {
    if (customUrls.length) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const next = new Date();
      next.setHours(24, 0, 0, 0);
      timer = setTimeout(() => { void loadDynamic(false); schedule(); }, next.getTime() - Date.now());
    };
    schedule();
    return () => clearTimeout(timer);
  }, [customUrls.length, loadDynamic]);

  const handleError = React.useCallback(() => {
    // Never retry the same broken cache entry indefinitely.
    try { localStorage.removeItem('backgroundImage'); } catch { /* ignore */ }
    setMedia(null);
    void loadDynamic(true);
  }, [loadDynamic]);

  return { media, isSwitching, videoRef, ensureVideoPlayback, switchMedia, handleError };
};
