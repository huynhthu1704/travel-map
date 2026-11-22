import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Modal, Avatar, Loader, Empty, TrashIcon } from './ui';
import { maskEmail } from '../lib/adminStore';
import { feedbackApi, feedbackDraft, envInfo, prepareFile, FEEDBACK_STATUSES, MAX_VIDEO_MB } from '../lib/feedback';
import '../styles/pages/feedback.css';

/* ------------------------------------------------------------------ */
/* Góp ý / báo lỗi: form cho người dùng, danh sách góp ý của tôi,      */
/* và trang xử lý trong khu quản trị                                   */
/* ------------------------------------------------------------------ */

const MAX_FILES = 5;
const fmtTime = (ms, lang) =>
  ms ? new Date(ms).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtSize = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export function StatusChip({ status }) {
  const { t } = useI18n();
  return <span className={`fb-status fb-status--${status}`}>{t('fb.status.' + status)}</span>;
}

function TypeTag({ type }) {
  const { t } = useI18n();
  return (
    <span className={`fb-type fb-type--${type}`} title={t('fb.type.' + type)}>
      {type === 'bug' ? '🐞' : '✨'}
      <em className="fb-type__label"> {t('fb.type.' + type)}</em>
    </span>
  );
}

/** Form góp ý + danh sách góp ý của tôi */
export function FeedbackModal({ capture, onClose }) {
  const { t } = useI18n();
  const { user, notify, setModal } = useApp();
  const init = feedbackDraft.current || {};
  const [tab, setTab] = useState(init.tab || 'new');
  const [type, setType] = useState(init.type || 'bug');
  const [title, setTitle] = useState(init.title || '');
  const [actual, setActual] = useState(init.actual || '');
  const [expected, setExpected] = useState(init.expected || '');
  const [description, setDescription] = useState(init.description || '');
  const [files, setFiles] = useState(init.files || []); // [{kind,name,mime,size,data}]
  const [shot, setShot] = useState(capture || init.shot || null); // {screenshot, element}
  const [busy, setBusy] = useState('');
  const [openId, setOpenId] = useState(null);
  const env = useMemo(() => envInfo(), []);
  useEffect(() => {
    feedbackDraft.current = null;
  }, []);

  const pickArea = () => {
    feedbackDraft.current = { tab: 'new', type, title, actual, expected, description, files, shot };
    setModal(null);
    setTimeout(() => window.dispatchEvent(new Event('feedback:pick')), 120);
  };

  const addFiles = async (list) => {
    const room = MAX_FILES - files.length;
    const picked = [...list].slice(0, room);
    if (list.length > room) notify(t('fb.maxFiles', { n: MAX_FILES }), 'error');
    setBusy(t('fb.preparing'));
    const out = [];
    for (const f of picked) {
      try {
        out.push(await prepareFile(f));
      } catch (e) {
        notify(String(e.message).startsWith('video>') ? t('fb.videoTooBig', { n: MAX_VIDEO_MB }) : t('fb.fileBad'), 'error');
      }
    }
    setFiles((x) => [...x, ...out]);
    setBusy('');
  };

  const valid = title.trim() && (type === 'bug' ? actual.trim() : description.trim());
  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(t('fb.sending'));
    try {
      const all = [...(shot?.screenshot ? [{ kind: 'screenshot', name: 'screenshot.jpg', mime: 'image/jpeg', size: Math.round(shot.screenshot.length * 0.75), data: shot.screenshot }] : []), ...files];
      await feedbackApi.submit(
        user,
        {
          type,
          title: title.trim(),
          actual: type === 'bug' ? actual.trim() : '',
          expected: type === 'bug' ? expected.trim() : '',
          description: type === 'enhancement' ? description.trim() : '',
          page: location.hash || '#/',
          url: location.href,
          element: shot?.element || null,
          env,
        },
        all,
      );
      notify(t('fb.sent'));
      setTitle('');
      setActual('');
      setExpected('');
      setDescription('');
      setFiles([]);
      setShot(null);
      setTab('mine');
    } catch (err) {
      notify(t('fb.failed', { msg: err.message }), 'error');
    }
    setBusy('');
  };

  return (
    <Modal title={`💬 ${t('fb.title')}`} onClose={onClose} wide>
      <div className="stack fb">
        <div className="segmented">
          <button className={tab === 'new' ? 'on' : ''} onClick={() => setTab('new')}>
            ✍️ {t('fb.tabNew')}
          </button>
          <button className={tab === 'mine' ? 'on' : ''} onClick={() => setTab('mine')}>
            📋 {t('fb.tabMine')}
          </button>
        </div>

        {tab === 'new' && (
          <form className="stack" onSubmit={submit}>
            <div className="fb-types">
              {['bug', 'enhancement'].map((k) => (
                <button type="button" key={k} className={type === k ? 'on' : ''} onClick={() => setType(k)}>
                  <b>{k === 'bug' ? '🐞' : '✨'}</b>
                  <span>
                    <strong>{t('fb.type.' + k)}</strong>
                    <small>{t('fb.typeHint.' + k)}</small>
                  </span>
                </button>
              ))}
            </div>
            <label className="field">
              <span>{t('fb.titleLabel')} *</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder={t(type === 'bug' ? 'fb.titlePhBug' : 'fb.titlePhEnh')} />
            </label>
            {type === 'bug' ? (
              <div className="grid-2">
                <label className="field">
                  <span>❌ {t('fb.actual')} *</span>
                  <textarea rows={4} value={actual} onChange={(e) => setActual(e.target.value)} maxLength={1500} placeholder={t('fb.actualPh')} />
                </label>
                <label className="field">
                  <span>✅ {t('fb.expected')}</span>
                  <textarea rows={4} value={expected} onChange={(e) => setExpected(e.target.value)} maxLength={1500} placeholder={t('fb.expectedPh')} />
                </label>
              </div>
            ) : (
              <label className="field">
                <span>💡 {t('fb.description')} *</span>
                <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1500} placeholder={t('fb.descriptionPh')} />
              </label>
            )}

            <div className="field">
              <span>🎯 {t('fb.area')}</span>
              {shot ? (
                <div className="fb-shot">
                  {shot.screenshot ? <img src={shot.screenshot} alt={t('fb.screenshot')} /> : <div className="fb-shot__none">{t('fb.noShot')}</div>}
                  <div className="fb-shot__meta">
                    {shot.element?.text && (
                      <p className="small">
                        <b>{t('fb.selected')}:</b> “{shot.element.text}”
                      </p>
                    )}
                    <div className="row wrap">
                      <button type="button" className="btn btn--sm btn--soft" onClick={pickArea}>
                        🎯 {t('fb.repick')}
                      </button>
                      <button type="button" className="btn btn--sm btn--ghost" onClick={() => setShot(null)}>
                        ✕ {t('fb.removeShot')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button type="button" className="fb-pick" onClick={pickArea}>
                  <b>🎯</b>
                  <span>
                    <strong>{t('fb.pickArea')}</strong>
                    <small>{t('fb.pickAreaHint')}</small>
                  </span>
                </button>
              )}
            </div>

            <div className="field">
              <span>
                📎 {t('fb.attach')} <small className="muted">({files.length}/{MAX_FILES} · {t('fb.attachHint', { n: MAX_VIDEO_MB })})</small>
              </span>
              <div className="uploader">
                {files.map((f, i) => (
                  <div className="uploader__thumb" key={i}>
                    {f.kind === 'video' ? <video src={f.data} muted playsInline /> : <img src={f.data} alt="" />}
                    {f.kind === 'video' && <span className="fb-vid">▶</span>}
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={t('mem.removePhoto')}>
                      ✕
                    </button>
                  </div>
                ))}
                {files.length < MAX_FILES && (
                  <label className="uploader__add">
                    <input type="file" accept="image/*,video/*" multiple onChange={(e) => addFiles(e.target.files)} />
                    <span>＋</span>
                    <small>{t('fb.addFile')}</small>
                  </label>
                )}
              </div>
            </div>

            <details className="fb-env">
              <summary>
                🖥️ {t('fb.envIncluded')}: {env.browser} · {env.os} · {t('fb.device.' + env.device)} · {env.viewport}
              </summary>
              <dl>
                <dt>{t('fb.page')}</dt>
                <dd>{location.hash || '#/'}</dd>
                <dt>{t('fb.screen')}</dt>
                <dd>{env.screen}</dd>
                <dt>{t('fb.lang')}</dt>
                <dd>{env.lang}</dd>
                <dt>{t('fb.version')}</dt>
                <dd>{env.version}</dd>
              </dl>
            </details>

            <div className="row wrap">
              <button className="btn btn--primary" disabled={!valid || !!busy}>
                {busy ? `⏳ ${busy}` : `📨 ${t('fb.send')}`}
              </button>
              {!valid && <small className="muted">{t('fb.required')}</small>}
            </div>
          </form>
        )}

        {tab === 'mine' && <MyFeedback openId={openId} setOpenId={setOpenId} />}
      </div>
    </Modal>
  );
}

