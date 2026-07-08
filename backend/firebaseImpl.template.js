// ─────────────────────────────────────────────────────────────
// Firebase 클라우드 제공자 (템플릿)
//
// 사용법:
//   1) `npm i firebase` (Expo 관리형에서 Firebase JS SDK 사용)
//   2) 이 파일을 `app/backend/firebaseImpl.js` 로 복사
//   3) app.json 의 expo.extra.firebase 에 콘솔 설정값을 넣는다:
//        "extra": { "firebase": { "apiKey": "...", "authDomain": "...",
//          "projectId": "...", "appId": "..." } }
//   4) 앱 진입(App.js 최상단)에서 한 번 import:  import './app/backend/firebaseImpl';
//      → globalThis.__ELDRIA_CLOUD__ 에 provider가 등록되어 클라우드 세이브가 켜진다.
//
// 미설정/미설치 시 이 파일을 import 하지 않으면 앱은 로컬 전용으로 동작한다.
// ─────────────────────────────────────────────────────────────

import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const cfg = (Constants.expoConfig?.extra || Constants.manifest?.extra || {}).firebase;

if (cfg && cfg.projectId) {
  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const fns = getFunctions(app);
  let currentUser = null;
  onAuthStateChanged(auth, (u) => { currentUser = u; });

  globalThis.__ELDRIA_CLOUD__ = {
    available: () => true,
    user: () => (currentUser ? { uid: currentUser.uid } : null),
    async signIn() {
      const cred = await signInAnonymously(auth);
      currentUser = cred.user;
      return { ok: true, uid: cred.user.uid };
    },
    async signOut() { await auth.signOut(); currentUser = null; },
    async pull() {
      if (!currentUser) return null;
      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      return snap.exists() ? snap.data() : null; // { blob, version, progress, updatedAt }
    },
    async push(envelope) {
      if (!currentUser) return { ok: false, reason: 'no-user' };
      await setDoc(doc(db, 'users', currentUser.uid), envelope, { merge: true });
      return { ok: true };
    },
    // 인앱결제 영수증 서버 검증 → Cloud Function iapVerify 호출.
    async verifyPurchase({ platform, productId, token }) {
      if (!currentUser) return { ok: false, reason: 'no-user' };
      const call = httpsCallable(fns, 'iapVerify');
      const res = await call({ platform, productId, token });
      return res.data; // { ok, reason?, productId? }
    },
  };
}
