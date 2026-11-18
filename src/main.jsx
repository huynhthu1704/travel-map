import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n';
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';

// Windows không hiển thị emoji lá cờ (🇻🇳 thành "VN") → nạp font cờ khi cần
polyfillCountryFlagEmojis('Twemoji Country Flags', `${import.meta.env.BASE_URL}fonts/TwemojiCountryFlags.woff2`);
import './styles/tokens.css';
import './styles/app.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);
