import { Fragment, useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Avatar, Empty, Loader, LoadingImage, formatDate, AppLink, TrashIcon } from '../components/ui';
import { hrefProfile, hrefPlace } from '../lib/route';
import Combobox from '../components/Combobox';
import { countryName, flagOf } from '../lib/countries';
import { pName, pCity } from '../lib/lang';
import { normalize } from '../lib/geo';
import { useThumbs } from '../lib/useThumbs';
import { tipsApi, isFlagged, DEFAULT_COMMUNITY } from '../lib/tips';
import { FLAGS } from '../data/flags';
import { socialApi as social } from '../lib/social';
import { usePlaceImage } from '../lib/placeImage';
import { resolveGoogleMaps } from '../components/Modals';
import { isSuperUid, maskEmail } from '../lib/adminStore';
import { allRoles, roleLabel, PERMS, PRESET_ROLES } from '../lib/roles';
import { ANNOUNCEMENT_TEMPLATES, announcementStatus } from '../lib/announcements';
import { AD_PLACEMENTS } from '../components/AdSlot';
import AdminInsights from './AdminInsights';
import { AdminFeedback } from '../components/Feedback';

/* ------------------------------------------------------------------ */
/* Trang quản trị: người dùng & phân quyền, kiểm duyệt nội dung,       */
/* báo cáo, địa điểm nổi tiếng, chuyến đi, cài đặt trang               */
/* ------------------------------------------------------------------ */

// perm: quyền cần có (Quản trị → Vai trò & quyền); admin: chỉ quản trị viên
const TABS = [
  { id: 'dashboard', icon: '🏠' },
  { id: 'insights', icon: '📊', perm: 'insights' },
  { id: 'users', icon: '👥', admin: true },
  { id: 'roles', icon: '🔐', admin: true },
  { id: 'content', icon: '🖼️', perm: 'content' },
  { id: 'reports', icon: '🚩', perm: 'content' },
  { id: 'feedback', icon: '💬', perm: 'feedback' },
  { id: 'places', icon: '🏞️', perm: 'places' },
  { id: 'tips', icon: '🧭', perm: 'tips' },
  { id: 'trips', icon: '🧳', perm: 'trips' },
  { id: 'announce', icon: '📢', perm: 'announce' },
  { id: 'notify', icon: '📣', perm: 'notify' },
  { id: 'ads', icon: '🪧', perm: 'ads' },
  { id: 'flags', icon: '🚦', perm: 'flags' },
  { id: 'settings', icon: '⚙️', perm: 'settings' },
  { id: 'logs', icon: '📜', perm: 'logs' },
];

