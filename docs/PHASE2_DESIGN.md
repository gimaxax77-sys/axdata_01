# Phase 2 설계 — 리더보드 · 비동기 실 PvP · 시즌

> 상태: **설계 문서**. 실 서버 연동 전까지 앱은 현재처럼 **로컬 시뮬로 정상 동작**한다.
> Phase 1과 동일 원칙: 서버가 붙으면 켜지고, 없으면 로컬 폴백.
> 배경/전제: `docs/BACKEND.md`. 재사용 코어: `system/core/arena.mjs`, `resolution.mjs`, `save.mjs`.

---

## 0. 목표와 범위

Phase 2는 "**실제 다른 유저와 겨루는 경쟁 층**"을 얹는다.

| 기능 | 지금(로컬) | Phase 2(서버) |
|------|-----------|---------------|
| 아레나 상대 | 시뮬 생성 | **실 유저 방어팀 스냅샷** 매칭 |
| 랭킹 | 로컬 포인트만 | **시즌 리더보드**(전 유저 순위) |
| 무한의 탑 | 로컬 최고층 | **탑 리더보드**(최고층 경쟁) |
| 보상 정산 | 즉시 | **시즌 종료 정산**(순위 보상) |
| 검증 | 클라 신뢰 | **서버 재-시뮬 안티치트** |

**비범위**: 실시간 동기 PvP(턴 주고받기)는 하지 않는다 → 비동기 스냅샷만(부하·구현 최소). 실 길드/채팅은 Phase 3.

---

## 1. 설계 원칙

1. **비동기 스냅샷 PvP** — 공격자는 방어자의 "팀 스냅샷"을 받아 겨룬다. 상대는 접속 중일 필요 없음.
2. **서버 권위적 판정(안티치트)** — 승패·랭크·보상은 **서버가 `resolve()`로 재-시뮬**해 확정. 코어가 의존성 없는 ESM이라 **Node 서버에서 그대로 import** 가능 → 클라·서버 동일 결과.
3. **약자 보호 규칙 재사용** — 매칭은 `arena.mjs`의 **전투력 리그 + 상대 상한(내 전투력 ×1.12)** 규칙을 서버로 이식. 강자는 상위 리그로 격리.
4. **로컬 폴백** — 서버 미설정 시 지금의 시뮬 아레나로 동작(코드 무변경 유지).
5. **저비용** — 방어 스냅샷은 유저당 문서 1개, 매칭은 인덱스 쿼리 1회. 무료 티어 친화.

---

## 2. 데이터 모델 (Firestore)

### 2-1. 방어 팀 스냅샷 — `pvp_defense/{uid}`
공격 대상이 되는 내 방어 편성. 세이브 전체가 아니라 **전투 재현에 필요한 최소치**만.
```
pvp_defense/{uid} = {
  name,                 // 표시용 닉네임(프로필)
  power,                // partyPowerEff(state) — 매칭 밴드 계산용
  tierIndex,            // arenaPowerTier(power).index — 리그 버킷
  element,              // 대표 속성(선택, 표시용)
  party: [ unit… ],     // 편성 유닛 인스턴스(장비/룬/스킨/스킬/각인/레벨/랭크/등급/속성)
  powerMult,            // accountMods(state).powerMult (환생·유물·펫·엠블럼·정령 합산)
  formation,            // state.formation (전열/후열)
  updatedAt
}
```
- 업로드 시점: 파티/장비 변경 후 저빈도(디바운스). 세이브 push와 함께 갱신.
- 크기: 파티 4인 기준 수 KB(전체 세이브보다 훨씬 작음).

### 2-2. 시즌 리더보드 — `leaderboards/{season}/arena/{uid}`
```
leaderboards/{season}/arena/{uid} = { name, points, power, tierIndex, updatedAt }
leaderboards/{season}/tower/{uid} = { name, bestFloor, updatedAt }
```
- 순위 조회: `orderBy(points desc) limit N` (인덱스). 내 순위: 근사(상위 컷 기준) 또는 주기적 랭크 계산 함수.

### 2-3. 시즌 메타 — `seasons/{seasonId}`
```
seasons/{seasonId} = { startAt, endAt, active }
current = 'seasons/current' → seasonId 포인터
```

### 2-4. 결과 원장(중복/어뷰징 방지) — `pvp_log/{uid}/{ts}`
공격 기록(일일 횟수·재보상 방지·신고 추적).

---

## 3. 아레나 실 PvP 플로우

```
[공격]
1) 클라: 오늘 입장 남았나?(로컬) → 서버 matchmakePvp(uid) 호출
2) 서버: 내 리그 풀에서 상대 1명 추출
     - 같은 tierIndex 버킷 우선
     - 상대 power ≤ 내 power × 1.12 (약자 보호), ≥ 내 power × 0.7
     - 자기 자신·최근 상대 제외
3) 서버: resolve(myParty, defenderParty, mods…) 재-시뮬 → win/margin 확정
4) 서버: 랭크 포인트(±) + 리그 보상 적용, 리더보드 갱신, 원장 기록
5) 서버 → 클라: { win, defender{name,power,tier}, points, reward }
6) 클라: 결과 표시(연출용으로 로컬 resolve 재생 가능 — 동일 결과 보장)
```
- **매칭 대상이 없을 때**: 봇(현재 시뮬 상대) 폴백 → 신규/최상위도 항상 대전 성립.
- **입장 제한**: 지금처럼 하루 N회. 서버에서도 원장으로 재확인(변조 방지).

