import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeConfigSync } from '@/utils/configSyncClient';

void initializeConfigSync().finally(() => ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
));
