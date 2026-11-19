import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Loader } from '../components/ui';
import { countryName, flagOf } from '../lib/countries';

/* ------------------------------------------------------------------ */
/* Thống kê sản phẩm cho quản trị viên.                                */
/* Nguồn: users/{uid} (kèm stats do máy người dùng tự tính), trips,    */
/* và các phép đếm trên máy chủ (getCountFromServer).                 */
/* Định nghĩa + truy vấn chi tiết: docs/METRICS.md                    */
/* ------------------------------------------------------------------ */

const DAY = 864e5;
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const ms = (v) => (v?.toMillis ? v.toMillis() : typeof v === 'number' ? v : v ? Date.parse(v) || 0 : 0);
const weekStart = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // thứ Hai
  return d.getTime();
};
const fmtWeek = (t, lang) => new Date(t).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit' });

/** Tính toàn bộ chỉ số từ danh sách người dùng + chuyến đi (thuần, dễ kiểm thử) */
export function computeInsights(users, trips, now = Date.now()) {
  const U = users || [];
  const T = trips || [];
  const created = (u) => ms(u.createdAt);
  const last = (u) => ms(u.lastLoginAt);
  const st = (u) => u.stats || {};
  const activeIn = (d) => U.filter((u) => now - last(u) < d * DAY).length;
  const actedIn = (d) => U.filter((u) => now - ms(st(u).lastActionAt) < d * DAY).length;
  const dau = activeIn(1);
  const wau = activeIn(7);
  const mau = activeIn(30);

  // Phễu kích hoạt
  const saved = U.filter((u) => (st(u).visited || 0) + (st(u).wishlist || 0) > 0).length;
  const checkedIn = U.filter((u) => (st(u).memories || 0) > 0).length;
  const tripped = U.filter((u) => (st(u).trips || 0) > 0).length;
  const grouped = U.filter((u) => (st(u).groupTrips || 0) > 0).length;
  const ttfc = U.filter((u) => st(u).firstCheckinAt && created(u)).map((u) => Math.max(0, (st(u).firstCheckinAt - created(u)) / DAY));

  // Đăng ký theo tuần (12 tuần gần nhất) + giữ chân theo nhóm tuần đăng ký (8 tuần)
  const thisWeek = weekStart(now);
  const weeks = Array.from({ length: 12 }, (_, i) => thisWeek - (11 - i) * 7 * DAY);
  const signups = weeks.map((w) => ({ w, n: U.filter((u) => created(u) >= w && created(u) < w + 7 * DAY).length }));
  const cohorts = weeks.slice(-9, -1).map((w) => {
    const c = U.filter((u) => created(u) >= w && created(u) < w + 7 * DAY);
    const back = (d) => c.filter((u) => last(u) - created(u) >= d * DAY).length;
    const eligible = (d) => now - (w + 7 * DAY) >= d * DAY; // nhóm đủ "tuổi" để đo
    return { w, n: c.length, d1: back(1), d7: eligible(7) ? back(7) : null, d30: eligible(30) ? back(30) : null };
  });

  // Mức độ sử dụng (trên người dùng đã kích hoạt)
  const activeUsers = U.filter((u) => (st(u).visited || 0) + (st(u).memories || 0) > 0);
  const avg = (k) => (activeUsers.length ? Math.round((activeUsers.reduce((n, u) => n + (st(u)[k] || 0), 0) / activeUsers.length) * 10) / 10 : 0);
  const totalMem = U.reduce((n, u) => n + (st(u).memories || 0), 0);
  const totalPublic = U.reduce((n, u) => n + (st(u).publicMemories || 0), 0);
  const totalPhotos = U.reduce((n, u) => n + (st(u).photos || 0), 0);
  const totalVisited = U.reduce((n, u) => n + (st(u).visited || 0), 0);

  // Chuyến đi
  const members = T.map((t) => t.memberIds?.length || 0);
  const groupTrips = T.filter((t) => (t.memberIds?.length || 0) > 1).length;
  const trips30 = T.filter((t) => now - ms(t.createdAt) < 30 * DAY).length;

  // Điểm đến: số người đã đến mỗi quốc gia; điểm đến của các chuyến đi
  const byCountry = {};
  U.forEach((u) => (st(u).countries || []).forEach((cc) => (byCountry[cc] = (byCountry[cc] || 0) + 1)));
  const topCountries = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const byDest = {};
  T.forEach((t) => (t.destinations || []).forEach((d) => d?.cc && (byDest[d.cc] = (byDest[d.cc] || 0) + 1)));
  const topDest = Object.entries(byDest).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return {
    total: U.length,
    new7: U.filter((u) => now - created(u) < 7 * DAY).length,
    new30: U.filter((u) => now - created(u) < 30 * DAY).length,
    dau, wau, mau,
    stickiness: pct(dau, mau),
    wat: actedIn(7),
    funnel: [
      { id: 'signup', n: U.length },
      { id: 'saved', n: saved },
      { id: 'checkin', n: checkedIn },
      { id: 'trip', n: tripped },
      { id: 'group', n: grouped },
    ],
    ttfcMedian: median(ttfc),
    signups,
    cohorts,
    avgVisited: avg('visited'),
    avgMemories: avg('memories'),
    avgCountries: activeUsers.length ? Math.round((activeUsers.reduce((n, u) => n + (st(u).countries?.length || 0), 0) / activeUsers.length) * 10) / 10 : 0,
    totalMem, totalPublic, totalPhotos, totalVisited,
    publicShare: pct(totalPublic, totalMem),
    trips: T.length, trips30, groupTrips,
    groupShare: pct(groupTrips, T.length),
    avgMembers: T.length ? Math.round((members.reduce((a, b) => a + b, 0) / T.length) * 10) / 10 : 0,
    topCountries, topDest,
    withStats: U.filter((u) => u.stats).length,
  };
}

