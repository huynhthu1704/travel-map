import { useEffect, useState } from 'react';
import { useApp } from '../AppContext';
import { useI18n } from '../i18n';
import { Empty, Modal } from '../components/ui';
import { exportMyData, downloadJson, deleteMyAccount, tripsImpact } from '../lib/account';
import { firebaseEnabled } from '../lib/firebase';
import { pushConfigured, pushSupport, currentPushSub, enablePush, disablePush } from '../lib/push';

const STEP_KEYS = ['reauth', 'trips', 'memories', 'social', 'profile', 'account'];

/** Phần dùng chung: trạng thái + thao tác của trang / hộp thoại Tài khoản & dữ liệu */
function useAccount() {
  const { user, myPublic, socialApi, notify } = useApp();
  const { t } = useI18n();
  const [busy, setBusy] = useState('');
  const [step, setStep] = useState('');
  const toggle = async (key, value) => {
    setBusy(key);
    try {
      if (key === 'hideDates') await socialApi.setHideDates(user.uid, value);
      else await socialApi.saveProfile(user.uid, { [key]: value });
      notify(t('acc.saved'));
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy('');
    }
  };
  return { user, myPublic, notify, t, busy, setBusy, step, setStep, toggle };
}

export function PrivacySection({ bare = false }) {
  const { myPublic, t, busy, toggle } = useAccount();
  const priv = !!myPublic?.privateProfile;
  const hide = !!myPublic?.hideDates;
  return (
    <section className={bare ? 'stack-sm' : 'card stack-sm'}>
      {!bare && <h3 className="h3">🛡️ {t('acc.privacy')}</h3>}
      <label className="acc-toggle">
        <input type="checkbox" checked={priv} disabled={!!busy || myPublic === undefined} onChange={(e) => toggle('privateProfile', e.target.checked)} />
        <span>
          <b>{t('priv.private')}</b>
          <small>{t('priv.privateHint')}</small>
        </span>
      </label>
      <label className="acc-toggle">
        <input type="checkbox" checked={hide} disabled={!!busy || myPublic === undefined} onChange={(e) => toggle('hideDates', e.target.checked)} />
        <span>
          <b>{t('priv.hideDates')}</b>
          <small>{t('priv.hideDatesHint')}</small>
        </span>
      </label>
    </section>
  );
}

/** REQ-062: Notification settings — push notifications on this device (flag pushNotif) */
export const showNotifSettings = (can) => can('pushNotif') && pushConfigured();

export function NotificationSection({ bare = false }) {
  const { notify, t } = useAccount();
  const { lang } = useI18n();
  const [support, setSupport] = useState(() => pushSupport());
  const [on, setOn] = useState(null); // null = checking
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    currentPushSub()
      .then((s) => live && setOn(!!s))
      .catch(() => live && setOn(false));
    return () => {
      live = false;
    };
  }, []);
  const toggle = async () => {
    setBusy(true);
    try {
      if (on) {
        await disablePush();
        setOn(false);
        notify(t('push.off'));
      } else {
        const r = await enablePush(lang);
        if (r === 'on') (setOn(true), notify(t('push.on')));
        else if (r === 'blocked') setSupport('blocked'); // 'dismissed': prompt closed, stays Off and usable
      }
    } catch {
      notify(t('push.failed'), 'error');
    } finally {
      setBusy(false);
    }
  };
  const hint = { ok: 'push.hint', ios: 'push.ios', blocked: 'push.blocked' }[support] || 'push.unsupported';
  return (
    <section className={bare ? 'stack-sm' : 'card stack-sm'}>
      {!bare && <h3 className="h3">🔔 {t('acc.notif')}</h3>}
      <div className="push-row">
        <div className="push-row__head">
          <b id="push-label">📲 {t('push.title')}</b>
          <button
            type="button"
            role="switch"
            aria-checked={!!on}
            aria-labelledby="push-label"
            aria-describedby="push-hint"
            className={`toggle-switch${on ? ' is-on' : ''}`}
            disabled={support !== 'ok' || busy || on === null}
            onClick={toggle}
          >
            <span />
          </button>
        </div>
        <small id="push-hint">{t(hint)}</small>
      </div>
    </section>
  );
}

export function ExportSection({ bare = false }) {
  const { user, notify, t, busy, setBusy, step, setStep } = useAccount();
  const [withPhotos, setWithPhotos] = useState(false);
  const doExport = async () => {
    setBusy('export');
    try {
      const data = await exportMyData(user, { withPhotos, onStep: setStep });
      downloadJson(data, `travel-map-${new Date().toISOString().slice(0, 10)}.json`);
      notify(t('acc.exported'));
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy('');
      setStep('');
    }
  };
  return (
    <section className={bare ? 'stack-sm' : 'card stack-sm'}>
      {!bare && <h3 className="h3">📦 {t('acc.export')}</h3>}
      <p className="small muted">{t('acc.exportHint')}</p>
      <label className="acc-toggle">
        <input type="checkbox" checked={withPhotos} onChange={(e) => setWithPhotos(e.target.checked)} />
        <span>
          <b>{t('acc.withPhotos')}</b>
          <small>{t('acc.withPhotosHint')}</small>
        </span>
      </label>
      <div>
        <button className="btn btn--primary" disabled={!!busy} onClick={doExport}>
          {busy === 'export' ? `⏳ ${t(`acc.step.${step || 'account'}`)}` : `⬇️ ${t('acc.download')}`}
        </button>
      </div>
    </section>
  );
}