function MyFeedback({ openId, setOpenId }) {
  const { t, lang } = useI18n();
  const { user } = useApp();
  const [list, setList] = useState(null);
  useEffect(() => (user ? feedbackApi.watchMine(user.uid, setList) : undefined), [user]);
  if (!list) return <Loader />;
  if (!list.length) return <Empty emoji="📭" title={t('fb.noneMine')} text={t('fb.noneMineHint')} />;
  const open = list.find((x) => x.id === openId);
  if (open)
    return (
      <div className="stack">
        <button className="back" onClick={() => setOpenId(null)}>
          ← {t('fb.backToList')}
        </button>
        <FeedbackDetail item={open} />
      </div>
    );
  return (
    <div className="fb-list">
      {list.map((x) => (
        <button key={x.id} className="fb-row" onClick={() => setOpenId(x.id)}>
          <TypeTag type={x.type} />
          <span className="fb-row__main">
            <b>{x.title}</b>
            <small>
              {fmtTime(x.createdAt, lang)}
              {x.adminNote ? ` · 💬 ${t('fb.hasReply')}` : ''}
            </small>
          </span>
          <StatusChip status={x.status} />
        </button>
      ))}
    </div>
  );
}

/** Chi tiết 1 góp ý — dùng cho cả người dùng và quản trị viên */
export function FeedbackDetail({ item: x, admin = false }) {
  const { isAdmin: fullAdmin } = useApp();
  const { t, lang } = useI18n();
  const [files, setFiles] = useState(null);
  const [zoom, setZoom] = useState(null);
  useEffect(() => {
    let alive = true;
    setFiles(null);
    if (!x.files?.length) return setFiles([]);
    feedbackApi.files(x.id).then((f) => alive && setFiles(f));
    return () => {
      alive = false;
    };
  }, [x.id, x.files?.length]);
  const shot = files?.find((f) => f.kind === 'screenshot');
  const others = files?.filter((f) => f.kind !== 'screenshot') || [];
  return (
    <article className="fb-detail">
      <header className="fb-detail__head">
        <div className="row wrap">
          <TypeTag type={x.type} />
          <StatusChip status={x.status} />
        </div>
        <h3 className="h3">{x.title}</h3>
        <div className="fb-detail__by">
          <Avatar name={x.userName || '?'} photo={x.userPhoto} size={30} />
          <span>
            <b>{x.userName || '—'}</b>
            {admin && x.userEmail && <small>{fullAdmin ? x.userEmail : maskEmail(x.userEmail)}</small>}
          </span>
          <small className="muted">🕒 {fmtTime(x.createdAt, lang)}</small>
        </div>
      </header>

      {x.type === 'bug' ? (
        <div className="fb-compare">
          <section className="fb-compare__bad">
            <h4>❌ {t('fb.actual')}</h4>
            <p>{x.actual || '—'}</p>
          </section>
          <section className="fb-compare__good">
            <h4>✅ {t('fb.expected')}</h4>
            <p>{x.expected || '—'}</p>
          </section>
        </div>
      ) : (
        <section className="fb-desc">
          <h4>💡 {t('fb.description')}</h4>
          <p>{x.description}</p>
        </section>
      )}

      {x.adminNote && (
        <section className="fb-reply">
          <h4>💬 {t('fb.teamReply')}</h4>
          <p>{x.adminNote}</p>
        </section>
      )}

      {(x.files?.length || 0) > 0 && (
        <section className="stack-sm">
          <h4 className="fb-h4">📎 {t('fb.files')}</h4>
          {!files ? (
            <Loader size="sm" />
          ) : (
            <>
              {shot && (
                <figure className="fb-shot fb-shot--detail">
                  <img src={shot.url} alt={t('fb.screenshot')} onClick={() => setZoom(shot.url)} />
                  <figcaption className="small">
                    🎯 {t('fb.screenshot')}
                    {x.element?.text ? ` · “${x.element.text}”` : ''}
                  </figcaption>
                </figure>
              )}
              {others.length > 0 && (
                <div className="fb-files">
                  {others.map((f, i) =>
                    f.kind === 'video' ? (
                      <video key={i} src={f.url} controls playsInline />
                    ) : (
                      <img key={i} src={f.url} alt="" onClick={() => setZoom(f.url)} />
                    ),
                  )}
                </div>
              )}
            </>
          )}
        </section>
      )}

      <details className="fb-env" open={admin}>
        <summary>🖥️ {t('fb.envTitle')}</summary>
        <dl>
          <dt>{t('fb.browser')}</dt>
          <dd>{x.env?.browser}</dd>
          <dt>{t('fb.os')}</dt>
          <dd>{x.env?.os}</dd>
          <dt>{t('fb.deviceLabel')}</dt>
          <dd>{x.env?.device ? t('fb.device.' + x.env.device) : '—'}</dd>
          <dt>{t('fb.viewport')}</dt>
          <dd>{x.env?.viewport}</dd>
          <dt>{t('fb.screen')}</dt>
          <dd>{x.env?.screen}</dd>
          <dt>{t('fb.lang')}</dt>
          <dd>{x.env?.lang}</dd>
          <dt>{t('fb.network')}</dt>
          <dd>{[x.env?.online === false ? 'offline' : 'online', x.env?.connection].filter(Boolean).join(' · ')}</dd>
          <dt>{t('fb.page')}</dt>
          <dd>{x.page}</dd>
          {x.element?.selector && (
            <>
              <dt>{t('fb.element')}</dt>
              <dd>
                <code>{x.element.selector}</code>
              </dd>
            </>
          )}
          <dt>{t('fb.version')}</dt>
          <dd>{x.env?.version}</dd>
          {admin && (
            <>
              <dt>User agent</dt>
              <dd className="tiny">{x.env?.ua}</dd>
            </>
          )}
        </dl>
      </details>

      {(x.history?.length || 0) > 0 && (
        <section className="stack-sm">
          <h4 className="fb-h4">🕓 {t('fb.history')}</h4>
          <ol className="fb-history">
            {x.history.map((h, i) => (
              <li key={i}>
                <StatusChip status={h.status} />
                <small className="muted">
                  {fmtTime(h.at, lang)}
                  {admin && h.by ? ` · ${h.by}` : ''}
                </small>
              </li>
            ))}
          </ol>
        </section>
      )}
      {zoom && (
        <div className="fb-zoom" onClick={() => setZoom(null)} role="dialog">
          <img src={zoom} alt="" />
        </div>
      )}
    </article>
  );
}

