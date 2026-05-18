import React from 'react';

const TOAST_AUTO_DISMISS_MS = 3500;

export interface ToastApi {
  message: string;
  show: (text: string) => void;
}

export const useToast = (): ToastApi => {
  const [message, setMessage] = React.useState('');
  const timerRef = React.useRef<number | null>(null);

  const show = React.useCallback((text: string) => {
    setMessage(text);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setMessage(''), TOAST_AUTO_DISMISS_MS);
  }, []);

  React.useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  return { message, show };
};
