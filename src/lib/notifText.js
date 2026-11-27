// REQ-063: the text of each notification kind, in VI and EN — the same words as the in-app list
// (src/components/Notifications.jsx via src/i18n.jsx / src/i18n-en.js; tests/push.test.mjs keeps them equal).
// Pure JS (no React) so the Cloudflare Worker in worker/ can bundle it.

export const NOTIF_TEXT = {
  vi: {
    'notif.like': '{name} đã thích check-in {place} của bạn',
    'notif.follow': '{name} đã theo dõi bạn',
    'notif.hidden': 'Check-in {place} của bạn đã bị ẩn sau khi được xem xét',
    'notif.invite': '{name} mời bạn tham gia chuyến đi "{trip}"',
    'notif.postComment': '{name} đã bình luận bài "{title}" của bạn',
    'notif.inviteAccepted': '{name} đã chấp nhận lời mời vào "{trip}"',
    'notif.inviteDeclined': '{name} đã từ chối lời mời vào "{trip}"',
  },
  en: {
    'notif.like': '{name} liked your check-in at {place}',
    'notif.follow': '{name} started following you',
    'notif.hidden': 'Your check-in at {place} was hidden after review',
    'notif.invite': '{name} invited you to the trip "{trip}"',
    'notif.postComment': '{name} commented on your post "{title}"',
    'notif.inviteAccepted': '{name} accepted your invite to "{trip}"',
    'notif.inviteDeclined': '{name} declined your invite to "{trip}"',
  },
};

const fill = (s, vars) => Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), s);

/** The in-app line of a notification `n` (fields as stored in Firestore `notifications`). */
export function notifLine(n, lang = 'vi') {
  const d = NOTIF_TEXT[lang] || NOTIF_TEXT.vi;
  const name = n.fromName || '?';
  const title = n.title || '';
  const vars = {
    like: { name, place: title },
    follow: { name },
    hidden: { place: title },
    invite: { name, trip: title },
    postComment: { name, title },
    inviteAccepted: { name, trip: title },
    inviteDeclined: { name, trip: title },
  }[n.type];
  return vars ? fill(d['notif.' + n.type], vars) : title;
}

/** What the push message shows: the in-app line; messages from the team keep their own title and text. */
export function pushMessage(n, lang = 'vi') {
  const team = n.type === 'feature' || n.type === 'system';
  return { title: notifLine(n, lang), body: team ? n.body || '' : '' };
}