### 왜 서버 재-시뮬인가
클라 결과를 그대로 믿으면 승패·랭크 조작 가능. 우리 `resolve()`는 결정론이라 **서버가 같은 입력으로 재계산**하면 클라와 100% 일치 → 조작 즉시 탐지. 추가 안티치트 로직 불필요.

---

## 4. 리더보드 플로우

- **아레나 시즌 포인트**: PvP 결과마다 서버가 `leaderboards/{season}/arena/{uid}.points` 갱신.
- **무한의 탑**: 최고층 갱신 시 클라가 `submitTower(floor)` 호출 → 서버가 max로 기록.
- **조회**: 상위 100 + 내 주변 순위. 캐시(1~5분)로 읽기 비용 절감.
- **시즌 종료**: 스케줄 함수가 순위별 보상 우편 지급 → 포인트 리셋 → 새 시즌 시작.

---

## 5. 서버 함수 목록 (Cloud Functions)

| 함수 | 트리거 | 역할 |
|------|--------|------|
| `uploadDefense` | callable | 방어 스냅샷 저장(검증: power 정합성) |
| `matchmakePvp` | callable | 리그 풀 매칭 + `resolve()` 재-시뮬 + 랭크/보상 + 원장 |
| `submitTower` | callable | 탑 최고층 리더보드 갱신 |
| `getLeaderboard` | callable | 상위 N + 내 순위 |
| `rolloverSeason` | scheduled | 시즌 종료 정산·보상 우편·리셋 |

> 함수는 **`system/core`를 그대로 import**해 `resolve()`·`arenaPowerTier()`를 재사용(코드 중복 0).

---

## 6. 클라이언트 스캐폴드 (원격에서 구현 가능, 서버 없이 폴백)

Phase 1과 동일 패턴:
- `app/backend/pvp.js` — 파사드(`cloudMatchmake`, `cloudUploadDefense`, `cloudLeaderboard`). provider 미등록 시 **로컬 시뮬 아레나로 폴백**.
- `system/core/arena.mjs` — 매칭 규칙 함수를 **순수화**(입력: 내 power + 후보 목록 → 상대 선택)해 클라·서버 공용. 테스트 가능.
- `ArenaGuildScreen` — 온라인이면 실 상대명/리그, 오프라인이면 지금처럼 시뮬. UI 최소 변경.
- 방어 스냅샷 빌더 — `state.party` → 스냅샷 직렬화(세이브 유틸 재사용).

즉 **서버 붙기 전에도 지금과 동일 동작**, 붙으면 실 PvP로 승격.

---

## 7. 비용 영향 (무료 티어 친화)

| 동작 | 읽기/쓰기 | 빈도 |
|------|-----------|------|
| 방어 스냅샷 업로드 | 쓰기 1 | 파티 변경 시(저빈도) |
| PvP 1회 | 읽기 1~2 + 쓰기 1~2 | 하루 N회 |
| 리더보드 조회 | 읽기 ~수십(캐시) | 탭 진입 시 |

- 유저당 하루 PvP 5회 기준 추가 쓰기 ~10 → Phase 1 세이브 쓰기와 합쳐도 **DAU 1,000까지 무료 구간 유지**(자세한 계산은 `docs/BACKEND.md §8`).

---

## 8. 롤아웃 순서

1. (원격) 매칭 규칙 순수화 + 클라 파사드 + 폴백 + 테스트
2. (원격) 방어 스냅샷 빌더 + 리더보드 UI(오프라인은 로컬)
3. (원격) 서버 함수 골격(`backend/functions/pvp.js`) — `resolve` 재사용
4. (PC/Firebase) 함수 배포 + 인덱스 + 스케줄(시즌) → 실 PvP 켜짐

각 단계는 독립적이라 1~2만 해도 코드가 깨지지 않는다(폴백 유지).

---

## 9. 결정 필요 항목 (Gim 확인)

1. **시즌 길이** — 2주 / 4주? (권장: 2주, 라이브옵스 리듬)
2. **PvP 보상** — 승리 시 즉시 보상 + 시즌 종료 순위 보상 이원화? (권장: 예)
3. **방어 패배 시** — 방어자도 포인트 하락시킬지(양방향) vs 공격자만(단방향, 부담↓). 권장: **단방향**(방어자 무손실 → 스트레스↓).
4. **봇 폴백 비율** — 실 유저 풀이 얇을 때 봇 허용 범위.
5. **탑 리더보드** — 시즌제 vs 영구 명예의 전당.

---

## 부록. 재사용 코어 매핑

| Phase 2 필요 | 기존 코드 | 재사용 방식 |
|--------------|-----------|-------------|
| 승패 판정 | `resolution.resolve()` | 서버에서 그대로 import |
| 전투력·리그 | `arena.partyPowerEff` / `arenaPowerTier` | 클라·서버 공용 |
| 약자 보호 밴드 | `arena.OPP_CAP_MULT`(1.12) | 매칭 규칙 이식 |
| 계정 배수 | `balance.accountMods` | 스냅샷에 powerMult 포함 |
| 스냅샷 직렬화 | `save.serialize` 유틸 | 부분 직렬화 재사용 |
