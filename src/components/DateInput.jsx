import { useEffect, useRef, useState } from 'react';

const toDisplay = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
};
const toIso = (text) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};
/** Tự chèn dấu "/" khi gõ: 07052025 → 07/05/2025 */
const mask = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
};

/**
 * Ô nhập ngày luôn hiển thị DD/MM/YYYY (không phụ thuộc ngôn ngữ trình duyệt).
 * value / onChange dùng định dạng ISO 'YYYY-MM-DD' ('' = để trống). Nút 📅 mở lịch của trình duyệt.
 */
export default function DateInput({ value, onChange, max, ariaLabel }) {
  const [text, setText] = useState(toDisplay(value));
  const [invalid, setInvalid] = useState(false);
  const pickerRef = useRef(null);
  useEffect(() => {
    setText(toDisplay(value));
    setInvalid(false);
  }, [value]);

  const commit = (t) => {
    if (!t.trim()) {
      setInvalid(false);
      if (value) onChange('');
      return;
    }
    const iso = toIso(t);
    if (!iso || (max && iso > max)) return setInvalid(true);
    setInvalid(false);
    if (iso !== value) onChange(iso);
  };

  return (
    <div className={`date-input ${invalid ? 'is-invalid' : ''}`}>
      <input
        inputMode="numeric"
        placeholder="DD/MM/YYYY"
        value={text}
        aria-label={ariaLabel}
        onChange={(e) => {
          const t = mask(e.target.value);
          setText(t);
          if (t.length === 10) commit(t);
        }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      <button
        type="button"
        className="date-input__btn"
        aria-label="📅"
        onClick={() => {
          const el = pickerRef.current;
          if (!el) return;
          try {
            el.showPicker();
          } catch {
            el.focus();
            el.click();
          }
        }}
      >
        📅
      </button>
      <input
        ref={pickerRef}
        type="date"
        className="date-input__native"
        tabIndex={-1}
        aria-hidden
        value={value || ''}
        max={max}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