export default function AdminPage() {
  const { isStaff, isAdmin, user, role, adminApi, hasPerm, settings } = useApp();
  const { t, lang } = useI18n();
  const allowed = (x) => (x.admin ? isAdmin : x.perm ? hasPerm(x.perm) : true);
  const canContent = hasPerm('content');
  const canTrips = hasPerm('trips') || hasPerm('insights');
  const [tab, setTab] = useState('dashboard');
  const [users, setUsers] = useState(null);
  const [memories, setMemories] = useState(null);
  const [reports, setReports] = useState(null);
  const [trips, setTrips] = useState(null);

  useEffect(() => {
    if (!isStaff) return;
    const u = [
      isAdmin ? adminApi.watchUsers(setUsers) : setUsers([]),
      canContent ? adminApi.watchModerationMemories(setMemories) : setMemories([]),
      canContent ? adminApi.watchReports(setReports) : setReports([]),
      canTrips ? adminApi.watchAllTrips(setTrips) : setTrips([]),
    ];
    return () => u.forEach((f) => typeof f === 'function' && f());
  }, [isStaff, isAdmin, canContent, canTrips, adminApi]);

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
            {t('admin.youAre')} <span className={`role role--${role}`}>{roleLabel(role, settings, t, lang)}</span>
          </p>
        </div>
      </header>
      <div className="admin__layout">
        <nav className="admin__tabs">
          {TABS.filter(allowed).map((x) => (
            <button key={x.id} className={tab === x.id ? 'on' : ''} onClick={() => setTab(x.id)}>
              <span>{x.icon}</span> {t('admin.tab.' + x.id)}
              {x.id === 'reports' && openReports > 0 && <b className="admin__badge">{openReports}</b>}
            </button>
          ))}
        </nav>
        <section className="admin__body">
          {!allowed(TABS.find((x) => x.id === tab) || {}) ? (
            <Empty emoji="🔒" title={t('admin.noAccess')} text={t('perm.noTab')} />
          ) : (
            <>
              {tab === 'dashboard' && <Dashboard data={data} go={(id) => allowed(TABS.find((x) => x.id === id) || {}) && setTab(id)} />}
              {tab === 'insights' && <AdminInsights users={people} trips={trips} />}
              {tab === 'users' && <Users users={people} />}
              {tab === 'roles' && <RolesAdmin users={people} />}
              {tab === 'content' && <Content memories={memories} reports={reports} />}
              {tab === 'reports' && <Reports reports={reports} />}
              {tab === 'feedback' && <AdminFeedback />}
              {tab === 'places' && <PlacesAdmin />}
              {tab === 'trips' && <TripsAdmin trips={trips} />}
              {tab === 'announce' && <AnnouncementsAdmin />}
              {tab === 'notify' && <Broadcast />}
              {tab === 'ads' && <AdsAdmin />}
              {tab === 'settings' && <SettingsAdmin />}
              {tab === 'logs' && <AdminLogs />}
              {tab === 'tips' && <TipsAdmin />}
              {tab === 'flags' && <FlagsAdmin />}
            </>
          )}
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
    const owner = isSuperUid(u.uid);
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
  const { t, lang } = useI18n();
  const _t = t;
  const { isAdmin, user: me, adminApi, notify, openProfile, settings } = useApp();
  const roles = allRoles(settings);
  const rl = (id) => roleLabel(id, settings, _t, lang);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [shown, setShown] = useState({}); // email đã bấm xem đầy đủ (có ghi nhật ký)
  if (!users) return <Loader />;
  const n = normalize(q);
  const list = users.filter(
    (u) => (roleFilter === 'all' || (roleFilter === 'banned' ? u.banned : roleFilter === 'staff' ? (u.role || 'user') !== 'user' : (u.role || 'user') === roleFilter)) && (!n || normalize(`${u.name} ${u.email}`).includes(n)),
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
          {['all', 'staff', 'user', 'banned'].map((r) => (
            <button key={r} className={roleFilter === r ? 'on' : ''} onClick={() => setRoleFilter(r)}>
              {r === 'all' ? t('common.all') : r === 'banned' ? t('admin.banned') : r === 'staff' ? t('perm.staff') : rl(r)}
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
              <AppLink className="user-cell user-cell--link" href={hrefProfile(u.uid)} onClick={() => openProfile(u.uid)} title={t('social.viewProfile')}>
                <Avatar name={u.name || '?'} photo={u.photo} size={34} />
                <span>
                  <b>
                    <span className="user-cell__name">{u.name || t('admin.unknownUser')}</span>
                    {u.owner && <span className="role role--admin owner-tag">{t('admin.ownerTag')}</span>}
                  </b>
                  <small>
                    {u.email ? (shown[u.uid] ? u.email : maskEmail(u.email)) : u.noDoc ? t('admin.noProfile') : t('admin.oldProfile')}
                    {isAdmin && u.email && !shown[u.uid] && (
                      <button
                        className="email-reveal"
                        title={t('admin.revealEmail')}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShown((x) => ({ ...x, [u.uid]: true }));
                          adminApi.log('user.revealEmail', u.uid, u.name || '');
                        }}
                      >
                        👁
                      </button>
                    )}
                  </small>
                </span>
              </AppLink>
              <span>
                {isAdmin && !locked ? (
                  <select value={u.role || 'user'} onChange={(e) => update(u, { role: e.target.value }, t('admin.roleChanged', { name: u.name, role: rl(e.target.value) }))}>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.icon} {rl(r.id)}
                      </option>
                    ))}
                    {!roles.some((r) => r.id === (u.role || 'user')) && <option value={u.role}>{u.role}</option>}
                  </select>
                ) : (
                  <span className={`role role--${u.role || 'user'}`}>{rl(u.role || 'user')}</span>
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
            <TrashIcon />
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
                  <AppLink className="link" href={hrefProfile(r.byUid)} onClick={() => openProfile(r.byUid)}>
                    {r.byName}
                  </AppLink>{' '}
                  · {formatDate(r.createdAt)}
                </dd>
                <dt>{t('admin.reportAuthor')}</dt>
                <dd>
                  <AppLink className="link" href={hrefProfile(r.memoryOwner)} onClick={() => r.memoryOwner && openProfile(r.memoryOwner)}>
                    {snap.authorName || '—'}
                  </AppLink>
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
              <TrashIcon />
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
        <AppLink className="btn btn--sm btn--soft" href={hrefPlace(p)} onClick={() => openPlace(p)} title={t('common.viewOnMap')}>
          🗺️
        </AppLink>
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
            <TrashIcon /> {t('admin.deletePlace')}
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
                <TrashIcon />
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
  const save = async () => {
    try {
      // Chỉ lưu phần của trang Cài đặt (các mục khác có tab & quyền riêng)
      await adminApi.saveSettings({ homeCountry: s.homeCountry, community: s.community });
      notify(t('admin.saved'));
    } catch (e) {
      notify(t('admin.error', { msg: e.message }), 'error');
    }
  };
  return (
    <div className="stack">
      <div className="card stack">
        <h3 className="h3">🌏 {t('admin.defaultCountry')}</h3>
        <p className="small muted">{t('admin.defaultCountryHelp')}</p>
        <Combobox value={s.homeCountry} options={options} onChange={(v) => v && setS((x) => ({ ...x, homeCountry: v }))} icon="🌏" />
      </div>
      <div className="card stack">
        <h3 className="h3">🧭 {t('admin.community')}</h3>
        <p className="small muted">{t('admin.communityHelp')}</p>
        <div className="community-grid">
          {[
            ['helpfulSlots', 0, 10],
            ['newSlots', 0, 10],
            ['newDays', 1, 365],
            ['flagMin', 1, 100],
            ['flagPct', 1, 100],
            ['staleMonths', 1, 60],
          ].map(([k, min, max]) => (
            <label key={k} className="field">
              <span>{t('admin.cm.' + k)}</span>
              <input
                type="number"
                min={min}
                max={max}
                value={s.community?.[k] ?? ''}
                onChange={(e) => setS((x) => ({ ...x, community: { ...x.community, [k]: Math.max(min, Math.min(max, Number(e.target.value) || 0)) } }))}
              />
            </label>
          ))}
        </div>
        <p className="tiny muted">{t('admin.cm.preview', { h: s.community?.helpfulSlots, n: s.community?.newSlots })}</p>
      </div>
      <p className="small muted">{t('admin.settingsMoved')}</p>
      <button className="btn btn--primary" onClick={save}>
        💾 {t('admin.saveSettings')}
      </button>
    </div>
  );
}

