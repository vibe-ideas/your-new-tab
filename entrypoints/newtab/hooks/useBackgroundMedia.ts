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
    try {
      if (forceRefresh) {
        localStorage.removeItem('backgroundImage');
      } else {
        const stored = localStorage.getItem('backgroundImage');
        if (stored) {
          const parsed: BackgroundImageCache = JSON.parse(stored);
          const cachedSource = parsed.base64 || parsed.url;
          if (cachedSource) {
            setMedia({ src: cachedSource, type: 'image' });
            return true;
          }
        }
      }
      const { imageUrl, fallbackUrls } = buildDynamicRequest();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Background script response timeout')), FETCH_TIMEOUT_MS);
      });
      const fetchPromise = sendMessage({ action: 'fetchBackgroundImage', url: imageUrl, fallbackUrls });
      const response: any = await Promise.race([fetchPromise, timeoutPromise]);
      if (requestIdRef.current !== requestId) return false;
      if (response?.success && response.data) {
        const base64Image = response.data as string;
        setMedia({ src: base64Image, type: 'image' });
        localStorage.setItem('backgroundImage', JSON.stringify({
          url: imageUrl, base64: base64Image, timestamp: Date.now(),
        } satisfies BackgroundImageCache));
        return true;
      }
      console.error('Background script returned no image', response);
    } catch (error) {
      console.error('Failed to fetch background image:', error);
    }
    if (requestIdRef.current === requestId) setMedia(null);
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
        localStorage.setItem(CUSTOM_INDEX_KEY, String(idx));
        return true;
      } catch (error) {
        console.error(`Failed to load custom background: ${url}`, error);
      }
    }
    if (requestIdRef.current === requestId) setMedia(null);
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

  const handleError = React.useCallback(() => { void loadDynamic(false); }, [loadDynamic]);

  return { media, isSwitching, videoRef, ensureVideoPlayback, switchMedia, handleError };
};
