import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n';
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';

// Windows không hiển thị emoji lá cờ (🇻🇳 thành "VN") → nạp font cờ khi cần
polyfillCountryFlagEmojis('Twemoji Country Flags', `${import.meta.env.BASE_URL}fonts/TwemojiCountryFlags.woff2`);

// Lăn chuột dọc trên hàng nút cuộn ngang → cuộn ngang
document.addEventListener(
  'wheel',
  (e) => {
    const row = e.target.closest?.('.chips--scroll');
    if (!row || Math.abs(e.deltaY) <= Math.abs(e.deltaX) || row.scrollWidth <= row.clientWidth) return;
    const atStart = row.scrollLeft <= 0 && e.deltaY < 0;
    const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 1 && e.deltaY > 0;
    if (atStart || atEnd) return;
    e.preventDefault();
    row.scrollLeft += e.deltaY;
  },
  { passive: false },
);
import './styles/tokens.css';
import './styles/app.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);
