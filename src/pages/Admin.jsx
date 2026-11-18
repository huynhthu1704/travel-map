import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Avatar, Empty, Loader, LoadingImage, formatDate } from '../components/ui';
import Combobox from '../components/Combobox';
import { countryName, flagOf } from '../lib/countries';
import { pName, pCity } from '../lib/lang';
import { normalize } from '../lib/geo';
import { useThumbs } from '../lib/useThumbs';
import { usePlaceImage } from '../lib/placeImage';
import { resolveGoogleMaps } from '../components/Modals';
import { ROLES, SUPER_ADMINS } from '../lib/adminStore';
import AdminInsights from './AdminInsights';
import { AdminFeedback } from '../components/Feedback';

/* ------------------------------------------------------------------ */
/* Trang quản trị: người dùng & phân quyền, kiểm duyệt nội dung,       */
/* báo cáo, địa điểm nổi tiếng, chuyến đi, cài đặt trang               */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: 'dashboard', icon: '🏠', staff: true },
  { id: 'insights', icon: '📊', admin: true },
  { id: 'users', icon: '👥', staff: true },
  { id: 'content', icon: '🖼️', staff: true },
  { id: 'feedback', icon: '💬', staff: true },
  { id: 'reports', icon: '🚩', staff: true },
  { id: 'places', icon: '🏞️', staff: true },
  { id: 'trips', icon: '🧳', staff: true },
  { id: 'settings', icon: '⚙️', admin: true },
];

export default function AdminPage() {
  const { isStaff, isAdmin, user, role, adminApi } = useApp();
  const { t } = useI18n();
  const [tab, setTab] = useState('dashboard');
  const [users, setUsers] = useState(null);
  const [memories, setMemories] = useState(null);
  const [reports, setReports] = useState(null);
  const [trips, setTrips] = useState(null);

  useEffect(() => {
    if (!isStaff) return;
    const u = [adminApi.watchUsers(setUsers), adminApi.watchModerationMemories(setMemories), adminApi.watchReports(setReports), adminApi.watchAllTrips(setTrips)];
    return () => u.forEach((f) => f && f());
  }, [isStaff, adminApi]);

  if (!user || !isStaff)
    return (
      <div className="page">
        <Empty emoji="🔒" title={t('admin.noAccess')} text={t('admin.noAccessText')} />
      </div>
    );

  const openReports = (reports || []).filter((r) => r.status === 'open').length;
  const people = mergePeople(users, trips, memories);
  const data = { users: people, memories, reports, trips };

  return (
    <div className="page admin">
      <header className="page__head">
        <div>
          <p className="eyebrow">{t('admin.eyebrow')}</p>
          <h1 className="h1">🛠️ {t('admin.title')}</h1>
          <p className="muted">
            {t('admin.youAre')} <span className={`role role--${role}`}>{t('role.' + role)}</span>
          </p>
        </div>
      </header>
      <div className="admin__layout">
        <nav className="admin__tabs">
          {TABS.filter((x) => (x.admin ? isAdmin : true)).map((x) => (
            <button key={x.id} className={tab === x.id ? 'on' : ''} onClick={() => setTab(x.id)}>
              <span>{x.icon}</span> {t('admin.tab.' + x.id)}
              {x.id === 'reports' && openReports > 0 && <b className="admin__badge">{openReports}</b>}
            </button>
          ))}
        </nav>
        <section className="admin__body">
          {tab === 'dashboard' && <Dashboard data={data} go={setTab} />}
          {tab === 'insights' && isAdmin && <AdminInsights users={people} trips={trips} />}
          {tab === 'users' && <Users users={people} />}
          {tab === 'content' && <Content memories={memories} reports={reports} />}
          {tab === 'reports' && <Reports reports={reports} />}
          {tab === 'feedback' && <AdminFeedback />}
          {tab === 'places' && <PlacesAdmin />}
          {tab === 'trips' && <TripsAdmin trips={trips} />}
          {tab === 'settings' && isAdmin && <SettingsAdmin />}
        </section>
      </div>
    </div>
  );
}

function Stat({ icon, value, label, onClick }) {
  return (
    <button className="admin-stat" onClick={onClick}>
      <span className="admin-stat__icon">{icon}</span>
      <b>{value ?? '…'}</b>
      <small>{label}</small>
    </button>
  );
}

