import { useEffect, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';

/**
 * Nút "Góp ý" cố định ở cạnh phải + chế độ chọn vùng trên màn hình:
 * di chuột / chạm để chọn một phần của trang → tự chụp màn hình, khoanh vùng phần đã chọn → mở form góp ý.
 * Mở chế độ chọn từ nơi khác: window.dispatchEvent(new Event('feedback:pick'))
 */
export default function FeedbackLauncher() {
  const { setModal, requireLogin, user } = useApp();
  const { t } = useI18n();
  const [picking, setPicking] = useState(false);
  const [box, setBox] = useState(null);
  const [busy, setBusy] = useState(false);
  const target = useRef(null);
  // Vị trí nút Góp ý: kéo lên / xuống, kéo sang mép trái / phải; nhớ cho lần sau
  const [pos, setPos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('travel-map-fb-pos')) || { side: 'right', top: 0.46 };
    } catch {
      return { side: 'right', top: 0.46 };
    }
  });
  const drag = useRef(null);
  const onDown = (e) => {
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
    d.moved = true;
    const top = Math.min(0.9, Math.max(0.08, e.clientY / window.innerHeight));
    setPos({ side: e.clientX < window.innerWidth / 2 ? 'left' : 'right', top });
  };
  const justDragged = useRef(false);
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false), 300);
    try {
      localStorage.setItem('travel-map-fb-pos', JSON.stringify(pos));
    } catch {
      /* bỏ qua */
    }
  };
  // Mở form bằng sự kiện click (chạm trên điện thoại cũng sinh click); bỏ qua nếu vừa kéo
  const onClick = () => {
    if (justDragged.current) return;
    requireLogin(() => setModal({ type: 'feedback' }), t('fb.loginReason'));
  };

  useEffect(() => {
    const start = () => setPicking(true);
    window.addEventListener('feedback:pick', start);
    return () => window.removeEventListener('feedback:pick', start);
  }, []);

  useEffect(() => {
    if (!picking) return undefined;
    const inUi = (el) => el?.closest?.('.fb-ignore');
    const at = (x, y) => {
      const el = document.elementFromPoint(x, y);
      if (!el || inUi(el) || el === document.body || el === document.documentElement) return null;
      return el;
    };
    const move = (e) => {
      const el = at(e.clientX, e.clientY);
      target.current = el;
      setBox(el ? el.getBoundingClientRect() : null);
    };
    const choose = async (e) => {
      if (inUi(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      const el = at(e.clientX, e.clientY) || target.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setBusy(true);
      setBox(null);
      const { captureScreen, describeElement } = await import('../lib/feedback');
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      let screenshot = '';
      try {
        screenshot = await captureScreen(rect);
      } catch {
        /* không chụp được: vẫn cho góp ý */
      }
      setBusy(false);
      setPicking(false);
      setModal({ type: 'feedback', capture: { screenshot, element: describeElement(el) } });
    };
    const block = (e) => {
      if (inUi(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const key = (e) => e.key === 'Escape' && (setPicking(false), setModal({ type: 'feedback' }));
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerdown', choose, true);
    window.addEventListener('click', block, true);
    window.addEventListener('mousedown', block, true);
    window.addEventListener('touchstart', block, { capture: true, passive: false });
    window.addEventListener('keydown', key);
    document.body.classList.add('fb-picking');
    return () => {
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerdown', choose, true);
      window.removeEventListener('click', block, true);
      window.removeEventListener('mousedown', block, true);
      window.removeEventListener('touchstart', block, { capture: true });
      window.removeEventListener('keydown', key);
      document.body.classList.remove('fb-picking');
      setBox(null);
    };
  }, [picking, setModal]);

  return (
    <>
      {!picking && (
        <button
          className={`fb-tab fb-ignore fb-tab--${pos.side}`}
          style={{ top: `${pos.top * 100}%` }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => (drag.current = null)}
          onClick={onClick}
          title={t('fb.open') + ' · ' + t('fb.dragHint')}
        >
          <span>💬</span>
          <b>{t('fb.tab')}</b>
        </button>
      )}
      {picking && (
        <>
          {box && !busy && <div className="fb-box fb-ignore" style={{ left: box.left - 4, top: box.top - 4, width: box.width + 8, height: box.height + 8 }} />}
          <div className="fb-picker-bar fb-ignore" role="status">
            {busy ? (
              <span>📸 {t('fb.capturing')}</span>
            ) : (
              <>
                <span>🎯 {t('fb.pickHint')}</span>
                <button
                  onClick={() => {
                    setPicking(false);
                    if (user) setModal({ type: 'feedback' });
                  }}
                >
                  {t('pick.cancel')}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
