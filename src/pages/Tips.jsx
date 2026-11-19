import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Avatar, Empty, Loader, Modal, AppLink } from '../components/ui';
import { countryName, flagOf } from '../lib/countries';
import { hrefCountry, hrefProfile } from '../lib/route';
import { tipsApi, rankPosts, isFlagged, isStale, TOPICS, TOPIC_ICON, DEFAULT_COMMUNITY } from '../lib/tips';
import { socialApi } from '../lib/social';
import AdSlot from '../components/AdSlot';

const ago = (ts, lang) => {
  const d = Math.max(0, Date.now() - (ts || 0));
  const m = Math.round(d / 6e4);
  const rtf = new Intl.RelativeTimeFormat(lang === 'vi' ? 'vi' : 'en', { numeric: 'auto' });
  if (m < 60) return rtf.format(-m, 'minute');
  if (m < 1440) return rtf.format(-Math.round(m / 60), 'hour');
  if (m < 43200) return rtf.format(-Math.round(m / 1440), 'day');
  return new Date(ts).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** #/tips/<cc> — Kinh nghiệm du lịch của cộng đồng cho 1 quốc gia */
export default function TipsPage() {
  const { selectedCountry: cc, openCountry, settings, requireLogin, tipPost, setTipPost } = useApp();
  const { t } = useI18n();
  const [posts, setPosts] = useState(null);
  const [mode, setMode] = useState('top');
  const [topic, setTopic] = useState('');
  const [city, setCity] = useState('');
  const [writing, setWriting] = useState(null); // null | {} (mới) | post (sửa)
  const cfg = { ...DEFAULT_COMMUNITY, ...(settings?.community || {}) };

  useEffect(() => {
    setPosts(null);
    if (!cc) return undefined;
    return tipsApi.watchCountry(cc, setPosts);
  }, [cc]);

  const cities = useMemo(() => [...new Set((posts || []).map((p) => p.city).filter(Boolean))].sort(), [posts]);
  const list = useMemo(() => {
    const f = (posts || []).filter((p) => (!topic || p.topic === topic) && (!city || p.city === city));
    return rankPosts(f, mode, cfg);
  }, [posts, mode, topic, city, settings?.community]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cc) return <div className="page"><Empty emoji="🌏" title={t('tips.pickCountry')} /></div>;

  return (
    <div className="page tips">
      <header className="tips__head">
        <AppLink className="back" href={hrefCountry(cc)} onClick={() => openCountry(cc)}>
          ← {countryName(cc)}
        </AppLink>
        <div className="tips__title">
          <span className="tips__flag">{flagOf(cc)}</span>
          <div>
            <h1 className="h1">{t('tips.title', { country: countryName(cc) })}</h1>
            <p className="muted">{t('tips.sub')}</p>
          </div>
          <button className="btn btn--primary" onClick={() => requireLogin(() => setWriting({}), t('tips.loginWrite'))}>
            ✍️ {t('tips.write')}
          </button>
        </div>
      </header>

      <div className="tips__bar">
        <div className="segmented segmented--sm">
          {[
            ['top', '✨'],
            ['new', '🕒'],
            ['helpful', '👍'],
          ].map(([m, ic]) => (
            <button key={m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
              {ic} {t(`tips.mode.${m}`)}
            </button>
          ))}
        </div>
        {cities.length > 0 && (
          <select value={city} onChange={(e) => setCity(e.target.value)} aria-label={t('tips.city')}>
            <option value="">{t('tips.allCities')}</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        )}
      </div>
      <div className="chips chips--scroll">
        <button className={`chip ${!topic ? 'chip--on' : ''}`} onClick={() => setTopic('')}>
          {t('common.all')}
        </button>
        {TOPICS.map((k) => (
          <button key={k} className={`chip ${topic === k ? 'chip--on' : ''}`} onClick={() => setTopic(topic === k ? '' : k)}>
            {TOPIC_ICON[k]} {t(`tips.topic.${k}`)}
          </button>
        ))}
      </div>
      {mode === 'top' && <p className="tiny muted">{t('tips.mixNote', { h: cfg.helpfulSlots, n: cfg.newSlots, d: cfg.newDays })}</p>}

      {!posts ? (
        <Loader />
      ) : !list.length ? (
        <Empty emoji="🗺️" title={t('tips.empty')} text={t('tips.emptyHint')} />
      ) : (
        <div className="tips__list">
          {list.map((p, i) => (
            <PostCard key={p.id} post={p} cfg={cfg} onOpen={() => setTipPost(p.id)} index={i} />
          ))}
        </div>
      )}
      <AdSlot placement="tips-bottom" size="banner" />

      {writing && <PostForm cc={cc} post={writing.id ? writing : null} onClose={() => setWriting(null)} onSaved={(id) => (setWriting(null), setTipPost(id))} />}
      {tipPost && <PostModal id={tipPost} cfg={cfg} onClose={() => setTipPost(null)} onEdit={(p) => (setTipPost(null), setWriting(p))} />}
    </div>
  );
}

function PostCard({ post: p, cfg, onOpen }) {
  const { t, lang } = useI18n();
  return (
    <button className="tip-card card" onClick={onOpen}>
      <div className="tip-card__tags">
        <span className="tip-tag">
          {TOPIC_ICON[p.topic] || '💬'} {t(`tips.topic.${p.topic || 'other'}`)}
        </span>
        {p.city && <span className="tip-tag tip-tag--city">📍 {p.city}</span>}
        {isFlagged(p, cfg) && <span className="tip-tag tip-tag--warn">⚠️ {t('tips.flagged')}</span>}
        {isStale(p, cfg) && <span className="tip-tag tip-tag--old">⏳ {t('tips.stale')}</span>}
      </div>
      <h3 className="tip-card__title">{p.title}</h3>
      <p className="tip-card__body">{p.body}</p>
      <div className="tip-card__meta">
        <Avatar name={p.authorName || '?'} photo={p.authorPhoto} size={22} />
        <span>{p.authorName}</span>
        <span className="muted">· {ago(p.createdAt, lang)}</span>
        <span className="tip-card__stats">
          👍 {p.helpful || 0} · ⚠️ {p.wrong || 0} · 💬 {p.comments || 0}
        </span>
      </div>
    </button>
  );
}

function PostForm({ cc, post, onClose, onSaved }) {
  const { user, notify } = useApp();
  const { t } = useI18n();
  const [f, setF] = useState({ title: post?.title || '', body: post?.body || '', topic: post?.topic || 'other', city: post?.city || '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const ok = f.title.trim().length >= 5 && f.body.trim().length >= 20;
  const save = async (e) => {
    e.preventDefault();
    if (!ok) return;
    setBusy(true);
    try {
      const data = { title: f.title.trim(), body: f.body.trim(), topic: f.topic, city: f.city.trim() };
      if (post) {
        await tipsApi.update(post.id, data);
        onSaved(post.id);
      } else onSaved(await tipsApi.create(user, { cc, ...data }));
      notify(t('tips.saved'));
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={`✍️ ${post ? t('tips.edit') : t('tips.write')} · ${flagOf(cc)} ${countryName(cc)}`} onClose={onClose}>
      <form className="stack" onSubmit={save}>
        <label className="field">
          <span>{t('tips.f.topic')}</span>
          <select value={f.topic} onChange={set('topic')}>
            {TOPICS.map((k) => (
              <option key={k} value={k}>
                {TOPIC_ICON[k]} {t(`tips.topic.${k}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('tips.f.title')}</span>
          <input value={f.title} onChange={set('title')} maxLength={120} placeholder={t('tips.f.titlePh')} required />
        </label>
        <label className="field">
          <span>{t('tips.f.city')}</span>
          <input value={f.city} onChange={set('city')} maxLength={60} placeholder={t('tips.f.cityPh')} />
        </label>
        <label className="field">
          <span>{t('tips.f.body')}</span>
          <textarea rows={8} value={f.body} onChange={set('body')} maxLength={5000} placeholder={t('tips.f.bodyPh')} required />
          <small className="muted">{f.body.length}/5000</small>
        </label>
        <p className="tiny muted">{t('tips.f.rules')}</p>
        <div className="row wrap" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t('acc.cancel')}
          </button>
          <button className="btn btn--primary" disabled={!ok || busy}>
            {post ? t('admin.save') : t('tips.publish')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PostModal({ id, cfg, onClose, onEdit }) {
  const { user, isStaff, requireLogin, notify, openProfile, adminApi } = useApp();
  const { t, lang } = useI18n();
  const [p, setP] = useState(undefined);
  const [vote, setVote] = useState('');
  const [comments, setComments] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => tipsApi.watchPost(id, setP), [id]);
  useEffect(() => tipsApi.watchComments(id, setComments), [id]);
  useEffect(() => {
    if (user) tipsApi.myVote(id, user.uid).then(setVote);
  }, [id, user]);
  if (p === undefined) return <Modal title="" onClose={onClose}><Loader /></Modal>;
  if (!p) return <Modal title="" onClose={onClose}><Empty emoji="🫥" title={t('tips.gone')} /></Modal>;
  const mine = user?.uid === p.uid;
  const doVote = (v) =>
    requireLogin(async () => {
      if (mine) return notify(t('tips.ownVote'), 'error');
      try {
        setVote(await tipsApi.vote(user, p, vote, v));
      } catch (e) {
        notify(e.message, 'error');
      }
    }, t('tips.loginVote'));
  const send = (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    requireLogin(async () => {
      setBusy(true);
      try {
        const cid = await tipsApi.comment(user, p, body);
        setText('');
        if (!mine) socialApi.notify({ to: p.uid, type: 'postComment', from: user.uid, fromName: user.name || '', fromPhoto: user.photo || '', title: p.title.slice(0, 160), postId: p.id, commentId: cid, cc: p.cc }).catch(() => {});
      } catch (err) {
        notify(err.message, 'error');
      } finally {
        setBusy(false);
      }
    }, t('tips.loginComment'));
  };
  const best = (comments || []).filter((c) => c.best);
  const rest = (comments || []).filter((c) => !c.best);
  return (
    <Modal title={`${flagOf(p.cc)} ${t(`tips.topic.${p.topic || 'other'}`)}`} onClose={onClose}>
      <article className="tip-post stack">
        <div className="tip-card__tags">
          {p.city && <span className="tip-tag tip-tag--city">📍 {p.city}</span>}
          {isFlagged(p, cfg) && <span className="tip-tag tip-tag--warn">⚠️ {t('tips.flagged')}</span>}
          {isStale(p, cfg) && <span className="tip-tag tip-tag--old">⏳ {t('tips.stale')}</span>}
        </div>
        <h2 className="h2">{p.title}</h2>
        <AppLink className="tip-card__meta" href={hrefProfile(p.uid)} onClick={() => (onClose(), openProfile(p.uid))}>
          <Avatar name={p.authorName || '?'} photo={p.authorPhoto} size={28} />
          <b>{p.authorName}</b>
          <span className="muted">· {ago(p.createdAt, lang)}</span>
        </AppLink>
        <p className="tip-post__body">{p.body}</p>
        <div className="tip-votes">
          <button className={`btn btn--sm ${vote === 'helpful' ? 'btn--primary' : 'btn--soft'}`} onClick={() => doVote('helpful')} disabled={mine}>
            👍 {t('tips.helpful')} · {p.helpful || 0}
          </button>
          <button className={`btn btn--sm ${vote === 'wrong' ? 'btn--danger' : 'btn--ghost'}`} onClick={() => doVote('wrong')} disabled={mine}>
            ⚠️ {t('tips.wrong')} · {p.wrong || 0}
          </button>
          {(mine || isStaff) && (
            <span className="tip-votes__own">
              {mine && (
                <button className="btn btn--sm btn--ghost" onClick={() => onEdit(p)}>
                  ✏️ {t('tips.edit')}
                </button>
              )}
              {isStaff && !mine && (
                <button
                  className="btn btn--sm btn--ghost"
                  onClick={() => tipsApi.setStatus(p.id, 'hidden').then(() => (adminApi.log('tip.hide', p.id, p.title), notify(t('tips.hiddenDone')), onClose()))}
                >
                  🙈 {t('tips.hide')}
                </button>
              )}
              <button
                className="btn btn--sm btn--ghost danger"
                onClick={() => confirm(t('tips.confirmDelete')) && tipsApi.remove(p.id).then(() => (isStaff && !mine && adminApi.log('tip.delete', p.id, p.title), onClose()))}
              >
                {t('tips.delete')}
              </button>
            </span>
          )}
        </div>
        <p className="tiny muted">{t('tips.voteHint')}</p>

        <section className="tip-comments stack-sm">
          <h3 className="h3">💬 {t('tips.qa', { n: comments?.length || 0 })}</h3>
          {!comments ? (
            <Loader />
          ) : (
            [...best, ...rest].map((c) => (
              <div key={c.id} className={`tip-comment ${c.best ? 'tip-comment--best' : ''}`}>
                <Avatar name={c.authorName || '?'} photo={c.authorPhoto} size={28} />
                <div className="tip-comment__main">
                  <div className="tip-comment__head">
                    <b>{c.authorName}</b>
                    {c.uid === p.uid && <span className="tip-tag">{t('tips.author')}</span>}
                    {c.best && <span className="tip-tag tip-tag--best">✅ {t('tips.best')}</span>}
                    <small className="muted">{ago(c.createdAt, lang)}</small>
                  </div>
                  <p>{c.body}</p>
                  <div className="tip-comment__acts">
                    {mine && c.uid !== p.uid && (
                      <button className="link" onClick={() => tipsApi.markBest(p, c, !c.best).catch((e) => notify(e.message, 'error'))}>
                        {c.best ? t('tips.unbest') : `✅ ${t('tips.markBest')}`}
                      </button>
                    )}
                    {(c.uid === user?.uid || isStaff) && (
                      <button className="link danger" onClick={() => confirm(t('tips.confirmDeleteComment')) && tipsApi.deleteComment(p, c).catch((e) => notify(e.message, 'error'))}>
                        {t('tips.delete')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <form className="tip-comment-form" onSubmit={send}>
            <textarea rows={2} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} placeholder={t('tips.commentPh')} />
            <button className="btn btn--primary btn--sm" disabled={busy || !text.trim()}>
              {t('tips.send')}
            </button>
          </form>
        </section>
      </article>
    </Modal>
  );
}

/** Ô giới thiệu trong bảng quốc gia (bản đồ): số bài + 2 bài nổi bật + nút xem tất cả */
export function TipsTeaser({ cc }) {
  const { openTips, settings, setTipPost } = useApp();
  const { t } = useI18n();
  const [posts, setPosts] = useState(null);
  useEffect(() => {
    let alive = true;
    setPosts(null);
    tipsApi.countFor(cc).then((l) => alive && setPosts(l));
    return () => {
      alive = false;
    };
  }, [cc]);
  const top = posts ? rankPosts(posts, 'top', { ...DEFAULT_COMMUNITY, ...(settings?.community || {}) }).slice(0, 2) : [];
  return (
    <section className="tips-teaser card">
      <div className="tips-teaser__head">
        <h3 className="section-title">🧭 {t('tips.teaser')}</h3>
        <a href={`#/tips/${cc}`} className="link" onClick={(e) => (e.preventDefault(), openTips(cc))}>
          {posts?.length ? t('tips.seeAll', { n: posts.length }) : t('tips.open')} →
        </a>
      </div>
      {posts && !posts.length && <p className="small muted">{t('tips.teaserEmpty')}</p>}
      {top.map((p) => (
        <button key={p.id} className="tips-teaser__item" onClick={() => (openTips(cc), setTipPost(p.id))}>
          <span>{TOPIC_ICON[p.topic] || '💬'}</span>
          <span className="tips-teaser__text">
            <b>{p.title}</b>
            <small>
              👍 {p.helpful || 0} · 💬 {p.comments || 0}
            </small>
          </span>
        </button>
      ))}
    </section>
  );
}