/* ------------------------ Thông báo đầu trang (có lịch) ------------------------ */
const pad = (n) => String(n).padStart(2, '0');
const toLocalInput = (ms) => {
  if (!ms) return '';
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v) => (v ? new Date(v).getTime() : null);
/** Ô ngày + giờ riêng: chọn ngày thì giờ mặc định là 00:00 (12:00 AM) */
function DateTimeField({ value, onChange }) {
  const v = toLocalInput(value);
  const [d, tm] = v ? v.split('T') : ['', ''];
  return (
    <div className="row dt-field">
      <input type="date" value={d} onChange={(e) => onChange(e.target.value ? fromLocalInput(`${e.target.value}T${tm || '00:00'}`) : null)} />
      <input type="time" value={tm} disabled={!d} onChange={(e) => d && onChange(fromLocalInput(`${d}T${e.target.value || '00:00'}`))} />
    </div>
  );
}
const fmtWhen = (ms, lang) => new Date(ms).toLocaleString(lang === 'en' ? 'en-GB' : 'vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

function AnnouncementsAdmin() {
  const { t, lang } = useI18n();
  const { settings, adminApi, notify } = useApp();
  const list = settings.announcements || [];
  const legacy = settings.announcement;
  const [edit, setEdit] = useState(null); // bản nháp đang soạn (mới hoặc sửa)
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(id);
  }, []);
  const persist = async (next, msg) => {
    try {
      const patch = { announcements: next };
      // Thông báo kiểu cũ (một ô duy nhất) — tắt đi khi đã chuyển sang danh sách có lịch
      if (legacy?.active) patch.announcement = { ...legacy, active: false };
      await adminApi.saveSettings(patch);
      notify(msg);
      return true;
    } catch (e) {
      notify(t('admin.error', { msg: e.message }), 'error');
      return false;
    }
  };
  const startNew = (tpl) => {
    const start = new Date(new Date().setHours(24, 0, 0, 0)).getTime(); // 00:00 (12:00 AM) ngày mai
    const fill = (x) =>
      (x || '')
        .replace('{date}', new Date(start).toLocaleDateString(lang === 'en' ? 'en-GB' : 'vi-VN'))
        .replace('{time}', new Date(start).toLocaleTimeString(lang === 'en' ? 'en-GB' : 'vi-VN', { hour: '2-digit', minute: '2-digit' }));
    setEdit({
      id: 'a' + Date.now().toString(36),
      vi: tpl ? fill(tpl.vi) : '',
      en: tpl ? fill(tpl.en) : '',
      tone: tpl?.tone || 'info',
      when: 'now',
      startAt: start,
      endAt: null,
      isNew: true,
    });
  };
  const saveDraft = async () => {
    const d = edit;
    if (!d.vi.trim() && !d.en.trim()) return notify(t('ann.needText'), 'error');
    const startAt = d.when === 'now' ? Date.now() : d.startAt;
    if (d.when === 'schedule' && (!startAt || startAt <= Date.now())) return notify(t('ann.pastStart'), 'error');
    if (d.endAt && d.endAt <= startAt) return notify(t('ann.badEnd'), 'error');
    const item = { id: d.id, vi: d.vi.trim(), en: d.en.trim(), tone: d.tone, startAt, endAt: d.endAt || null, createdAt: d.createdAt || Date.now() };
    const next = d.isNew ? [item, ...list] : list.map((x) => (x.id === d.id ? item : x));
    if (await persist(next.slice(0, 20), d.when === 'now' ? t('ann.published') : t('ann.scheduled', { when: fmtWhen(startAt, lang) }))) setEdit(null);
  };
  const statusOf = (a) => announcementStatus(a);
  const sorted = [...list].sort((a, b) => {
    const order = { live: 0, scheduled: 1, paused: 2, ended: 3 };
    return order[statusOf(a)] - order[statusOf(b)] || (b.startAt || 0) - (a.startAt || 0);
  });
  return (
    <div className="stack">
      <div className="card stack">
        <h3 className="h3">📢 {t('ann.title')}</h3>
        <p className="small muted">{t('ann.help')}</p>
        <div className="ann-templates">
          {ANNOUNCEMENT_TEMPLATES.map((tp) => (
            <button key={tp.id} type="button" className="ann-tpl" onClick={() => startNew(tp)}>
              <span className="ann-tpl__icon">{tp.icon}</span>
              <b>{t('ann.tpl.' + tp.id)}</b>
              <small className="muted">{t('ann.tplHelp.' + tp.id)}</small>
            </button>
          ))}
        </div>
      </div>

      {edit && (
        <div className="card stack ann-editor">
          <h3 className="h3">{edit.isNew ? `✍️ ${t('ann.new')}` : `✏️ ${t('ann.edit')}`}</h3>
          <label className="field">
            <span>🇻🇳 {t('admin.f.textVi')}</span>
            <textarea rows={2} maxLength={300} value={edit.vi} onChange={(e) => setEdit((d) => ({ ...d, vi: e.target.value }))} />
          </label>
          <label className="field">
            <span>🇬🇧 {t('admin.f.textEn')}</span>
            <textarea rows={2} maxLength={300} value={edit.en} onChange={(e) => setEdit((d) => ({ ...d, en: e.target.value }))} />
          </label>
          <div className="segmented">
            {['info', 'success', 'warning'].map((tone) => (
              <button key={tone} className={edit.tone === tone ? 'on' : ''} onClick={() => setEdit((d) => ({ ...d, tone }))}>
                {t('admin.tone.' + tone)}
              </button>
            ))}
          </div>
          <div className="segmented">
            <button className={edit.when === 'now' ? 'on' : ''} onClick={() => setEdit((d) => ({ ...d, when: 'now' }))}>
              ⚡ {t('ann.now')}
            </button>
            <button className={edit.when === 'schedule' ? 'on' : ''} onClick={() => setEdit((d) => ({ ...d, when: 'schedule' }))}>
              🗓️ {t('ann.schedule')}
            </button>
          </div>
          <div className="grid-2">
            {edit.when === 'schedule' && (
              <label className="field">
                <span>{t('ann.startAt')}</span>
                <DateTimeField value={edit.startAt} onChange={(v) => setEdit((d) => ({ ...d, startAt: v }))} />
              </label>
            )}
            <label className="field">
              <span>{t('ann.endAt')}</span>
              <DateTimeField value={edit.endAt} onChange={(v) => setEdit((d) => ({ ...d, endAt: v }))} />
              <small className="muted">{t('ann.endHelp')}</small>
            </label>
          </div>
          {(edit.vi || edit.en) && (
            <div>
              <p className="tiny muted">{t('ann.preview')}</p>
              <div className={`announce announce--${edit.tone}`}>{lang === 'en' ? edit.en || edit.vi : edit.vi || edit.en}</div>
            </div>
          )}
          <div className="row wrap">
            <button className="btn btn--primary" onClick={saveDraft}>
              {edit.when === 'now' ? `📢 ${t('ann.publishNow')}` : `🗓️ ${t('ann.saveSchedule')}`}
            </button>
            <button className="btn btn--ghost" onClick={() => setEdit(null)}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="card stack">
        <div className="row between">
          <h3 className="h3">🗂️ {t('ann.list')}</h3>
          {!edit && (
            <button className="btn btn--sm btn--soft" onClick={() => startNew(null)}>
              ＋ {t('ann.new')}
            </button>
          )}
        </div>
        {legacy?.active && (legacy.vi || legacy.en) && (
          <div className="ann-row">
            <span className="ann-status ann-status--live">{t('ann.st.live')}</span>
            <div className="ann-row__main">
              <div className={`announce announce--${legacy.tone || 'info'}`}>{lang === 'en' ? legacy.en || legacy.vi : legacy.vi || legacy.en}</div>
              <small className="muted">{t('ann.legacy')}</small>
            </div>
            <button className="btn btn--sm btn--ghost" onClick={() => persist(list, t('ann.stopped'))}>
              ⏹ {t('ann.stop')}
            </button>
          </div>
        )}
        {sorted.length === 0 && !legacy?.active && <p className="muted small">{t('ann.empty')}</p>}
        {sorted.map((a) => {
          const st = statusOf(a);
          return (
            <div key={a.id} className="ann-row">
              <span className={`ann-status ann-status--${st}`}>{t('ann.st.' + st)}</span>
              <div className="ann-row__main">
                <div className={`announce announce--${a.tone || 'info'}`}>{lang === 'en' ? a.en || a.vi : a.vi || a.en}</div>
                <small className="muted">
                  {a.startAt ? `${t('ann.from')} ${fmtWhen(a.startAt, lang)}` : ''}
                  {a.endAt ? ` → ${fmtWhen(a.endAt, lang)}` : ` → ${t('ann.untilStopped')}`}
                </small>
              </div>
              <div className="row wrap ann-row__actions">
                {st !== 'ended' && (
                  <button className="btn btn--sm btn--ghost" onClick={() => setEdit({ ...a, when: st === 'scheduled' ? 'schedule' : 'now', isNew: false })}>
                    ✏️
                  </button>
                )}
                {st === 'live' && (
                  <button className="btn btn--sm btn--ghost" onClick={() => persist(list.map((x) => (x.id === a.id ? { ...x, endAt: Date.now() } : x)), t('ann.stopped'))}>
                    ⏹ {t('ann.stop')}
                  </button>
                )}
                {st === 'scheduled' && (
                  <button className="btn btn--sm btn--ghost" onClick={() => persist(list.map((x) => (x.id === a.id ? { ...x, startAt: Date.now() } : x)), t('ann.published'))}>
                    ⚡ {t('ann.publishNow')}
                  </button>
                )}
                <button className="btn btn--sm btn--ghost danger" title={t('common.delete')} onClick={() => confirm(t('ann.confirmDelete')) && persist(list.filter((x) => x.id !== a.id), t('ann.deleted'))}>
                  <TrashIcon />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Gửi thông báo trong app cho mọi người (tính năng mới, thông báo chung) */
function Broadcast() {
  const { t } = useI18n();
  const { socialApi, user, notify, adminApi } = useApp();
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
      adminApi.log('broadcast.send', type, title.trim());
      notify(t('admin.bcSent'));
      setTitle('');
      setBody('');
    } catch (e) {
      notify(t('admin.error', { msg: e.message }), 'error');
    }
    setBusy(false);
  };
  return (
    <div className="stack">
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
          <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={300} />
        </label>
        <button className="btn btn--dark" disabled={busy || !title.trim()} onClick={send}>
          📨 {t('admin.bcSend')}
        </button>
      </div>
      <p className="tiny muted">{t('admin.bcVsAnn')}</p>
    </div>
  );
}

/* ------------------------------ Quảng cáo ------------------------------ */
function AdsAdmin() {
  const { t } = useI18n();
  const { settings, adminApi, notify } = useApp();
  const ads = settings.ads || { mode: 'staff', off: [] };
  const save = async (patch, msg) => {
    try {
      await adminApi.saveSettings({ ads: { mode: ads.mode, off: ads.off || [], ...patch } });
      notify(msg || t('admin.saved'));
    } catch (e) {
      notify(t('admin.error', { msg: e.message }), 'error');
    }
  };
  const off = new Set(ads.off || []);
  return (
    <div className="stack">
      <div className="card stack">
        <h3 className="h3">🪧 {t('ads.adminTitle')}</h3>
        <p className="small muted">{t('admin.feature.adsHelp')}</p>
        <div className="segmented">
          {['off', 'staff', 'all'].map((v) => (
            <button key={v} className={ads.mode === v ? 'on' : ''} onClick={() => ads.mode !== v && save({ mode: v })}>
              {t('admin.ads.' + v)}
            </button>
          ))}
        </div>
      </div>
      <div className="card stack">
        <h3 className="h3">📍 {t('ads.placements')}</h3>
        <p className="small muted">{t('ads.placementsHelp')}</p>
        {AD_PLACEMENTS.map((p) => (
          <label key={p.id} className="switch ads-place">
            <input
              type="checkbox"
              checked={!off.has(p.id)}
              onChange={(e) => {
                const next = new Set(off);
                e.target.checked ? next.delete(p.id) : next.add(p.id);
                save({ off: [...next] });
              }}
            />
            <span>
              {p.icon} <b>{t('ads.place.' + p.id)}</b>
            </span>
          </label>
        ))}
      </div>
      <p className="tiny muted">{t('ads.realNote')}</p>
    </div>
  );
}

/* --------------------------- Vai trò & quyền --------------------------- */
function RolesAdmin({ users }) {
  const { t, lang } = useI18n();
  const { settings, adminApi, notify } = useApp();
  const roles = allRoles(settings);
  const [draft, setDraft] = useState(null); // { rolePerms, roleDefs }
  useEffect(() => setDraft(null), [settings]);
  const cur = draft || { rolePerms: Object.fromEntries(roles.filter((r) => !r.fixed).map((r) => [r.id, r.perms])), roleDefs: settings.roleDefs || [] };
  const editable = [...PRESET_ROLES.map((r) => ({ ...r, preset: true })), ...cur.roleDefs.map((r) => ({ ...r, custom: true }))];
  const count = (id) => (users || []).filter((u) => (u.role || 'user') === id).length;
  const rl = (r) => (r.custom ? r.name?.[lang] || r.name?.vi || r.name?.en || r.id : t('role.' + r.id));
  const toggle = (rid, perm) =>
    setDraft(() => {
      const ps = new Set(cur.rolePerms[rid] || []);
      ps.has(perm) ? ps.delete(perm) : ps.add(perm);
      return { ...cur, rolePerms: { ...cur.rolePerms, [rid]: [...ps] } };
    });
  const [newName, setNewName] = useState('');
  const addRole = () => {
    const name = newName.trim();
    if (!name) return;
    const id = 'r_' + Date.now().toString(36);
    setDraft({ rolePerms: { ...cur.rolePerms, [id]: [] }, roleDefs: [...cur.roleDefs, { id, icon: '🧩', name: { vi: name, en: name } }] });
    setNewName('');
  };
  const removeRole = (r) => {
    if (count(r.id) > 0) return notify(t('perm.inUse', { n: count(r.id) }), 'error');
    if (!confirm(t('perm.confirmDelete', { name: rl(r) }))) return;
    const rp = { ...cur.rolePerms };
    delete rp[r.id];
    setDraft({ rolePerms: rp, roleDefs: cur.roleDefs.filter((x) => x.id !== r.id) });
  };
  const resetPreset = (r) => setDraft({ ...cur, rolePerms: { ...cur.rolePerms, [r.id]: PRESET_ROLES.find((x) => x.id === r.id).perms } });
  const save = async () => {
    try {
      await adminApi.saveRoles(cur.rolePerms, cur.roleDefs);
      notify(t('perm.saved'));
      setDraft(null);
    } catch (e) {
      notify(t('admin.error', { msg: e.message }), 'error');
    }
  };
  return (
    <div className="stack">
      <div className="card stack">
        <h3 className="h3">🔐 {t('perm.title')}</h3>
        <p className="small muted">{t('perm.help')}</p>
        <div className="roles-fixed">
          <span>
            👑 <b>{t('role.admin')}</b> — {t('perm.adminDesc')} <small className="muted">({t('perm.people', { n: count('admin') })})</small>
          </span>
          <span>
            🙂 <b>{t('role.user')}</b> — {t('perm.userDesc')}
          </span>
        </div>
      </div>
      <div className="card perm-matrix-card">
        <div className="perm-matrix" style={{ '--cols': editable.length }}>
          <div className="perm-matrix__corner">{t('perm.permission')}</div>
          {editable.map((r) => (
            <div key={r.id} className="perm-matrix__role">
              <span className="perm-matrix__icon">{r.icon || '🧩'}</span>
              {r.custom ? (
                <input
                  className="perm-matrix__name"
                  value={r.name?.[lang] || r.name?.vi || ''}
                  maxLength={40}
                  onChange={(e) =>
                    setDraft({ ...cur, roleDefs: cur.roleDefs.map((x) => (x.id === r.id ? { ...x, name: { vi: e.target.value, en: e.target.value } } : x)) })
                  }
                />
              ) : (
                <b>{rl(r)}</b>
              )}
              <small className="muted">{t('perm.people', { n: count(r.id) })}</small>
              {r.custom ? (
                <button className="btn btn--sm btn--ghost danger" onClick={() => removeRole(r)} title={t('common.delete')}>
                  <TrashIcon />
                </button>
              ) : (
                <button className="btn btn--sm btn--ghost" onClick={() => resetPreset(r)} title={t('perm.reset')}>
                  ↺
                </button>
              )}
            </div>
          ))}
          {PERMS.map((p) => (
            <Fragment key={p.key}>
              <div className="perm-matrix__perm">
                <span>{p.icon}</span>
                <span>
                  <b>{t('perm.p.' + p.key)}</b>
                  <small className="muted">{t('perm.d.' + p.key)}</small>
                </span>
              </div>
              {editable.map((r) => (
                <label key={r.id} className="perm-matrix__cell">
                  <input type="checkbox" checked={(cur.rolePerms[r.id] || []).includes(p.key)} onChange={() => toggle(r.id, p.key)} />
                </label>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
      <div className="card stack">
        <h3 className="h3">＋ {t('perm.newRole')}</h3>
        <div className="row">
          <input value={newName} maxLength={40} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addRole()} placeholder={t('perm.newRolePh')} />
          <button className="btn btn--soft" onClick={addRole} disabled={!newName.trim()}>
            {t('perm.add')}
          </button>
        </div>
        <p className="tiny muted">{t('perm.assignHint')}</p>
      </div>
      <div className="row">
        <button className="btn btn--primary" disabled={!draft} onClick={save}>
          💾 {t('perm.save')}
        </button>
        {draft && (
          <button className="btn btn--ghost" onClick={() => setDraft(null)}>
            {t('common.cancel')}
          </button>
        )}
      </div>
    </div>
  );
}

/** Nhật ký quản trị: ai làm gì, lúc nào (chỉ thêm, không sửa / xoá được) */
const LOG_ICON = { settings: '⚙️', place: '🏞️', report: '🚩', user: '👥', memory: '🖼️', trip: '🧳', broadcast: '📢', feedback: '💬' };
function AdminLogs() {
  const { adminApi, openProfile } = useApp();
  const { t, lang } = useI18n();
  const [logs, setLogs] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => adminApi.watchLogs(setLogs), [adminApi]);
  if (!logs) return <Loader />;
  const n = normalize(q);
  const list = logs.filter((l) => !n || normalize(`${l.byName} ${l.action} ${l.target} ${l.detail}`).includes(n));
  const when = (at) => new Date(at).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' });
  return (
    <div className="stack">
      <p className="small muted">{t('admin.logsHint')}</p>
      <div className="admin-toolbar">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.logsSearch')} />
      </div>
      {!list.length ? (
        <Empty emoji="📜" title={t('admin.logsEmpty')} />
      ) : (
        <ul className="admin-logs">
          {list.map((l) => (
            <li key={l.id}>
              <span className="admin-logs__icon">{LOG_ICON[l.action.split('.')[0]] || '•'}</span>
              <span className="admin-logs__main">
                <b>{t(`log.${l.action}`) !== `log.${l.action}` ? t(`log.${l.action}`) : l.action}</b>
                {l.target && <code className="admin-logs__target">{l.target}</code>}
                {l.detail && <small className="admin-logs__detail">{l.detail}</small>}
              </span>
              <span className="admin-logs__meta">
                <button className="link" onClick={() => openProfile(l.by)}>
                  {l.byName || l.by}
                </button>
                <small>{when(l.at)}</small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Kiểm duyệt bài kinh nghiệm: bài bị báo sai nhiều lên đầu; ẩn / hiện lại / xoá */
function TipsAdmin() {
  const { settings, adminApi, notify, openTips, setTipPost } = useApp();
  const { t } = useI18n();
  const [list, setList] = useState(null);
  const [filter, setFilter] = useState('flagged');
  useEffect(() => tipsApi.watchAll(setList), []);
  if (!list) return <Loader />;
  const cfg = { ...DEFAULT_COMMUNITY, ...(settings?.community || {}) };
  const shown = list.filter((p) => (filter === 'flagged' ? isFlagged(p, cfg) : filter === 'hidden' ? p.status === 'hidden' : true));
  const act = (p, status) =>
    tipsApi
      .setStatus(p.id, status)
      .then(() => (adminApi.log(status === 'hidden' ? 'tip.hide' : 'tip.unhide', p.id, p.title), notify(t('admin.done'))))
      .catch((e) => notify(e.message, 'error'));
  return (
    <div className="stack">
      <div className="segmented segmented--sm">
        {['flagged', 'hidden', 'all'].map((k) => (
          <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
            {t('admin.tips.' + k)}
          </button>
        ))}
      </div>
      {!shown.length ? (
        <Empty emoji="🧭" title={t('admin.tips.empty')} />
      ) : (
        <ul className="admin-logs">
          {shown.map((p) => (
            <li key={p.id}>
              <span className="admin-logs__icon">{flagOf(p.cc)}</span>
              <span className="admin-logs__main">
                <b>{p.title}</b>
                <small className="admin-logs__detail">
                  {p.authorName} · 👍 {p.helpful || 0} · ⚠️ {p.wrong || 0} · 💬 {p.comments || 0}
                  {p.status === 'hidden' ? ` · 🙈 ${t('admin.tips.hiddenTag')}` : ''}
                </small>
              </span>
              <span className="row wrap">
                <button className="btn btn--sm btn--soft" onClick={() => (openTips(p.cc), setTipPost(p.id))}>
                  {t('admin.tips.view')}
                </button>
                {p.status === 'hidden' ? (
                  <button className="btn btn--sm btn--ghost" onClick={() => act(p, 'ok')}>
                    {t('admin.tips.unhide')}
                  </button>
                ) : (
                  <button className="btn btn--sm btn--ghost" onClick={() => act(p, 'hidden')}>
                    🙈 {t('tips.hide')}
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Feature flags: bật tính năng mới cho tất cả, hoặc cho một số người dùng thử trước. Chủ trang luôn thấy. */
function FlagsAdmin() {
  const { settings, adminApi, notify } = useApp();
  const { t, lang } = useI18n();
  const flags = settings.flags || {};
  const [busy, setBusy] = useState('');
  const save = async (key, patch, logDetail) => {
    const cur = flags[key] || {};
    const def = FLAGS.find((f) => f.key === key);
    const next = { on: cur.on ?? (settings.features?.[key] === false ? false : def.defaultOn), users: cur.users || [], ...patch };
    setBusy(key);
    try {
      await adminApi.saveSettings({ flags: { ...flags, [key]: next } });
      adminApi.log('flag.update', key, logDetail);
      notify(t('admin.done'));
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy('');
    }
  };
  return (
    <div className="stack">
      <p className="small muted">{t('flags.help')}</p>
      {FLAGS.map((f) => {
        const cfg = flags[f.key] || {};
        const on = cfg.on ?? (settings.features?.[f.key] === false ? false : f.defaultOn);
        const users = cfg.users || [];
        return (
          <section key={f.key} className="card stack-sm flag-card">
            <div className="flag-card__head">
              <span className="flag-card__icon">{f.icon}</span>
              <div className="grow">
                <b>{f.name[lang] || f.name.vi}</b>
                <small className="muted">
                  {f.desc[lang] || f.desc.vi} · {f.since ? t('flags.since', { date: f.since }) : t('flags.existing')}
                </small>
              </div>
              <span className={`flag-status ${on ? 'flag-status--on' : users.length ? 'flag-status--beta' : ''}`}>
                {on ? t('flags.statusAll') : users.length ? t('flags.statusBeta', { n: users.length }) : t('flags.statusOwner')}
              </span>
            </div>
            <label className="switch">
              <input type="checkbox" checked={on} disabled={busy === f.key} onChange={(e) => save(f.key, { on: e.target.checked }, e.target.checked ? 'on for everyone' : 'off for everyone')} />
              <span>
                <b>{t('flags.forAll')}</b>
                <small>{t('flags.forAllHelp')}</small>
              </span>
            </label>
            {!on && <BetaUsers users={users} busy={busy === f.key} onChange={(list, d) => save(f.key, { users: list }, d)} />}
          </section>
        );
      })}
    </div>
  );
}

function BetaUsers({ users, busy, onChange }) {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [found, setFound] = useState([]);
  const [names, setNames] = useState({});
  useEffect(() => {
    let alive = true;
    Promise.all(users.filter((u) => !names[u]).map((uid) => new Promise((res) => { let un = () => {}; un = social.watchProfile(uid, (p) => (res([uid, p]), setTimeout(() => un && un(), 0))); }))).then(
      (rows) => alive && rows.length && setNames((n) => ({ ...n, ...Object.fromEntries(rows.map(([uid, p]) => [uid, p])) })),
    );
    return () => {
      alive = false;
    };
  }, [users.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const s = q.trim();
    if (s.length < 2) return setFound([]), undefined;
    let alive = true;
    const tm = setTimeout(() => social.searchUsers(s).then((l) => alive && setFound(l)).catch(() => alive && setFound([])), 300);
    return () => {
      alive = false;
      clearTimeout(tm);
    };
  }, [q]);
  return (
    <div className="stack-sm">
      <b className="small">{t('flags.beta')}</b>
      <div className="chips">
        {users.map((uid) => (
          <span key={uid} className="chip chip--on flag-user">
            {names[uid]?.name || uid.slice(0, 8)}
            {names[uid]?.username ? ` @${names[uid].username}` : ''}
            <button disabled={busy} onClick={() => onChange(users.filter((x) => x !== uid), `remove ${uid}`)} aria-label={t('flags.remove')}>
              ✕
            </button>
          </span>
        ))}
        {!users.length && <small className="muted">{t('flags.noBeta')}</small>}
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('flags.addPh')} />
      {found.filter((p) => !users.includes(p.uid)).length > 0 && (
        <ul className="tm__list">
          {found
            .filter((p) => !users.includes(p.uid))
            .slice(0, 6)
            .map((p) => (
              <li key={p.uid}>
                <Avatar name={p.name || '?'} photo={p.photo} size={30} />
                <span className="tm__who">
                  <b>{p.name}</b>
                  {p.username && <small>@{p.username}</small>}
                </span>
                <button
                  className="btn btn--sm btn--primary"
                  disabled={busy}
                  onClick={() => (setNames((n) => ({ ...n, [p.uid]: p })), setQ(''), onChange([...users, p.uid], `add ${p.uid}`))}
                >
                  ＋ {t('flags.add')}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
