# 파킹 대장 — 호드워 인터페이스 전환 (2026-07-25)

> **Gim 지시**: "기존 on/off 기능 모듈들은 아예 전체 연계 끊어서 별도로 보관. 우선은 호드워 인터페이스 구축이 최우선."
> **원칙은 그대로**: 삭제 금지. 화면 배선만 끊고 파일·코어 로직·테스트는 살려둔다([[DISCONNECTED.md]]와 같은 규약).

## 무엇을 남겼나

호드워 UI를 **백지 위에** 올리기 위해 코어만 남겼습니다.

| 남긴 것(코어) | 모듈 |
|---|---|
| 캐릭터 | `units` `stats` `character` `archetypes` `skills` `starGrade` `seed` |
| 전투 | `resolution` `progression` `difficulty` `balance` `modifiers` `elements` |
| 파티 | `gameState` `formation` `synergy` `partyPresets` |
| 캠페인 | `campaign` |
| 살림 | `economy` `save` `rng` `daily` `mailbox` `unlocks` `player` `tutorial` `meta` |

## 파킹한 선택 모듈 17종

`system/core/features.mjs` 의 플래그를 `false` 로 내렸습니다. **파일은 그대로** 있습니다.

`summon` · `sigweapon` · `gear` · `runes` · `relics` · `emblems` · `pets` · `guardians` · `costumes` · `arena` · `guild` · `tower` · `expedition` · `season` · `events` · `intimacy` · `shop`

### 켜둔 3종과 그 이유

| 모듈 | 왜 켜져 있나 |
|---|---|
| `elements` | **호드워 UI 자체의 구성요소.** 편성 화면의 속성 필터 바(ALL+속성 원형 아이콘)와 전투 유닛의 속성 아이콘이 이걸 쓴다. |
| `rarity` | 같은 이유. 호드워 편성 카드의 **등급 원형 뱃지(S+/S/A)** 가 이걸 쓴다. 엘드리아 N~UR을 S+/S/A/B/C로 매핑해 표시한다. |
| `gacha` | **2026-07-26 되살림(Gim 지시).** 호드워 「영웅 제단」(모집). 영웅이 1명에서 안 늘어나 편성·진형·속성 필터·시너지를 전부 확인할 수 없었다. |

> ⚠️ `gacha`와 `summon`은 **다른 모듈**이다. `gacha`=영웅 뽑기(되살림), `summon`=소환 숙련도(누적 보상, 계속 파킹).
> 파킹된 `GachaScreen.js`는 **되살리지 않았다** — 배너 6개 중 5개가 파킹 모듈(장비·룬·펫·정령·코스튬)이라 통째로 되살리면 파킹 결정이 무너진다. 대신 영웅 배너만 다루는 `SummonScreen.js`를 호드워 캡처 기준으로 새로 만들었다.

## 화면 파일 이동 — `app/screens/` → `app/parked/`

| 파일 | 무엇 | 되살리는 법 |
|---|---|---|
| `GachaScreen.js` | 소환(영웅·장비·룬·코스튬·정령) | **되살리지 않는다.** 영웅 배너는 새 `SummonScreen.js`가 대체. 나머지 5개 배너는 각 모듈을 켤 때 그 화면에 붙인다 |
| `ContentScreen.js` | 일일임무·이벤트·던전·시즌·**캠페인** | 캠페인은 새 `AdventureScreen.js`가 대체함. 나머지 되살리려면 위와 동일 |
| `ShopScreen.js` | 상점·과금 | `features.shop = true` |
| `ArenaGuildScreen.js` | 아레나·길드·무한의 탑 | `features.arena/guild/tower = true` |
| `RunScreen.js` | 원정(로그라이트) | `features.expedition = true` |
| `DungeonListScreen.js` | 던전 목록 | 던전 플래그들과 함께 |
| `GrowthScreen.js` · `GrowthPanel.js` | 펫·유물·엠블럼·정령 | `features.pets/relics/emblems/guardians = true` |
| `InventoryScreen.js` | 장비 인벤토리 | `features.gear = true` |
| `RosterScreen.js` | 구 영웅 화면(64KB, 장비·룬·코스튬·전용무기·친밀도 통합) | **새 `HeroScreen.js`가 대체**. 되살릴 일은 없을 것 |
| `RosterPickerModal.js` · `rosterShared.js` | RosterScreen 부속 | RosterScreen과 함께 |
| `MetaScreen.js` | 도감·업적·시즌패스 | 도감·업적은 코어라 되살릴 값어치 있음 |
| `TabShell.js` | 세븐식 서브탭 골격 | 호드워는 서브탭을 안 쓴다 |
| `RosterSheet.js` | App.js에서 떼어낸 바텀시트(이미 미배선이었음) | App.js로 붙여넣기 |