function Dashboard({ data, go }) {
  const { t } = useI18n();
  const { customPlaces, overrides } = useApp();
  const { users, memories, reports, trips } = data;
  const day = 864e5;
  const active7 = users?.filter((u) => Date.now() - (u.lastLoginAt || 0) < 7 * day).length;
  const newUsers = users?.filter((u) => Date.now() - (u.createdAt || 0) < 7 * day).length;
  const recent = (memories || []).slice(0, 6);
  const topCountries = useMemo(() => {
    const c = {};
    (memories || []).forEach((m) => m.place?.country && (c[m.place.country] = (c[m.place.country] || 0) + 1));
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [memories]);
  return (
    <div className="stack">
      <div className="admin-stats">
        <Stat icon="👥" value={users?.length} label={t('admin.stat.users')} onClick={() => go('users')} />
        <Stat icon="🟢" value={active7} label={t('admin.stat.active7')} onClick={() => go('users')} />
        <Stat icon="✨" value={newUsers} label={t('admin.stat.new7')} onClick={() => go('users')} />
        <Stat icon="🖼️" value={memories?.filter((m) => m.visibility === 'public').length} label={t('admin.stat.public')} onClick={() => go('content')} />
        <Stat icon="🙈" value={memories?.filter((m) => m.moderated).length} label={t('admin.stat.hidden')} onClick={() => go('content')} />
        <Stat icon="🚩" value={reports?.filter((r) => r.status === 'open').length} label={t('admin.stat.reports')} onClick={() => go('reports')} />
        <Stat icon="🧳" value={trips?.length} label={t('admin.stat.trips')} onClick={() => go('trips')} />
        <Stat icon="🏞️" value={customPlaces.length + Object.keys(overrides).length} label={t('admin.stat.placeEdits')} onClick={() => go('places')} />
      </div>
      <div className="grid-2 grid-2--wide">
        <div className="card stack">
          <h3 className="h3">{t('admin.recentPublic')}</h3>
          {!memories ? <Loader /> : recent.length ? recent.map((m) => <MemoryRow key={m.id} m={m} compact />) : <p className="muted">—</p>}
        </div>
        <div className="card stack">
          <h3 className="h3">{t('admin.topCountries')}</h3>
          {topCountries.length ? (
            topCountries.map(([cc, n]) => (
              <div key={cc} className="bar-row">
                <span>
                  {flagOf(cc)} {countryName(cc)}
                </span>
                <div className="bar">
                  <i style={{ width: `${(n / topCountries[0][1]) * 100}%` }} />
                </div>
                <b>{n}</b>
              </div>
            ))
          ) : (
            <p className="muted">—</p>
          )}
          <p className="tiny muted">{t('admin.privacyNote')}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Người dùng ---------------------------- */
/**
 * Gộp hồ sơ người dùng với tên / ảnh trong chuyến đi và kỉ niệm công khai:
 * hồ sơ tạo trước khi có trang quản trị chỉ có tên tự đặt (chưa có tên Google, email),
 * và có người chưa có hồ sơ nào → vẫn hiện đúng tên / ảnh, chờ họ đăng nhập lại để có email.
 */
function mergePeople(users, trips, memories) {
  if (!users) return null;
  const extra = {};
  const add = (uid, name, photo) => {
    if (!uid) return;
    const e = (extra[uid] ||= {});
    if (name && !e.name) e.name = name;
    if (photo && !e.photo) e.photo = photo;
  };
  (trips || []).forEach((tr) => Object.entries(tr.members || {}).forEach(([uid, m]) => add(uid, m?.name, m?.photo)));
  (memories || []).forEach((m) => add(m.uid, m.authorName, m.authorPhoto));
  const seen = new Set();
  const list = users.map((u) => {
    seen.add(u.uid);
    const e = extra[u.uid] || {};
    const owner = SUPER_ADMINS.includes((u.email || '').toLowerCase());
    return {
      ...u,
      name: u.displayName || u.name || e.name || '',
      photo: u.photo || u.googlePhoto || e.photo || '',
      role: owner ? 'admin' : u.role || 'user',
      owner,
      partial: !u.email, // hồ sơ cũ: chưa có email / thông tin đăng nhập
    };
  });
  Object.entries(extra).forEach(([uid, e]) => {
    if (!seen.has(uid) && uid !== 'sample') list.push({ uid, name: e.name || '', photo: e.photo || '', role: 'user', partial: true, noDoc: true });
  });
  return list;
}


function Users({ users }) {
  const { t } = useI18n();
  const { isAdmin, user: me, adminApi, notify } = useApp();
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  if (!users) return <Loader />;
  const n = normalize(q);
  const list = users.filter(
    (u) => (roleFilter === 'all' || (roleFilter === 'banned' ? u.banned : (u.role || 'user') === roleFilter)) && (!n || normalize(`${u.name} ${u.email}`).includes(n)),
  );
  const update = async (u, patch, msg) => {
    try {
      await adminApi.updateUser(u.uid, patch);
      notify(msg);
    } catch (e) {
      notify(t('admin.error', { msg: e.message }), 'error');
    }
  };
  return (
    <div className="stack">
      <div className="admin-toolbar">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.searchUsers')} />
        <div className="segmented">
          {['all', 'admin', 'editor', 'user', 'banned'].map((r) => (
            <button key={r} className={roleFilter === r ? 'on' : ''} onClick={() => setRoleFilter(r)}>
              {r === 'all' ? t('common.all') : r === 'banned' ? t('admin.banned') : t('role.' + r)}
            </button>
          ))}
        </div>
      </div>
      {!isAdmin && <p className="small warn">{t('admin.editorUsersNote')}</p>}
      <div className="admin-table">
        <div className="admin-table__head">
          <span>{t('admin.col.user')}</span>
          <span>{t('admin.col.role')}</span>
          <span>{t('admin.col.joined')}</span>
          <span>{t('admin.col.lastLogin')}</span>
          <span>{t('admin.col.status')}</span>
        </div>
        {list.map((u) => {
          const self = u.uid === me.uid;
          const locked = self || u.owner || u.noDoc; // không đổi quyền chính mình / chủ web / người chưa có hồ sơ
          return (
            <div key={u.uid} className={`admin-table__row ${u.banned ? 'is-banned' : ''}`}>
              <span className="user-cell">
                <Avatar name={u.name || '?'} photo={u.photo} size={34} />
                <span>
                  <b>
                    {u.name || t('admin.unknownUser')}
                    {u.owner && <span className="role role--admin"> {t('admin.ownerTag')}</span>}
                  </b>
                  <small>{u.email || (u.noDoc ? t('admin.noProfile') : t('admin.oldProfile'))}</small>
                </span>
              </span>
              <span>
                {isAdmin && !locked ? (
                  <select value={u.role || 'user'} onChange={(e) => update(u, { role: e.target.value }, t('admin.roleChanged', { name: u.name, role: t('role.' + e.target.value) }))}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {t('role.' + r)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`role role--${u.role || 'user'}`}>{t('role.' + (u.role || 'user'))}</span>
                )}
              </span>
              <span className="small">{u.createdAt ? formatDate(u.createdAt) : '—'}</span>
              <span className="small">{u.lastLoginAt ? formatDate(u.lastLoginAt) : '—'}</span>
              <span>
                {isAdmin && !locked ? (
                  <button
                    className={`btn btn--sm ${u.banned ? 'btn--soft' : 'btn--ghost danger'}`}
                    onClick={() => {
                      if (!u.banned && !confirm(t('admin.confirmBan', { name: u.name }))) return;
                      update(u, { banned: !u.banned }, u.banned ? t('admin.unbanned', { name: u.name }) : t('admin.bannedDone', { name: u.name }));
                    }}
                  >
                    {u.banned ? t('admin.unban') : t('admin.ban')}
                  </button>
                ) : u.banned ? (
                  <span className="role role--banned">{t('admin.banned')}</span>
                ) : (
                  <span className="small muted">{t('admin.active')}</span>
                )}
              </span>
            </div>
          );
        })}
        {list.length === 0 && <p className="muted small" style={{ padding: 12 }}>—</p>}
      </div>
      <p className="tiny muted">{t('admin.rolesHelp')}</p>
    </div>
  );
}

/* ----------------------- Kiểm duyệt kỉ niệm & ảnh ----------------------- */
function MemoryRow({ m, compact, reportCount }) {
  const { t } = useI18n();
  const { adminApi, user, notify, setModal } = useApp();
  const act = async (fn, msg) => {
    try {
      await fn();
      notify(msg);
    } catch (e) {
      notify(t('admin.error', { msg: e.message }), 'error');
    }
  };
  return (
    <article className={`mod-row ${m.moderated ? 'is-hidden' : ''}`}>
      <button className="mod-row__photo" onClick={() => setModal({ type: 'viewMemory', memory: m })}>
        <LoadingImage src={m.photos?.[0]} alt="" fallback={<span>📝</span>} />
      </button>
      <div className="mod-row__main">
        <b>
          {flagOf(m.place?.country)} {pName(m.place)}
        </b>
        <small>
          {m.authorName} · {formatDate(m.createdAt)} · {Math.max(m.photoCount || 0, m.photos?.length || 0)} 📸
          {reportCount ? <span className="role role--banned"> 🚩 {reportCount}</span> : null}
          {m.moderated && <span className="role role--banned"> {t('admin.hiddenTag')}</span>}
        </small>
        {m.caption && !compact && <p className="small">“{m.caption}”</p>}
      </div>
      {!compact && (
        <div className="mod-row__actions">
          {m.moderated ? (
            <button className="btn btn--sm btn--soft" onClick={() => act(() => adminApi.unhideMemory(m.id), t('admin.unhidden'))}>
              👁️ {t('admin.unhide')}
            </button>
          ) : (
            <button className="btn btn--sm btn--soft" onClick={() => act(() => adminApi.hideMemory(m.id, user.uid, '', m.uid, pName(m.place)), t('admin.hiddenDone'))}>
              🙈 {t('admin.hide')}
            </button>
          )}
          <button
            className="btn btn--sm btn--ghost danger"
            onClick={() => confirm(t('admin.confirmDeleteMemory')) && act(() => adminApi.deleteMemoryAdmin(m), t('mem.deleted'))}
          >
            🗑️
          </button>
        </div>
      )}
    </article>
  );
}

function Content({ memories, reports }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  if (!memories) return <Loader />;
  const reportCount = {};
  (reports || []).forEach((r) => r.status === 'open' && (reportCount[r.memoryId] = (reportCount[r.memoryId] || 0) + 1));
  const n = normalize(q);
  const list = memories.filter((m) => {
    if (filter === 'public' && m.visibility !== 'public') return false;
    if (filter === 'hidden' && !m.moderated) return false;
    if (filter === 'reported' && !reportCount[m.id]) return false;
    return !n || normalize(`${m.authorName} ${pName(m.place)} ${pCity(m.place)} ${countryName(m.place?.country)} ${m.caption}`).includes(n);
  });
  return (
    <div className="stack">
      <div className="admin-toolbar">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.searchContent')} />
        <div className="segmented">
          {['all', 'public', 'hidden', 'reported'].map((f) => (
            <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
              {t('admin.filter.' + f)}
            </button>
          ))}
        </div>
      </div>
      <p className="tiny muted">{t('admin.privacyNote')}</p>
      {list.length ? list.map((m) => <MemoryRow key={m.id} m={m} reportCount={reportCount[m.id]} />) : <Empty emoji="🧺" title={t('admin.nothing')} />}
    </div>
  );
}

/* ------------------------------ Báo cáo ------------------------------ */
function Reports({ reports }) {
  const { t } = useI18n();
  const { adminApi, user, notify } = useApp();
  const [status, setStatus] = useState('open');
  const [openId, setOpenId] = useState(null);
  if (!reports) return <Loader />;
  const list = reports.filter((r) => (status === 'all' ? true : r.status === status));
  const act = async (fn, msg) => {
    try {
      await fn();
      notify(msg);
    } catch (e) {
      notify(t('admin.error', { msg: e.message }), 'error');
    }
  };
  return (
    <div className="stack">
      <div className="segmented admin-seg">
        {['open', 'resolved', 'dismissed', 'all'].map((s) => (
          <button key={s} className={status === s ? 'on' : ''} onClick={() => setStatus(s)}>
            {t('admin.reportStatus.' + s)}
          </button>
        ))}
      </div>
      {list.length === 0 && <Empty emoji="🎉" title={t('admin.noReports')} />}
      {list.map((r) => (
        <ReportRow key={r.id} r={r} open={openId === r.id} onToggle={() => setOpenId(openId === r.id ? null : r.id)} act={act} />
      ))}
    </div>
  );
}

/** 1 báo cáo: bấm để xem chi tiết (ảnh, ghi chú, người báo cáo, lý do) rồi mới ẩn / bỏ qua */
function ReportRow({ r, open, onToggle, act }) {
  const { t } = useI18n();
  const { adminApi, user, setModal, openProfile, api } = useApp();
  const snap = r.snapshot || {};
  const [zoom, setZoom] = useState(null); // ảnh đang xem lớn (chỉ số)
  const [full, setFull] = useState(null); // ảnh độ phân giải cao
  // Mở chi tiết: tải ảnh gốc của bài để admin xem rõ
  useEffect(() => {
    if (!open || full) return undefined;
    let alive = true;
    api
      .getPhotos({ id: r.memoryId, photoCount: snap.photoCount || 20, photos: snap.photo ? [snap.photo] : [] }, 'high')
      .then((l) => alive && setFull(l?.length ? l : null))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const memLike = useMemo(
    () => ({ id: r.memoryId, photos: snap.photo ? [snap.photo] : [], photoCount: open ? snap.photoCount || 20 : 0 }),
    [r.memoryId, snap.photo, snap.photoCount, open],
  );
  const photos = useThumbs(memLike);
  const hide = () =>
    act(async () => {
      await adminApi.hideMemory(r.memoryId, user.uid, r.reason, r.memoryOwner, pName(snap.place));
      await adminApi.updateReport(r.id, { status: 'resolved', resolvedBy: user.uid, resolvedAt: Date.now() });
    }, t('admin.hiddenDone'));
  const dismiss = () => act(() => adminApi.updateReport(r.id, { status: 'dismissed', resolvedBy: user.uid, resolvedAt: Date.now() }), t('admin.dismissed'));
  const actions =
    r.status === 'open' ? (
      <>
        <button className="btn btn--sm btn--primary" onClick={hide}>
          🙈 {t('admin.hide')}
        </button>
        <button className="btn btn--sm btn--soft" onClick={dismiss}>
          {t('admin.dismiss')}
        </button>
      </>
    ) : (
      <span className={`report-status report-status--${r.status}`}>{t('admin.reportStatus.' + r.status)}</span>
    );
  return (
    <article className={`report-card ${open ? 'is-open' : ''}`}>
      <button className="report-card__head" onClick={onToggle} aria-expanded={open}>
        <span className="mod-row__photo">
          <LoadingImage src={snap.photo} alt="" fallback={<span>📝</span>} />
        </span>
        <span className="mod-row__main">
          <b>🚩 {t('admin.reason.' + r.reason, {}) || r.reason}</b>
          <small>
            {flagOf(snap.place?.country)} {pName(snap.place)} · {t('admin.by')} {snap.authorName} · {t('admin.reportedBy')} {r.byName} · {formatDate(r.createdAt)}
          </small>
          {r.note && !open && <small className="report-card__notePreview">💬 “{r.note}”</small>}
        </span>
        <span className="report-card__toggle">{open ? t('admin.reportCollapse') : t('admin.reportView')}</span>
      </button>
      {zoom !== null && (full || photos)[zoom] && (
        <div className="report-zoom" onClick={() => setZoom(null)} role="dialog">
          <img src={(full || photos)[zoom]} alt="" onClick={(e) => e.stopPropagation()} />
          {(full || photos).length > 1 && (
            <>
              <button
                className="report-zoom__nav report-zoom__nav--prev"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom((zoom - 1 + (full || photos).length) % (full || photos).length);
                }}
              >
                ‹
              </button>
              <button
                className="report-zoom__nav report-zoom__nav--next"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom((zoom + 1) % (full || photos).length);
                }}
              >
                ›
              </button>
            </>
          )}
          <span className="report-zoom__count">
            {zoom + 1} / {(full || photos).length}
          </span>
          <button className="report-zoom__close" onClick={() => setZoom(null)}>
            ✕
          </button>
        </div>
      )}
      {open && (
        <div className="report-card__body">
          <div className="report-card__grid">
            <div className="report-card__info">
              <dl>
                <dt>{t('admin.reportReason')}</dt>
                <dd>🚩 {t('admin.reason.' + r.reason, {}) || r.reason}</dd>
                <dt>{t('admin.reportNote')}</dt>
                <dd>{r.note ? `“${r.note}”` : <span className="muted">{t('admin.reportNoNote')}</span>}</dd>
                <dt>{t('admin.reportReporter')}</dt>
                <dd>
                  <button className="link" onClick={() => openProfile(r.byUid)}>
                    {r.byName}
                  </button>{' '}
                  · {formatDate(r.createdAt)}
                </dd>
                <dt>{t('admin.reportAuthor')}</dt>
                <dd>
                  <button className="link" onClick={() => r.memoryOwner && openProfile(r.memoryOwner)}>
                    {snap.authorName || '—'}
                  </button>
                </dd>
                <dt>{t('admin.reportPlace')}</dt>
                <dd>
                  {flagOf(snap.place?.country)} {pName(snap.place)}
                  {snap.place && <small className="muted"> · {[pCity(snap.place), countryName(snap.place.country)].filter(Boolean).join(', ')}</small>}
                </dd>
                {snap.date && (
                  <>
                    <dt>{t('admin.reportDate')}</dt>
                    <dd>
                      {formatDate(snap.date)}
                      {snap.occasion ? ` · ${snap.occasion}` : ''}
                    </dd>
                  </>
                )}
                <dt>{t('admin.reportCaption')}</dt>
                <dd>{snap.caption ? `“${snap.caption}”` : <span className="muted">—</span>}</dd>
              </dl>
            </div>
            <div className="report-card__photos">
              {photos.length ? (
                (full || photos).map((src, i) => (
                  <button key={i} className="report-card__photo" onClick={() => setZoom(i)} title={t('admin.reportZoom')}>
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))
              ) : (
                <span className="muted small">{t('admin.reportNoPhoto')}</span>
              )}
              {(full || photos).length > 0 && (
                <small className="muted report-card__count">{t('admin.reportPhotoCount', { n: (full || photos).length })}</small>
              )}
            </div>
          </div>
          <div className="report-card__actions">
            <button
              className="btn btn--sm btn--ghost"
              onClick={() =>
                setModal({
                  type: 'viewMemory',
                  memory: { id: r.memoryId, uid: r.memoryOwner, authorName: snap.authorName, authorPhoto: snap.authorPhoto, place: snap.place, caption: snap.caption, date: snap.date, photos: (full || photos).length ? full || photos : snap.photo ? [snap.photo] : [], photoCount: (full || photos).length, visibility: 'public' },
                })
              }
            >
              🔍 {t('admin.reportOpenPost')}
            </button>
            <span className="report-card__spacer" />
            {actions}
            <button className="btn btn--sm btn--ghost danger" onClick={() => act(() => adminApi.deleteReport(r.id), t('mem.deleted'))} title={t('mem.delete')}>
              🗑️
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

/* ------------------------- Địa điểm nổi tiếng ------------------------- */
function PlaceAdminRow({ p, onEdit }) {
  const { t } = useI18n();
  const { adminApi, user, notify, overrides, openPlace } = useApp();
  const { src } = usePlaceImage(p);
  const ov = overrides[p.id];
  const toggleHidden = async () => {
    await adminApi.saveOverride(p.id, { hidden: !p.hidden }, user.uid);
    notify(p.hidden ? t('admin.placeShown') : t('admin.placeHidden'));
  };
  return (
    <article className={`mod-row ${p.hidden ? 'is-hidden' : ''}`}>
      <span className="mod-row__photo">
        <LoadingImage src={src} alt="" fallback={<span>{p.emoji}</span>} />
      </span>
      <div className="mod-row__main">
        <b>
          {p.emoji} {pName(p)}
        </b>
        <small>
          {pCity(p)} · {p.id.startsWith('cp-') ? t('admin.src.custom') : p.id.startsWith('wd-') ? t('admin.src.wikidata') : t('admin.src.curated')}
          {ov && <span className="role role--editor"> {t('admin.edited')}</span>}
          {p.hidden && <span className="role role--banned"> {t('admin.hiddenTag')}</span>}
        </small>
      </div>
      <div className="mod-row__actions">
        <button className="btn btn--sm btn--soft" onClick={() => openPlace(p)} title={t('common.viewOnMap')}>
          🗺️
        </button>
        <button className="btn btn--sm btn--soft" onClick={() => onEdit(p)}>
          ✏️ {t('admin.edit')}
        </button>
        <button className="btn btn--sm btn--ghost" onClick={toggleHidden}>
          {p.hidden ? `👁️ ${t('admin.unhide')}` : `🙈 ${t('admin.hide')}`}
        </button>
      </div>
    </article>
  );
}

function PlaceEditor({ place, cc, onClose }) {
  const { t } = useI18n();
  const { adminApi, user, notify, overrides } = useApp();
  const isNew = !place;
  const isCustom = isNew || place.id.startsWith('cp-');
  const ov = (place && overrides[place.id]) || {};
  const [f, setF] = useState(() => ({
    nameVi: ov.nameVi || place?.name || '',
    nameEn: ov.nameEn || place?.i18n?.en?.name || '',
    city: place?.city || '',
    cityEn: place?.i18n?.en?.city || '',
    descVi: ov.descVi || place?.desc || '',
    descEn: ov.descEn || place?.i18n?.en?.desc || '',
    image: ov.image || place?.image || '',
    emoji: place?.emoji || '📍',
    lat: place?.lat ?? '',
    lng: place?.lng ?? '',
    country: place?.country || cc,
    link: '',
  }));
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const fromLink = async () => {
    if (!f.link.trim()) return;
    setBusy(true);
    const p = await resolveGoogleMaps(f.link);
    setBusy(false);
    if (!p) return notify(t('link.notFound'), 'error');
    setF((x) => ({ ...x, lat: p.lat, lng: p.lng, country: p.country || x.country, city: x.city || p.city, nameVi: x.nameVi || p.name }));
  };

  const save = async () => {
    setBusy(true);
    try {
      if (isCustom) {
        if (!f.nameVi.trim() || f.lat === '' || f.lng === '') throw new Error(t('admin.needNameCoords'));
        await adminApi.saveCustomPlace({
          id: place?.id, name: f.nameVi.trim(), city: f.city.trim(), country: f.country, lat: Number(f.lat), lng: Number(f.lng),
          emoji: f.emoji || '📍', desc: f.descVi.trim(), image: f.image.trim(),
          i18n: { en: { name: f.nameEn.trim() || f.nameVi.trim(), city: f.cityEn.trim() || f.city.trim(), desc: f.descEn.trim() } },
        });
      } else {
        await adminApi.saveOverride(place.id, { nameVi: f.nameVi.trim(), nameEn: f.nameEn.trim(), descVi: f.descVi.trim(), descEn: f.descEn.trim(), image: f.image.trim() }, user.uid);
      }
      notify(t('admin.saved'));
      onClose();
    } catch (e) {
      notify(e.message, 'error');
      setBusy(false);
    }
  };

  return (
    <div className="card stack place-editor">
      <div className="trip-summary__head">
        <h3 className="h3">{isNew ? t('admin.addPlace') : t('admin.editPlace')}</h3>
        <button className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
          ✕
        </button>
      </div>
      {isCustom && (
        <div className="row wrap">
          <input className="grow" value={f.link} onChange={set('link')} placeholder={t('admin.fromLink')} />
          <button className="btn btn--sm btn--dark" onClick={fromLink} disabled={busy}>
            🔗 {t('link.find')}
          </button>
        </div>
      )}
      <div className="grid-2">
        <label className="field">
          <span>{t('admin.f.nameVi')}</span>
          <input value={f.nameVi} onChange={set('nameVi')} />
        </label>
        <label className="field">
          <span>{t('admin.f.nameEn')}</span>
          <input value={f.nameEn} onChange={set('nameEn')} />
        </label>
        {isCustom && (
          <>
            <label className="field">
              <span>{t('admin.f.city')}</span>
              <input value={f.city} onChange={set('city')} />
            </label>
            <label className="field">
              <span>{t('admin.f.cityEn')}</span>
              <input value={f.cityEn} onChange={set('cityEn')} />
            </label>
            <label className="field">
              <span>{t('admin.f.lat')}</span>
              <input value={f.lat} onChange={set('lat')} inputMode="decimal" />
            </label>
            <label className="field">
              <span>{t('admin.f.lng')}</span>
              <input value={f.lng} onChange={set('lng')} inputMode="decimal" />
            </label>
            <label className="field">
              <span>{t('admin.f.emoji')}</span>
              <input value={f.emoji} onChange={set('emoji')} maxLength={4} />
            </label>
            <label className="field">
              <span>{t('admin.f.country')}</span>
              <input value={`${flagOf(f.country)} ${countryName(f.country)}`} readOnly />
            </label>
          </>
        )}
        <label className="field">
          <span>{t('admin.f.descVi')}</span>
          <textarea rows={2} value={f.descVi} onChange={set('descVi')} />
        </label>
        <label className="field">
          <span>{t('admin.f.descEn')}</span>
          <textarea rows={2} value={f.descEn} onChange={set('descEn')} />
        </label>
      </div>
      <label className="field">
        <span>{t('admin.f.image')}</span>
        <input value={f.image} onChange={set('image')} placeholder="https://upload.wikimedia.org/…" />
      </label>
      {f.image && (
        <div className="place-photo place-photo--sm">
          <LoadingImage src={f.image} alt="" loaderSize="sm" />
        </div>
      )}
      <div className="row wrap">
        <button className="btn btn--primary" onClick={save} disabled={busy}>
          💾 {t('admin.save')}
        </button>
        {!isNew && !isCustom && overrides[place.id] && (
          <button
            className="btn btn--ghost"
            onClick={async () => {
              await adminApi.clearOverride(place.id);
              notify(t('admin.resetDone'));
              onClose();
            }}
          >
            ↩️ {t('admin.resetEdits')}
          </button>
        )}
        {!isNew && isCustom && (
          <button
            className="btn btn--ghost danger"
            onClick={async () => {
              if (!confirm(t('admin.confirmDeletePlace'))) return;
              await adminApi.deleteCustomPlace(place.id);
              notify(t('mem.deleted'));
              onClose();
            }}
          >
            🗑️ {t('admin.deletePlace')}
          </button>
        )}
      </div>
    </div>
  );
}

function PlacesAdmin() {
  const { t, lang } = useI18n();
  const { countries, famousFor, ensureFamous, homeCountry } = useApp();
  const [cc, setCc] = useState(homeCountry);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | place
  const [limit, setLimit] = useState(30);
  useEffect(() => ensureFamous(cc), [cc, ensureFamous]);
  const options = useMemo(
    () =>
      (countries?.features || [])
        .map((f) => f.properties.cc)
        .filter(Boolean)
        .map((c) => ({ value: c, label: countryName(c), icon: flagOf(c) }))
        .sort((a, b) => a.label.localeCompare(b.label, lang)),
    [countries, lang],
  );
  const n = normalize(q);
  const all = famousFor(cc, { includeHidden: true });
  const list = all.filter((p) => !n || normalize(`${p.name} ${pName(p)} ${p.city}`).includes(n));
  return (
    <div className="stack">
      <div className="admin-toolbar">
        <Combobox value={cc} options={options} onChange={(v) => v && (setCc(v), setLimit(30))} placeholder={t('filter.countryPlaceholder')} icon="🌏" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.searchPlaces')} />
        <button className="btn btn--primary" onClick={() => setEditing('new')}>
          ＋ {t('admin.addPlace')}
        </button>
      </div>
      {editing && <PlaceEditor key={editing === 'new' ? 'new' : editing.id} place={editing === 'new' ? null : editing} cc={cc} onClose={() => setEditing(null)} />}
      <p className="small muted">{t('admin.placesHelp', { n: all.length })}</p>
      {list.slice(0, limit).map((p) => (
        <PlaceAdminRow key={p.id} p={p} onEdit={setEditing} />
      ))}
      {list.length > limit && (
        <button className="btn btn--soft" onClick={() => setLimit((x) => x + 30)}>
          {t('country.showMore', { n: list.length - limit })}
        </button>
      )}
    </div>
  );
}

/* ----------------------------- Chuyến đi ----------------------------- */
function TripsAdmin({ trips }) {
  const { t } = useI18n();
  const { adminApi, isAdmin, notify } = useApp();
  if (!trips) return <Loader />;
  return (
    <div className="stack">
      {trips.length === 0 && <Empty emoji="🎒" title={t('trips.empty')} />}
      {trips.map((tr) => (
        <article key={tr.id} className="mod-row">
          <span className="mod-row__photo">
            <span>{tr.emoji}</span>
          </span>
          <div className="mod-row__main">
            <b>{tr.name}</b>
            <small>
              {t('trips.meta', { n: tr.memberIds?.length || 0, code: tr.inviteCode })} · {t('admin.owner')}: {tr.members?.[tr.ownerId]?.name || '—'} · {formatDate(tr.createdAt)}
            </small>
            <small>{Object.values(tr.members || {}).map((m) => m.name).join(', ')}</small>
          </div>
          {isAdmin && (
            <div className="mod-row__actions">
              <button
                className="btn btn--sm btn--ghost danger"
                onClick={async () => {
                  if (!confirm(t('trip.confirmDelete'))) return;
                  await adminApi.deleteTrip(tr.id);
                  notify(t('mem.deleted'));
                }}
              >
                🗑️
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

/* ------------------------------ Cài đặt ------------------------------ */
function SettingsAdmin() {
  const { t, lang } = useI18n();
  const { settings, adminApi, notify, countries } = useApp();
  const [s, setS] = useState(settings);
  useEffect(() => setS(settings), [settings]);
  const options = useMemo(
    () =>
      (countries?.features || [])
        .map((f) => f.properties.cc)
        .filter(Boolean)
        .map((c) => ({ value: c, label: countryName(c), icon: flagOf(c) }))
        .sort((a, b) => a.label.localeCompare(b.label, lang)),
    [countries, lang],
  );
  const ann = s.announcement;
  const setAnn = (patch) => setS((x) => ({ ...x, announcement: { ...x.announcement, ...patch } }));
  const setFeat = (k, v) => setS((x) => ({ ...x, features: { ...x.features, [k]: v } }));
  const save = async () => {
    try {
      await adminApi.saveSettings(s);
      notify(t('admin.saved'));
    } catch (e) {
      notify(t('admin.error', { msg: e.message }), 'error');
    }
  };
  return (
    <div className="stack">
      <div className="card stack">
        <h3 className="h3">📢 {t('admin.announcement')}</h3>
        <label className="switch">
          <input type="checkbox" checked={ann.active} onChange={(e) => setAnn({ active: e.target.checked })} />
          <span>{t('admin.announcementOn')}</span>
        </label>
        <label className="field">
          <span>🇻🇳 {t('admin.f.textVi')}</span>
          <input value={ann.vi} onChange={(e) => setAnn({ vi: e.target.value })} placeholder="VD: 🎉 Tính năng Tổng kết năm đã ra mắt!" />
        </label>
        <label className="field">
          <span>🇬🇧 {t('admin.f.textEn')}</span>
          <input value={ann.en} onChange={(e) => setAnn({ en: e.target.value })} placeholder="e.g. 🎉 Year in travel is here!" />
        </label>
        <div className="segmented">
          {['info', 'success', 'warning'].map((tone) => (
            <button key={tone} className={ann.tone === tone ? 'on' : ''} onClick={() => setAnn({ tone })}>
              {t('admin.tone.' + tone)}
            </button>
          ))}
        </div>
        {ann.active && (ann.vi || ann.en) && <div className={`announce announce--${ann.tone}`}>{lang === 'en' ? ann.en || ann.vi : ann.vi || ann.en}</div>}
      </div>
      <div className="card stack">
        <h3 className="h3">🌏 {t('admin.defaultCountry')}</h3>
        <p className="small muted">{t('admin.defaultCountryHelp')}</p>
        <Combobox value={s.homeCountry} options={options} onChange={(v) => v && setS((x) => ({ ...x, homeCountry: v }))} icon="🌏" />
      </div>
      <div className="card stack">
        <h3 className="h3">🧩 {t('admin.features')}</h3>
        {['explore', 'trips', 'wikidata'].map((k) => (
          <label key={k} className="switch">
            <input type="checkbox" checked={s.features[k] !== false} onChange={(e) => setFeat(k, e.target.checked)} />
            <span>
              <b>{t('admin.feature.' + k)}</b>
              <small>{t('admin.feature.' + k + 'Help')}</small>
            </span>
          </label>
        ))}
      </div>
      <button className="btn btn--primary" onClick={save}>
        💾 {t('admin.saveSettings')}
      </button>
      <Broadcast />
    </div>
  );
}

/** Gửi thông báo trong app cho mọi người (tính năng mới, thông báo chung) */
function Broadcast() {
  const { t } = useI18n();
  const { socialApi, user, notify } = useApp();
  const [type, setType] = useState('feature');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!title.trim()) return;
    if (!confirm(t('admin.bcConfirm'))) return;
    setBusy(true);
    try {
      await socialApi.notify({ to: 'all', type, from: user.uid, fromName: user.name || '', title: title.trim(), body: body.trim() });
      notify(t('admin.bcSent'));
      setTitle('');
      setBody('');
    } catch (e) {
      notify(t('admin.error', { msg: e.message }), 'error');
    }
    setBusy(false);
  };
  return (
    <div className="card stack">
      <h3 className="h3">📣 {t('admin.bcTitle')}</h3>
      <p className="small muted">{t('admin.bcHelp')}</p>
      <div className="segmented">
        <button className={type === 'feature' ? 'on' : ''} onClick={() => setType('feature')}>
          🎉 {t('admin.bcFeature')}
        </button>
        <button className={type === 'system' ? 'on' : ''} onClick={() => setType('system')}>
          📢 {t('admin.bcSystem')}
        </button>
      </div>
      <label className="field">
        <span>{t('admin.bcHeading')}</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder={t('admin.bcHeadingPh')} />
      </label>
      <label className="field">
        <span>{t('admin.bcBody')}</span>
        <textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} maxLength={300} />
      </label>
      <button className="btn btn--dark" disabled={busy || !title.trim()} onClick={send}>
        📨 {t('admin.bcSend')}
      </button>
    </div>
  );
}
