import { useEffect, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Avatar, Empty, Loader } from './ui';
import { socialApi } from '../lib/social';
import { FeedList } from '../pages/Profile';

const ago = (ms, lang) => {
  const s = Math.max(1, Math.round((Date.now() - ms) / 1000));
  const rtf = new Intl.RelativeTimeFormat(lang === 'vi' ? 'vi' : 'en', { numeric: 'auto' });
  if (s < 60) return rtf.format(-s, 'second');
  if (s < 3600) return rtf.format(-Math.round(s / 60), 'minute');
  if (s < 86400) return rtf.format(-Math.round(s / 3600), 'hour');
  if (s < 86400 * 30) return rtf.format(-Math.round(s / 86400), 'day');
  return new Date(ms).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB');
};

/** Chuông thông báo trên thanh trên cùng: thông báo cá nhân + thông báo chung + bảng tin bạn bè */
export default function Notifications() {
  const { user, notes, unread, friendIds } = useApp();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('notes');
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const key = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  if (!user) return null;
  return (
    <div className="notif" ref={ref}>
      <button className="notif__bell" onClick={() => setOpen((v) => !v)} aria-label={t('notif.title')} title={t('notif.title')}>
        🔔
        {unread > 0 && <b className="notif__badge">{unread > 9 ? '9+' : unread}</b>}
      </button>
      {open && (
        <div className="notif__pop" role="dialog" aria-label={t('notif.title')}>
          <div className="notif__head">
            <b>{t('notif.title')}</b>
            <div className="segmented segmented--sm">
              <button className={tab === 'notes' ? 'on' : ''} onClick={() => setTab('notes')}>
                🔔 {t('notif.tabNotes')} {unread > 0 && <em className="notif__count">{unread}</em>}
              </button>
              <button className={tab === 'friends' ? 'on' : ''} onClick={() => setTab('friends')}>
                🤝 {t('notif.tabFriends')} {friendIds.length > 0 && <em className="notif__count notif__count--soft">{friendIds.length}</em>}
              </button>
            </div>
          </div>
          {tab === 'notes' ? <NoteList notes={notes} onDone={() => setOpen(false)} /> : <FriendsFeed ids={friendIds} />}
        </div>
      )}
    </div>
  );
}

