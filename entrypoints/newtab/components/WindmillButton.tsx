import React from 'react';
import { t } from '@/utils/i18n';

interface WindmillButtonProps {
  onClick: () => void;
  loading: boolean;
}

export const WindmillButton: React.FC<WindmillButtonProps> = ({ onClick, loading }) => (
  <button
    type="button"
    className={`windmill-button ${loading ? 'loading' : ''}`}
    onClick={onClick}
    disabled={loading}
    aria-label={t('switchBackgroundAria')}
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </button>
);
