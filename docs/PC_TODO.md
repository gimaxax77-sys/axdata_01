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
> **📖 상세 실행 가이드: `docs/BUILD_APK.md` (그대로 복붙 실행)**

- [ ] 최신 브랜치 pull: `git pull origin claude/git-connection-status-rkjuko`
- [ ] 의존성: `npm install`
- [ ] 테스트 확인: `npm test` (**유닛 188 / 장르 17 / 캐릭터 37** 통과 확인)
- [ ] EAS 로그인: `eas login` (계정 `gimax77`)
- [ ] APK(내부 테스트): `npm run build:apk`  (EAS preview)
- [ ] 기기 설치 후 신규 기능 육안 확인 (트랙1: DPS 미터·분해환급·주간이벤트·시즌던전·
      덱복사·본진발전·가챠스킵 / 기존: 장비 11슬롯·소환레벨·아레나 리그·엠블럼/정령·인챈트)
- [ ] (배포용) AAB: `npm run build:aab`  (EAS production)

**한 줄 실행:**
`git pull origin claude/git-connection-status-rkjuko && npm install && npm test && eas login && npm run build:apk`

메모: EAS 프로젝트·키스토어는 이미 설정됨(projectId `f95f8fe3-…`, owner `gimax77`).
버전은 이번에 **1.1.0 / versionCode 2**로 올려둠(기존 설치 위 덮어쓰기 업데이트 가능).

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

### 2-4. Remote Config(원격 밸런스/공지) — 코드 완료, 콘솔 설정만
- [ ] Firebase 콘솔 → Remote Config에 파라미터 등록(문자열 JSON):
  - `balance` 예: `{"powerWeights.hp":0.09}` (허용 경로는 admin.mjs ADMIN_FIELDS)
  - `notice` 예: `{"text":"점검 안내"}`  ·  `event` 예: `{"text":"주말 2배!"}`
- [ ] 앱에서 자동 로드(1회)·밸런스 반영·공지 배너 표시됨(추가 코드 불필요)

> Phase 1의 세 축(**클라우드 세이브·IAP 검증·Remote Config**) 클라이언트 구현 완료.
> 남은 건 Firebase 콘솔 설정 + 함수 배포뿐입니다.

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

## 4. 픽셀 아트 에셋 팩 셋업 (보류 — 팩 입수 후 규격 맞춰 진행)

> 귀가 후 진행 예정. 상세: `docs/PIXEL_ASSETS.md`, `docs/pixel-asset-board.html`.
> **작업 순서: (1) 팩 입수 → (2) 규격 확정 → (3) 아래 배선 확장 → (4) PNG 배치 = 자동 반영**

### 4-1. 팩 입수·규격 확정
- [ ] 선정 팩 다운로드(고해상도 128/256 우선 — indieartifex 초상, Beowulf 등)
- [ ] 규격 결정(해상도·색 팔레트·초상 프레이밍·아이콘 크기)

### 4-2. "덮어쓰기 = 자동 반영" 배선 확장 (팩 규격에 맞춰 원격 작업 가능)
> 현재는 캐릭터 초상만 레지스트리로 자동 반영됨. 아래를 같은 패턴(레지스트리+이모지 폴백)으로 확장:
- [ ] **코스튬 초상 레지스트리** — 코스튬별 PNG 경로 + `Portrait` 연결(폴백 유지)
- [ ] **아이콘 레지스트리** — 장비/펫/유물/정령/엠블럼 이미지 슬롯(폴백 유지)
- [ ] **화면 배경 슬롯** — 탭·화면별 배경 이미지 경로(없으면 현재 스타일 유지)
- [ ] **UI 프레임/버튼 스킨**(선택) — 9-slice 프레임·버튼 스킨
- [ ] **적·보스 스프라이트**(선택) — 전투 연출 강화

### 4-3. 반영·검증
- [ ] `assets/` 하위 경로에 PNG 배치 → 자동 반영 확인
- [ ] 색상 변형·틴트·조립 파이프라인(스크립트 `scripts/gen-*`) 적용
- [ ] 픽셀 모드 화면(`PixelIdleScreen`)·초상 확인 후 재빌드

> 참고: **캐릭터 초상**은 지금도 `assets/char/<concept>/<id>.png` 덮어쓰면 즉시 전역 반영됨(레지스트리 완료).
> 나머지 영역은 4-2 배선을 먼저 깔아야 "덮어쓰기 = 자동 반영"이 됨.

---

## 5. (선택) 출시 준비 점검

- [ ] 스토어 등록 정보 확인(`docs/STORE_LISTING.md`), 스크린샷(`docs/store/*`)
- [ ] 개인정보처리방침(`docs/PRIVACY.md`) — 클라우드/계정 도입 시 갱신
- [ ] 가챠 확률 표기 확인(소환 화면 표기 유지)
- [ ] 확률형 아이템·미성년자 결제·환불 정책 점검

---

## 6. (보류) 글로벌/현지화(i18n)

> **결정: 미룸.** 한국어 단일 출시가 목표이므로 지금 전면 국제화는 **가치 0, 리스크 有**
> (신규 화면 수백 개 문자열을 키로 빼는 대규모 리팩터 → 회귀 위험). 아래는 2차 언어를
> **실제로 결정하는 시점**에 진행할 마일스톤으로만 남겨둔다.

- [ ] **스캐폴드 활성화** — `app/i18n.js`의 `t()`는 이미 존재(현재 대부분 화면은 한글 하드코딩)
- [ ] **문자열 추출** — 신규 화면(소환/로스터/아레나/상점/설정/온보딩 등) 한글 → 로케일 키로 이관
- [ ] **코어 텍스트 분리** — `system/core/*`의 라벨/사유 문자열(예: `reason`) 로케일화 방식 결정
- [ ] **조사 처리 일반화** — 현재 한국어 조사(을/를·이/가) 로직을 로케일별 플러럴/젠더 규칙으로 추상화
- [ ] **2차 언어 번역** — 결정된 언어(영어 등) 번역본 + 폰트/글자수 레이아웃 검증
- [ ] **로케일 전환 UI** — 설정에 언어 선택 추가, 저장/복원

**착수 조건:** "글로벌 출시" 또는 "2차 언어 지원" 의사결정 확정 시. 그 전에는 손대지 않는다.

---

## 우선순위 요약

1. **지금 당장**: §1 새 빌드 → 실기기에서 이번 세션 기능 확인
2. **다음**: §2 Firebase Phase 1(무료 티어, 진행 보존+결제보안)
3. **결제 오픈 시**: §3 실 IAP
4. **여유 있을 때**: §4 아트, §5 출시 점검
5. **보류**: §6 글로벌/현지화(i18n) — 2차 언어 결정 전까지 미착수

문의/이어서 진행할 항목이 생기면 원격 세션에서 코드·문서로 계속 지원합니다.
