import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(config.apiKey && config.projectId);

export const app = firebaseEnabled ? initializeApp(config) : null;
// App Check: chứng minh yêu cầu đến từ đúng trang web của mình (chặn script / bot gọi thẳng Firestore bằng khoá API).
// Bật khi có VITE_RECAPTCHA_SITE_KEY (khoá reCAPTCHA v3 đăng ký trong Firebase Console → App Check).
if (app && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  try {
    if (import.meta.env.DEV) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    initializeAppCheck(app, { provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY), isTokenAutoRefreshEnabled: true });
  } catch (e) {
    console.warn('App Check chưa bật được', e);
  }
}
export const auth = app ? getAuth(app) : null;
// Lưu dữ liệu Firestore vào bộ nhớ trình duyệt (IndexedDB): lần mở sau hiện ngay dữ liệu cũ,
// rồi chỉ tải phần thay đổi — nhanh hơn nhiều trên mạng chậm, xem được cả khi mất mạng.
function makeDb() {
  try {
    return initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch {
    return getFirestore(app);
  }
}
export const db = app ? makeDb() : null;
export const googleProvider = app ? new GoogleAuthProvider() : null;
