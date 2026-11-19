import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Avatar, Modal, formatDate } from './ui';
import { socialApi } from '../lib/social';

const STATUS_ICON = { pending: '⏳', accepted: '✅', declined: '✖️', cancelled: '🚫' };

/**
 * Thành viên & lời mời của 1 chuyến đi.
 * - Chủ chuyến mời người đã có tài khoản; người được mời phải chấp nhận mới thành thành viên
 *   (chưa chấp nhận thì không được tính vào chia tiền).
 * - Mã mời / link mời vẫn dùng được; chủ chuyến có thể đổi mã để mã cũ hết hiệu lực.
 * - Chỉ chủ chuyến được xoá thành viên khác.
 */
export default function TripMembers({ trip, onClose }) {
  const { user, api, notify, can } = useApp();
  const { t, lang } = useI18n();
  const owner = trip.ownerId === user?.uid;
  const canInvite = owner && can('tripInvites');
  const [tab, setTab] = useState(canInvite ? 'invite' : 'members');
  const [q, setQ] = useState('');
  const [found, setFound] = useState([]);
  const [invites, setInvites] = useState([]);
  const [busy, setBusy] = useState('');

  useEffect(() => (owner ? api.watchTripInvites(trip, user.uid, setInvites) : undefined), [owner, trip.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const s = q.trim();
    if (s.length < 2) return setFound([]), undefined;
    let alive = true;
    const tm = setTimeout(() => socialApi.searchUsers(s).then((l) => alive && setFound(l)).catch(() => alive && setFound([])), 300);
    return () => {
      alive = false;
      clearTimeout(tm);
    };
  }, [q]);

  const members = trip.memberIds || [];
  const statusOf = useMemo(() => Object.fromEntries(invites.map((i) => [i.to, i])), [invites]);
  const link = `${location.origin}${location.pathname}#join=${trip.inviteCode}`;
  const run = async (key, fn, ok) => {
    setBusy(key);
    try {
      await fn();
      if (ok) notify(ok);
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy('');
    }
  };
  const invite = (p) =>
    run(`inv-${p.uid}`, () => api.inviteToTrip(user, trip, p), t('tm.invited', { name: p.name || '' }));

  const statusLabel = (st) => `${STATUS_ICON[st] || ''} ${t(`tm.status.${st}`)}`;

  return (
    <Modal title={`👥 ${t('tm.title')}`} onClose={onClose}>
      <div className="stack tm">
        <div className="segmented">
          {canInvite && (
            <button className={tab === 'invite' ? 'on' : ''} onClick={() => setTab('invite')}>
              ➕ {t('tm.tabInvite')}
            </button>
          )}
          <button className={tab === 'members' ? 'on' : ''} onClick={() => setTab('members')}>
            👥 {t('tm.tabMembers', { n: members.length })}
          </button>
          <button className={tab === 'code' ? 'on' : ''} onClick={() => setTab('code')}>
            🔗 {t('tm.tabCode')}
          </button>
        </div>

        {tab === 'invite' && canInvite && (
          <div className="stack-sm">
            <p className="small muted">{t('tm.inviteHint')}</p>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('tm.searchPh')} autoFocus />
            {q.trim().length >= 2 && !found.length && <p className="small muted">{t('tm.noUser')}</p>}
            <ul className="tm__list">
              {found
                .filter((p) => p.uid !== user.uid)
                .map((p) => {
                  const inv = statusOf[p.uid];
                  const isMember = members.includes(p.uid);
                  return (
                    <li key={p.uid}>
                      <Avatar name={p.name || '?'} photo={p.photo} size={36} />
                      <span className="tm__who">
                        <b>{p.name || '—'}</b>
                        {p.username && <small>@{p.username}</small>}
                      </span>
                      {isMember ? (
                        <span className="tm__status tm__status--accepted">{t('tm.alreadyMember')}</span>
                      ) : inv?.status === 'pending' ? (
                        <span className="tm__status tm__status--pending">{statusLabel('pending')}</span>
                      ) : (
                        <button className="btn btn--sm btn--primary" disabled={busy === `inv-${p.uid}`} onClick={() => invite(p)}>
                          {inv ? t('tm.reinvite') : t('tm.invite')}
                        </button>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        )}

        {tab === 'members' && (
          <div className="stack-sm">
            <h4 className="tm__h">{t('tm.members')}</h4>
            <ul className="tm__list">
              {members.map((id) => {
                const m = trip.members?.[id] || {};
                return (
                  <li key={id}>
                    <Avatar name={m.name || '?'} photo={m.photo} size={36} />
                    <span className="tm__who">
                      <b>
                        {m.name || '—'}
                        {id === user?.uid && <em> · {t('social.you')}</em>}
                      </b>
                      <small>{id === trip.ownerId ? `👑 ${t('trip.owner')}` : t('tm.member')}</small>
                    </span>
                    {owner && id !== user.uid && (
                      <button
                        className="btn btn--sm btn--ghost danger"
                        disabled={busy === `rm-${id}`}
                        onClick={() => confirm(t('tm.confirmRemove', { name: m.name || '' })) && run(`rm-${id}`, () => api.removeMember(trip, id), t('tm.removed'))}
                      >
                        {t('tm.remove')}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            {owner && invites.some((i) => i.status !== 'accepted') && (
              <>
                <h4 className="tm__h">{t('tm.invites')}</h4>
                <p className="tiny muted">{t('tm.pendingNote')}</p>
                <ul className="tm__list">
                  {invites
                    .filter((i) => i.status !== 'accepted')
                    .map((i) => (
                      <li key={i.id}>
                        <Avatar name={i.toName || '?'} photo={i.toPhoto} size={36} />
                        <span className="tm__who">
                          <b>{i.toName || '—'}</b>
                          <small>
                            {t('tm.invitedOn', { date: formatDate(i.createdAt) })}
                            {i.respondedAt ? ` · ${formatDate(i.respondedAt)}` : ''}
                          </small>
                        </span>
                        <span className={`tm__status tm__status--${i.status}`}>{statusLabel(i.status)}</span>
                        {i.status === 'pending' ? (
                          <button className="btn btn--sm btn--ghost" disabled={busy === `c-${i.id}`} onClick={() => run(`c-${i.id}`, () => api.cancelInvite(i), t('tm.cancelled'))}>
                            {t('tm.cancel')}
                          </button>
                        ) : (
                          <button
                            className="btn btn--sm btn--soft"
                            disabled={busy === `inv-${i.to}`}
                            onClick={() => invite({ uid: i.to, name: i.toName, photo: i.toPhoto })}
                          >
                            {t('tm.reinvite')}
                          </button>
                        )}
                      </li>
                    ))}
                </ul>
              </>
            )}
          </div>
        )}

        {tab === 'code' && (
          <div className="stack-sm">
            <p className="small muted">{t('tm.codeHint')}</p>
            <div className="tm__code">
              <b className="code">{trip.inviteCode}</b>
              <button className="btn btn--sm btn--soft" onClick={() => navigator.clipboard?.writeText(trip.inviteCode).then(() => notify(t('trip.codeCopied', { code: trip.inviteCode })))}>
                📋 {t('tm.copyCode')}
              </button>
              <button className="btn btn--sm btn--soft" onClick={() => navigator.clipboard?.writeText(link).then(() => notify(t('trip.copied')))}>
                🔗 {t('tm.copyLink')}
              </button>
            </div>
            {owner && (
              <button
                className="btn btn--sm btn--ghost"
                disabled={busy === 'code'}
                onClick={() => confirm(t('tm.confirmNewCode')) && run('code', () => api.regenerateInviteCode(user, trip), t('tm.newCodeDone'))}
              >
                🔄 {t('tm.newCode')}
              </button>
            )}
            <p className="tiny muted">{t('tm.codeSafety', { lang })}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

/** Danh sách lời mời đang chờ mình trả lời (trang Chuyến đi) */
export function MyTripInvites() {
  const { myInvites, user, api, notify, setOpenTripId } = useApp();
  const { t } = useI18n();
  const [busy, setBusy] = useState('');
  if (!myInvites?.length) return null;
  const answer = async (inv, accept) => {
    setBusy(inv.id);
    try {
      await api.respondInvite(user, inv, accept);
      notify(accept ? t('tm.joined', { trip: inv.tripName }) : t('tm.declinedDone'));
      if (accept) setOpenTripId(inv.tripId);
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy('');
    }
  };
  return (
    <section className="card stack-sm tm-inbox">
      <h3 className="h3">📨 {t('tm.inbox', { n: myInvites.length })}</h3>
      {myInvites.map((inv) => (
        <div key={inv.id} className="tm-inbox__row">
          <span className="tm-inbox__emoji">{inv.tripEmoji || '🧳'}</span>
          <span className="tm__who">
            <b>{inv.tripName}</b>
            <small>
              {t('tm.from', { name: inv.fromName || '?' })}
              {inv.startDate ? ` · ${formatDate(inv.startDate)}${inv.endDate ? ` → ${formatDate(inv.endDate)}` : ''}` : ''}
            </small>
          </span>
          <button className="btn btn--sm btn--ghost" disabled={busy === inv.id} onClick={() => answer(inv, false)}>
            {t('tm.decline')}
          </button>
          <button className="btn btn--sm btn--primary" disabled={busy === inv.id} onClick={() => answer(inv, true)}>
            {t('tm.accept')}
          </button>
        </div>
      ))}
    </section>
  );
}
