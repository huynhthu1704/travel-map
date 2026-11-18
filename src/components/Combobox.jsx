import { useEffect, useMemo, useRef, useState } from 'react';
import { normalize } from '../lib/geo';

/**
 * Ô chọn có tìm kiếm: gõ để lọc danh sách (không phân biệt dấu), chọn bằng chuột hoặc phím ↑ ↓ Enter.
 * options: [{ value, label, icon?, group? }]. allowFree: cho phép giữ chữ tự gõ làm giá trị.
 */
export default function Combobox({ value, options, onChange, placeholder, allLabel, allowFree = false, ariaLabel, icon }) {
  const selected = options.find((o) => o.value === value);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef(null);
  const listRef = useRef(null);

  const shown = useMemo(() => {
    const n = normalize(text.trim());
    const list = n ? options.filter((o) => normalize(`${o.label} ${o.value}`).includes(n)) : options;
    return list.slice(0, 300);
  }, [options, text]);

  useEffect(() => {
    const h = (e) => !boxRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, []);
  useEffect(() => setActive(0), [text]);
  useEffect(() => {
    listRef.current?.querySelector('.combo__opt.is-active')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const pick = (v) => {
    onChange(v);
    setText('');
    setOpen(false);
  };
  const display = open ? text : selected ? selected.label : allowFree ? value || '' : '';

  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, shown.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active === 0 && allLabel) pick('');
      else if (shown[active - (allLabel ? 1 : 0)]) pick(shown[active - (allLabel ? 1 : 0)].value);
      else if (allowFree) pick(text.trim());
    } else if (e.key === 'Escape') setOpen(false);
  };

  let lastGroup = null;
  return (
    <div className={`combo ${open ? 'is-open' : ''}`} ref={boxRef}>
      {icon && <span className="combo__icon">{(!open && selected?.icon) || icon}</span>}
      <input
        value={display}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={open}
        onFocus={() => {
          setOpen(true);
          setText(allowFree ? value || '' : '');
        }}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          if (allowFree) onChange(e.target.value);
        }}
        onKeyDown={onKey}
      />
      {(value || text) && (
        <button type="button" className="combo__clear" onClick={() => pick('')} aria-label="Clear">
          ✕
        </button>
      )}
      {open && (
        <div className="combo__list" ref={listRef} role="listbox">
          {allLabel && (
            <button type="button" className={`combo__opt ${active === 0 ? 'is-active' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={() => pick('')}>
              {allLabel}
            </button>
          )}
          {shown.map((o, i) => {
            const idx = i + (allLabel ? 1 : 0);
            const header = o.group && o.group !== lastGroup ? <div className="combo__group" key={`g-${o.group}`}>{o.group}</div> : null;
            lastGroup = o.group;
            return [
              header,
              <button
                type="button"
                key={o.value}
                className={`combo__opt ${idx === active ? 'is-active' : ''} ${o.value === value ? 'is-selected' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(idx)}
                onClick={() => pick(o.value)}
              >
                {o.icon && <span className="combo__flag">{o.icon}</span>}
                {o.label}
              </button>,
            ];
          })}
          {shown.length === 0 && !allowFree && <div className="combo__empty">—</div>}
        </div>
      )}
    </div>
  );
}
