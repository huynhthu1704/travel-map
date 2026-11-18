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
        <button className="fb-tab fb-ignore" onClick={() => requireLogin(() => setModal({ type: 'feedback' }), t('fb.loginReason'))} title={t('fb.open')}>
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
