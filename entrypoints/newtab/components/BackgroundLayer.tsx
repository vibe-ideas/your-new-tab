import React from 'react';
import type { BackgroundMedia } from '../hooks/useBackgroundMedia';

interface BackgroundLayerProps {
  media: BackgroundMedia | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onVideoReady: () => void;
  onError: () => void;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({ media, videoRef, onVideoReady, onError }) => {
  if (!media) return null;
  return (
    <>
      <div className="background-media-layer" aria-hidden="true">
        {media.type === 'video' ? (
          <video
            key={media.src}
            ref={videoRef}
            className="background-media"
            src={media.src}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onCanPlay={onVideoReady}
            onError={onError}
          />
        ) : (
          <img
            key={media.src}
            className="background-media"
            src={media.src}
            alt=""
            draggable={false}
            onError={onError}
          />
        )}
      </div>
      <div className="background-overlay" aria-hidden="true" />
    </>
  );
};
