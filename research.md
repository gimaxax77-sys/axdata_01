# research.md — 작업·조사 기록

> CLAUDE.md 규칙: 모든 질문·요구·요청과 진행 과정·결과를 신중·깊이·상세·명확·정확하게 정리해 여기에 누적 기록한다.

## 기록 형식
- **날짜 — 제목**
  - 요청:
  - 진행:
  - 결정·근거:
  - 결과:

---

## 2026-07-13 — CLAUDE.md 규칙 추가 및 전 저장소 횡전개
- 요청: CLAUDE.md에 "모든 답변을 신중·깊이·상세·명확·정확하게 정리하고 research.md에 기록" 규칙 추가, 전 저장소 기본 브랜치에 횡전개.
- 진행: 7개 저장소(axax77, axdata_01/03/05/07/09, gax)의 기본 브랜치 CLAUDE.md에 "답변·기록 규칙" 섹션 추가, 각 저장소에 research.md 생성.
- 결정·근거: '횡전개' = 새 세션이 실제로 여는 기본 브랜치에 반영(ponytail 배포와 동일 기준). 기존 CLAUDE.md는 보존하고 규칙 섹션만 추가(수술적 변경).
- 결과: 각 저장소 커밋·푸시 완료(아래 커밋 참조).

## 2026-07-13 밤 — 아트 브릿지 확인 + 캐릭터 매핑 초안
- 확인: 게임팩에 이미 브릿지 존재(gen-art-csv.mjs → docs/art_assets.csv). 캐릭터 33명, 초상 14완료/19필요, 전투 스프라이트(4종) 33 전원 필요.
- 추가: gen-character-map.mjs → docs/character_map.csv 자동 초안(로스터 원형/속성 기반).
  - 원형→몸: STRIKER/VANGUARD→Knight, SUPPORT→Mage, ROGUE→Rogue, ARCHER→Ranger.
  - 속성→색: FIRE빨강/WATER파랑/WOOD초록/LIGHT금흰/DARK보라.
  - 배정: Knight 12·Mage 11·Rogue 5·Ranger 5. (Gim 검토·수정용, Barbarian/Rogue_Hooded 다양화 여지)
- 남은 통합: 렌더 도구가 이 매핑대로 게임 규격 이름·경로로 출력 → charImages.js 자동 반영.

---

## QoL 배치 4종 (피로도 제로 보강) — 완료

Gim이 선택박스로 4가지를 모두 고르셔서 순서대로 구현·커밋·검증했습니다.

### ① 전체 던전 일괄 소탕
- `ContentScreen.doSweepAll` — 해금·입장 남은 모든 던전을 한 번에 소탕.
- '🧹 모두 소탕' 버튼을 던전 타일 아래 배치.

### ② 우편함 '읽은 우편 비우기'
- 코어: `mailbox.clearClaimedMail(state)` — 수령 완료 우편만 제거, 미수령 보존. 테스트 3건.
- `MailboxModal`에 읽은 우편이 있을 때만 노출되는 비우기 버튼.

### ③ 재화 낭비 알림
- 코어: `nudges.spendNudges(state)` — 소환 재화가 10연 1회분(100) 이상 쌓이면 알림. 테스트 3건.
- 근거: 자원 상한이 없어 "가득"은 없음 → 소환 재화는 소환 외 용처가 없어 쌓아두면 곧 낭비. 홈에 안내 라인.

### ④ 낮은 등급 장비 자동 분해
- 코어: `gearsalvage.autoSalvage(state, maxRarity)` — 인벤토리 하급 드롭(임계 이하·레벨1·인챈트 없음)을 재화로 정리. 강화/인챈트 투자분은 보호. 테스트 5건.
- 설정: `settings.autoSalvage`(null/끄기·'N'·'R'), 기본 끄기(save.mjs 마이그레이션).
- `ContentScreen`에 토글 3단(끄기/노멀↓/레어↓) + 소탕·던전 드롭 직후 자동 실행, 결과 문구에 '♻️분해 N개 🪙…' 병기.

### 검증
- `node --test system/test/*.test.mjs` → 267 pass / 0 fail.
- `npm run build:play` 성공(7668KB), mock 유출 0. play.html 전송 완료.
- 각 기능 개별 커밋(의미 단위), `claude/git-connection-status-rkjuko` 푸시.

## 2026-07-16 — 게임 단순화 재설계 착수 (최소 코어 + 선택 모듈 옵션화)
- 요청(Gim): 게임을 최소 코어 + 나머지 모듈 옵션화 구조로 진짜 재설계. 삭제가 아니라 기능 플래그로 on/off. 캐릭터는 이름+원형만(등급·속성 제거).
- 배경: 로스터를 21명으로 교체 시도 → 등급(rarity)·속성(element)이 14개+ 시스템(가챠·장비·펫·룬·유물·엠블럼·가디언·전투상성 등)의 뼈대라 커버리지·패리티 테스트 3종이 깨짐. 되돌림.
- 결정: 옵션화(플래그) 방식이 안전. 기본=풀 모드(비파괴), simplePreset로 선택 모듈 off.
- 진행(Phase1 스캐폴드, 비파괴): docs/redesign-plan.md 작성 + system/core/features.mjs(FEATURES/isOn/simplePreset) 추가. 아직 어느 모듈도 안 물림 → 테스트 그대로 통과.
- 자산: 21종 KayKit 캐릭터 초상(axdata_05/out_portrait21) + 16동작 스프라이트 2688장(out_roster_full). render_sprites env(SPRITE_CHARDIR/ANIM_PATH/FRAMES/DIR/OUT)로 재렌더 자동화.
- 다음: Phase2 element 옵션화 → Phase3 rarity 옵션화 → Phase4 부가모듈 → Phase5 21로스터 연결 → 검증. 각 단계 테스트 통과 유지.