> 상대 경로 깊이가 `app/screens/`와 같아서(`../theme`, `../../system/…`) **되돌려 놓기만 하면 import는 그대로 동작**합니다.

## 새로 만든 화면

| 파일 | 무엇 |
|---|---|
| `app/screens/SummonScreen.js` | 모집(소환) — 호드워 「영웅 제단」. 천장 게이지 · 배너 캐러셀 3 · 1회/10회 모집 · 애니메이션 토글 |
| `app/screens/SummonResult.js` | 10연 결과 오버레이 — 카드 3·4·3 · 등급별 카드색 · 순차 등장 |
| `app/screens/HeroScreen.js` | 호드워 편성 화면 — 속성 필터 바 · 등급 원형 뱃지 카드 그리드 · 상세(스탯/레벨업/돌파) · 진형 · 하단 액션 바(자동편성·일괄 진형 배치·**전투**) |
| `app/screens/AdventureScreen.js` | 모험(스토리 캠페인) — BOSS COMING 카드 · 챕터 목록 · 정주행 |

## 자물쇠 정책 — 구축 중엔 전부 열고, 출시 직전에 잠근다

**Gim 지시(2026-07-25)**: "현재는 구축하는 단계이니 모든 메뉴 탭 전부 살려놓은 상태로 설계하고, 자물쇠로 채우는건 출시전 최종 단계에서 하면 됨."

- 지금은 **6탭 전부 진입 가능**합니다. 내용이 없는 탭은 `StubScreen`(빈 골격)이 들어갑니다.
- 호드워의 "잠긴 탭을 자물쇠째 노출"(명세 3번)은 **출시 시점의 표현 방식**이지 구축 단계의 상태가 아닙니다. 마지막에 다시 채웁니다.
- 되살릴 자물쇠 구현은 `App.js` 히스토리에 있습니다(`TABS`의 `lock` 필드 + `lockMsg` 토스트). 토스트 자체는 재화 `＋` 버튼이 아직 쓰고 있어 살아 있습니다.

## 하단 메뉴바 6탭 (호드워)

| 탭 | 상태 | 화면 |
|---|---|---|
| 🏰 요새 | ✅ | `IdleScreen` — 방치 자동전투(호드워는 요새 맵이지만 방치형 정체성 유지, Gim 결정) |
| 🌄 필드 | 🟡 빈 골격 | `StubScreen` — 예정: 월드맵 계약 노드 · 원정 · 던전 목록 |
| 🏛️ 길드 | 🟡 빈 골격 | `StubScreen` — 예정: 길드 · 아레나 · 무한의 탑 |
| 🦸 영웅 | ✅ ❗ | `HeroScreen`. 편성 자리가 비면 ❗ |
| 🎁 혜택 | 🟡 빈 골격 | `StubScreen` — 예정: 일일 임무 · 이벤트 · 상점 |
| ⚔️ 모험 | ✅ ❗ **넓음** | `AdventureScreen`. 호드워의 주 진행 버튼 |

> ⚠️ **필드·길드·혜택은 호드워 실기 캡처에서도 잠겨 있어 베낄 화면이 없습니다.** 위 "예정" 목록은 엘드리아의 파킹 모듈을 성격에 맞춰 배치한 제안이며, 호드워 원본과 같다는 보장이 없습니다.

## 되돌리는 순서 (모듈 하나 되살리기)

1. `app/parked/<화면>.js` → `app/screens/` 로 이동
2. `system/core/features.mjs` 에서 해당 플래그 `true`
3. `App.js` `TABS` 에 `{ key, label, icon, Screen }` 추가 (또는 기존 탭 안에서 진입점 연결)
4. `node --test system/test/*.test.mjs` 로 확인