/** Trang quản trị: xử lý góp ý */
export function AdminFeedback() {
  const { t, lang } = useI18n();
  const { user, notify, isAdmin, adminApi } = useApp();
  const [list, setList] = useState(null);
  const [status, setStatus] = useState('active');
  const [type, setType] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [note, setNote] = useState('');
  useEffect(() => feedbackApi.watchAll(setList), []);
  const open = list?.find((x) => x.id === openId);
  useEffect(() => setNote(open?.adminNote || ''), [openId, open?.adminNote]);
  if (!list) return <Loader />;
  const counts = Object.fromEntries(FEEDBACK_STATUSES.map((s) => [s, list.filter((x) => x.status === s).length]));
  const shown = list.filter(
    (x) => (status === 'all' ? true : status === 'active' ? ['open', 'todo', 'coming_soon'].includes(x.status) : x.status === status) && (type === 'all' || x.type === type),
  );
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
      <div className="fb-counts">
        {FEEDBACK_STATUSES.map((s) => (
          <button key={s} className={`fb-count ${status === s ? 'on' : ''}`} onClick={() => setStatus(s)}>
            <StatusChip status={s} />
            <b>{counts[s]}</b>
          </button>
        ))}
      </div>
      <div className="admin-toolbar">
        <div className="segmented">
          {['active', 'all'].map((s) => (
            <button key={s} className={status === s ? 'on' : ''} onClick={() => setStatus(s)}>
              {t('fb.filter.' + s)}
            </button>
          ))}
        </div>
        <div className="segmented">
          {['all', 'bug', 'enhancement'].map((k) => (
            <button key={k} className={type === k ? 'on' : ''} onClick={() => setType(k)}>
              {k === 'all' ? t('common.all') : `${k === 'bug' ? '🐞' : '✨'} ${t('fb.type.' + k)}`}
            </button>
          ))}
        </div>
      </div>
      <div className={`fb-admin ${open ? 'has-detail' : ''}`}>
        <div className="fb-list">
          {shown.length === 0 && <Empty emoji="🎉" title={t('fb.noneAdmin')} />}
          {shown.map((x) => (
            <button key={x.id} className={`fb-card ${openId === x.id ? 'on' : ''}`} onClick={() => setOpenId(x.id === openId ? null : x.id)}>
              <span className="fb-card__tags">
                <TypeTag type={x.type} />
                <StatusChip status={x.status} />
                {x.files?.length ? <small className="muted">📎 {x.files.length}</small> : null}
              </span>
              <b className="fb-card__title">{x.title}</b>
              <span className="fb-card__summary">{x.type === 'bug' ? x.actual : x.description}</span>
              <small className="fb-card__meta">
                👤 {x.userName} · 🕒 {fmtTime(x.createdAt, lang)} · 🖥️ {x.env?.browser} / {x.env?.os}
              </small>
            </button>
          ))}
        </div>
        <div className="fb-admin__detail">
          {!open ? (
            <Empty emoji="👈" title={t('fb.pickOne')} />
          ) : (
            <div className="stack">
              <button className="back" onClick={() => setOpenId(null)}>
                ← {t('fb.backToList')}
              </button>
              <div className="card stack-sm fb-actions">
                <b>{t('fb.changeStatus')}</b>
                <div className="row wrap">
                  {FEEDBACK_STATUSES.map((s) => (
                    <button
                      key={s}
                      className={`btn btn--sm ${open.status === s ? 'btn--dark' : 'btn--soft'}`}
                      disabled={open.status === s}
                      onClick={() =>
                        act(
                          () => feedbackApi.setStatus(open.id, s, user.name, note !== open.adminNote ? note : null).then(() => adminApi.log('feedback.status', open.id, `${s} · ${open.title || ''}`)),
                          t('fb.statusChanged', { s: t('fb.status.' + s) }),
                        )
                      }
                    >
                      {t('fb.status.' + s)}
                    </button>
                  ))}
                </div>
                <label className="field">
                  <span>💬 {t('fb.replyLabel')}</span>
                  <textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('fb.replyPh')} maxLength={1000} />
                </label>
                <div className="row wrap">
                  <button className="btn btn--sm btn--primary" disabled={note === (open.adminNote || '')} onClick={() => act(() => feedbackApi.setNote(open.id, note, user.name), t('admin.saved'))}>
                    💾 {t('fb.saveReply')}
                  </button>
                  {isAdmin && (
                    <button
                      className="btn btn--sm btn--ghost danger"
                      onClick={() => confirm(t('fb.confirmDelete')) && act(() => feedbackApi.remove(open.id).then(() => (adminApi.log('feedback.delete', open.id, open.title || ''), setOpenId(null))), t('mem.deleted'))}
                    >
                      <TrashIcon /> {t('fb.delete')}
                    </button>
                  )}
                </div>
              </div>
              <FeedbackDetail item={open} admin />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