export function DeleteSection({ bare = false, onCancel }) {
  const { user, notify, t, busy, setBusy, step, setStep } = useAccount();
  const [confirmOpen, setConfirmOpen] = useState(bare);
  const [impact, setImpact] = useState(null);
  const [typed, setTyped] = useState('');
  useEffect(() => {
    if (confirmOpen && user) tripsImpact(user).then(setImpact).catch(() => setImpact({ deleted: [], transferred: [], left: [] }));
  }, [confirmOpen, user]);
  const CONFIRM_WORD = t('acc.confirmWord');
  const doDelete = async () => {
    setBusy('delete');
    try {
      await deleteMyAccount(user, { onStep: setStep });
      alert(t('acc.deleted'));
      location.hash = '#/';
      location.reload();
    } catch (e) {
      const cancelled = /popup-closed|cancelled-popup|user-cancelled/.test(e.code || e.message || '');
      notify(cancelled ? t('acc.reauthCancelled') : t('acc.deleteFailed', { msg: e.message }), 'error');
      setBusy('');
      setStep('');
    }
  };
  return (
    <section className={bare ? 'stack-sm' : 'card stack-sm acc-danger'}>
      {!bare && <h3 className="h3">🗑️ {t('acc.delete')}</h3>}
      <p className="small muted">{t('acc.deleteHint')}</p>
      {!confirmOpen ? (
        <div>
          <button className="btn btn--ghost danger" disabled={!!busy} onClick={() => setConfirmOpen(true)}>
            {t('acc.deleteStart')}
          </button>
        </div>
      ) : (
        <div className="stack-sm">
          <ul className="small acc-list">
            <li>{t('acc.will1')}</li>
            <li>{t('acc.will2')}</li>
            {impact === null ? (
              <li className="muted">{t('common.loading')}</li>
            ) : (
              <>
                {impact.deleted.length > 0 && <li>{t('acc.tripsDeleted', { list: impact.deleted.map((x) => x.name).join(', ') })}</li>}
                {impact.transferred.length > 0 && <li>{t('acc.tripsTransferred', { list: impact.transferred.map((x) => x.name).join(', ') })}</li>}
                {impact.left.length > 0 && <li>{t('acc.tripsLeft', { list: impact.left.map((x) => x.name).join(', ') })}</li>}
              </>
            )}
            <li>{t('acc.will3')}</li>
            <li className="muted">{t('acc.anon')}</li>
          </ul>
          <p className="small">
            <b>{t('acc.tipExport')}</b>
          </p>
          <label className="field">
            <span>{t('acc.typeToConfirm', { word: CONFIRM_WORD })}</span>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={CONFIRM_WORD} disabled={busy === 'delete'} />
          </label>
          {firebaseEnabled && <p className="tiny muted">{t('acc.reauthNote')}</p>}
          <div className="row wrap acc-actions">
            <button className="btn btn--ghost" disabled={busy === 'delete'} onClick={() => (bare && onCancel ? onCancel() : (setConfirmOpen(false), setTyped('')))}>
              {t('acc.cancel')}
            </button>
            <button className="btn btn--danger" disabled={typed.trim().toUpperCase() !== CONFIRM_WORD.toUpperCase() || !!busy} onClick={doDelete}>
              {busy === 'delete' ? `⏳ ${t(`acc.step.${STEP_KEYS.includes(step) ? step : 'account'}`)}` : t('acc.deleteForever')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Hộp thoại mở từ nút ⋯ trên trang hồ sơ của chính mình */
export function AccountModal({ section, onClose }) {
  const { t } = useI18n();
  const title = { privacy: `🛡️ ${t('acc.privacy')}`, notif: `🔔 ${t('acc.notif')}`, export: `📦 ${t('acc.export')}`, delete: `🗑️ ${t('acc.delete')}` }[section];
  return (
    <Modal title={title} onClose={onClose} className="modal--sm">
      {section === 'privacy' && <PrivacySection bare />}
      {section === 'notif' && <NotificationSection bare />}
      {section === 'export' && <ExportSection bare />}
      {section === 'delete' && <DeleteSection bare onCancel={onClose} />}
    </Modal>
  );
}

/** #/account — cả 3 phần trên 1 trang (dùng cho link trong Chính sách quyền riêng tư) */
export default function AccountPage() {
  const { user, requireLogin, can } = useApp();
  const { t } = useI18n();
  if (!user)
    return (
      <div className="page">
        <Empty
          emoji="🔐"
          title={t('acc.login')}
          action={
            <button className="btn btn--primary" onClick={() => requireLogin(() => {})}>
              {t('auth.login')}
            </button>
          }
        />
      </div>
    );
  return (
    <div className="page account">
      <header className="account__head">
        <h1 className="h1">🔐 {t('acc.title')}</h1>
        <p className="muted">{t('acc.sub')}</p>
      </header>
      <PrivacySection />
      {showNotifSettings(can) && <NotificationSection />}
      <ExportSection />
      <DeleteSection />
      <p className="small muted account__legal">
        <a href="#/privacy">{t('legal.privacy')}</a> · <a href="#/terms">{t('legal.terms')}</a>
      </p>
    </div>
  );
}