function Kpi({ icon, value, label, hint, tone }) {
  return (
    <div className={`kpi ${tone ? `kpi--${tone}` : ''}`} title={hint}>
      <span className="kpi__icon">{icon}</span>
      <b>{value ?? '—'}</b>
      <small>{label}</small>
      {hint && <em>{hint}</em>}
    </div>
  );
}

function Bars({ rows, max }) {
  const top = max || Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="ibars">
      {rows.map((r) => (
        <div key={r.key} className="ibars__row">
          <span className="ibars__label">{r.label}</span>
          <div className="ibars__track">
            <i style={{ width: `${(r.n / top) * 100}%` }} />
          </div>
          <b>{r.value ?? r.n}</b>
        </div>
      ))}
    </div>
  );
}

export default function AdminInsights({ users, trips }) {
  const { t, lang } = useI18n();
  const { adminApi } = useApp();
  const [counts, setCounts] = useState(null);
  const [stamp, setStamp] = useState(Date.now());
  useEffect(() => {
    let alive = true;
    setCounts(null);
    adminApi
      .counts()
      .then((c) => alive && setCounts(c))
      .catch(() => alive && setCounts({}));
    return () => {
      alive = false;
    };
  }, [adminApi, stamp]);
  const m = useMemo(() => computeInsights(users, trips, stamp), [users, trips, stamp]);
  if (!users || !trips) return <Loader />;
  const f0 = m.funnel[0].n || 1;
  return (
    <div className="stack insights">
      <div className="row wrap insights__head">
        <p className="small muted grow">{t('ins.source', { n: m.withStats, total: m.total })}</p>
        <button className="btn btn--sm btn--soft" onClick={() => setStamp(Date.now())}>
          🔄 {t('ins.refresh')}
        </button>
      </div>

      <section className="stack-sm">
        <h3 className="h3">⭐ {t('ins.north')}</h3>
        <div className="kpis">
          <Kpi icon="🧭" tone="brand" value={m.wat} label={t('ins.wat')} hint={t('ins.watHint')} />
          <Kpi icon="👥" value={m.total} label={t('ins.total')} />
          <Kpi icon="✨" value={m.new7} label={t('ins.new7')} hint={t('ins.new30', { n: m.new30 })} />
          <Kpi icon="📅" value={m.dau} label="DAU" hint={t('ins.dauHint')} />
          <Kpi icon="🗓️" value={m.wau} label="WAU" hint={t('ins.wauHint')} />
          <Kpi icon="📆" value={m.mau} label="MAU" hint={t('ins.mauHint')} />
          <Kpi icon="🧲" value={`${m.stickiness}%`} label={t('ins.stickiness')} hint={t('ins.stickinessHint')} />
        </div>
      </section>

      <div className="grid-2 grid-2--wide">
        <section className="card stack-sm">
          <h3 className="h3">🚀 {t('ins.funnel')}</h3>
          <p className="tiny muted">{t('ins.funnelHint')}</p>
          <Bars
            max={f0}
            rows={m.funnel.map((s) => ({ key: s.id, label: t('ins.f.' + s.id), n: s.n, value: `${s.n} · ${pct(s.n, f0)}%` }))}
          />
          <p className="small">
            ⏱️ {t('ins.ttfc')}: <b>{m.ttfcMedian == null ? '—' : t('ins.days', { n: Math.round(m.ttfcMedian * 10) / 10 })}</b>
          </p>
        </section>
        <section className="card stack-sm">
          <h3 className="h3">📈 {t('ins.signups')}</h3>
          <div className="spark">
            {m.signups.map((s, i, all) => {
              const max = Math.max(1, ...all.map((x) => x.n));
              // chiều cao tính bằng px (Safari trên iPhone tính % trong flex không ổn định)
              const h = s.n ? Math.max(6, Math.round((s.n / max) * 110)) : 2;
              return (
                <div key={s.w} className={`spark__col ${(all.length - 1 - i) % 2 ? 'spark__col--alt' : ''}`} title={`${fmtWeek(s.w, lang)}: ${s.n}`}>
                  {s.n > 0 && <b className="spark__val">{s.n}</b>}
                  <i style={{ height: `${h}px` }} />
                  <small>{fmtWeek(s.w, lang)}</small>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="card stack-sm">
        <h3 className="h3">🔁 {t('ins.retention')}</h3>
        <p className="tiny muted">{t('ins.retentionHint')}</p>
        <div className="cohort">
          <div className="cohort__row cohort__row--head">
            <span>{t('ins.cohort')}</span>
            <span>{t('ins.users')}</span>
            <span>≥1 {t('ins.day')}</span>
            <span>≥7 {t('ins.day')}</span>
            <span>≥30 {t('ins.day')}</span>
          </div>
          {m.cohorts.map((c) => (
            <div key={c.w} className="cohort__row">
              <span>{fmtWeek(c.w, lang)}</span>
              <span>{c.n}</span>
              {[c.d1, c.d7, c.d30].map((v, i) => (
                <span key={i} className="cohort__cell" style={{ '--a': v == null || !c.n ? 0 : v / c.n }}>
                  {v == null ? '…' : c.n ? `${pct(v, c.n)}%` : '—'}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="stack-sm">
        <h3 className="h3">📸 {t('ins.engagement')}</h3>
        <div className="kpis">
          <Kpi icon="👣" value={m.totalVisited} label={t('ins.totalVisited')} hint={t('ins.perActive', { n: m.avgVisited })} />
          <Kpi icon="📍" value={m.totalMem} label={t('ins.checkins')} hint={t('ins.perActive', { n: m.avgMemories })} />
          <Kpi icon="🖼️" value={m.totalPhotos} label={t('ins.photos')} />
          <Kpi icon="🌍" value={`${m.publicShare}%`} label={t('ins.publicShare')} hint={t('ins.publicCount', { n: counts?.publicMemories ?? m.totalPublic })} />
          <Kpi icon="🌏" value={m.avgCountries} label={t('ins.avgCountries')} />
        </div>
      </section>

      <section className="stack-sm">
        <h3 className="h3">🧳 {t('ins.tripsTitle')}</h3>
        <div className="kpis">
          <Kpi icon="🧳" value={counts?.trips ?? m.trips} label={t('ins.trips')} hint={t('ins.trips30', { n: m.trips30 })} />
          <Kpi icon="👯" value={`${m.groupShare}%`} label={t('ins.groupShare')} hint={t('ins.avgMembers', { n: m.avgMembers })} />
          <Kpi icon="🗓️" value={counts?.planItems} label={t('ins.planItems')} hint={m.trips ? t('ins.perTrip', { n: counts?.planItems == null ? '—' : Math.round((counts.planItems / m.trips) * 10) / 10 }) : ''} />
          <Kpi icon="💰" value={counts?.costItems} label={t('ins.costItems')} hint={m.trips ? t('ins.perTrip', { n: counts?.costItems == null ? '—' : Math.round((counts.costItems / m.trips) * 10) / 10 }) : ''} />
          <Kpi icon="✅" value={counts?.checklists} label={t('ins.checklists')} />
          <Kpi icon="🚩" value={counts?.openReports} label={t('ins.openReports')} tone={counts?.openReports ? 'warn' : ''} />
        </div>
        {!counts && <Loader size="sm" />}
      </section>

      <div className="grid-2 grid-2--wide">
        <section className="card stack-sm">
          <h3 className="h3">🌏 {t('ins.topCountries')}</h3>
          {m.topCountries.length ? (
            <Bars rows={m.topCountries.map(([cc, n]) => ({ key: cc, label: `${flagOf(cc)} ${countryName(cc)}`, n }))} />
          ) : (
            <p className="muted">—</p>
          )}
        </section>
        <section className="card stack-sm">
          <h3 className="h3">✈️ {t('ins.topDest')}</h3>
          {m.topDest.length ? <Bars rows={m.topDest.map(([cc, n]) => ({ key: cc, label: `${flagOf(cc)} ${countryName(cc)}`, n }))} /> : <p className="muted">—</p>}
        </section>
      </div>
      <p className="tiny muted">{t('ins.footer')}</p>
    </div>
  );
}
