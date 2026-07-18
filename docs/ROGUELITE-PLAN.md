# 원정(로그라이트) 모드 — 상세 기획·구현 계획

> 하이브리드 방치형 오토배틀러 로그라이트. 기존 엘드리아 코어·아트를 재사용해
> "좌→우 진격 런" 레이어를 얹는다. 전투·시너지·성장은 손대지 않는다.

## 1. 무엇을 왜 만드는가 (컨셉)

- **왜**: 2026 흥행 공식 = 방치형 뼈대 + 수집 + 오토배틀러 시너지 + 로그라이트 런(하이브리드). 시장 조사 근거는 `research.md` 참조.
- **무엇**: 거점(방치·수집)은 그대로 두고, 별도 **원정 모드**를 추가한다.
  파티를 꾸려 좌→우로 진격 → 웨이브 자동 전투 → 전투마다 **보상 3택(런 한정 강화)** → 보스 → 사망/클리어 시 런 종료 → **메타 재화 획득**(영구 성장).

## 2. 재사용 vs 신규 (경계 확정)

| 구분 | 항목 |
|---|---|
| ♻️ 그대로 재사용 | `resolve()` 전투엔진 · `teamSynergy` · `formation` · `economy`(재화) · `stats/성장` · `units/archetypes` · `save` · 스프라이트·배경·UI 아트 · `BattleView` 연출 · 탭 네비 |
| 🆕 신규(얇게) | `run.mjs`(런 상태·노드·보상·정산) · `runBoons.mjs`(런 한정 강화 목록) · `RunScreen.js`(진격 뷰+노드맵+3택 모달) · `state.run` 필드 · '원정' 탭 |

## 3. 핵심 설계 결정과 근거

- **전투는 새로 짜지 않는다.** 각 노드에서 기존 `resolve(party, challenge, mods, formation)`을 그대로 호출.
  → 승패·`margin`(여유)·`duration`을 이미 반환하므로 재사용.
- **소모전(attrition)은 `margin`으로 표현.** 런 동안 파티 "생명(runHP)" 풀을 둔다.
  전투 승리 시 `runHP -= f(margin)`(아슬한 승리일수록 더 깎임). `win=false`거나 runHP≤0이면 런 종료.
  → 새 전투 시뮬 없이 로그라이트의 긴장감(누적 피해)을 만든다. (ponytail: 최소 모델, 후에 정밀화 여지)
- **보상(boon)은 모디파이어 파이프라인 재사용.** 런 한정 배수를 `accountMods.powerMult` 등으로 주입해 `resolve`가 자동 반영.
- **통합은 새 탭.** `App.js` `ALL_TABS`에 `feat:'expedition'` 탭 추가 → features 플래그로 on/off.
- **세이브는 필드 추가만.** `createGameState`에 `run: null` 추가(진행 중 런 스냅샷). 하위호환.

## 4. 런 루프 구조(기본값)

- 1런 = **노드 8~10개**: 일반 전투 다수 + 엘리트 1~2 + 보스 1(마지막).
- 전투 승리마다 **boon 3택 1**(런 종료까지 유지, 영구 아님).
- 층(floor)이 오를수록 challenge 난이도 상승(기존 `getStage`/`bossChallenge` 곡선 재사용).
- 런 종료(클리어/사망) → 도달 노드 수 기반 **메타 재화** 지급 → 영구 강화에 투자.

## 5. 단계별 실행 계획 (각 단계 = 검증 가능 목표)

- [x] **P1. `run.mjs` 코어(로직만, UI 무관)** — `startRun / currentNode / fightNode / pickBoon / endRun` + BOONS 카탈로그(인라인). ✅ `run.test.mjs` 6/6 통과(진행·생명소모·패배종료·완주정산·세이브왕복). 전체 279통과.
- [x] **P0. 진입점·플래그** — `features.mjs`에 `expedition` 플래그(true), `App.js` ALL_TABS에 '원정'(⚔️) 탭 등록. ✅
- [x] **P2. `runBoons.mjs` 분리 + boon 확장·밸런스** — ✅ boon 10종(리스크: 광폭/gambit, 유틸: 보호막/재생, 회복 다양화). 런 상태에 powerMult·attritionMult·regen·shield 추가해 fightNode에 반영. run.test.mjs 8/8, 전체 281 통과. play.html 브라우저 검증(3택에 광폭·방벽 등 노출).
- [x] **P3. `RunScreen.js` UI** — 시작/진행/종료 3상태. 노드맵·생명바·BattleView 재사용·boon 3택 모달. ✅ 웹 빌드(play.html) 브라우저 검증: 시작→전투(승리 여유×4)→소모전(100→96%)→보상3택→선택 전 루프 정상. 콘솔 에러 0.
- [x] **P4. 연출 폴리시** — ✅ 생명바 부드러운 증감(Animated width), 진격 펄스, 전투결과 flash 팝(spring), 종료 🏆/💀 오버레이 등장. safeHP 가드(손상 세이브 방어). play.html 브라우저 검증: 시작→전투→보상→패배→정산→시작 전 루프 애니 정상, 에러 0. (진단 ErrorBoundary가 undefined runHP 크래시 포착 → 수정.)
- [ ] **P5. 빌드·검증** — `node --test system/test/*.test.mjs` 전체 통과 → `docs/play.html` 재빌드 → (요청 시) APK.

## 6. 리스크·주의

- `resolve`는 잔여 HP를 주지 않음 → runHP 소모는 `margin` 기반 근사(위 결정). 밸런싱에서 계수 조정.
- boon을 `resolve`에 주입하는 통로가 `accountMods` 중심 → 세밀한 효과(흡혈 등)는 P2에서 주입 방식 확정.
- 통합 범위(로스터·재화 공유 여부)는 아래 미결 결정 참조.

## 7. 미결 결정 (Gim 확인 필요)

1. **통합/공유 범위** — 원정이 기존 로스터·재화를 공유할지, 자체 진행으로 분리할지, 아예 새 앱으로 뺄지. (선택박스로 확인)
