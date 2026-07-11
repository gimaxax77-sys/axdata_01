# Supabase 백엔드 셋업 가이드 (계정 + 역할)

이 문서는 **계정·로그인·역할(운영자/매니저/일반)** 을 켜는 첫 단계 안내입니다.
결론부터: 코드는 다 준비돼 있고, Gim은 **Supabase 계정을 만들고 키 2개만 꽂으면** 됩니다.

---

## 0. 지금 무엇이 준비돼 있나

| 파일 | 역할 |
|------|------|
| `system/core/roles.mjs` | 누가 무엇을 할 수 있나 판정(순수 로직, 테스트 완료) |
| `backend/supabase/schema.sql` | DB 테이블 + 보안 규칙(RLS) |
| `backend/supabaseImpl.template.js` | 실제 Supabase 연결(복사해서 사용) |
| `app/backend/mockCloud.js` | **키 없이** 로컬에서 먼저 시험하는 가짜 서버 |
| `app/backend/cloud.js` | 공급자 무관 파사드(여기에 `cloudRole()` 추가됨) |

역할 3단: **user(일반) < manager(매니저) < admin(운영자)**

---

## 1. 키 없이 먼저 맛보기 (mock)

Supabase 가입 전에 역할 흐름부터 눈으로 확인하려면, 앱 진입부(`App.js` 최상단)에
아래 한 줄을 임시로 추가하세요.

```js
import './app/backend/mockCloud';
```

미리 심어둔 시험 계정:

- `admin@test` / `1234` → 운영자
- `manager@test` / `1234` → 매니저
- 그 외 이메일로 가입 → 일반

확인이 끝나면 이 줄을 지우고 아래 실서버 연결로 넘어갑니다.

---

## 2. Supabase 프로젝트 만들기 (무료)

1. https://supabase.com 가입 → **New project** 생성(리전은 가까운 곳: Seoul/Tokyo).
2. 좌측 **Project Settings → API** 에서 값 2개를 복사:
   - **Project URL** (예: `https://xxxx.supabase.co`)
   - **anon public key** (긴 문자열 — 공개용이라 앱에 넣어도 안전)

> anon 키가 노출돼도 괜찮은 이유: 실제 데이터 보호는 **3단계의 RLS 규칙**이 담당합니다.

---

## 3. 테이블·보안 규칙 심기

Supabase 대시보드 → **SQL Editor** → `backend/supabase/schema.sql` 내용을 붙여넣고 **Run**.
`profiles`(역할)·`saves`(세이브) 테이블과 보안 규칙(RLS)이 한 번에 생성됩니다.

---

## 4. 앱에 키 꽂고 연결

1. `npm i @supabase/supabase-js`
2. `backend/supabaseImpl.template.js` → `app/backend/supabaseImpl.js` 로 복사.
3. 프로젝트 루트에 `.env` 파일을 만들고 키 2개 입력:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
   ```
   > `EXPO_PUBLIC_` 접두사가 붙은 값은 Expo가 **웹·네이티브 빌드 모두**에 자동으로 새겨 넣습니다.
   > (웹 빌드에서는 `expo-constants` 의 `extra` 가 런타임에 노출되지 않으므로, 이 방식이 표준입니다.)
   > anonKey(=출판 가능 키)는 공개용이라 저장소에 포함해도 안전합니다. secret 키는 절대 금지.
4. `App.js` 최상단에서 한 번 import:
   ```js
   import './app/backend/supabaseImpl';
   ```
5. Metro가 supabase-js의 선택적 의존성(@opentelemetry/api)을 못 찾는다면,
   `metro.config.js` 에서 빈 모듈로 대체합니다(이 저장소엔 이미 적용됨).

이제 로그인하면 `cloudRole()` 이 그 계정의 역할을 돌려줍니다.

> 💡 **가입이 매끄럽지 않으면**: Supabase 대시보드 → Authentication → Providers → Email 에서
> **"Confirm email"(이메일 확인)** 이 켜져 있으면, 가입 후 메일 인증 전까지 로그인이 막힙니다.
> 캐주얼 게임이라면 이 옵션을 **꺼두면** 가입 즉시 로그인·동기화가 됩니다(보안을 위해 나중에 다시 켤 수 있음).

---

## 5. 나를 운영자로 임명

앱(또는 대시보드)에서 **본인 이메일로 한 번 로그인**해 계정을 만든 뒤,
SQL Editor 에서 (schema.sql 맨 아래 주석 참고):

```sql
update public.profiles set role = 'admin'
  where id = (select id from auth.users where email = '본인이메일');
```

---

## 6. 화면에서 역할로 기능 잠그기 (예시)

```js
import { cloudRole } from './app/backend/cloud';
import { can } from './system/core/roles.mjs';

// 운영자 조작 버튼은 admin 에게만
if (can(cloudRole(), 'tuneBalance')) {
  // 운영자 조작 화면 노출
}
```

> ⚠ **중요**: 화면에서의 `can()` 은 "버튼을 보여줄지" 판단용입니다.
> 실제 보안은 서버(RLS + 서버 검증)가 최종 강제합니다. 재화 지급·역할 변경 같은
> 민감 작업은 반드시 서버(service_role) 경로로만 처리해야 합니다.

---

## 다음 단계 (이후 조각)

- **클라우드 세이브 연결**: `saves` 테이블은 이미 준비됨 → `sync.mjs`(chooseSave)로 로컬↔원격 병합.
- **IAP 영수증 검증**: 서버 함수(Edge Function)로 결제 검증.
- **운영자 콘솔**: 매니저용 공지·우편·이벤트 관리 화면.
