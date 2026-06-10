import React from 'react';
import ReactDOM from 'react-dom/client';
import { t } from '@/utils/i18n';
import './style.css';

function PopupLauncher() {
  const openSettings = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('/settings.html') });
    window.close();
  };

  return (
    <div className="popup-launcher">
      <div className="popup-launcher-badge">Your New Tab</div>
      <p className="popup-launcher-hint">{t('popupHint')}</p>
      <button className="popup-launcher-button" onClick={openSettings} type="button">
        {t('openSettings')}
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PopupLauncher />
  </React.StrictMode>,
);
