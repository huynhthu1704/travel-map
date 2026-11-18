import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { getLocale } from '../lib/lang';

export function Modal({ onClose, title, children, wide, className = '' }) {
  const { t } = useI18n();
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', k);
    document.body.classList.add('no-scroll');
    return () => {
      window.removeEventListener('keydown', k);
      document.body.classList.remove('no-scroll');
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${wide ? 'modal--wide' : ''} ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__head">
          <h2 className="h3">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

export function Avatar({ name = '?', photo, size = 32 }) {
  return photo ? (
    <img className="avatar" src={photo} alt={name} width={size} height={size} referrerPolicy="no-referrer" />
  ) : (
    <span className="avatar avatar--letter" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {name.trim()[0]?.toUpperCase() || '?'}
    </span>
  );
}

export function Chip({ active, onClick, children }) {
  return (
    <button className={`chip ${active ? 'chip--on' : ''}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

/** Ảnh có hiệu ứng loading cho tới khi tải xong; lỗi tải thì hiện `fallback` */
export function LoadingImage({ src, alt, finding, fallback = null, loaderSize = 'sm', className = '', ...rest }) {
  const [state, setState] = useState('loading');
  useEffect(() => setState('loading'), [src]);
  if (!src && !finding) return fallback;
  return (
    <>
      {src && state !== 'error' && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${state === 'loaded' ? 'is-loaded' : 'is-loading'}`}
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          referrerPolicy="no-referrer"
          {...rest}
        />
      )}
      {state === 'error' && fallback}
      {(finding || (src && state === 'loading')) && <Loader size={loaderSize} overlay />}
    </>
  );
}

const OCCASIONS = {
  vi: ['🏖️ Du lịch', '💼 Công tác', '💍 Trăng mật', '👨‍👩‍👧 Đi cùng gia đình', '👯 Đi cùng bạn bè', '💑 Hẹn hò', '🎂 Sinh nhật', '🎓 Học tập', '🎒 Phượt', '🎉 Lễ hội / Sự kiện'],
  en: ['🏖️ Holiday', '💼 Business trip', '💍 Honeymoon', '👨‍👩‍👧 Family trip', '👯 With friends', '💑 Date', '🎂 Birthday', '🎓 Study', '🎒 Backpacking', '🎉 Festival / Event'],
};

/** Ô "Đến vì dịp gì?" (tuỳ chọn): gõ tự do hoặc bấm gợi ý. onCommit gọi khi chọn gợi ý / rời ô. */
export function OccasionField({ value, onChange, onCommit }) {
  const { t, lang } = useI18n();
  const commit = (v) => onCommit?.(v);
  return (
    <div className="field occasion">
      <span>{t('occasion.label')}</span>
      <input
        value={value}
        maxLength={80}
        placeholder={t('occasion.placeholder')}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => commit(e.target.value.trim())}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      <div className="chips occasion__chips">
        {(OCCASIONS[lang] || OCCASIONS.vi).map((o) => (
          <button
            type="button"
            key={o}
            className={`chip chip--sm ${value === o ? 'chip--on' : ''}`}
            onClick={() => {
              const v = value === o ? '' : o;
              onChange(v);
              commit(v);
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Hiệu ứng loading chung: logo 📍 nhảy qua lại + "Chờ chút xíu nha" */
export function Loader({ size = 'md', overlay, page, text }) {
  const { t } = useI18n();
  return (
    <div className={`loader loader--${size} ${overlay ? 'loader--overlay' : ''} ${page ? 'loader--page' : ''}`} role="status" aria-live="polite">
      <div className="loader__track" aria-hidden>
        <span className="loader__shadow" />
        <span className="loader__logo">📍</span>
      </div>
      <span className="loader__text">{text || t('common.loading')}</span>
    </div>
  );
}

export function Empty({ emoji = '🗺️', title, text, action }) {
  return (
    <div className="empty">
      <div className="empty__emoji">{emoji}</div>
      <h3 className="h3">{title}</h3>
      {text && <p className="muted">{text}</p>}
      {action}
    </div>
  );
}

export function formatDate(v) {
  if (!v) return '';
  const d = typeof v === 'string' ? new Date(v) : new Date(v?.toMillis ? v.toMillis() : v);
  if (isNaN(d)) return '';
  return d.toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
}
