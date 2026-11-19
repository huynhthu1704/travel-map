import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';

const THRESHOLD = 72; // kéo quá khoảng này rồi thả = tải lại
const MAX = 110;

/**
 * Kéo xuống để tải lại (điện thoại / màn cảm ứng).
 * Chỉ bắt đầu khi đang ở đầu trang; bỏ qua bản đồ, bảng kéo trên bản đồ và các popup.
 */
export default function PullToRefresh() {
  const { t } = useI18n();
  const [pull, setPull] = useState(0);
  const [loading, setLoading] = useState(false);
  const st = useRef(null);

  useEffect(() => {
    if (!window.matchMedia?.('(pointer: coarse)').matches) return undefined;
    const atTop = (el) => {
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        if (n.scrollTop > 0) return false;
      }
      return (document.scrollingElement?.scrollTop || 0) <= 0;
    };
    const blocked = (el) =>
      !!el.closest?.('.map-wrap, .leaflet-container, .maplibregl-map, .modal-backdrop, .panel, .search__dropdown, .fb-picker-bar, input, textarea, select, [data-no-ptr]') ||
      document.body.classList.contains('no-scroll') ||
      document.body.classList.contains('fb-picking');
    const start = (e) => {
      if (e.touches.length !== 1 || blocked(e.target) || !atTop(e.target)) return (st.current = null);
      st.current = { y: e.touches[0].clientY, x: e.touches[0].clientX, active: false };
    };
    const move = (e) => {
      const s = st.current;
      if (!s) return;
      const dy = e.touches[0].clientY - s.y;
      const dx = Math.abs(e.touches[0].clientX - s.x);
      if (!s.active) {
        if (dy < 8 || dx > dy) {
          if (dy < 0 || dx > dy) st.current = null;
          return;
        }
        s.active = true;
      }
      if (e.cancelable) e.preventDefault(); // chặn kéo trang mặc định khi đang kéo để tải lại
      setPull(Math.min(MAX, dy * 0.5));
    };
    const end = () => {
      const s = st.current;
      st.current = null;
      if (!s?.active) return;
      setPull((p) => {
        if (p >= THRESHOLD) {
          setLoading(true);
          setTimeout(() => window.location.reload(), 250);
          return 56;
        }
        return 0;
      });
    };
    window.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
    return () => {
      window.removeEventListener('touchstart', start);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
      window.removeEventListener('touchcancel', end);
    };
  }, []);

  if (!pull && !loading) return null;
  const ready = pull >= THRESHOLD;
  return (
    <div className="ptr fb-ignore" style={{ transform: `translate(-50%, ${pull - 44}px)` }} aria-live="polite">
      <span className={`ptr__icon ${loading ? 'is-spin' : ''}`} style={{ transform: loading ? undefined : `rotate(${pull * 3}deg)` }}>
        ↻
      </span>
      <span className="ptr__text">{loading ? t('ptr.loading') : ready ? t('ptr.release') : t('ptr.pull')}</span>
    </div>
  );
}
