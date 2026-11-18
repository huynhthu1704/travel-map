import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Avatar, Empty, Loader } from '../components/ui';
import { MemoryGrid } from '../components/SidePanel';
import { countryName, flagOf } from '../lib/countries';
import { socialApi } from '../lib/social';
import { fixMemory } from '../lib/fixes';

const BIO_MAX = 160;

/** Hồ sơ người dùng: quốc gia / thành phố đã đi, check-in công khai, giới thiệu ngắn, theo dõi */
export default function ProfilePage() {
  const { profileUid: uid, user, requireLogin, followingIds, followerIds, toggleFollow, notify } = useApp();
  const { t, lang } = useI18n();
  const [p, setP] = useState(undefined);
  const [checkins, setCheckins] = useState(null);
  const [fCount, setFCount] = useState({ followers: null, following: null });
  const [feed, setFeed] = useState(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const isMe = user?.uid === uid;
  const mutual = !isMe && followingIds.has(uid) && followerIds.has(uid);

  useEffect(() => {
    if (!uid || !user) return undefined;
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
    (p?.cities || []).forEach((c) => (g[c.cc] ||= []).push(c.name));
    return Object.entries(g).sort((a, b) => b[1].length - a[1].length);
  }, [p]);

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
  const prof = p || { name: user.name, photo: user.photo, countries: [], cities: [] };

  const saveBio = async () => {
    try {
      await socialApi.saveProfile(uid, { bio: bio.trim().slice(0, BIO_MAX) });
      setEditing(false);
      notify(t('social.bioSaved'));
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  return (
    <div className="page profile">
      <header className="profile__head card">
        <Avatar name={prof.name || '?'} photo={prof.photo} size={96} />
        <div className="profile__info">
          <h1 className="h1">{prof.name || t('admin.unknownUser')}</h1>
          {editing ? (
            <div className="stack-sm">
              <textarea rows={2} value={bio} maxLength={BIO_MAX} onChange={(e) => setBio(e.target.value)} placeholder={t('social.bioPh')} autoFocus />
              <div className="row wrap">
                <button className="btn btn--sm btn--primary" onClick={saveBio}>
                  💾 {t('admin.save')}
                </button>
                <button className="btn btn--sm btn--ghost" onClick={() => (setEditing(false), setBio(p?.bio || ''))}>
                  {t('pick.cancel')}
                </button>
                <small className="muted">
                  {bio.length}/{BIO_MAX}
                </small>
              </div>
            </div>
          ) : (
            <p className={`profile__bio ${prof.bio ? '' : 'muted'}`}>
              {prof.bio || (isMe ? t('social.bioEmptyMe') : t('social.bioEmpty'))}
              {isMe && (
                <button className="btn btn--sm btn--ghost" onClick={() => setEditing(true)}>
                  ✏️ {prof.bio ? t('social.editBio') : t('social.addBio')}
                </button>
              )}
            </p>
          )}
          <div className="profile__follow">
            <span>
              <b>{fCount.followers ?? '…'}</b> {t('social.followers')}
            </span>
            <span>
              <b>{fCount.following ?? '…'}</b> {t('social.following')}
            </span>
            {!isMe && (
              <>
                <button className={`btn btn--sm ${followingIds.has(uid) ? 'btn--soft' : 'btn--primary'}`} onClick={() => toggleFollow(uid, prof.name)}>
                  {followingIds.has(uid) ? `✓ ${t('social.followingBtn')}` : followerIds.has(uid) ? `＋ ${t('social.followBack')}` : `＋ ${t('social.follow')}`}
                </button>
                {mutual && <span className="profile__friend">🤝 {t('social.friends')}</span>}
              </>
            )}
          </div>
        </div>
      </header>

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
          <div className="chips">
            {[...prof.countries].sort((a, b) => countryName(a).localeCompare(countryName(b), lang)).map((cc) => (
              <span key={cc} className="chip">
                {flagOf(cc)} {countryName(cc)}
              </span>
            ))}
          </div>
          {citiesBy.length > 0 && (
            <div className="profile__cities">
              {citiesBy.map(([cc, list]) => (
                <div key={cc}>
                  <b>
                    {flagOf(cc)} {countryName(cc)}
                  </b>
                  <span>{list.join(' · ')}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {(isMe || mutual) && (
        <section className="card stack-sm">
          <h3 className="h3">🕒 {t('social.recent')}</h3>
          {!feed ? <Loader size="sm" /> : feed.length ? <FeedList items={feed.slice(0, 12)} /> : <p className="muted small">—</p>}
        </section>
      )}
      {!isMe && !mutual && <p className="small muted">🔒 {t('social.feedLocked')}</p>}

      <section className="stack-sm">
        <h3 className="h3">📸 {t('social.publicCheckinsTitle')}</h3>
        {!checkins ? <Loader /> : checkins.length ? <MemoryGrid items={checkins} /> : <Empty emoji="🖼️" title={t('social.noPublic')} />}
      </section>
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
              <button className="link" onClick={() => openProfile(who.uid)}>
                {who.name}
              </button>
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