function NoteList({ notes, onDone }) {
  const { t, lang } = useI18n();
  const { user, memories, setModal, openProfile, followingIds, toggleFollow, notify, setView, setOpenTripId, myInvites, trips, api, openTips, setTipPost, can } = useApp();
  const [answering, setAnswering] = useState('');
  const pendingFor = (n) => (myInvites || []).find((i) => i.tripId === n.tripId);
  const answer = async (n, inv, accept) => {
    setAnswering(n.id);
    try {
      await api.respondInvite(user, inv, accept);
      if (!n.read) setRead(n, true);
      notify(accept ? t('tm.joined', { trip: inv.tripName }) : t('tm.declinedDone'));
      if (accept) (setView('trips'), setOpenTripId(inv.tripId), onDone());
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setAnswering('');
    }
  };
  const fmtDay = (d) => (d ? new Date(d).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const [filter, setFilter] = useState('all');
  const list = filter === 'unread' ? notes.filter((n) => !n.read) : notes;
  const setRead = (n, read) => socialApi.setRead(user.uid, n, read).catch((e) => notify(e.message, 'error'));
  const openNote = (n) => {
    if (!n.read) setRead(n, true);
    if (n.type === 'follow' && n.from) return (openProfile(n.from), onDone());
    if ((n.type === 'like' || n.type === 'hidden') && n.memoryId) {
      const m = memories.find((x) => x.id === n.memoryId);
      if (m) return (setModal({ type: 'viewMemory', memory: m }), onDone());
    }
    if (n.type === 'postComment' && n.cc && n.postId) return (openTips(n.cc), setTipPost(n.postId), onDone());
    if (n.type === 'invite') return (setOpenTripId(null), setView('trips'), onDone());
    if ((n.type === 'inviteAccepted' || n.type === 'inviteDeclined') && n.tripId) return (setView('trips'), setOpenTripId(n.tripId), onDone());
    if (n.link) return (location.hash = n.link, onDone());
  };
  const text = (n) => {
    if (n.type === 'like') return t('notif.like', { name: n.fromName || '?', place: n.title || '' });
    if (n.type === 'follow') return t('notif.follow', { name: n.fromName || '?' });
    if (n.type === 'hidden') return t('notif.hidden', { place: n.title || '' });
    if (n.type === 'invite') return t('notif.invite', { name: n.fromName || '?', trip: n.title || '' });
    if (n.type === 'postComment') return t('notif.postComment', { name: n.fromName || '?', title: n.title || '' });
    if (n.type === 'inviteAccepted') return t('notif.inviteAccepted', { name: n.fromName || '?', trip: n.title || '' });
    if (n.type === 'inviteDeclined') return t('notif.inviteDeclined', { name: n.fromName || '?', trip: n.title || '' });
    return n.title || '';
  };
  const icon = (n) => ({ like: '❤️', follow: '👋', hidden: '🙈', feature: '🎉', system: '📢', invite: '🧳', inviteAccepted: '✅', inviteDeclined: '✖️', postComment: '💬' })[n.type] || '🔔';
  return (
    <div className="notif__body">
      <div className="notif__tools">
        <div className="segmented segmented--sm">
          <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>
            {t('common.all')}
          </button>
          <button className={filter === 'unread' ? 'on' : ''} onClick={() => setFilter('unread')}>
            {t('notif.unread')}
          </button>
        </div>
        {notes.some((n) => !n.read) && (
          <button className="btn btn--sm btn--ghost" onClick={() => socialApi.markAllRead(user.uid, notes).catch((e) => notify(e.message, 'error'))}>
            ✓ {t('notif.markAll')}
          </button>
        )}
      </div>
      {list.length === 0 ? (
        <Empty emoji="📭" title={filter === 'unread' ? t('notif.noneUnread') : t('notif.none')} />
      ) : (
        <ul className="notif__list">
          {list.map((n) => (
            <li key={n.id} className={`notif__item ${n.read ? '' : 'is-unread'}`}>
              <button className="notif__main" onClick={() => openNote(n)}>
                {n.fromPhoto || (n.fromName && ['like', 'follow', 'invite', 'inviteAccepted', 'inviteDeclined', 'postComment'].includes(n.type)) ? (
                  <span className="notif__av">
                    <Avatar name={n.fromName || '?'} photo={n.fromPhoto} size={36} />
                    <i>{icon(n)}</i>
                  </span>
                ) : (
                  <span className="notif__ic">{icon(n)}</span>
                )}
                <span className="notif__text">
                  <span>{text(n)}</span>
                  {n.type === 'hidden' && n.body && <small className="notif__reason">{t('notif.reason')}: {t('admin.reason.' + n.body) !== 'admin.reason.' + n.body ? t('admin.reason.' + n.body) : n.body}</small>}
                  {(n.type === 'feature' || n.type === 'system') && n.body && <small>{n.body}</small>}
                  {n.type === 'invite' &&
                    (() => {
                      const inv = pendingFor(n);
                      const joined = trips?.some((tr) => tr.id === n.tripId);
                      const dates = inv?.startDate ? `📅 ${fmtDay(inv.startDate)}${inv.endDate ? ` → ${fmtDay(inv.endDate)}` : ''}` : '';
                      return (
                        <>
                          {dates && <small className="notif__meta">{dates}</small>}
                          <small className="notif__meta">
                            {inv ? t('notif.inviteHint') : joined ? `✅ ${t('notif.inviteJoined')}` : t('notif.inviteClosed')}
                          </small>
                        </>
                      );
                    })()}
                  <small className="muted">{ago(n.createdAt, lang)}</small>
                </span>
              </button>
              <div className="notif__acts">
                {n.type === 'follow' && n.from && !followingIds.has(n.from) && can('follow') && (
                  <button className="btn btn--sm btn--primary" onClick={() => toggleFollow(n.from, n.fromName)}>
                    ＋ {t('social.followBack')}
                  </button>
                )}
                <button className="notif__dot" onClick={() => setRead(n, !n.read)} title={n.read ? t('notif.markUnread') : t('notif.markRead')} aria-label={n.read ? t('notif.markUnread') : t('notif.markRead')}>
                  <i />
                </button>
              </div>
                {n.type === 'invite' && pendingFor(n) && (
                  <div className="notif__invite">
                    <button className="btn btn--sm btn--ghost" disabled={answering === n.id} onClick={() => answer(n, pendingFor(n), false)}>
                      {t('tm.decline')}
                    </button>
                    <button className="btn btn--sm btn--primary" disabled={answering === n.id} onClick={() => answer(n, pendingFor(n), true)}>
                      {t('tm.accept')}
                    </button>
                  </div>
                )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FriendsFeed({ ids }) {
  const { t } = useI18n();
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let alive = true;
    if (!ids.length) return setRows([]);
    (async () => {
      const out = [];
      await Promise.all(
        ids.map(async (uid) => {
          const prof = await new Promise((r) => {
            const u = socialApi.watchProfile(uid, (p) => (r(p), setTimeout(() => u && u(), 0)));
          });
          const feed = (await socialApi.getFeed(uid)) || [];
          feed.forEach((it) => out.push({ it, who: { uid, name: prof?.name || '?', photo: prof?.photo } }));
        }),
      );
      out.sort((a, b) => b.it.at - a.it.at);
      if (alive) setRows(out.slice(0, 60));
    })();
    return () => {
      alive = false;
    };
  }, [ids.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ids.length) return <Empty emoji="🤝" title={t('notif.noFriends')} text={t('notif.noFriendsHint')} />;
  if (!rows) return <Loader size="sm" />;
  if (!rows.length) return <Empty emoji="🗺️" title={t('notif.noFriendNews')} />;
  return (
    <div className="notif__body">
      {rows.map(({ it, who }, i) => (
        <div key={i} className="notif__friend">
          <Avatar name={who.name} photo={who.photo} size={32} />
          <FeedList items={[it]} who={who} />
        </div>
      ))}
    </div>
  );
}
