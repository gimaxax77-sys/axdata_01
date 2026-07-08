# PC 작업 목록 — 엘드리아 연대기

이 문서는 **PC(로컬 개발 환경)에서만 할 수 있는 작업**을 우선순위로 정리한 것입니다.
(코드/설정은 대부분 원격에서 완료되어 `claude/git-connection-status-rkjuko` 브랜치에 반영됨.)

---

## 0. 재점검 결과 (원격에서 완료·검증됨)

- ✅ 유닛 테스트 **132 / 장르 17 / 캐릭터 37** 전부 통과
- ✅ 밸런스 시뮬(`test:smoke`) 통과 — 슬롯 확장 회귀 수정 포함
- ✅ 웹 빌드(`build:play`) 정상, 번들에 Firebase 참조 0(로컬 폴백 안전)
- ✅ 모든 변경 커밋·푸시 완료(미커밋 0)

### 이번 세션에 추가된 것(모두 코드 완료, 빌드에 반영 필요)
피로도-제로 QoL · 진형(전열/후열) · 개성 BM(코스메틱/프로필/광고제거) ·
전투력 형평 수정 · 소환 탭 확장(펫/장비/룬/코스튬)+소환레벨 · 장비 슬롯 3→11+탈것 ·
장비 세트 3종 · 인챈트 · 엠블럼/정령 · 신규 능력치 4종(회피/명중/절대공격/절대방어) ·
아레나 전투력 리그 · **백엔드 Phase 1 스캐폴드(클라우드 세이브 + IAP 검증)**

---

## 1. ★필수 — 새 빌드(APK/AAB) 생성

> 이번 세션 변경은 전부 **다음 빌드부터** 실기기에 반영됩니다.
> 특히 네이티브 의존(expo-font 등) 때문에 **OTA로는 기존 APK를 갱신 불가** → 리빌드 필요.

- [ ] 최신 브랜치 pull: `git pull origin claude/git-connection-status-rkjuko`
- [ ] 의존성: `npm install`
- [ ] 테스트 확인: `npm test` (132/17/37 통과 확인)
- [ ] APK(내부 테스트): `npm run build:apk`  (EAS preview)
- [ ] 기기 설치 후 신규 기능 육안 확인(장비 11슬롯·소환레벨·아레나 리그·엠블럼/정령·인챈트)
- [ ] (배포용) AAB: `npm run build:aab`  (EAS production)

메모: EAS·키스토어·EXPO_TOKEN은 이미 설정됨(이전 세션). 추가 설정 불필요.

---

## 2. 백엔드 Phase 1 활성화 (클라우드 세이브 + 결제검증)

> 클라이언트·서버 골격은 완료. **미설정이면 앱은 계속 로컬 전용으로 정상 동작**.
> 아래는 "켜기" 절차. 상세: `backend/README.md`, 배경: `docs/BACKEND.md`.

### 2-1. Firebase 프로젝트
- [ ] Firebase 콘솔에서 프로젝트 생성
- [ ] Authentication → **익명 로그인** 사용 설정
- [ ] Firestore Database 생성(프로덕션 모드)
- [ ] 보안 규칙에 `backend/firestore.rules` 내용 반영

### 2-2. 앱 연동
- [ ] `npm i firebase expo-constants`
- [ ] `app.json`의 `expo.extra.firebase`에 콘솔 설정값 입력(apiKey/authDomain/projectId/appId)
- [ ] `backend/firebaseImpl.template.js` → `app/backend/firebaseImpl.js`로 복사
- [ ] `App.js` 최상단에 한 줄: `import './app/backend/firebaseImpl';`
- [ ] 재빌드 후 설정 화면에 "☁️ 클라우드 세이브" 노출 확인(로그인→동기화)

### 2-3. Cloud Functions(결제검증)
- [ ] `cd backend/functions && npm i`
- [ ] `firebase deploy --only functions` (`iapVerify`, `validateSave` 배포)

---

## 3. 실 인앱결제(IAP) 연동

> 현재는 `mock` 경로(웹/개발)로 동작. 실 결제 승격 시 아래 필요.
> 지급 게이팅(스토어→검증→지급)은 이미 구현됨(`app/iap.js`, `app/backend/purchaseFlow.mjs`).

- [ ] `npm i expo-in-app-purchases` (또는 react-native-iap) — dev client 필요
- [ ] `app/iap.js`의 `storePurchase()` TODO 채우기(실 결제 → 영수증 token 획득)
- [ ] **스토어 콘솔 상품 등록**: 상품 ID는 `system/core/iap.mjs`의 `storeSkus('ios'|'android')`로 확인
  - Google Play Console: 인앱 상품 등록(id 소문자)
  - App Store Connect: 인앱 구매 등록(`eldria.<id>`)
- [ ] `backend/functions/index.js`의 `iapVerify`에 실 검증 구현
  - Android: Google Play Developer API `purchases.products.get`
  - iOS: App Store Server API / verifyReceipt
- [ ] 결제 테스트(샌드박스/내부 테스트 트랙)

---

## 4. 픽셀 아트 에셋 팩 셋업 (보류 중이던 작업)

> 귀가 후 진행 예정이던 항목. 상세: `docs/PIXEL_ASSETS.md`, `docs/pixel-asset-board.html`.

- [ ] 선정 팩 다운로드(고해상도 128/256 우선 — indieartifex 초상, Beowulf 등)
- [ ] `assets/` 하위에 배치 후 경로 연결(캐릭터/배경/UI)
- [ ] 색상 변형·틴트·조립 파이프라인 적용(스크립트: `scripts/gen-*`)
- [ ] 픽셀 모드 화면(`PixelIdleScreen`)·초상에 반영 후 재빌드

---

## 5. (선택) 출시 준비 점검

- [ ] 스토어 등록 정보 확인(`docs/STORE_LISTING.md`), 스크린샷(`docs/store/*`)
- [ ] 개인정보처리방침(`docs/PRIVACY.md`) — 클라우드/계정 도입 시 갱신
- [ ] 가챠 확률 표기 확인(소환 화면 표기 유지)
- [ ] 확률형 아이템·미성년자 결제·환불 정책 점검

---

## 우선순위 요약

1. **지금 당장**: §1 새 빌드 → 실기기에서 이번 세션 기능 확인
2. **다음**: §2 Firebase Phase 1(무료 티어, 진행 보존+결제보안)
3. **결제 오픈 시**: §3 실 IAP
4. **여유 있을 때**: §4 아트, §5 출시 점검

문의/이어서 진행할 항목이 생기면 원격 세션에서 코드·문서로 계속 지원합니다.
