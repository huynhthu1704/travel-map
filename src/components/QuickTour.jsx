import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { TOUR_STEPS } from '../data/tour';

const SEEN_KEY = 'travel-map-tour-v1';
export const startQuickTour = () => window.dispatchEvent(new Event('tour:start'));

/** Vùng hiển thị của các phần tử khớp selector (gộp lại nếu có nhiều phần tử đang hiện) */
function findRect(selector) {
  if (!selector) return null;
  let box = null;
  document.querySelectorAll(selector).forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return;
    const st = getComputedStyle(el);
    if (st.visibility === 'hidden' || st.display === 'none' || Number(st.opacity) === 0) return;
    // phần tử nằm hẳn ngoài màn hình: bỏ qua
    if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) return;
    box = box
      ? { top: Math.min(box.top, r.top), left: Math.min(box.left, r.left), right: Math.max(box.right, r.right), bottom: Math.max(box.bottom, r.bottom) }
      : { top: r.top, left: r.left, right: r.right, bottom: r.bottom };
  });
  if (!box) return null;
  const pad = 6;
  const top = Math.max(4, box.top - pad);
  const left = Math.max(4, box.left - pad);
  const right = Math.min(window.innerWidth - 4, box.right + pad);
  const bottom = Math.min(window.innerHeight - 4, box.bottom + pad);
  return { top, left, width: right - left, height: bottom - top };
}

/**
 * Hướng dẫn nhanh cho người mới: làm nổi bật từng phần của giao diện (vẫn bấm thử được),
 * kèm ảnh minh hoạ và hoạt hình nhỏ. Tự mở ở lần đầu vào web; mở lại từ trang chủ / menu tài khoản.
 */
