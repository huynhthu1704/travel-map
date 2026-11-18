import { useEffect } from 'react';

export function Modal({ onClose, title, children, wide, className = '' }) {
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
          <button className="icon-btn" onClick={onClose} aria-label="Đóng">✕</button>
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
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
