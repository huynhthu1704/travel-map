import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { AccountModal } from './Account';
import { Avatar, Empty, Loader, AppLink } from '../components/ui';
import { hrefProfile } from '../lib/route';
import { MemoryGrid } from '../components/SidePanel';
import { countryName, flagOf } from '../lib/countries';
import { socialApi, cleanUsername, usernameProblem } from '../lib/social';
import { fixMemory } from '../lib/fixes';
import { makeAvatar } from '../lib/avatar';

const BIO_MAX = 160;

/** Hồ sơ người dùng: quốc gia / thành phố đã đi, check-in công khai, giới thiệu ngắn, theo dõi */
export default function ProfilePage() {
  const { profileUid: uid, setProfileUid, profileSub, user, api, requireLogin, followingIds, followerIds, toggleFollow, notify, openProfile } = useApp();
  const { t, lang } = useI18n();
  const [p, setP] = useState(undefined);
  const [checkins, setCheckins] = useState(null);
  const [fCount, setFCount] = useState({ followers: null, following: null });
  const [feed, setFeed] = useState(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [nameEdit, setNameEdit] = useState(null); // đang sửa tên: chuỗi tên mới
  const [photoBusy, setPhotoBusy] = useState(false);
  const [openCc, setOpenCc] = useState({});
  const [handle, setHandle] = useState(''); // nickname đang sửa
  const [handleState, setHandleState] = useState(''); // '', 'checking', 'ok', 'taken', lỗi định dạng
  const [saving, setSaving] = useState(false);
  // Link dạng #/@nickname → tìm ra người dùng
  useEffect(() => {
    if (!uid?.startsWith('@') || !user) return undefined;
    let alive = true;
    socialApi
      .usernameOwner(uid.slice(1))
      .then((real) => alive && (real ? setProfileUid(real) : setP(null)))
      .catch(() => alive && setP(null));
    return () => {
      alive = false;
    };
  }, [uid, user]); // eslint-disable-line react-hooks/exhaustive-deps
  // Kiểm tra nickname còn trống không (chờ người dùng gõ xong)
  useEffect(() => {
    if (!editing) return undefined;
    const n = cleanUsername(handle);
    if (!n || n === (p?.username || '')) return setHandleState(''), undefined;
    const bad = usernameProblem(n);
    if (bad) return setHandleState(bad), undefined;
    setHandleState('checking');
    let alive = true;
    const tm = setTimeout(() => {
      socialApi
        .usernameOwner(n)
        .then((o) => alive && setHandleState(o && o !== user.uid ? 'taken' : 'ok'))
        .catch(() => alive && setHandleState(''));
    }, 400);
    return () => {
      alive = false;
      clearTimeout(tm);
    };
  }, [handle, editing, p?.username]); // eslint-disable-line react-hooks/exhaustive-deps
  const isMe = user?.uid === uid;
  const mutual = !isMe && followingIds.has(uid) && followerIds.has(uid);

  useEffect(() => {
    if (!uid || !user || uid.startsWith('@')) return undefined;
    setP(undefined);
    setCheckins(null);
    const u = [
      socialApi.watchProfile(uid, setP),
      socialApi.watchPublicCheckins(uid, (l) => setCheckins(l.map(fixMemory))),
      socialApi.watchFollowers(uid, (l) => setFCount((c) => ({ ...c, followers: l.length }))),
      socialApi.watchFollowing(uid, (l) => setFCount((c) => ({ ...c, following: l.length }))),
    ];
    return () => u.forEach((f) => f && f());
  }, [uid, user]);
  useEffect(() => setBio(p?.bio || ''), [p?.bio]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [accSection, setAccSection] = useState(null); // 'privacy' | 'export' | 'delete'
  // Hồ sơ riêng tư: thống kê nằm ở profileStats, chỉ chính chủ và bạn theo dõi chéo đọc được
  const locked = !!p?.privateProfile && !isMe && !mutual;
  const [stats, setStats] = useState(null);
  useEffect(() => {
    setStats(null);
    if (!uid || !p?.privateProfile || locked) return undefined;
    return socialApi.watchStats(uid, setStats);
  }, [uid, p?.privateProfile, locked]);
  // Hoạt động gần đây: chỉ chính mình và bạn bè theo dõi chéo mới xem được
  useEffect(() => {
    let alive = true;
    setFeed(null);
    if (!uid || !user || (!isMe && !mutual)) return undefined;
    socialApi.getFeed(uid).then((f) => alive && setFeed(f || []));
    return () => {
      alive = false;
    };
  }, [uid, user, isMe, mutual]);

  const citiesBy = useMemo(() => {
    const g = {};
    (stats?.cities || p?.cities || []).forEach((c) => (g[c.cc] ||= []).push(c.name));
    return Object.entries(g).sort((a, b) => b[1].length - a[1].length);
  }, [p, stats]);

  if (!user)
    return (
      <div className="page">
        <Empty
          emoji="👤"
          title={t('social.loginToView')}
          action={
            <button className="btn btn--primary" onClick={() => requireLogin(() => {})}>
              {t('auth.login')}
            </button>
          }
        />
      </div>
    );
  if (p === undefined) return <div className="page"><Loader /></div>;
  if (!p && !isMe) return <div className="page"><Empty emoji="🔍" title={t('social.notFound')} /></div>;
  const base = p ? { ...p, ...(stats || {}) } : { name: user.name, photo: user.photo, countries: [], cities: [] };
  // Của chính mình: lấy tên / ảnh mới nhất từ tài khoản (hồ sơ công khai cập nhật sau vài giây)
  const prof = isMe ? { ...base, name: user.name, photo: user.photo } : base;

  if (profileSub === 'activity') return <ActivityPage uid={uid} prof={prof} isMe={isMe} mutual={mutual} feed={feed} />;

  const pickPhoto = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return notify(t('profile.photoBad'), 'error');
    setPhotoBusy(true);
    try {
      const photo = await makeAvatar(f);
      await api.setProfilePhoto(user, photo);
      notify(t('profile.photoSaved'));
    } catch (err) {
      notify(err.message || t('profile.photoBad'), 'error');
    } finally {
      setPhotoBusy(false);
    }
  };
  const resetPhoto = async () => {
    setPhotoBusy(true);
    try {
      await api.setProfilePhoto(user, null);
      notify(t('profile.photoSaved'));
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setPhotoBusy(false);
    }
  };
  const shareLink = async () => {
    const url = `${location.origin}${location.pathname}#/${prof.username ? `@${prof.username}` : `u/${encodeURIComponent(uid)}`}`;
    try {
      if (navigator.share && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) await navigator.share({ title: prof.name, url });
      else {
        await navigator.clipboard.writeText(url);
        notify(t('social.linkCopied'));
      }
    } catch {
      /* người dùng huỷ */
    }
  };

  const startEdit = () => {
    setNameEdit(user.name || '');
    setBio(p?.bio || '');
    setHandle(p?.username || '');
    setHandleState('');
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setNameEdit(null);
    setBio(p?.bio || '');
  };
  const saveAll = async (e) => {
    e?.preventDefault();
    const n = (nameEdit || '').trim();
    if (!n) return;
    const h = cleanUsername(handle);
    if (h !== (p?.username || '') && h && handleState !== 'ok') return;
    setSaving(true);
    try {
      if (h !== (p?.username || '')) await socialApi.setUsername(uid, h, p?.username || '');
      if (n !== user.name) await api.setDisplayName(user, n);
      const b = bio.trim().slice(0, BIO_MAX);
      if (b !== (p?.bio || '')) await socialApi.saveProfile(uid, { bio: b });
      cancelEdit();
      notify(t('profile.updated'));
    } catch (err) {
      if (err.message === 'taken') setHandleState('taken');
      notify(err.message === 'taken' ? t('profile.handle.taken') : err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page profile">
      <header className="profile__head card">
        <div className="profile__avatar">
          <Avatar name={prof.name || '?'} photo={prof.photo} size={104} />
          {isMe && (
            <label className={`profile__cam ${photoBusy ? 'is-busy' : ''}`} title={t('profile.photoChange')}>
              {photoBusy ? '⏳' : '📷'}
              <input type="file" accept="image/*" onChange={pickPhoto} hidden disabled={photoBusy} />
            </label>
          )}
        </div>

        {editing ? (
          <form className="profile__edit" onSubmit={saveAll}>
            <label className="field">
              <span>{t('profile.nameLabel')}</span>
              <input value={nameEdit || ''} onChange={(e) => setNameEdit(e.target.value)} maxLength={40} placeholder={user.googleName} autoFocus />
            </label>
            <label className="field">
              <span>{t('profile.handle.label')}</span>
              <div className={`handle-input ${['ok'].includes(handleState) ? 'is-ok' : ['', 'checking'].includes(handleState) ? '' : 'is-bad'}`}>
                <b>@</b>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9._@]/g, '').replace(/^@/, ''))}
                  maxLength={20}
                  placeholder={t('profile.handle.ph')}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <i>{handleState === 'checking' ? '⏳' : handleState === 'ok' ? '✓' : handleState ? '✕' : ''}</i>
              </div>
              <small className={handleState && !['ok', 'checking'].includes(handleState) ? 'handle-msg is-bad' : 'muted'}>
                {handleState && handleState !== 'checking' ? t(`profile.handle.${handleState}`) : t('profile.handle.help')}
              </small>
            </label>
            <label className="field">
              <span>
                {t('profile.bioLabel')} <small className="muted">{bio.length}/{BIO_MAX}</small>
              </span>
              <textarea rows={2} value={bio} maxLength={BIO_MAX} onChange={(e) => setBio(e.target.value)} placeholder={t('social.bioPh')} />
            </label>
            <div className="profile__editLinks">
              {user.name !== user.googleName && user.googleName && (
                <button type="button" className="link" onClick={() => setNameEdit(user.googleName)}>
                  {t('profile.useGoogle', { name: user.googleName })}
                </button>
              )}
              {user.photo && user.googlePhoto && user.photo !== user.googlePhoto && (
                <button type="button" className="link" onClick={resetPhoto} disabled={photoBusy}>
                  {t('profile.photoGoogle')}
                </button>
              )}
            </div>
            <div className="profile__editBtns">
              <button type="button" className="btn btn--sm btn--ghost" onClick={cancelEdit}>
                {t('pick.cancel')}
              </button>
              <button
                className="btn btn--sm btn--primary"
                disabled={saving || !(nameEdit || '').trim() || (cleanUsername(handle) !== (p?.username || '') && !!cleanUsername(handle) && handleState !== 'ok')}
              >
                {t('admin.save')}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile__info">
            <div className="profile__top">
              <div>
                <h1 className="profile__name">{prof.name || t('admin.unknownUser')}</h1>
                {prof.username ? (
                  <span className="profile__handle">@{prof.username}</span>
                ) : (
                  isMe && (
                    <button className="profile__handle profile__handle--add" onClick={startEdit}>
                      ＋ {t('profile.handle.add')}
                    </button>
                  )
                )}
              </div>
              <div className="profile__btns">
                {isMe ? (
                  <button className="btn btn--sm btn--soft" onClick={startEdit}>
                    {t('profile.editBtn')}
                  </button>
                ) : (
                  <button className={`btn btn--sm ${followingIds.has(uid) ? 'btn--soft' : 'btn--primary'}`} onClick={() => toggleFollow(uid, prof.name)}>
                    {followingIds.has(uid) ? `✓ ${t('social.followingBtn')}` : followerIds.has(uid) ? t('social.followBack') : t('social.follow')}
                  </button>
                )}
                {isMe ? (
                  <div className="profile__more">
                    <button className="btn btn--sm btn--ghost btn--icon" onClick={() => setMoreOpen((v) => !v)} title={t('profile.more')} aria-label={t('profile.more')} aria-expanded={moreOpen}>
                      ⋯
                    </button>
                    {moreOpen && (
                      <>
                        <div className="profile__more-backdrop" onClick={() => setMoreOpen(false)} />
                        <div className="trip-menu profile__menu" role="menu">
                          <button role="menuitem" onClick={() => (setMoreOpen(false), shareLink())}>
                            🔗 {t('social.shareProfile')}
                          </button>
                          <hr />
                          <button role="menuitem" onClick={() => (setMoreOpen(false), setAccSection('privacy'))}>
                            🛡️ {t('acc.privacy')}
                          </button>
                          <button role="menuitem" onClick={() => (setMoreOpen(false), setAccSection('export'))}>
                            📦 {t('acc.export')}
                          </button>
                          <hr />
                          <button role="menuitem" className="danger" onClick={() => (setMoreOpen(false), setAccSection('delete'))}>
                            🗑️ {t('acc.delete')}
                          </button>
                        </div>
                      </>
                    )}
                    {accSection && <AccountModal section={accSection} onClose={() => setAccSection(null)} />}
                  </div>
                ) : (
                  <button className="btn btn--sm btn--ghost btn--icon" onClick={shareLink} title={t('social.shareProfile')} aria-label={t('social.shareProfile')}>
                    🔗
                  </button>
                )}
              </div>
            </div>
            <div className="profile__counts">
              <span>
                <b>{fCount.followers ?? '…'}</b> {t('social.followers')}
              </span>
              <span>
                <b>{fCount.following ?? '…'}</b> {t('social.following')}
              </span>
              {mutual && <span className="profile__friend">🤝 {t('social.friends')}</span>}
            </div>
            {prof.bio ? (
              <p className="profile__bio">{prof.bio}</p>
            ) : (
              <p className="profile__bio muted">{isMe ? t('social.bioEmptyMe') : t('social.bioEmpty')}</p>
            )}
            {isMe && (
              <AppLink className="profile__activity" href={hrefProfile(uid, 'activity')} onClick={() => openProfile(uid, 'activity')}>
                🕒 {t('social.recent')} <span aria-hidden>→</span>
              </AppLink>
            )}
          </div>
        )}
      </header>

      {locked ? (
        <section className="card profile__locked">
          <div className="profile__lock">🔒</div>
          <h3 className="h3">{t('priv.lockedTitle')}</h3>
          <p className="muted small">{t('priv.lockedBody')}</p>
        </section>
      ) : (
      <>
      {isMe && p?.privateProfile && <p className="small muted">🔒 {t('priv.meNote')}</p>}
      <div className="profile__stats">
        <div className="stat">
          <div className="stat__value">🌏 {prof.countries?.length || 0}</div>
          <div className="stat__label">{t('stat.countries')}</div>
        </div>
        <div className="stat">
          <div className="stat__value">🏙️ {prof.cities?.length || 0}</div>
          <div className="stat__label">{t('recap.cities')}</div>
        </div>
        <div className="stat">
          <div className="stat__value">👣 {prof.visited || 0}</div>
          <div className="stat__label">{t('stat.visited')}</div>
        </div>
        <div className="stat">
          <div className="stat__value">📸 {checkins ? checkins.length : prof.publicCheckins || 0}</div>
          <div className="stat__label">{t('social.publicCheckins')}</div>
        </div>
      </div>

      {(prof.countries?.length || 0) > 0 && (
        <section className="card stack-sm">
          <h3 className="h3">🌏 {t('social.countriesTitle')}</h3>
          <div className="place-groups">
            {[...prof.countries]
              .map((cc) => [cc, citiesBy.find(([c]) => c === cc)?.[1] || []])
              .sort((a, b) => b[1].length - a[1].length || countryName(a[0]).localeCompare(countryName(b[0]), lang))
              .map(([cc, list]) => {
                const sorted = [...list].sort((a, b) => a.localeCompare(b, lang));
                const LIMIT = 12;
                const more = sorted.length > LIMIT && !openCc[cc];
                return (
                  <div key={cc} className="place-group">
                    <div className="place-group__head">
                      <span className="place-group__flag">{flagOf(cc) || '🌏'}</span>
                      <b>{countryName(cc)}</b>
                      <span className="place-group__count">{t(sorted.length === 1 ? 'social.cityCount1' : 'social.cityCount', { n: sorted.length })}</span>
                    </div>
                    {sorted.length > 0 && (
                      <div className="place-group__cities">
                        {(more ? sorted.slice(0, LIMIT) : sorted).map((c) => (
                          <span key={c} className="city-chip">
                            📍 {c}
                          </span>
                        ))}
                        {sorted.length > LIMIT && (
                          <button className="city-chip city-chip--more" onClick={() => setOpenCc((o) => ({ ...o, [cc]: !o[cc] }))}>
                            {more ? t('social.moreCities', { n: sorted.length - LIMIT }) : t('social.lessCities')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      )}

      <section className="stack-sm">
        <h3 className="h3">📸 {t('social.publicCheckinsTitle')}</h3>
        {!checkins ? <Loader /> : checkins.length ? <MemoryGrid items={checkins} /> : <Empty emoji="🖼️" title={t('social.noPublic')} />}
      </section>
      </>
      )}
    </div>
  );
}

/** Trang hoạt động gần đây (#/u/<uid>/activity): chỉ chính chủ và bạn bè theo dõi chéo */
function ActivityPage({ uid, prof, isMe, mutual, feed }) {
  const { t, lang } = useI18n();
  const { openProfile } = useApp();
  const groups = useMemo(() => {
    const g = new Map();
    (feed || []).forEach((it) => {
      const d = new Date(it.at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!g.has(k)) g.set(k, { label: d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { month: 'long', year: 'numeric' }), items: [] });
      g.get(k).items.push(it);
    });
    return [...g.values()];
  }, [feed, lang]);
  return (
    <div className="page profile">
      <div className="activity__top">
        <AppLink className="btn btn--sm btn--ghost" href={hrefProfile(uid)} onClick={() => openProfile(uid)}>
          ← {t('social.backProfile')}
        </AppLink>
      </div>
      <header className="activity__head card">
        <Avatar name={prof.name || '?'} photo={prof.photo} size={56} />
        <div>
          <h1 className="h2">🕒 {t('social.recent')}</h1>
          <span className="muted small">{prof.name}</span>
        </div>
      </header>
      {!isMe ? (
        <Empty emoji="🔒" title={t('social.feedLocked')} />
      ) : !feed ? (
        <Loader />
      ) : !feed.length ? (
        <Empty emoji="🌱" title={t('social.noActivity')} />
      ) : (
        groups.map((g) => (
          <section key={g.label} className="card stack-sm">
            <h3 className="h3 activity__month">{g.label}</h3>
            <FeedList items={g.items} />
          </section>
        ))
      )}
    </div>
  );
}

/** Dòng hoạt động: check-in / lần đầu tới quốc gia / thành phố */
export function FeedList({ items, who }) {
  const { t, lang } = useI18n();
  const { openProfile } = useApp();
  return (
    <ul className="feed">
      {items.map((it, i) => (
        <li key={i}>
          <span className="feed__ic">{it.type === 'country' ? flagOf(it.cc) || '🌏' : it.type === 'city' ? '🏙️' : '📍'}</span>
          <span className="feed__text">
            {who && (
              <AppLink className="link" href={hrefProfile(who.uid)} onClick={() => openProfile(who.uid)}>
                {who.name}
              </AppLink>
            )}{' '}
            {it.type === 'country'
              ? t('social.feed.country', { country: countryName(it.cc) })
              : it.type === 'city'
                ? t('social.feed.city', { city: it.city, country: countryName(it.cc) })
                : t('social.feed.checkin', { place: it.name, where: [it.city, countryName(it.cc)].filter(Boolean).join(', ') })}
            <small>{new Date(it.at).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB')}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}