export default function QuickTour() {
  const { view, setView, setModal, modal, setSelectedPlace } = useApp();
  const { t, lang } = useI18n();
  const [step, setStep] = useState(-1); // -1 = đang tắt
  const [rect, setRect] = useState(null);
  const [cardSize, setCardSize] = useState({ w: 360, h: 300 });
  const cardRef = useRef(null);
  const open = step >= 0;
  const s = open ? TOUR_STEPS[step] : null;
  const L = (o) => (o ? o[lang] || o.vi : '');

  const start = useCallback(() => {
    setModal(null);
    setSelectedPlace?.(null);
    setView('map');
    setStep(0);
  }, [setModal, setView, setSelectedPlace]);
  const finish = useCallback(() => {
    setStep(-1);
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* bỏ qua */
    }
  }, []);

  // Mở bằng sự kiện (nút "Hướng dẫn nhanh") + tự mở lần đầu vào trang bản đồ
  useEffect(() => {
    window.addEventListener('tour:start', start);
    return () => window.removeEventListener('tour:start', start);
  }, [start]);
  useEffect(() => {
    let seen = true;
    try {
      seen = !!localStorage.getItem(SEEN_KEY);
    } catch {
      /* bỏ qua */
    }
    if (seen || view !== 'map' || /^#\/(u|@|trips\/|place|country)/.test(location.hash)) return undefined;
    const tm = setTimeout(() => !modal && setStep(0), 1800);
    return () => clearTimeout(tm);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Theo dõi vị trí phần tử đang được làm nổi bật (trang có thể cuộn / đổi kích thước)
  useEffect(() => {
    if (!open) return undefined;
    let raf;
    const tick = () => {
      const r = findRect(s.target);
      setRect((cur) =>
        !r && !cur
          ? cur
          : r && cur && Math.abs(r.top - cur.top) < 1 && Math.abs(r.left - cur.left) < 1 && Math.abs(r.width - cur.width) < 1 && Math.abs(r.height - cur.height) < 1
            ? cur
            : r,
      );
      if (cardRef.current) {
        const c = cardRef.current.getBoundingClientRect();
        // làm tròn để không cập nhật liên tục vì sai số nhỏ
        const w = Math.round(c.width / 4) * 4;
        const h = Math.round(c.height / 4) * 4;
        setCardSize((x) => (x.w === w && x.h === h ? x : { w, h }));
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [open, s]);

  // Phím tắt
  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => {
      if (e.key === 'Escape') finish();
      else if (e.key === 'ArrowRight') setStep((x) => (x < TOUR_STEPS.length - 1 ? x + 1 : x));
      else if (e.key === 'ArrowLeft') setStep((x) => Math.max(0, x - 1));
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, finish]);

  if (!open) return null;

  const last = step === TOUR_STEPS.length - 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mobile = vw < 640;

  // Vị trí thẻ hướng dẫn: cạnh vùng nổi bật, không che nó
  let cardStyle;
  if (!rect) cardStyle = mobile ? { left: 12, right: 12, top: '50%', transform: 'translateY(-50%)' } : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  else if (mobile) {
    const centerY = rect.top + rect.height / 2;
    cardStyle = centerY < vh / 2 ? { left: 12, right: 12, bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))' } : { left: 12, right: 12, top: 76 };
    // vùng nổi bật quá lớn (bản đồ): đặt thẻ ở đáy
    if (rect.height > vh * 0.55) cardStyle = { left: 12, right: 12, bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))' };
  } else {
    const gap = 16;
    const { w, h } = cardSize;
    const clampTop = (y) => Math.max(12, Math.min(vh - h - 12, y));
    const clampLeft = (x) => Math.max(12, Math.min(vw - w - 12, x));
    let top;
    let left;
    if (rect.height > vh * 0.6 && rect.width > vw * 0.6) {
      // bản đồ chiếm gần hết màn hình: thẻ ở góc dưới phải
      top = vh - h - 28;
      left = vw - w - 28;
    } else if (rect.width < vw * 0.5 && rect.left + rect.width + gap + w <= vw - 12) {
      // ưu tiên đặt bên phải vùng nổi bật
      left = rect.left + rect.width + gap;
      top = clampTop(rect.top + rect.height / 2 - h / 2);
    } else if (rect.left - gap - w >= 12 && rect.width < vw * 0.5) {
      left = rect.left - gap - w;
      top = clampTop(rect.top + rect.height / 2 - h / 2);
    } else {
      const below = vh - (rect.top + rect.height);
      top = below >= h + gap + 12 ? rect.top + rect.height + gap : rect.top >= h + gap + 12 ? rect.top - h - gap : clampTop(vh - h - 12);
      left = clampLeft(rect.left + rect.width / 2 - w / 2);
    }
    cardStyle = { top: clampTop(top), left: clampLeft(left) };
  }

  const hole = rect;
  return (
    <div className="tour fb-ignore" role="dialog" aria-modal="true" aria-label={L(s.title)}>
      {hole ? (
        <>
          {/* 4 tấm chắn quanh vùng nổi bật: bấm ra ngoài không làm gì; bên trong vẫn bấm thử được */}
          <div className="tour__block" style={{ top: 0, left: 0, right: 0, height: hole.top }} />
          <div className="tour__block" style={{ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
          <div className="tour__block" style={{ top: hole.top, left: 0, width: hole.left, height: hole.height }} />
          <div className="tour__block" style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
          {!s.tryIt && <div className="tour__block" style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }} />}
          <div className={`tour__spot ${s.tryIt ? 'is-try' : ''}`} style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }}>
            {s.demo === 'tap' && (
              <span className="tour__tap" aria-hidden>
                <i />
                👆
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="tour__dim" />
      )}

      <div ref={cardRef} className={`tour__card ${mobile ? 'is-mobile' : ''}`} style={cardStyle} key={s.id}>
        {s.demo === 'welcome' && <WelcomeDemo />}
        {s.demo === 'done' && <DoneDemo />}
        {s.image && (
          <div className="tour__img">
            <img src={`${import.meta.env.BASE_URL}${s.image}`} alt="" loading="lazy" />
          </div>
        )}
        <div className="tour__body">
          <span className="tour__count">
            {step + 1} / {TOUR_STEPS.length}
          </span>
          <h3>{L(s.title)}</h3>
          <p>{L(s.text)}</p>
          {s.tryIt && hole && <span className="tour__try">✋ {t('tour.tryIt')}</span>}
        </div>
        <div className="tour__dots" aria-hidden>
          {TOUR_STEPS.map((x, i) => (
            <button key={x.id} className={i === step ? 'on' : i < step ? 'done' : ''} onClick={() => setStep(i)} tabIndex={-1} />
          ))}
        </div>
        <div className="tour__actions">
          {!last && (
            <button className="btn btn--sm btn--ghost" onClick={finish}>
              {t('tour.skip')}
            </button>
          )}
          <span className="tour__spacer" />
          {step > 0 && (
            <button className="btn btn--sm btn--soft" onClick={() => setStep(step - 1)}>
              ← {t('tour.back')}
            </button>
          )}
          {last ? (
            <button className="btn btn--sm btn--primary" onClick={finish} autoFocus>
              📍 {t('tour.start')}
            </button>
          ) : (
            <button className="btn btn--sm btn--primary" onClick={() => setStep(step + 1)} autoFocus>
              {step === 0 ? t('tour.go') : t('tour.next')} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Hoạt hình chào mừng: bản đồ nhỏ với các ghim lần lượt rơi xuống, nước được tô màu */
function WelcomeDemo() {
  const { t } = useI18n();
  return (
    <div className="tour-demo tour-demo--welcome" aria-hidden>
      <svg viewBox="0 0 320 150" className="tour-demo__map">
        <defs>
          <linearGradient id="tdsea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#EAF4F8" />
            <stop offset="1" stopColor="#DCEBF2" />
          </linearGradient>
        </defs>
        <rect width="320" height="150" fill="url(#tdsea)" />
        <path className="td-land td-land--1" d="M40 30 L95 22 L120 48 L108 92 L70 110 L38 84 Z" />
        <path className="td-land td-land--2" d="M140 40 L190 30 L215 62 L200 100 L160 104 L136 74 Z" />
        <path className="td-land td-land--3" d="M232 58 L280 52 L296 86 L270 120 L236 108 Z" />
        <path className="td-route" d="M78 66 C 120 20, 150 110, 176 66 S 250 40, 262 86" />
      </svg>
      <span className="td-pin" style={{ left: '22%', top: '36%', animationDelay: '0.2s' }}>📍</span>
      <span className="td-pin" style={{ left: '53%', top: '34%', animationDelay: '0.7s' }}>📸</span>
      <span className="td-pin" style={{ left: '80%', top: '50%', animationDelay: '1.2s' }}>💛</span>
      <span className="td-card" style={{ animationDelay: '1.6s' }}>
        {t('tour.demoStat')}
      </span>
    </div>
  );
}

/** Hoạt hình kết thúc: pháo giấy */
function DoneDemo() {
  const bits = ['🎉', '✨', '📍', '🌏', '✈️', '💛', '📸', '🎊'];
  return (
    <div className="tour-demo tour-demo--done" aria-hidden>
      {Array.from({ length: 18 }).map((_, i) => (
        <span key={i} style={{ left: `${(i * 53) % 100}%`, animationDelay: `${(i % 6) * 0.18}s`, fontSize: `${16 + (i % 3) * 6}px` }}>
          {bits[i % bits.length]}
        </span>
      ))}
      <div className="tour-demo__badge">🗺️</div>
    </div>
  );
}
