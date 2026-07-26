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

## 2026-07-16 — 재설계 Phase2·3 (속성·등급 옵션화)
- Phase2 속성: elements.affinity + synergy 속성블록을 isOn('elements')로 가드 → off면 전투 스탯 전용, 속성 시너지 없음.
- Phase3 등급: seed.rarityBaseMult를 isOn('rarity')로 가드 → off면 전투력 등급 무관. 등급 커버리지 테스트(newArchetypes)를 등급 off 시 skip 처리.
- 검증: system/test/features.test.mjs (속성·등급 on/off 5케이스). 전체 테스트 0 실패(기본 풀모드 비파괴).
- 남음: Phase4 부가모듈(펫·룬·유물·엠블럼·가디언·코스튬·가챠·장비·아레나·길드) 옵션화 → Phase5 21로스터(fantasy+scifi 동시 축소) 연결 → Phase6 단순모드 구동검증.

## 2026-07-16 — 컨트롤 판넬 + Phase4 (UI 게이팅·단순모드 검증)
- 컨트롤 판넬: control-panel.bat + scripts/control-panel.mjs. features.mjs를 MODULE_META(그룹별)+FEATURES로 재구성 → 번호 토글·프리셋(단순/풀)·저장. 모듈 추가는 META+FEATURES 한 줄씩.
- Phase4: App.js TABS를 isOn(feat)로 필터(가챠·상점 탭이 off면 숨음). 코어 탭(전투·영웅·콘텐츠)은 항상.
- 검증: features.test에 '단순모드 코어 유닛·전투력·시너지 정상' 스모크 추가. createUnit(archetype,opts)는 element 옵션(null 기본)·rarity 인자 없음 → 코어가 원형만으로 유닛 생성 이미 지원. 전체 273/0 통과.
- 남음: Phase4 잔여(각 화면 내부의 off 기능 숨김: 펫/룬/유물/엠블럼/가디언/코스튬/아레나/길드 UI) · Phase5(21 로스터 fantasy+scifi 동시 축소+KayKit 초상, 커버리지 test는 등급 off시 skip) · Phase6(단순모드 실제 구동).

## 2026-07-16 — 코어 캐릭터 정의 일반화 (어떤 장르·형태 캐릭터도 로스터 허용)
- 요청: Phase4는 인앱 토글 없이 컨트롤 판넬에서만 조작(현행 그대로). 코어 캐릭터 정의를 수정해 어떤 장르·형태 캐릭터도 로스터 적용 가능하게.
- 변경: content.test 유효성 검증을 '이름+원형 필수, 나머지(속성·시그니처·코스튬·대사)는 있을 때만/모듈 켜졌을 때만 검증'으로 완화. 패리티는 두 스킨 캐릭터 수가 같을 때만 확인(단일/유연 로스터 허용).
- 검증: features.test에 '이름+원형만 있는 임의 형태 캐릭터(로봇 등) 로스터 유효' 추가. 전체 274/0 통과.
- 의미: createUnit(archetype, opts)가 이미 element/rarity 없이 동작 + 유효성 완화 → 21 KayKit(기사·스켈레톤·늑대인간·로봇곰 등) 및 미래 임의 캐릭터를 로스터에 바로 넣을 수 있음.

## 2026-07-16 — Phase5 21 KayKit 로스터 실제 적용
- fantasy 로스터를 21종(이름+원형만)으로 교체: 기사/팔라딘/황금기사/해골골렘/바바리안/대전사/늑대인간/광랑/해골전사/해골졸개/드루이드/곰인형/도적/암살자/해골도적/괴이곰/궁수/기공사/흑마법사/강령술사/해골법사. 원형분포 V4·S6·Sup2·R4·A2·M3(6원형 전부).
- 초상: axdata_05/out_portrait21 → 01/assets/char/fantasy/<id>.png 복사. charImages.js fantasy 21 갱신. 코스튬 비움(옵션).
- 등급 커버리지 테스트: 컨셉이 등급 안 쓰면(일반 로스터) 생략하도록 수정 → fantasy(21,등급없음) 스킵, scifi(33,등급있음) 검사. 전체 274/0 통과.
- scifi는 33 유지(패리티 유연화로 무관). 다음: Phase6 실제 빌드 구동.

## 2026-07-16 — 전투 화면 캐릭터 아트 표시(이모지→전신 렌더)
- 증상: 전투 화면에 이모지만 나오고 연결한 21종 캐릭터 아트가 안 보임(Gim 확인: "이모지만 나옴").
- 원인: BattleView가 identity().emoji만 렌더. 3D 스프라이트 등록부(unitSprites.js SHEETS)는 비어 있고, charImages(초상)는 로스터 화면 전용이라 전투엔 미사용.
- 조치: axdata_05/out_front21의 정면 전신 대기 포즈 21종을 assets/char/battle/<id>.png로 복사(초상=얼굴컷이라 전투 부적합, 전신 포즈 사용). app/battleImages.js 등록부 추가. IdleScreen.heroFormation을 {emoji,img}로 확장(battleImage(concept.id,characterId)). BattleView에 Fighter 컴포넌트 추가 — img 있으면 Image, 없으면 이모지 폴백(scifi 등 무등록은 자연 폴백).
- 검증: 로컬 웹 빌드 DOM에서 char/battle/knight.png 배경이미지 렌더 확인. 테스트 274/0.

## 2026-07-16 — 전투 애니메이션 스프라이트 적용 + 스케일 확대
- 요청: 전투 화면에 정지 이미지가 아니라 애니 스프라이트 적용, 캐릭터 크기 확대.
- 스트립 조립: out_roster_full 개별 프레임 → 가로 8프레임 스트립(128px). 상태 idle(순환)·attack(1회, 원형별 클립: VANGUARD=slice_diagonal, STRIKER=2h_chop, ROGUE=stab, ARCHER=bow_release, MAGE=magic_shoot, SUPPORT=spellcasting). hit 스트립도 생성했으나 용량 위해 미등록.
- 배치: assets/units/fantasy/<id>/<id>_{idle,attack,hit}.png. unitSprites.js에 21종 등록(frames 반환 추가).
- BattleView: SpriteFighter 추가 — idle 순환, 공격 틱(atk 카운터)마다 attack 1회 재생 후 idle 복귀. 우리 파티는 좌→우 향하도록 scaleX(-1) 반전. 스프라이트 없으면 전신이미지→이모지 폴백(scifi 등).
- 스케일: 전열 96px·후중열 76px(기존 이모지 22px/이미지 46px 대비 확대). arena 높이 132→220.
- 검증: 로컬 웹 빌드 DOM 확인 — 96px 프레임 창(overflow hidden)이 768px 스트립을 한 프레임만 표시, scaleX(-1) 반전, attack 스트립 로드 확인. 테스트 274/0.
- 용량: play.html 16MB로 증가(스프라이트 다수). 단일 웹보다 Expo/네이티브 빌드가 적합.

## 2026-07-16 — 첫 APK 클라우드 빌드 성공
- 전투 스프라이트 방향 버그 수정(scaleX 반전 제거) 후 EAS 빌드.
- git 로컬 shallow clone(file://) 실패 → EAS_NO_VCS=1로 작업 디렉터리 직접 압축 업로드(25MB)로 우회.
- eas build -p android --profile preview --non-interactive --no-wait. 원격 키스토어 자동(Build Credentials wP_IdursVd). SDK 51, v1.1.0, 버전코드 2.
- 결과: finished. APK = https://expo.dev/artifacts/eas/NOSpmcDujwEltgGopCN1n0gKI36piLTVXZWr5aV-dMA.apk
- 빌드 페이지: https://expo.dev/accounts/gimax77/projects/eldria-idle/builds/5177c725-41b8-453a-bb67-f18c503edd22
- 소요: 큐 ~14분 + 빌드 ~6분. 향후 빌드도 EAS_NO_VCS=1 필요(로컬 git clone 이슈).

## 2026-07-16 — 전투 애니 16프레임 재렌더(부드럽게)
- 요청: 프레임 늘려 애니 더 부드럽게(Gim). 8→16프레임.
- 방식: axdata_05에서 Blender로 idle+attack 재렌더(SPRITE_FRAMES=16). 각 동작 타임라인 16 균등 샘플 = 진짜 3D 중간동작(보간 아님). 카메라 SPRITE_DIR="1,0,0"(오른쪽 측면, 기존과 동일 검증).
- 조립: scripts/assemble_strips.py (SRC=out_battle16, NFR=16, idle+attack) → assets/units/fantasy/<id>/<id>_{idle,attack}.png (가로 16프레임, 2048×128).
- 코드: unitSprites.js frames 8→16(21종). spriteAnim.mjs fps 상향(idle 10→20, attack 14→28, hit 24, death 20, spawn 24) — 재생시간 동일·부드러움 2배.
- 검증: DOM에서 knight_attack 스트립 img폭 1536(=16×96), 창 96 한 프레임. 테스트 274/0.
- 렌더 매핑·드라이버: axdata_05/battle_render_map.tsv, axdata_05/render-battle16.sh(커밋). 재렌더 재현 가능.
- 용량: play.html 16→18MB(프레임 2배). 스프라이트 게임은 APK 권장.

## 2026-07-16 — APK 재빌드(16프레임 최종본)
- 16프레임·정방향·확대 반영한 새 APK. EAS_NO_VCS=1, preview 프로파일.
- 결과: finished. APK = https://expo.dev/artifacts/eas/7iYy_4f-W1l2EsmqyKfpLAFMC8yRVrKJXFBFzMPQIkc.apk
- 빌드 페이지: https://expo.dev/accounts/gimax77/projects/eldria-idle/builds/c254f8ad-aff3-4584-bccd-9fd876b51091
- 웹(play.html)은 18MB로 아티팩트 16MB 한도 초과 → 웹 링크 갱신 불가, APK가 정식 배포 경로.

## 2026-07-16 — 앱 크래시 대응(레벨업 Max / 내보내기)
- 증상(Gim, APK): 레벨업 Max → 에러화면(ErrorBoundary), 세이브 내보내기 → 앱 종료. 웹·node에선 재현 안 됨(계산·직렬화 정상).
- 가설: 네이티브(Yoga)는 width:"NaN%" 등 비유한 스타일값에서 크래시(웹은 무시) → 웹만 정상.
- 조치(방어+진단):
  1) components.js pctW(n) 추가(0~100 클램프, 비유한→0). 전 화면 진행바 너비에 적용(Roster·Arena·Gacha·Idle·Content·Meta·PixelIdle).
  2) Settings.doExport try/catch — 내보내기 실패가 앱을 죽이지 않게(원인 메시지 노출).
  3) ErrorBoundary가 에러 메시지+컴포넌트 위치를 화면에 항상 표시(테스트 단계 진단용, __DEV__ 가드 제거).
- 목적: 이 빌드로 실제 에러 텍스트를 확보해 정확히 수정. 테스트 274/0, 웹 컴파일 정상.

## 2026-07-17 — 레벨업 Max 크래시 원인 확정 + 로그인 이모지 수정
- 진단 빌드로 실제 에러 확보: "Attempting to run JS driven animation on animated node that has been moved to native earlier (useNativeDriver:true)" @ PowerBadge.
- 원인: PowerBadge가 같은 Animated.View에 scale(transform, native)과 glowRadius→shadowRadius(JS)를 동시 애니. shadowRadius는 네이티브 드라이버 불가 → 네이티브에서 드라이버 혼용 크래시(웹은 무시). 레벨업 Max로 전투력 상승 시 발동.
- 수정: PowerBadge scale 애니를 useNativeDriver:false로 통일(작은 뱃지라 성능 무관). ResCell/StarBadge는 노드 분리/transform-only라 정상.
- 두번째 증상(로그인 후 캐릭 이모지): 클라우드/예전 세이브 유닛의 characterId가 현재 21로스터에 없어 스프라이트 폴백→이모지.
  수정: useGame.normalizeRoster — 로드 시 미등록 characterId를 같은 원형 로스터 캐릭터로 uid해시 안정 재매핑. applyLoad·importSave·cloud pull 세 경로 모두 적용.
- ErrorBoundary는 원인 표시 유지(테스트 단계). 테스트 274/0.

## 2026-07-17 — 등급(rarity) 모듈 끄기(Gim 요청)
- Gim: 등급 아예 적용 말 것 → 등급 모듈 off + 표시 제거.
- features.mjs: rarity false(기본 off).
- 표시 게이팅(isOn('rarity')): components.Portrait(링 글로우·배지 → 중립 N), RosterScreen(이름 옆 등급 알약·씨앗 등급문구), GachaScreen(RevealCell 등급 라벨·색테두리·확률 안내문). 전투력은 rarityBaseMult=1로 이미 등급 무관.
- 주의: 등급 off로 기존 UR·SSR 유닛 전투력이 등급배수만큼 하락(설계상 정상, Gim 동의).
- 테스트: 등급 검증 테스트(core-mechanics·economy)는 FEATURES.rarity=true 명시+복구로 격리. features 기본값 테스트 rarity=false로 갱신. 273 pass/0 fail(등급 커버리지 1 skip).

## 2026-07-17 — 등급 표시 잔여 제거(장비·펫·정령·유물·엠블럼)
- 이전엔 캐릭터·뽑기만 가림. 아이템류 등급 배지 남아 있던 것 발견(Gim 스샷).
- GrowthPanel: Tile(펫·정령·유물·엠블럼 공용) 등급 테두리·라벨 isOn('rarity') 게이팅 + 상세 인라인.
- RosterScreen: rarityColor()→중립(T.line), rarityText()→display:none 로 등급 off 시 전 장비/룬/코스튬 표시 일괄 숨김(사이트 10곳+ 한번에).
- ContentScreen: 드롭 토스트의 [등급] 표기 게이팅.
- MetaScreen(도감): 로스터 등급 데이터 없음 + Portrait 게이팅으로 이미 정상.
- 테스트 273/0.

## 2026-07-17 — 전투 4상태 애니 배선(hit·walk 추가)
- unitSprites.js: 21종 idle/attack/hit/walk 등록(16프레임). spriteAnim.mjs: walk 규약 추가(1회, 20fps).
- BattleView: hitTok(적 반격 t%6), walkTok(적 처치→다음 웨이브) 추가. SpriteFighter가 attack/hit/walk 토큰 감시, 소스순 마지막 우선(피격이 공격 끊음). onEnd→idle.
- 검증: 로컬 웹 DOM에서 attack·hit·walk 상태 전환 확인(에러 0). 테스트 273/0.

## 2026-07-17 — 자원바 아이콘 인앱 배선(UI 1단계)
- app/uiIcons.js: 자원키→assets/ui 아이콘 레지스트리(resIcon). components ResCell이 아이콘 있으면 Image, 없으면 이모지 폴백. ResourceBar가 iconKey 전달. resIcon 스타일 22px.
- 범위: 상단 자원바만(다른 화면 자원 이모지는 유지). 검증: 웹 DOM에 ui 아이콘 4개 렌더 확인. 273/0.

## 2026-07-17 — 전투 배경 인앱 적용(UI 2단계)
- IdleScreen 전투 무대(Card)에 bg-battle.png 절대배치(콘텐츠 뒤, 둥근모서리 클립, opacity 0.9). stage overflow:hidden.
- 검증: 웹 DOM에 bg-battle 렌더 확인(에러 0). 목업으로 파티+던전바닥 확인. 273/0.

## 2026-07-17 — 전투 무대 레이아웃 재설계(Gim 피드백: 위치 어색·스케일)
- 문제: 파티가 무대 중앙에 떠 있고 텍스트와 겹침, 캐릭터 작음.
- BattleView: 파티/적 바닥 정렬(arena flex:1, alignItems flex-end). 스케일 확대(FRONT 96→120, BACK 76→96, enemy 72→104). 편성 열 겹쳐쌓기(formCol gap -8)로 7인도 그룹으로 뭉침.
- IdleScreen: 층·구역 = 상단 배너(절대, 그림자). 적HP·속성·시너지 = 카드 밖 아래 스트립. 구역바 = 무대 하단 절대. 무대 padding 0으로 배경 꽉 채움.
- 검증: 웹 컴파일·273/0. 목업으로 파티 바닥정렬·확대 확인.

## 2026-07-17 — 전투 2열 표시 + 배경 층/난이도 적용
- BattleView: 전투 화면에 중열+전열(1·2열)만 표시, 후열 숨김(Gim 요청, 로직 무관).
- IdleScreen: BATTLE_BGS 배열 층÷10 순환 + DIFF_TINT 난이도 색조 오버레이(stageTint). 구 bg-battle.png 제거.
- 273/0.

## 2026-07-17 — 전투 배경 8종으로 확장(Gim 요청)
- 던전 변형 4종 추가(bg4 가시바닥+게이트창, bg5 대형격자, bg6 격자+아치, bg7 파운데이션+슬로프T). 총 bg-battle-0..7.
- 숲 팩은 gltf가 풀뿐이라 던전 변형으로 확장. IdleScreen BATTLE_BGS 8종, 층÷10 순환.

## 2026-07-17 — 속성(element) 모듈 끄기(Gim 요청, 등급과 동일)
- features.mjs: elements false(기본 off). affinity/synergy는 이미 isOn 게이팅됨(=1, 결속 없음).
- 표시 게이팅: IdleScreen 구역 속성·적 속성/상성 숨김. RosterScreen 장비 속성부여 버튼 숨김. ContentScreen 보스 속성 숨김. (21로스터는 element 없어 대부분 이미 공백.)
- 테스트 격리: elements 검증 테스트(core-mechanics·pvp-resolve·features)는 FEATURES.elements=true 명시+false 복구. 기본값 테스트 갱신. 273/0.

## 2026-07-17 — 무기·방패 장비 아이콘(3D)
- render_icons.py로 7종 렌더: sword(sword_D)·dagger·bow·axe·greatsword(sword_B)·shield(round)·tome(staff_A). → assets/ui/gear/.
- uiIcons.gearIcon(blueprint): 블루프린트→아이콘 매핑(검류 다수→sword, 방패류→shield, ARCANE_TOME→tome). 모델 없는 방어구·장신구는 null→이모지 폴백.
- RosterScreen 장비 타일: 장착 아이템이 gearIcon 있으면 Image, 없으면 슬롯 이모지. 273/0.

## 2026-07-17 — 적 몬스터 스프라이트(이모지→몬스터)
- 적 5종(skeleton_warrior/minion/mage/golem, werewolf_wolf) idle+hit 렌더(왼쪽 향함 SPRITE_DIR=-1,0,0, 16프레임, General/Idle_A·Hit_A). axdata_05 body는 battle_render_map.tsv 경로 재사용.
- 조립 → assets/units/enemy/<id>/<id>_{idle,hit}.png. unitSprites 'enemy:<id>' 5종 등록.
- BattleView EnemyFighter: idle 순환, 히어로 공격(atk)마다 hit 재생. enemyKey 없거나 미등록이면 이모지 폴백.
- IdleScreen ENEMY_KEYS 층÷10 순환(배경과 함께 변화). 273/0.

## 2026-07-17 — UI/아트: 무덤 배경 2종 + 뽑기 장비 아이콘
- 할로윈 팩으로 무덤 배경 렌더(bg8 흙바닥+철제울타리+해골묘비, bg9 파손울타리+무덤). render_scene.py 재사용(Halloween gltf). → bg-battle-8/9. BATTLE_BGS 10종.
- GachaScreen 장비 뽑기 결과 셀에 gearIcon(무기·방패 3D 아이콘) 적용, 그 외 이모지 폴백.
- 273/0.

## 2026-07-17 — 적 공격 애니 + 정리(픽셀모드·미사용초상)
- 적 공격 5종 렌더(왼쪽향함, 근접4=slice/chop/kick, 마법1=magic_shoot, 16프레임) → enemy/<id>_attack.png. unitSprites 'enemy:<id>'에 attack 추가.
- BattleView EnemyFighter: 적 반격(t%6)에 attack 재생(setEnemyAtk), 파티 공격 시 hit. idle 순환.
- 정리: 픽셀 모드 제거(App.js pixelMode/showPixel/togglePixel, ShopScreen 픽셀버튼, PixelIdleScreen.js 삭제, 옛 픽셀자산 bg-sanctum/hero-fire/enemy-guardian 삭제). 미사용 옛 초상 24종 삭제. 273/0.

## 2026-07-17 — 난이도 마커 3D + 장비 선택창 아이콘
- 난이도 마커: Gem_Large 4색 틴트(normal 초록/hard 노랑/hell 빨강/abyss 보라) → assets/ui/diff/. uiIcons.diffIcon. IdleScreen 난이도 버튼에 아이콘+라벨.
- 장비 선택창(picker): 제작·보유 목록에 gearIcon 표시(무기·방패), 없으면 텍스트만.
- 273/0.

## 2026-07-17 — 전체 코드 재점검(이슈 수정)
- [회귀 수정] npm test에 포함된 verify-character.mjs 3건 실패(등급·속성 off 전제 미반영) → 해당 블록만 FEATURES.rarity/elements=true로 켜고 복구. 이제 npm test 전체 통과(273/0 + 17/0 + 37/0).
- [데드코드 제거] battleImage/assets/char/battle(3.8MB): 21종 전부 스프라이트 보유 → 폴백이 영구 미실행. BattleView img 분기·Image import·miniImg 스타일까지 정리.
- [잔재 제거] charImages 'fantasy:kael'(로스터에 없음) + kael.png.
- [주석 정정] village.mjs의 PixelIdleScreen 참조, BattleView 헤더.
- 자산 32M→28M. 판넬/플래그 일관성 OK(OFF: elements·rarity), 적 자산·ENEMY_KEYS 일치 OK.
- [미해결·보고] village.mjs(본진 발전)가 픽셀 화면 제거로 UI 연결이 끊긴 고아 모듈(기능 손실). 삭제/재노출 결정 필요.

## 2026-07-18 — village(본진 발전) 전투 화면 되살리기
- 픽셀 화면 제거로 고아가 됐던 village를 IdleScreen 배너에 복구: '⛺ 본진: 야영지 → 전초기지 XX%' 한 줄(peakStage 기반, 순수 표시). villageTier import + village/villageDim 스타일.
- npm test 273/0 + 17/0 + 37/0, 웹 빌드 정상.

---

## [2026-07-18] 원정(로그라이트) 모드 기획

- **컨셉 확정**: 하이브리드 방치형 오토배틀러 로그라이트. 시장조사 결론 = 방치형+수집+오토배틀러 시너지+로그라이트 런.
- **재사용 판단**: 코어(resolve·synergy·formation·economy·성장·save·아트) 그대로 재사용. 상태/전투/캠페인이 이미 "장르 중립" 설계라 로그라이트는 얇은 run 레이어만 추가.
- **신규**: run.mjs / runBoons.mjs / RunScreen.js / state.run 필드 / '원정' 탭.
- **핵심 결정**: 전투는 resolve() 재사용, 소모전은 margin 기반 runHP 소모로 근사, boon은 모디파이어 파이프라인 주입, 통합은 App.js 탭 추가.
- 상세: `docs/ROGUELITE-PLAN.md`.
- **미결**: 통합/공유 범위(로스터·재화 공유 vs 분리 vs 새 앱) → Gim 확인 대기.

## [2026-07-18] 원정 P1 — run.mjs 코어 완성
- system/core/run.mjs 신규: startRun/currentNode/fightNode/pickBoon/endRun + BOONS 카탈로그.
- 전투는 resolve() 재사용, 소모전은 margin 기반 runHP 소모(attritionCost), boon은 accountMods.powerMult 주입.
- gameState에 run:null 필드 추가(세이브 자동 왕복).
- system/test/run.test.mjs 6/6 통과. 전체 279 통과/0 실패.
- 다음: P0(원정 탭 껍데기) → P3(RunScreen UI).

## [2026-07-18] 원정 P0+P3 — UI 구현·검증 완료
- features.mjs: expedition 플래그 추가(true). App.js: '원정'(⚔️) 탭 등록(feat 게이팅).
- app/screens/RunScreen.js 신규: 시작(층 선택)/진행(노드맵·생명바·BattleView·boon 3택)/종료 정산 3상태. BattleView·배경·formationSummary·identity 재사용.
- build-play.mjs: PLAY_DIST env로 소스 폴더 우회(dist 잠금 대비). dist가 node server.js에 잠겨 dist2로 clean export.
- docs/play.html 재빌드(26MB, 새 코드 포함) → 로컬 서버(8799)+브라우저로 스모크 검증:
  원정 탭 렌더 OK → 원정 시작 → 관문 1/10 → 전투 승리(여유×4.0) → 생명 100→96% → 보상 3택 → '전투력+25%' 선택 반영. 콘솔 에러 0. 전체 테스트 279 통과 유지.
- 남음: P2(boon 확장·메타 재화), 밸런싱, 배경/이모지 아트.

## [2026-07-18] 아트팩 조사 브리핑
- 공백: 방어구·장신구 아이콘 / 펫·가디언 / 적 다양성.
- 펫·가디언·적: Quaternius Cute Animated Monsters(21종, CC0, FBX/Blend)가 최적 — 기존 EEVEE 파이프라인 그대로. Animated Animals·Ultimate Monsters도 CC0. 보유 Monster Pack(박쥐·드래곤·슬라임·스켈레톤).
- 방어구·장신구 아이콘: KayKit 3D 없음. 2D 아이콘팩(Clockwork Raven 100+, Helmet Icons 50)은 스타일 충돌로 비추천. AI 아트(axdata_09) or 틀 이모지 권장.
- 무기·캐릭터: KayKit Fantasy Weapons·Adventurers 액세서리 이미 보유.
- 결론: 펫·가디언·적은 Quaternius로 렌더, 방어구·장신구는 AI/틀 이모지.

## [2026-07-18] RosterScreen.js 파일 분리 리팩터링
- 목적: 1401줄 단일 파일을 기능별로 분리(가독성·유지보수).
- app/screens/rosterShared.js(137줄) 신규: 공용 표시 헬퍼(rarityColor/Text, statIcon, ov, describe*, DeltaText, powerWith*, RARITY_RANK).
- app/screens/RosterPickerModal.js(250줄) 신규: 장비/스킬/룬 선택·강화 모달 + m 스타일. rosterShared에서 헬퍼 import.
- RosterScreen.js: 1401 → 1057줄. 헬퍼·모달·m스타일 제거, 두 새 파일에서 import. 로직 변경 없음(순수 이동).
- 검증: expo export 컴파일 OK(에러0) · play.html 브라우저 스모크(앱 마운트·영웅 로스터·육성/장비/스킬/꾸미기 탭·PickerModal 룬선택 모달 정상) · 코어 테스트 279 통과.

## [2026-07-18] 원정 P2 — boon 확장·밸런스
- system/core/runBoons.mjs 신규: boon 10종(might/surge/berserk/bulwark/mend/vitality/regen/ward/fortune/gambit). 리스크(광폭·gambit), 유틸(보호막·재생), 회복 다양화. applyBoon()이 런 상태에 누적 적용.
- run.mjs: 런 상태에 powerMult·attritionMult·regen·shield 추가. fightNode 소모전에 attritionMult·shield(1회무효)·regen 반영. BOONS는 runBoons에서 re-export(화면 호환).
- RunScreen: boon 아이콘 b.icon 사용.
- run.test.mjs 8/8(보호막·gambit·광폭 검증 추가), 전체 281 통과. play.html 브라우저 검증: 3택에 광폭(생명소모↑)·방벽(생명소모↓) 등 노출 확인.

## [2026-07-18] 원정 P4 — 연출 폴리시
- RunScreen: Animated 연출 추가 — 생명바 부드러운 증감(useNativeDriver:false, width interpolate), 진격 펄스(관문 이동 시 scale), 전투결과 flash 팝(spring opacity+scale), 종료 🏆/💀 오버레이 등장(fade+scale). reduceMotion 시 즉시값.
- 버그 수정: 저장된 손상/구버전 런의 runHP가 undefined면 new Animated.Value(undefined)로 크래시 → safeHP(0~1 유한수 정규화) 가드. 표시·색·바 모두 safeHP 사용. (진단 ErrorBoundary가 정확히 포착 — 릴리스 전까지 유지 가치 확인.)
- 검증: 전체 281 통과 · play.html 브라우저 전 루프(시작→전투→보상→패배→정산→시작) 애니 정상, 콘솔 에러 0.

## [2026-07-18] 정리 + 원정 콘텐츠 확장
- 정리: RosterScreen 미사용 import 30개 제거(리팩터 잔여). 01 vs 03은 별개 GitHub repo 확인(01=292커밋 메인, 03=18커밋 품질리부트 추정).
- 원정 메타 확장: gameState.expedition{maxFloor,tokens,upgrades} 추가. run.mjs에 EXP_UPGRADES(might/vigor/fortune) + expeditionMeta/upgradeCost/buyUpgrade. startRun이 해금 층까지 캡+업그레이드 반영, endRun이 토큰 지급+완주 시 다음 층 해금.
- RunScreen: 시작 화면에 층 캡·해금 안내 + 원정 강화 상점(토큰으로 영구 업그레이드) + 정산 flash에 토큰/해금 표기.
- run.test.mjs +3(층해금·업그레이드반영·층캡). 전체 284통과/0실패. play.html 재빌드(인라인 195).
- 미완: 방어구·장신구 아트(접근 미정), 병합브랜치 삭제(멀티세션 우려로 보류), 인게임 상점 시각확인(프리뷰 지속런 아티팩트로 막힘 — 코드는 검증됨).

## [2026-07-19] 버벅거림 수정 + 3D 빌드 분리 + APK + main 병합
- 문제: 실기기에서 캐릭터·몬스터가 미묘하게 버벅거림. 진단(추측 아님): (1)주범 SpriteAnim이 매 프레임 setFrame→스프라이트당 초당 20~28회 리렌더(8마리≈190/s), (2)부주범 BattleView 120ms force 전체 리렌더.
- 수정: SpriteAnim 프레임을 Animated.Value(translateX)로 구동(리렌더 0). BattleView 파이터 React.memo + HP바 Animated 너비 + 데미지 숫자 FloatText 자가 애니(생성/제거 때만 렌더) → force 완전 제거.
- 3D POC 판단: 실시간 3D(expo-gl) POC APK가 네이티브 Gradle에서 2회 연속 실패. 로컬 android export는 성공→JS 무죄, expo-gl 네이티브가 원인으로 확정. Gim 선택으로 3D를 빌드에서 분리(RunScreen 연결 해제, expo-gl/expo-three/three 의존성 제거, babel/metro 3D설정 원복). Model3D.js·yellowdragon.gltf는 보존. expo-doctor 15/17→17/17.
- APK: EAS preview 빌드 성공(45f1f078, ~7분). expo 링크+APK(89MB) 전달. (규칙: 재빌드 후 항상 expo 링크 동반.)
- 커밋: d5b06b1 perf(최적화) / e219f57 build(3D 분리·보존). main에 --no-ff 머지(ea818b7) 후 push. 전체 테스트 284/0 유지.
- 미완(이월): 방어구·장신구 아트, 실기기 버벅거림 재검증, 3D 재개 시 expo-gl Gradle 원인 규명, 진단 ErrorBoundary 릴리스 전 원복, 병합브랜치 정리.

## [2026-07-19] 피처 플래그 on/off 가드 전면 보완
- 점검: features.mjs 계약(진입점 isOn 가드)을 전수 조사 → 20개 모듈 중 5개(expedition/gacha/shop 탭 + rarity/elements 표시)만 가드, 15개는 선언만 되고 off가 안 먹는 상태 확인.
- 보완(15개): 탭·섹션 계층부터 → 개별 카드까지 isOn 가드 추가.
  · RosterScreen: DETAIL_TABS 필터(gear·costumes), 전용무기(sigweapon)·룬(runes)·친밀도(intimacy) 가드.
  · ContentScreen: SUBTABS 필터(경쟁=arena|guild|tower, 이벤트=events|season) + 이벤트/시즌 블록 가드.
  · ArenaGuildScreen: isOn import + 아레나/무한의탑/길드 섹션 각각 가드.
  · GachaScreen: 소환 숙련(summon) 카드 가드.
  · GrowthPanel: 펫(pets)·유물(relics)·엠블럼(emblems)·정령(guardians) 카드 가드.
- 기본값 전부 on이라 무회귀. 그룹 탭은 하위 모듈이 모두 off면 탭 자체가 사라짐. 검증: 284/0, 웹 번들 클린(오류0), 콘솔0.

## [2026-07-19] 전투 '보는 맛' 강화 1~3차 (전략: 시장 진단 후 결정)
- 배경: 구조 재점검+시장 경쟁력 진단 → 최상위권 대비 격차 1순위가 "전투 볼거리". 3D는 성능·빌드 리스크로 보류, 저비용 Animated 연출로 개선.
- 1차: 타격 섬광(💥 확대·소멸)·적 피격 플래시·크리티컬 무대 셰이크·처치 팝. 기존 이모지 전용 enemyFlash state 제거(Animated 통합).
- 2차: 파티 피격 플래시+흔들림(적 반격 시), 웨이브 전환 시 새 적 오른쪽 슬라이드인(spring).
- 3차: 열세 위기 비네팅(win=false 시 붉은 펄스 loop, cleanup서 stop), 진격 러지 setState→Animated 전환(공격당 렌더 2회 제거).
- 전부 Animated 노드 구동 — 연출 추가에도 리렌더 증가 0(오히려 감소). BattleView.js 단일 파일 변경.
- 검증: 284/0, 웹 번들 클린, 콘솔 0. BattleView는 방치 전투·원정 공용이라 두 화면 모두 적용됨.

## [2026-07-19] 전투 연출 자연스러움 개선 + 로컬 안드로이드 빌드 환경 구축
- 배경: EAS 무료 빌드 한도 소진(8/1 리셋) → JDK17+Android SDK를 D:\Android에 로컬 설치, gradlew assembleRelease로 로컬 APK 빌드 전환. eas upload(빌드 아님, 업로드 전용)로 expo.dev 공유 링크는 계속 생성 가능(한도 무관).
  · 삽질: MSYS가 `cmd //c`를 경로로 오인 변환 → PowerShell로 전환. local.properties가 Java Properties라 `\`가 이스케이프로 소비돼 sdk.dir 깨짐 → 슬래시 표기로 해결.
- 실기기 피드백 반영 다회전:
  1) 새 전투 연출(타격섬광·피격플래시·크리셰이크 등) 9개가 실수로 useNativeDriver:false → JS스레드 버벅거림 재발. true로 전환.
  2) SpriteFighter/EnemyFighter가 모션 전환마다 useEffect 경유로 재렌더 2회 → React "렌더 중 상태 파생" 패턴으로 1회로.
  3) "동시에 움직임" 피드백 → 유닛별 staggerMs(SpriteAnim에 전달, elapsed 시작을 유닛마다 다르게 지연)로 idle 위상·모션 시작 개별화.
  4) 재점검: 전열 전체를 한 Animated.Value로 묶은 그룹 lungeX가 스태거를 다 가리는 진짜 원인이었음 → 유닛별 개별 러지로 교체.
  5) 캐릭터 2배 확대 요청 → 과했다는 피드백으로 25% 축소(최종 180/144/198). 화면 셰이크 진폭 절반. 재생 fps를 낮춰 "느리게" 시도했으나 프레임수(16장) 고정이라 오히려 끊겨보임 → fps는 원복(부드러움), 전투 틱 간격(120→150ms)으로 템포만 별도 조절.
  6) HP바 라벨("내 파티"/"적") 제거 요청 → 이후 진행바 자체가 겹친다는 피드백으로 HP바 전체 제거(관련 Animated.Value·style·bar() 함수 정리).
- 이 사이클 전체가 "모션·템포 이전보다 좋음" 피드백으로 일단락. HP바 제거 결과 대기 중.
- .gitignore에 android/ 추가(로컬 prebuild 산출물, local.properties가 머신별 절대경로라 커밋 부적합).

## 2026-07-23 — (소급기록) 코어 라이브러리화(엘드리아)
- 요청: 3트랙 독립 원칙下, 엘드리아 코어를 트랙 안에서 라이브러리화(엘로그와 공유 아님).
- 진행: `system/core/`에 파일 이동·앱 import 변경 **없이** `index.mjs`(barrel, 65모듈 네임스페이스 재노출)+`package.json`(`@eldria/core`) 추가.
- 검증: barrel 로드 OK, 테스트 285/0. 두 코어는 99% 동일(65중 58 완전동일, 다른 7개는 파티정원7 vs 엘로그5·브랜딩텍스트·가산기능=조율가능). 상세 루트 `CORE_LIBRARY_REVIEW.md`.
- 참고: 엘드리아는 픽셀 스프라이트 미적용(일러스트 초상 중심). 캐릭터 아트 3트랙 정리는 루트 `CHAR_ART_TRACKS.md`.

---

## 2026-07-25 · 전투 세로 자유 산개 전환 (세븐나이츠 키우기 벤치마크 적용)

**배경**: 세븐나이츠 키우기 UI 벤치마크 결과, 세로 화면에서도 유닛이 필드 전체를 자유롭게 흩어져 난전(진형은 편성 스탯일 뿐, 전투 화면 배치가 아님)함을 실제 세로 캡처(악마의 광장)로 확인. 이 방식을 엘드리아(axdata_01)에 적용.

**변경 파일**: `app/screens/BattleView.js` 1개. 순수 연출만 수정 — 게임 로직(resolve 등)·다른 파일 불변.

**핵심 변경**:
- `arena`를 좌우 대치(flexDirection:row, heroSide/side/formRow/formCol)에서 **절대좌표 필드**(position:relative + 유닛별 position:absolute, left/top %)로 전환.
- 파티 front/mid를 필드 하단~중앙에 산개(`ALLY_FRONT_POS`=위쪽/적에 가깝게, `ALLY_MID_POS`=아래쪽), 적은 상단(`ENEMY_POS` y:12%).
- 전열 러지 방향 오른쪽→위(translateX→translateY, +8→-9). 적 등장 슬라이드 오른쪽→위에서 아래로(`waveX`→`waveY`, +70→-70).
- 스프라이트 축소(FRONT 180→128, BACK 144→104, ENEMY 198→150) — 한 필드에 여러 유닛 겹침 방지.
- 미사용 스타일(side/heroSide/formRow/formCol/clash) 제거, `unitAbs` 추가.

**검증**: 코어 테스트 284 pass/0 fail. `npm run build:play` 성공(docs/play.html 34MB). 로컬 http로 앱 로드·콘솔 에러 0 확인. **미검증**: 시각 배치(브라우저 pane 스샷 불가) — 실기 확인·튜닝 필요.

**남은 튜닝 후보**: 유닛 좌표·크기 미세조정(실기 겹침 여부), 데미지 숫자 floatLayer가 현재 하단 공용(산개와 안 맞음 → 유닛별 위치로 개선), 적 1마리→다수 산개 여부, 유닛별 HP바 추가(세븐나이츠식).

### Phase 1 착수 (세븐식 개조 · 전투 비주얼)
- 방향 확정(Gim): "첫 이미지처럼 전체 변경" + "없는 기능도 신규 개발". 로드맵 `docs/SEVEN_REVAMP.md` 작성.
- **데미지 숫자 겹침 버그 수정**: FloatText에 side 전달. 아군 피해=중앙 하단(bottom 70→118), 적 피해=적 근처 상단(top 17%→9%). floatLayer를 arena 전체로 확장. (이전: hero/enemy 공용 한곳에 뭉쳐 뭉개짐 — 내 회귀였음)
- **유닛별 HP바 추가**: HpBar 컴포넌트(발밑 34x4 바). 아군=heroHp.current(초록), 적=enemyHp.current(빨강). unitAbs에 alignItems:center. 연출용 공통 HP라 리렌더 시 갱신.
- 검증: 테스트 284 pass, build:play 성공.
- 다음: 산개 배치 실기 튜닝(Gim 확인) → Phase 2 액티브 스킬 시스템.

### 아트 제거 → 세븐 목업 형태로 (Gim: "아트 전부 제거하고 전부 동일하게")
- **3D 던전 배경 제거**: IdleScreen stageBg를 BATTLE_BGS Image → LinearGradient(#5a2f45→#241826) 세븐식 자주 필드.
- **캐릭터 스프라이트 제거**: heroFormation slotOf에서 cid/key 제거 → 이모지 렌더. BattleView enemyKey prop 제거 → 적도 이모지.
- 손실(합의): 스프라이트 공격/피격 애니, 3D 배경 전부 사라짐. 위험 한 줄 고지 후 진행.
- 미사용화: ENEMY_KEYS, BATTLE_BGS(복구 대비 잔존).
- 검증: build:play 성공.
- **관건**: 파티 1명이라 산개 확인 불가 → 소환으로 영웅 확보·편성 필요. Phase 4(UI 골격: 스킬바·좌우버튼·상단바)와 파티 채우기 남음.

### 세븐식 개조 이어서 (배회 교전·적 무리·스킬바 작동)
- **유닛 배회(Wander)**: 각 유닛이 자기 자리 주변을 끊임없이 이동(우왕좌왕 방지 위해 적 근처로 좌표 당기고 range 축소 → 적에 붙어 교전).
- **적 무리 3~5 랜덤 + 종류 섞기**: MONSTER_EMOJIS(12종) 풀에서 rollSquad로 처치마다 새로 뽑음. ENEMY_SLOTS 5자리.
- **스킬바 작동**: SkillSlot 컴포넌트 — 쿨타임(8~18초) 아래에서 차오르고, 다 차면 발동(테두리 반짝) 후 재순환. 방치라 자동. 파티 영웅 이모지, 빈칸은 '＋'. (현재 연출 수준 — 실제 전투 데미지 판정 연동은 미구현)
- 검증: build:play 성공.
- 남음: 스킬 발동을 실제 전투 효과와 연동, 좌우버튼 실기능(배속·방치보상·탐험), 상단 스테이지바 세븐화, Phase 3 콘텐츠.

### 기준 해상도 고정 출력 전환 (Gim 지적: "기기마다 해상도가 줄었다 늘었다 한다")
- **진단**: 엘드리아는 `flex` 비율 기반 반응형이라 기기 세로 길이만큼 레이아웃이 늘어났음. 세븐 등 Unity 세로 모바일 게임은 기준 해상도(Reference Resolution) 하나를 잡고 화면 전체를 균일 배율로 확대/축소(남는 쪽은 레터박스) — Gim 지적이 맞음. **주의: 세븐 앱을 직접 계측한 값이 아니라 Unity 표준 방식을 적용한 것.**
- **`app/FixedStage.js` 신규**: 기준 390×844(비율 2.164:1) 고정 무대. `scale = min(w/390, h/844)`로 균일 축소, 가운데 정렬, 남는 여백은 바깥 배경(레터박스). 390을 고른 이유 = 기존 UI가 이 폭 기준으로 작성돼 있어 글자·버튼 크기가 안 변함.
- **App.js**: frame을 FixedStage로 감쌈. bgGrad를 SafeAreaView→frame 안으로 이동(레터박스는 T.bg 단색). `wide`/`frameWide`(≥720 가운데정렬) 제거 — FixedStage가 대체.
- **RosterScreen.js**: 그리드 폭 계산이 `useWindowDimensions` 실제 창 폭이라 PC에서 어긋남 → `DESIGN_W` 상수로 교체.
- **검증**: 테스트 284/0. build:play 성공. 브라우저 393×917에서 DOM 실측 — 무대 390×844 · 상하 레터박스 각 36.5px · 콘솔 에러 0. 배포 `?v=6`.
- **알려진 제약**: RN `Modal`은 포털이라 무대 밖에 렌더 → 설정·우편함·오프라인 팝업은 스케일 미적용(PC에서 풀스크린). 태블릿처럼 확대되는 기기는 미검증(`ponytail:` 주석으로 표시).

**고정 무대 실측 세로 배분(390×844 기준)** — 휑함 문제의 실체가 숫자로 드러남.

| 영역 | 높이 | 비중 |
|---|---|---|
| 자원바 | 68px | 8% |
| 스테이지바 | 52px | 6% |
| **전투 필드** | **328px** | **39%** |
| **하단 정보 패널** | **217px** | **26%** |
| 스킬바 | 52px | 6% |
| 탭바 | 79px | 9% |

→ 전투 필드가 39%뿐이고, 정보 2줄짜리 하단 패널이 26%를 먹음. 세븐은 필드가 절반 이상. **다음 조치 후보: 필드 flex 3→5, 하단 패널을 얇은 콘텐츠 버튼 줄로 압축.** Gim 확인 대기.

### 전투화면 레이아웃 세븐 기준 전면 재설계 (Gim: "기존 레이아웃 다 정리하고 세븐과 동일하게")
- **기준 자료 확보**: `seven_real.html`(구글플레이 실제 세로 캡처 재현 정밀 목업, 340×720)을 이전 세션 scratchpad에서 회수. 공개 Pages 사본은 force_orphan으로 404 — **로컬 원본이 유일본**이므로 `docs/`로 보존 필요.
- **세븐 세로 배분 계측(720 기준 → 비중)**: topbar 34(4.7%) · stagebar 33(4.6%) · **field 560(78%)** · skillbar 54(7.5%) · menubar 39(5.4%). 하단 정보패널은 **없음**.
- **엘드리아 개조 전**: field 328/844 = **39%**, 하단 정보패널 217(26%). 필드가 세븐의 절반 → 이것이 휑함의 실제 원인(세로 길이 문제가 아니었음).

**변경**
- `app/screens/IdleScreen.js` **전면 재작성**. 하단 정보패널(방치보상 카드+적HP/전투력/최고층) 삭제. Card·padding 제거로 필드를 화면 좌우 끝까지. 필드 `flex:1`.
  - 스테이지바: 상점(2줄) · 구역명+진행바(**진행바 안에 "진행도 N% · 최고 N" 오버레이** = 세븐 방식) · 보스 ☠️.
  - 필드 배경: 네이비 4단 그라데이션 + **격자 무늬**(가로14·세로9 정적 View) + **기둥 장식 5개**. 세븐 필드가 안 휑한 이유가 이 배경 레이어라 그대로 이식(보라 금지 준수).
  - 좌측 세로버튼 **4개**(📊전투력 · AUTO● · 🎥 · 💬), 우측 **3개**(💎보유량 · 🎁방치+수입/s · 🧭탐험), 중앙 하단 어비스 배너 — 세븐 구성 그대로.
  - 사라진 정보 보존: **전투력→좌측 📊 버튼 라벨**, **초당 수입→우측 🎁 버튼 라벨**, 원탭 전체수령→🎁 onPress + 미수령 빨간점.
  - 스킬바: 채워지는 바 → **세븐식 남은 초 숫자 덮개** + 발동 시 금테. 1초 간격 setState(슬롯당 1/s = 6/s, 무시 가능).
- `app/screens/BattleView.js`: 유닛 크기를 세븐 환산치로 축소(foe 52→26 · front 46→28 · mid 34→24, HP바 34→26x3). **작은 유닛 여럿의 난전**이 세븐 그림이고, 크면 몇 마리로 화면이 막힘. **보스 1마리 신규**(상단 우측 56px + 60x5 굵은 HP바) = 무대 시각 중심. 좌표를 목업 그대로(적 y6~48% · 아군 y42~64%). 데미지 숫자도 새 배치에 맞춰 이동.
- `App.js`: 상단바 68→40px(padding·mailBtn 46→32), 하단 탭바 79→52px(아이콘22→18·라벨11→8·인디케이터3→2, 배경 #0a1018).
- `app/components.js`: `resbar`/`rescell`/`resIcon`/`resVal` 축소(ResourceBar 사용처는 App.js 단독).

**검증(실측)**: 테스트 284/0. 브라우저 390×844 DOM 실측 — topbar 40(4.7%) · stagebar 37(4.4%) · **field 664(78.7%)** · skillbar 51(6%) · menubar 52(6.2%). **세븐 78% 대비 78.7%로 일치.** 콘솔 에러 0. 배포 `?v=7`.

**미이행(세븐과 다른 점, 의도적)**
- 세븐 메뉴 7탭(인벤토리·캐릭터·성장·마을·도감·던전·PVP) vs 엘드리아 6탭(전투·원정·영웅·소환·콘텐츠·상점) — **실제 경로가 있는 탭만 유지**. 없는 탭을 만들면 눌러도 안 가는 가짜가 됨. 라벨 체계 교체는 별건.
- 세븐 상단 아바타(Lv+기사단장) 미구현 — 엘드리아에 대응 데이터(플레이어 레벨) 없음. 만들려면 신규 데이터부터.
- 좌우 플로팅 버튼은 🎁 외 **아직 연출**(경로 미연결) — HANDOFF 방침대로 레이아웃 우선.

### 데미지 숫자 누적 버그 수정 + 세븐 7탭 + 아바타 레벨 (Gim 지시 3건)

**1) 버그: 데미지 숫자가 계속 겹쳐 쌓이고 사라지지 않음**
- **진단(추측 아님)**: 브라우저에서 실측 — 데미지 텍스트 **88개**가 전부 `opacity:1`, 시작 위치(`top:197.78px`)에 얼어붙어 있었음. 애니메이션이 0에서 진행되지 않아 `Animated.timing(...).start(onDone)`의 **완료 콜백이 안 불렸고**, 제거를 그 콜백에만 의존해 영원히 남았음.
- **근본 원인**: 제거 트리거가 rAF(애니메이션 프레임)에 묶여 있었음. rAF가 멈추는 상황(백그라운드 탭·비표시·저사양 프레임드랍)에서 생성(setInterval)은 계속되고 제거만 멈춘다 → 단조 증가.
- **수정**: 제거를 **나이(Date.now) 기준**으로 전환. `pushFloat`가 만료분(`FLOAT_MS=1100ms`)을 걸러내고 `FLOAT_MAX=5`로 상한. 생성과 같은 시계(전투 setInterval)를 쓰므로 rAF와 무관하게 항상 사라진다. `FloatText`의 `onDone` prop과 `dropFloat` 제거.
- **검증**: 같은 pane(rAF 정지 = 버그 유발 조건 그대로)에서 재측정 — **6초간 1개 유지**(이전 88개, 증가 중).

**2) 세븐 7탭 메뉴바**
- `ALL_TABS` 교체: 🎒인벤토리 · 🦸캐릭터 · 📈성장 · 🏰마을 · 📖도감 · 🗡️던전 · ⚔️PVP (세븐 그대로, '마을'=메인 전투화면).
- **신규 화면 2개**: `app/screens/InventoryScreen.js`(state.inventory 목록·등급필터·일괄분해 autoSalvage), `app/screens/GrowthScreen.js`(GrowthPanel 래퍼 — GrowthPanel은 View만 반환해 스크롤 없음 → ScrollView 씌움).
- 기존 화면 승격: 도감=MetaScreen, PVP=ArenaGuildScreen. **둘 다 `embedded` 분기로 독립 ScrollView 모드를 이미 지원**해 수정 불필요(확인함).
- **고아 방지**: 탭에서 뺀 소환·일일/이벤트·상점은 `EXTRA` 라우트로 유지하고 **세븐식 ☰ 메뉴**(상단바)로 진입. 상점은 스테이지바 🛒(세븐 동일), 탐험 버튼은 던전으로 연결 — `onGo(tabKey)` prop을 IdleScreen에 전달.
- 라우팅: `ROUTES=[...TABS,...EXTRA]`로 해석. 알 수 없는 키 폴백을 `ROUTES[0]`(인벤토리)이 아니라 **'idle'(마을)** 로 지정.

**3) 상단 아바타(Lv + 칭호)**
- `system/core/player.mjs` 신규 — **파생 값**(저장 필드 신설 없음 = 세이브 마이그레이션 불필요, 진행도와 항상 일치). `playerLevel = floor(sqrt(peakStage)*2) + prestige*5 + 1`, 칭호 6구간(견습→모험가→기사→기사단장→영웅→전설).
- `system/test/player.test.mjs` 신규 4케이스(층 상승·환생 +5·손상값 방어·칭호 경계). **288 pass/0 fail**(284→288).
- App.js 상단바에 아바타(Lv 원형 뱃지 + 칭호) 추가.

**검증**: 288/0. 브라우저 390×844 실측 — **필드 664px 78.7% 유지**, 상단 `3 견습` + 재화 + 📬 + ☰, 하단 7탭 전부 렌더, 필드에 보스🗿+적무리+좌4/우3 버튼+어비스 배너. 콘솔 에러 0. 배포 `?v=8`.
- **미검증**: 새 탭 화면들의 실제 클릭 진입 — 브라우저 pane이 rAF 정지 상태라 RN 터치가 안 먹음(기존 기록된 pane 제약). 실기 확인 필요.

### 탭 내부 세븐식 재구성 + 연결해제 원칙 도입 (Gim 지시)

**⚠️ 최대 발견 — 기준으로 쓰던 `seven_real.html`이 실물과 다름**
구글플레이 실물 캡처(`com.netmarble.skiagb`, 6장 다운로드)와 대조한 결과, 재현 목업이 여러 곳 틀렸음.

| 항목 | seven_real.html(목업) | **실물 캡처** |
|---|---|---|
| 상단 재화바 | 4칸 | **없음**. 재화는 하단 전투력 바에 동거 |
| 상단 좌측 | 🛒 상점 | **아바타 카드**(초상+Lv.74+닉+경험치바+≪접기) |
| 스테이지 | 별도 줄 | **필드 위 오버레이**, 우상단 "스테이지 1/100" 세그먼트바 |
| 전투력 | 없음 | **스킬바 아래 전용 바** + 💎5303 + 🪙15.5G + ▲ |
| 스킬 슬롯 | 6칸 | **10칸**(방패 문장형, 슬롯마다 2줄 게이지) |
| 메뉴 7탭 | 균등 | **가운데(마을)가 크게 돌출**, 문장(crest) 모양 |
| 도감 | 독립 탭 | **캐릭터 탭의 서브탭** |
- 실물은 필드가 화면 ~90%. 전부 오버레이라 줄을 쌓지 않음.
- **Gim 결정: 전투화면은 지금(78%) 유지, 탭 내부부터.** 전투화면 실물 재교정은 보류 항목.
- 자료 위치: scratchpad `sk/sk1~6.png`(sk3=전투, sk2·sk6=캐릭터탭, sk5=PVP 결투장).

**확보한 실물 근거**
- **캐릭터 탭**(sk2): 상단 `전투력 369K | 💎62000 | 🪙1.43M` · `☑보유 영웅만 표시` + `[일괄 승급]` · 필터줄 `☰133/133 | ⊞ | 전체 | ↓☰` · **5열 그리드**(직업아이콘·Lv·초상·이름·★·0/4) · **하단 서브탭 4개 `영웅 관리|편성|펫|도감`**.
- **PVP**(sk5): 결투장 10v10, SKIP, 양팀 카드 2줄, 타이머 1:56.
- **공통 골격 확정** — 모든 탭이 `상단 전투력·재화 바 + 콘텐츠 + 하단 서브탭 줄`.

**조사(공개 자료, Gim 승인한 추정 경로)** — 세븐 키우기 던전/재화 구성
골드 던전 · 영웅 경험치 던전 · 펫 경험치 던전 · 기사단 증표 던전 · 유물 던전 · 무한의 탑 · 혼돈의 유적 · 보스 러쉬 · 토벌 의뢰 / 상점=일반·결투장 상점·잡화 상자 / 성장=영향력(스테이지 전용 능력치)·특성(증표)·유물·승급·레벨.

**구현**
- `app/screens/TabShell.js` 신규 — 세븐 공통 골격(전투력·재화 바 + 서브탭 줄). 실물 2장에서 확인된 패턴이라 게임 내 공통 템플릿은 정당(다른 게임과 공유하는 템플릿 아님).
- `app/screens/DungeonListScreen.js` 신규 — 무한의 탑 카드(원정 연결) + 재화 던전 5종 카드. **입장·보상 미연결이라 '준비 중' 명시**.
- App.js `SUBS` 구성 — 캐릭터(영웅관리·펫·성장·도감) / 인벤토리(장비·소환) / 던전(던전목록·원정) / PVP(결투장길드·임무이벤트). **서브탭 본문은 전부 기존 화면 재사용** → 기능 모듈 무손실.
- **바텀시트 제거**: 캐릭터 탭이 전투 위 시트로 뜨던 걸 실물처럼 전체화면+서브탭으로. `RosterSheet`는 **삭제하지 않고 미배선**(Gim 지시).
- ☰ 메뉴는 상점만 남음(소환·일일은 서브탭으로 승격).

**연결해제 원칙(Gim 지시) — `docs/DISCONNECTED.md` 신규**
삭제 금지·배선만 끊기·대장에 기록. 상태표기 🟢배선/🟡우회/🔴해제. feature 플래그(게임 on/off)와 화면 배선을 구분해 적음.

**검증**: 288/0. TabShell 경로가 기본탭('마을')에선 안 타므로 **임시로 기본탭을 'roster'로 바꿔 빌드해 실렌더 확인** — 전투력바(375·💎120·🪙137.0K)+서브탭줄(영웅관리·펫성장·도감)+본문 정상, 이후 원복 재빌드. 콘솔 에러 0. 배포 `?v=9`.

**남은 문제(다음 세션)**
1. **탭 줄 이중화** — RosterScreen 자체 내부탭(영웅·편성·성장·기록)과 새 서브탭 줄이 위아래로 겹침. 실물 세븐은 한 줄만 있음 → RosterScreen 내부탭을 서브탭으로 흡수해야 함.
2. **상단 재화바 중복** — 전역 상단바와 TabShell 전투력바가 재화를 둘 다 표시. 실물은 상단에 재화 없음.
3. 인벤토리·성장·상점 내부는 아직 세븐 구성 미반영(자료 없음, 추정 대기).
4. 던전 카드 입장·보상 미연결.

## [2026-07-25] 세로형 방치형 게임 GUI 조사 (Gim 지시)
- **방법**: 텍스트 공략은 GUI가 안 나옴 → 구글플레이 HTML 크롤 → `play-lh.googleusercontent.com/...=w1400` 스크린샷 직접 판독. 다수 장면은 **콘택트시트로 합쳐 1회 판독**(컨텍스트 절약).
- **화면방향 판별**: PIL로 원본 크기만 읽어 세로/가로 사전 선별(이미지 판독 없이 싸게). 단 **스토어 배너가 가로여도 게임은 세로**일 수 있음(버섯커 사례) — 배너 속 폰 프레임을 봐야 함.
- **세로 확정**: 세븐나이츠 키우기(skiagb) · 레전드 오브 슬라임(loadcomplete.slimeidle) · 버섯커 키우기(mxdzzkr.google) · AFK 아레나(lilithgame.hgame.gp.kr).
- **가로 → 제외**: 메이플 키우기(nexon.ma, 횡스크롤 액션) · 히어로 워즈(nexters.herowars) · **AFK 저니**(farlightgames.igame.gp, 7장 전부 가로 오픈월드).
- **AFK 아레나 = UI 자료 없음**: KR 플레이스토어 7장 전부 캐릭터 프로모 카드. iTunes lookup(1475474300)도 screenshotUrls 0. 실기 캡처 필요.
- 앱스토어 경로: `itunes.apple.com/lookup?id=<id>&country=kr` → screenshotUrls. 세븐나이츠(1658717149)만 5장 유효(1242x2208).

**게임별 고유 구조(공통 템플릿 아님 — [[ui-benchmark-mockups]] 교훈 준수)**
| 게임 | 메인화면 정체 | 성장 UI | 특징 |
|---|---|---|---|
| 세븐나이츠 키우기 | 전투 필드(~90%) | 목록형 5열 그리드+일괄승급 | HUD 전부 오버레이, 하단 전투력바에 재화, 스킬 10칸, 7탭 가운데 돌출, 도감=캐릭터 서브탭 |
| 레전드 오브 슬라임 | 전투 필드 + 중앙하단 대형 원형버튼 | **육각 노드 진화 트리**(잠금/해금/빨간점) | 상단 HUD 최소, ⏩배속·☰목록, Village Raid 타이머 콘텐츠, 수집=등급색 타일 그리드, 큰수 BB 표기 |
| 버섯커 키우기 | **마을 맵**(전투 아님) | **전직 트리(가계도 분기)** 6직업 | 상단 아바타+경험치바+재화, 장비=캐릭터 중심 원형 슬롯, 무한의 램프(자동 장비), 악룡의 도전(타이머 보스), 가문의 난투(서버간), 미니게임 |
| AFK 아레나 | ❓ | ❓ | UI 증거 없음 |

- 자료: scratchpad `top10/<패키지>/` + 콘택트시트 `sh_*.png` `ov_beoseot.png`.

## [2026-07-25] ⚠️ 벤치마크 기준 교체 — 세븐나이츠 키우기 → 호드워
- **Gim 결정**: 새 기준 =「호드워: 어벤저의 소환」. 근거자료 = **Gim 실기 캡처 24장** `G:\내 드라이브\인앱트리\Screenshot_20260725_*.jpg`, 원본 **1080×2520**(Gim 폰 = 우리 목표 해상도와 정확히 일치. 세븐 자료는 스토어 홍보물·재현목업이라 품질이 낮았음).
- **명세 신설: `docs/HORDWAR_SPEC.md`** — 골격·상단바·6탭 메뉴·전투 구조·적용 우선순위 7항목.
- 세븐 자료는 폐기 아님, **참고자료로 강등**(연결해제 원칙 준용). HANDOFF 머리말 교체.

**호드워 실측 요약**
- 상단바: 좌=초상(녹색프레임)+닉+★Lv뱃지+경험치바 / 우=재화 **세로 2줄 스택**, 줄마다 **[＋] 구매 버튼**(과금 동선).
- 하단 **6탭**: 요새·필드🔒·길드🔒·영웅❗·혜택🔒·모험❗. 선택탭은 **칸 배경 전체 금색**. **잠긴 탭을 숨기지 않고 자물쇠로 노출** ← 엘드리아의 `isOn` 숨김 정책과 정반대(정책 반전 필요, Gim 확인 대상). '모험'만 넓고 다른 모양=주 진행 버튼.
- 전투: **좌우 대치 진형**(아군 좌3열/적 우3열), 상단 **VS 바**(아군 진영명 적색 ⚔ 적 스테이지 청색), 유닛=속성아이콘+레벨뱃지+분홍 타원 그림자, **양팀 전투력 비교** ⚔12.48k vs ⚔10.31k, 배속×2·⏸.
- 편성: 등급 원형뱃지(S+/S/A)+속성+✅+레벨 카드줄, **속성 필터바**(⌃·ALL금색·속성4), 하단 `일괄 진형 배치`·**`전투`(금색 대형)**.
- 그 외: 요새맵·영웅그리드·장비/유물 인벤·속성보너스·캐릭터상세·일일임무·소환10연·VICTORY·BOSS COMING·월드맵 계약노드.

**⚠️ 충돌 지점(구현 전 Gim 판단 필요)**
호드워는 **편성 화면에서 `전투` 버튼**을 눌러야 전투 시작. 엘드리아는 방치형이라 **상시 자동 전투**가 정체성. 그대로 옮기면 방치형이 아니게 됨.
→ 권장안: 전투는 상시 자동 유지, **편성 화면만** 호드워식(필터·일괄배치·전투력 비교)으로.

**주의**: 전투화면 레이아웃은 이번이 **4번째 기준 변경**(A안제거→3:2패널→세븐78%→호드워). 코드 갈아엎기 전 명세·실기캡처 대조 필수.

## [2026-07-25] 호드워 적용 1·2번 구현 완료 (`?v=8`)

### 1번 — 양팀 전투력 비교 (난이도 낮음) ✅
- **문제**: 명세는 "`resolve()`에 이미 양쪽 값 있음"이라 했지만 실제로는 `partyPower`(=rawDPS)만 반환하고 **적 쪽 값은 없었다.** 게다가 rawDPS는 파티 인원수만큼 누적되는 값이라 스칼라 적(`challenge.atk`)과 나란히 놓으면 스케일이 안 맞는다.
- **해결**: `resolve()`에 **승리조건과 수학적으로 동치인** 비교 지표 2개를 추가(`system/core/resolution.mjs`).
  - `win ⟺ hp/partyEffDPS ≤ partyHPeff/enemyEffDPS ⟺ hp·enemyEffDPS ≤ partyHPeff·partyEffDPS`
  - `score = √(partyHPeff × partyEffDPS)` · `enemyScore = √(challenge.hp × enemyEffDPS)`
  - 제곱근은 자릿수 축소용 **단조 변환**이라 대소 관계 불변 → **숫자가 큰 쪽이 반드시 이긴다.** (그냥 dps만 비교하면 "전투력이 높은데 지는" 모순이 생김.)
  - 기존 `partyPower`는 테스트 4곳이 쓰고 있어 **건드리지 않고 추가만** 했다.
- **화면**(`app/screens/IdleScreen.js`): 필드 상단에 `⚔ 아군(금색) VS 적(적색) ⚔` 오버레이 바 추가. 절대배치라 세븐식 세로 배분(필드 78%)에 영향 없음.
- 좌측 📊 버튼(전투력 숨어있던 자리) 제거 → 정보가 VS 바로 이동. `effectivePower` import도 미사용이 되어 정리.
- **검증**: `system/test/vspower.test.mjs` 신설 — Lv1/20/60 파티 × 1~200층을 훑어 `score ≥ enemyScore`가 `win`과 **항상 일치**하는지 + 빈 파티 NaN 방지.

### 2번 — 속성 필터 바 (난이도 낮음) ✅ + ⚠️ 전제 수정
- **발견한 전제 오류**: 명세 2번은 "속성·편성 이미 있음"이라 했으나 **실제로는 둘 다 아니었다.**
  1. `system/concepts/fantasy.mjs` 캐릭터 도감 **21종 전원 `element` 값 없음**(`element:` 0개).
  2. `system/core/features.mjs`의 `elements` 플래그가 **`false`**(꺼짐) → 상성 배수 항상 1.
  - 그대로 만들었으면 **어느 속성 칩을 눌러도 영웅 0명**이 나오는 죽은 UI가 됐다.
- **Gim 결정(선택박스)**: "속성 필터 + 도감에 속성 배정" — 원안 유지, 데이터를 채우는 쪽.
- **한 일**
  1. `fantasy.mjs` 도감 21종에 `element` 배정 — **불4·물4·숲4·빛4·어둠5**로 고르게(어느 속성 구역에서도 쓸 카드가 남도록).
     - 빛: 기사·팔라딘·황금기사·곰인형 / 불: 바바리안·대전사·광랑·기공사 / 숲: 늑대인간·드루이드·도적·궁수 / 물: 암살자·해골도적·괴이곰·해골법사 / 어둠: 해골골렘·해골전사·해골졸개·흑마법사·강령술사
  2. `features.mjs` → `elements: true`.
  3. **기존 세이브 백필**(`app/useGame.js` `normalizeRoster`) — 속성 도입 전 유닛은 `element: null`이라 전투 상성이 안 걸린다. 이미 있던 로스터 재매핑 훅에 한 줄 붙여 도감 값으로 채움. (`identity()`는 도감에서 읽으므로 표시·필터는 백필 없이도 동작하지만, `toCombatProfile`은 `unit.element`를 읽으므로 필요.)
  4. `app/screens/RosterScreen.js` 영웅 그리드 위에 **ALL 알약 + 속성 원형 칩 5개** 필터 바. `isOn('elements')` 가드. 같은 칩 재탭=해제. 결과 0명이면 안내문.
- **이미 있어서 안 만든 것**: 명세의 "일괄 진형 배치" = 편성 탭의 **`🪄 위치 재배치`**(`autoFormation`) 버튼. 신규 개발 불필요.
- **필터를 편성 탭이 아니라 영웅 탭에 둔 이유**: 엘드리아는 파티 편입이 **영웅 그리드 → 상세카드 `편성` 버튼**으로 이뤄진다. 편성 탭에는 걸러낼 영웅 목록 자체가 없다(파티 슬롯·진형·프리셋만).
- **밸런스 영향(주의)**: `elements: true`로 켰으므로 이제 속성 상성 배수(유리 1.3 / 불리 0.8)가 실전투에 적용된다. 층 진행 속도가 편성에 따라 ±30% 흔들린다. Gim이 옵션에서 이 영향을 알고 선택함.
- **테스트 수정**: `system/test/features.test.mjs`가 "기본값 속성 off"를 단언하고 있어 새 기본값(on)에 맞춰 갱신. off 테스트는 try/finally로 on 복구(같은 파일 뒤 테스트 오염 방지).

### 결과
- `node --test system/test/*.test.mjs` → **291개 중 290 통과 · 0 실패**(1 skip은 기존).
- 빌드·배포: `docs/play.html`(34MB) 재빌드 → gh-pages push. 폰 링크 **https://gimaxax77-sys.github.io/axdata_01/?v=8**
- **미커밋**: 작업 트리에 이전 세션 WIP(App.js·BattleView.js·theme.js·components.js·신규 화면 5개)가 섞여 있어 커밋하지 않음. 커밋 시 무관한 변경이 함께 들어감 — Gim 확인 후 분리 커밋 필요.

### 다음(명세 우선순위)
- 3번 잠긴 탭 노출 — **정책 반전이라 Gim 확인 필요**(현재 `isOn`으로 숨김 → 자물쇠 노출).
- 4번 상단바 재편(초상+닉+★Lv+경험치바 / 재화 세로2줄+＋) · 5번 하단 6탭.

## [2026-07-25] 호드워 인터페이스 전환 — 옵션 모듈 18종 파킹 + 6탭 골격 (`?v=9`)

**Gim 지시**: "호드워와 동일하게 맞춰서 수정하고, 현재의 기존 on/off 기능 모듈들은 아예 전체 연계 끊어서 별도로 보관. 우선은 호드워 인터페이스 구축이 최우선. 다음은 필요한 부분 다듬고, 수정될수있도록."

**해석 확정(선택박스)**: "옵션 모듈 20종 전부 파킹 (백지에서 시작)". 나머지 후보였던 (b)on/off 장치만 파킹, (c)꺼진 것만 파킹은 기각.

### 파킹 — 18종(20종 중 2종 예외)
- `features.mjs` 플래그 18개 → `false`. 파일은 삭제하지 않음(테스트 291개가 붙어 있음).
- **예외 2종 `elements`·`rarity`는 켜둠.** 이유: 호드워 UI **자체의 구성요소**임. 편성 화면의 속성 필터 바·유닛 속성 아이콘(elements), 편성 카드의 등급 원형 뱃지 S+/S/A(rarity). 이걸 끄면 "호드워와 동일하게"와 정면 충돌하고, 직전에 배정한 속성 데이터도 사장됨.
- 화면 14개를 `app/screens/` → **`app/parked/`로 실제 이동**. 상대 경로 깊이가 같아 되돌리면 import가 그대로 동작.
  - GachaScreen · ContentScreen · ShopScreen · ArenaGuildScreen · RunScreen · DungeonListScreen · GrowthScreen · GrowthPanel · InventoryScreen · RosterScreen · RosterPickerModal · rosterShared · MetaScreen · TabShell
  - App.js에 죽은 채 남아 있던 `RosterSheet`(이미 미배선)도 떼어 `app/parked/RosterSheet.js`로.
- **대장 신설 `docs/PARKED.md`** — 무엇을 왜 껐는지 + 되살리는 4단계.
- 효과: 번들 612모듈 / play.html **34MB → 24.5MB**.

### 신규 화면 2개(코어만 사용)
- `app/screens/HeroScreen.js` — 호드워 편성 화면. VS 전투력 바 · ⌃접기+ALL+속성 원형칩 필터 · 등급 원형 뱃지(S+/S/A/B/C)+속성+✅+`n레벨` 카드 그리드 · 상세(스탯·편성·레벨업·돌파) · 진형(전열2·중열3·후열2) · 하단 액션 바(자동편성 · 일괄 진형 배치 · **전투**(금색 대형)).
- `app/screens/AdventureScreen.js` — 모험(스토리 캠페인). BOSS COMING 카드 + 챕터 12개 목록(잠긴 챕터는 `???`+🔒) + 정주행.
- 구 RosterScreen(64KB)은 장비·룬·코스튬·전용무기·친밀도가 얽혀 있어 **수술 대신 대체**가 더 작은 작업이었음.

### 호드워 골격 적용(명세 3·4·5·6번)
- **4번 상단바** — 좌: 초상(녹색 테두리)+칭호+★Lv 뱃지+경험치바 / 우: 재화 **세로 2줄**(💎·🪙) 각 줄에 **[＋]**. 닉네임 데이터가 없어 칭호를 닉네임 자리에 씀. 경험치바 = `sqrt(peakStage)*2`의 소수부(저장 필드 신설 없음).
- **5번 하단 6탭** — 요새🏰 · 필드🌄🔒 · 길드🏛️🔒 · 영웅🦸❗ · 혜택🎁🔒 · 모험⚔️❗(**flex 1.7 넓은 주버튼**). 선택 탭은 **칸 배경 전체 금색**(세븐의 얇은 인디케이터 폐기).
- **3번 잠긴 탭 노출** — `isOn`으로 숨기던 정책을 **반전**. 화면 없는 탭도 자물쇠째 노출하고, 누르면 안내 토스트. 재화 ＋도 같은 토스트 재사용.
- **6번 전투 좌우 대치** — BattleView 전면 교체. 아군 좌 3열(후열→중열→전열)·적 우 3열이 마주 봄(`row-reverse`). 유닛 = 속성 아이콘 + **레벨 뱃지** + **발밑 분홍 타원 그림자**(호드워 고유) + HP바. 러지는 가로(적 방향), 다음 웨이브는 오른쪽 밖에서 슬라이드인. 구 세로 산개 `Wander` 난전 제거.
- **7번(편성→전투 진입)은 넣지 않음** — 방치형 정체성이 사라짐. 명세도 "Gim 판단 필요"로 분류. 대신 편성 화면 `전투` 버튼은 요새 탭으로 이동시킴.

### 발견·수정한 버그 — 데미지 숫자 무한 누적 (기존 버그)
- 스모크 테스트 중 전투 필드의 플로팅 데미지 숫자가 **180개+까지 무한히 쌓이는 것**을 발견. DOM 노드가 초당 ~2개씩 증가.
- **내 변경이 만든 게 아님을 확인** — 배포돼 있던 v8(구 BattleView)에서도 동일 재현(21개 누적). 즉 이전부터 있던 버그.
- 원인: 정리(`filter`+`slice`)를 **"새 숫자를 밀어넣을 때"에만** 돌렸음. 푸시가 끊기거나 rAF가 멈춰 렌더 커밋이 밀리는 환경(백그라운드 탭 등)에서 상한이 실효되지 않음. 애니메이션도 얼어 opacity 1로 남음.
- 수정: 순수 함수 `pruneFloats(list, now)`를 **`system/core/battleFloats.mjs`로 분리**(JSX 파일은 node로 테스트 불가라 코어에 둠, 의존 방향 화면→코어 유지). ① **전투 틱마다** 정리(푸시와 무관) ② 렌더에서도 `slice(-FLOAT_MAX)` 상한.
- 검증: `system/test/battlefloat.test.mjs` 3케이스(수명 만료·상한·**푸시 없이 틱만 돌아도 비워짐**). 실측 재확인 — 180+ → **1~2개 유지**.

### 검증
- `node --test system/test/*.test.mjs` → **294개 전부 통과 · 0 실패**.
- 로컬 스모크(브라우저 페인): 요새·영웅·모험 3화면 모두 정상 렌더 확인. 6탭 자물쇠 라벨(`필드 잠김 — …`) 접근성 라벨까지 확인.
- ⚠️ **탭 조작(터치 핸들러)은 이 환경에서 검증 못 함** — 브라우저 페인이 컴포지팅을 안 해 스크린샷·rAF가 멈추고, 합성 이벤트가 react-native-web의 responder 체계를 타지 않음. 오프라인 보상 팝업의 `받기`가 안 닫히는 것도 이 한계 때문인지 실제 버그인지 구분 불가. **Gim이 폰에서 확인 필요.**
- 배포: `?v=9` → https://gimaxax77-sys.github.io/axdata_01/?v=9

### 다음
- 폰 확인 후 "필요한 부분 다듬기" — 호드워 24장 캡처와 대조해 간격·색·크기 보정.
- 7번(편성→전투 진입) 여부 Gim 판단.
- 되살릴 모듈 선별(소환 없이는 영웅 수급이 없음 — `gacha`가 1순위 후보).

## [2026-07-25] 전제 정정 — 구축 단계엔 6탭 전부 개통 (`?v=10`)

**Gim 지시**: "현재는 구축하는 단계이니 모든 메뉴 탭 전부 살려놓은 상태로 설계하고, 자물쇠로 채우는건 출시전 최종 단계에서 하면 됨. 목표 1=인터페이스 온전히 동일, 2=탭별 기능 분석해서 개발 혹은 기존 모듈 연결."

### 내가 잘못 이해했던 것
- **명세 3번(잠긴 탭 자물쇠 노출)을 "지금 구현할 일"로 받았음.** 그건 **출시 시점의 표현 방식**이지 구축 단계의 상태가 아니었다. 필드·길드·혜택 3탭을 화면 없이 `lock` 문구만 달아 막아버렸다 → **전부 개통으로 정정.**
- `docs/PARKED.md`도 자물쇠를 최종 상태처럼 써놨음 → **"구축 중엔 전부 열고 출시 직전에 잠근다"** 정책으로 갱신.
- **모듈 파킹 자체는 유지**가 맞다고 판단. Gim의 2순위("탭별 기능 분석 → 개발 혹은 기존 모듈 연결")가 끊긴 상태를 전제로 한 말씀이라, 파킹=백지 / 탭별 연결=채우기로 방향이 일치.

### 점검에서 새로 드러난 사실
- **필드·길드·혜택은 호드워 실기 캡처에서도 잠겨 있었다**(명세 하단 메뉴바 표에 🔒로 기록됨). 즉 "온전히 동일하게" 만들려 해도 **베낄 화면 자체가 없다.** → Gim 결정: **"빈 골격만 놓고 나중에"**.
- **요새 탭 해석 충돌** — 호드워 요새는 **요새 맵**(24장 목록 첫 항목), 나는 방치 전투를 넣었음. → Gim 결정: **"지금대로 방치 전투 유지"**. 7번(편성→전투 진입)과 한 몸인 문제라 함께 보류.
- **IdleScreen이 아직 78% 세븐 골격**이었음 — 좌측 AUTO·🎥·💬, 하단 스킬바 6칸, 필드 격자·기둥 장식. 호드워엔 없는 것들.

### 이번에 한 일
1. **6탭 전부 개통** — `app/screens/StubScreen.js` 신설(빈 골격: 아이콘·제목·"들어올 예정" 목록). 필드·길드·혜택이 여기로 들어간다. `TABS`에서 `lock` 제거, `stub` 데이터를 route에 실어 App이 prop으로 전달. 잠금 토스트(`lockMsg`)는 재화 `＋`가 아직 쓰므로 유지.
2. **전투 화면 세븐 잔재 제거** — `FieldGrid`(격자)·`PILLARS`(기둥)·`SkillSlot`+스킬바 6칸·좌측 세로버튼 3개 전부 삭제. 딸린 스타일 25개도 정리.
3. **호드워 VS 바 완성형** — `★ | 아군 진영명(적색 칩) | ⚔ | 적 스테이지(청색 칩) | ★` 2줄 구성. 아랫줄은 `⚔전투력(금) — 진행바 — 전투력(적)⚔`.
4. **배속 ×2 · ⏸ 일시정지 신규** — 필드 우상단. **연출만이 아니라 실제 동작**: BattleView가 `speed`로 틱 간격을 `150/speed`로 줄이고, `paused`면 인터벌을 안 건다(+정지 시 잔여 데미지 숫자 비움).

### 검증
- `node --test system/test/*.test.mjs` → **294개 전부 통과**.
- 로컬 스모크: **6탭 전부 진입 확인**(필드·길드·혜택이 빈 골격 화면을 정상 표시). 요새 화면 `★ 원정대 ⚔ 🔥불 1층 ★` / `×1 ⏸` 확인. 접근성 라벨에 "잠김"이 사라진 것도 확인.
- ⚠️ 중간에 로컬 서버가 죽어(exit 127) 브라우저가 **캐시된 옛 페이지**를 보여줘 "빌드가 안 됐다"고 오판할 뻔했음. `curl`로 서버 200 + 번들 해시를 먼저 확인하는 절차를 쓸 것.
- 배포: `?v=10` → https://gimaxax77-sys.github.io/axdata_01/?v=10

### 남은 "인터페이스 온전히 동일" 미달 항목
VICTORY 팝업 · 이벤트 팝업 · 캐릭터 상세 전신 이미지 · 장비/유물 인벤토리 · 속성 보너스 화면 · 일일 임무 목록 · 소환 10연 연출 · 월드맵 계약 노드 · 상단 실제 초상화(현재 🧝 이모지) · 닉네임(데이터 없어 칭호로 대체 중)

## [2026-07-26] 데미지 숫자 겹침·잔류 — 목록 → 고정 슬롯으로 재설계 (`?v=11`)

**Gim 제보(실기 스크린샷)**: 전투 필드 오른쪽에 데미지 숫자 14개가 세로 한 줄로 포개진 채 사라지지 않음.

### 원인 두 가지
1. **겹침** — 좌우 대치로 BattleView를 갈아엎으면서 **가로 분산(`dx`)을 빠뜨렸다.** 적 쪽 숫자를 전부 `right: 18%` 한 자리에 띄우고 세로(`dy`)만 흔들어, 한 열에 쌓여 보였다.
2. **잔류** — 어제 넣은 상한(`pruneFloats` + 렌더 `slice(-5)`)이 **실기에서 안 먹었다.** 렌더에서 5개로 자르는데도 14개가 살아 있었다. 즉 **"리스트 길이를 줄이면 DOM도 줄어든다"는 전제가 실제 기기에서 성립하지 않는다.** (원인을 더 파는 대신 전제를 없애는 쪽을 택함.)

### 수정 — 배열 길이를 구조적으로 못 늘리게
- `system/core/battleFloats.mjs` 재작성: `pruneFloats`(목록형) 폐기 → **슬롯 5칸 고정** API.
  - `emptySlots()` · `nextSlot(idx)` · `writeSlot(slots, idx, float)` · `expireSlots(slots, now)`
  - 라운드로빈으로 덮어쓰므로 배열 길이가 **항상 5**. 몇 개가 쌓이는 상황 자체가 불가능.
  - `expireSlots`는 바뀐 게 없으면 **같은 참조**를 돌려줘 헛 리렌더를 막는다.
- `FloatText`의 key를 **칸 번호(0~4)** 로 고정 → 마운트/언마운트가 없다. 덮어쓰면 `tok` 변경 → `useEffect([tok])`이 애니메이션을 처음부터 재생.
- **칸별 고정 오프셋 `SLOT_OFFSET`** 5종(가로 6·20·12·27·2 / 세로 0·-7·8·4·-12) → 같은 자리에 포개지지 않는다.
- ⏸ 정지 시 `emptySlots()`로 비우기 유지.

### 검증
- `system/test/battlefloat.test.mjs` 재작성 4케이스 — **200번 밀어넣어도 칸 수 5 고정**(누적 버그 재현) · 라운드로빈으로 오래된 것이 밀려남 · 푸시 없이 틱만 돌아도 비워짐 · 무변경 시 동일 참조.
- `node --test system/test/*.test.mjs` → **295개 전부 통과**.
- 로컬 스모크: 필드 숫자 개수 0~2 유지(증가 없음). 이후 브라우저 페인이 멈춰 가로 분산 실측은 못 함 — **폰에서 최종 확인 필요.**

### 절차 교훈 (두 번 당함)
- 로컬 정적 서버(`python -m http.server`/`npx serve`)가 **dist를 잠가 `expo export`가 EBUSY로 실패**한다. 그런데 `build-play.mjs`는 옛 dist로 조용히 성공해 **옛 내용이 배포될 뻔했다.**
- 앞으로: ① 빌드 전 서버 종료 → ② `expo export` 출력에서 **번들 해시 변경 확인** → ③ `grep`로 새 코드 문자열이 play.html에 들어갔는지 확인 → ④ 배포. 이번엔 `grep -c expireSlots docs/play.html` = 2로 확인 후 올림.

## [2026-07-26] 전체 재점검 → 순서대로 수정 (`?v=12`)

**Gim 지시**: "현재 코드 전체 깊이있게 재점검 하고 내용 정리해서 브리핑" → 브리핑 후 "순서대로 정리하고 진행해".

### 재점검 결과 (요약)
구조는 건강. 활성 화면 11 / 파킹 15, **활성 코드의 파킹 모듈 import 0건**, core 배럴 미참조(파킹 코어가 번들에 안 들어감), 미사용 스타일 1개뿐.

### 1단계 — 실제 버그 3건 수정
| 버그 | 원인 | 수정 |
|---|---|---|
| 돌파 비용이 항상 `돌파 0` | `ascendCost()`는 `{summon}`을 반환하는데 HeroScreen이 `.growth`를 읽음 | `asc.summon` + 소환석 이모지. 실측 `돌파 🔮80` 확인 |
| 레벨업해도 전투 화면 레벨 뱃지가 안 바뀜 | `heroFormation` 메모 키에 레벨이 없었음. 슬롯이 `u.level`을 **숫자로 복사**해 담으므로 편성이 바뀌기 전까지 옛 값 유지 | formKey를 `uid:level` 조합으로 변경 |
| 초상화 경로에 컨셉 하드코딩 | `charImage('fantasy', …)` — sci-fi 컨셉이 실제 존재 | `concept.id` 사용. 단 `HeroCard`는 `concept`을 안 받으므로 **부모가 이미지를 계산해 `img` prop으로 전달**(그대로 `concept.id`를 쓰면 ReferenceError) |

### 2단계 — 온보딩 정리
- 첫 실행 소개가 **불가능한 일을 약속**하고 있었음 — "스테이지 8에서 소환이 열립니다", "환생으로 영구 배수를". 둘 다 파킹으로 경로 없음. → 진형·모험 안내로 교체하고 "지금 되는 것만 약속한다"를 주석으로 못박음.
- `ObjectiveBanner` — 아무도 렌더하지 않는 죽은 코드인데다 목적지가 `roster/gacha/content` 등 **없는 옛 탭 이름**. → `app/parked/ObjectiveBanner.js`로 파킹(되살릴 때 tutorial.mjs의 tab 값과 App.js TABS 키를 맞추라는 주석 포함).

### 3단계 — 파킹 부작용으로 끊겼던 경로 복구
**둘 다 파킹 대상이 아니었는데 화면이 같이 날아가면서 경로만 사라진 것.** 내가 놓친 부분.
- **난이도 선택** — `difficulty.mjs`는 코어인데 이를 띄우던 ContentScreen이 파킹돼 영원히 '일반' 고정이었음(험난 ×8 · 지옥 ×40 · 나락 ×200 보상 배수가 전부 사장). → 요새 화면 전투력 줄 아래에 4단계 선택 줄 신설. 잠긴 것은 흐리게 + 필요 층수 표시. 진행바 텍스트의 난이도 중복 제거.
- **일일 미션 기록** — `recordMission` 호출부가 전부 파킹 화면(RosterScreen·GachaScreen)에 있어 미션이 절대 완료되지 않았음. → HeroScreen 레벨업·돌파 성공 시 `recordMission(state,'upgrade',1)`.

### 4단계 — 커밋 정리 (3개로 분리)
1. `617dcc0` chore: 이전 세션 WIP(지침서 12원칙, 세븐식 테마, FixedStage, 기준 문서)
2. `b3de1c4` feat(core): 양팀 전투력 비교 + 속성 배정 + 데미지 숫자 고정 슬롯
3. `665df5b` refactor(ui): 옵션 모듈 18종 파킹 + 호드워 6탭 골격 + 재점검 반영
- 브랜치 `claude/3d-poc`. **push는 안 함** — 필요하면 지시 주시면 올림.

### 잔재 정리
미사용 import 제거(HeroScreen `pctW`, AdventureScreen `fmt`, BattleView `FLOAT_SLOTS`), 미사용 스타일 제거(App.js `menuRowDot`).

### 아직 남은 것 (경로 없는 코어 기능)
- **소환** — 영웅이 1명에서 안 늘어남. 되살릴 1순위.
- **환생(prestige)** — `accountMods.powerMult`가 영원히 ×1.
- **본진(village)** · **도감·업적·시즌(meta)** — 코어는 살아 있고 화면만 없음.

### 지침서 보완
`D:\.CODE\AXdata\CLAUDE.md`(루트)에 **"답변·기록 규칙"** 섹션이 누락돼 있어 추가함(엘드리아 하위 CLAUDE.md에는 이미 있었음).

### 검증
- `node --test system/test/*.test.mjs` → **295개 전부 통과**.
- 로컬 스모크: 난이도 4단계 접근성 라벨 확인(`험난 난이도 잠김 · 30층 필요`), `돌파 🔮80` 확인.
- 배포 절차 준수 — 서버 종료 → 번들 해시 변경 확인(`afb1993a…`) → play.html에 새 코드 문자열 확인 → 배포.
- 배포: `?v=12` → https://gimaxax77-sys.github.io/axdata_01/?v=12

## [2026-07-26] 지침서 보완 — "점검·검토·조사·설계는 상세 보고서로" (규칙 3 신설)

**Gim 지시**: "점검, 검토, 조사, 설계 등과 같은 작업시에는 어떻게 동작하는지 깊이있게, 아주 상세하게 이해하고 모든 세부사항을 파악해서 research.md 상세 보고서를 작성해라."

### 한 일
`답변·기록 규칙`에 **3번 항목**을 신설. 코드를 바꾸지 않는 작업(점검·검토·조사·리뷰·분석·설계·타당성 확인)일수록 더 깊이 파고들고 `research.md`에 **상세 보고서**를 남긴다. 실행 지침을 함께 못박음.
- **추측 금지** — 실제 파일·호출 경로·실행 결과로 확인한 것만 사실로. 확인 수단(`파일:줄`, 명령, 실측치) 병기.
- **끝까지 따라가기** — 진입점 → 데이터 흐름 → 경계 조건 → 실패 경로. 증상 하나를 보면 같은 원인을 공유하는 다른 자리도 함께 확인.
- **보고서 필수 6항목** — ① 무엇을 왜 ② 방법과 근거 ③ 발견(문제·정상 확인 둘 다) ④ **확인 못한 것과 이유** ⑤ 영향·위험 ⑥ 권고·우선순위.
- **모르는 것은 모른다고** — 검증한 것과 추정한 것을 섞지 않는다.
- 채팅은 요약·결론, 전문은 `research.md`.

### 적용 범위 — 지침서 두 곳을 함께 고침
`답변·기록 규칙` 섹션이 **루트(`D:\.CODE\AXdata\CLAUDE.md`)와 하위(`axdata_01_엘드리아\CLAUDE.md`) 양쪽에 중복 존재**한다. 한쪽만 고치면 다음 세션이 갈라진 규칙을 읽게 되므로 **둘 다 동일하게 보완**했다.
→ 앞으로 이 섹션을 손댈 때는 **항상 두 파일을 함께** 고칠 것. (중복 자체를 없애려면 하위 문서에서 섹션을 지우고 루트만 남기는 게 맞지만, 하위 문서를 단독으로 읽는 경우가 있어 이번엔 동기화 유지를 택함.)

### 남은 숙제
직전 [2026-07-26] 전체 재점검 기록은 **변경 이력 형식**으로 적혀 있어 새 규칙 3의 보고서 6항목(특히 ②조사 방법·근거, ④확인 못한 것)을 완전히 만족하지 않는다. 새 기준에 맞춰 보강할지는 Gim 판단 대기.

## [2026-07-26] 지침서 보완 2차 — 승인 게이트 · 모듈화 · 불명확 시 이해 확인

**Gim 지시(3건)**
1. 많은 부분을 수정해야 한다면 반드시 내용 정리해서 물어보고 의사결정 받고 진행할 것.
2. 하나의 파일에 코드를 다 넣지 말고 기능별로 모듈화할 것.
3. 요청이 명확하지 않을 때 추론·실행하지 말고, 먼저 이해가 맞는지 말할 것.

### 배치 결정
성격에 맞는 섹션에 나눠 넣었다(한 곳에 몰면 나중에 안 읽힘).
| 지시 | 들어간 곳 |
|---|---|
| 3번 (불명확 시 이해 확인) | **소통 규칙** — 루트 8번 / 엘드리아 7번 |
| 1번 (큰 수정 승인 게이트) | **작업 방식 13번** |
| 2번 (기능별 모듈화) | **작업 방식 14번** |
- 섹션 제목 `실수 줄이기 12원칙` → **`14원칙`** (양쪽 파일).

### "많은 부분"을 숫자로 못박음
기준 없는 규칙은 지켜지지 않으므로, 기존 12번 규칙과 같은 방식으로 **판정 조건**을 붙였다.
> 하나라도 해당하면 승인 게이트 — 파일 3개 이상 수정 · 파일 이동/삭제/대체 · **기존 동작이 바뀜** · 되돌리기 어려움(배포·마이그레이션·대량 리팩터) · 공개된 곳에 나감.
> 물을 때 담을 것 — 무엇을 왜 · 범위(파일 목록) · 바뀌는 동작 · **되돌리는 법** · 더 작은 대안.
> 제외 — 이미 승인받은 계획의 실행, 오탈자·한 줄 수정, 조사·읽기.

모듈화도 마찬가지로 **쪼갤 신호**를 명시 — 한 파일 300~400줄 초과 · 무관한 기능이 섞임 · 같은 조각을 두 곳 이상에서 사용. 다만 원칙 2(단순함 우선)와 충돌하지 않게 **"쪼개기 위한 쪼개기 금지"** 를 함께 적었다.

### 실제 사례를 규칙에 박아둠
엘드리아 지침서 14번에 각주로: 구 `RosterScreen.js`가 **64KB**(장비·룬·코스튬·전용무기·친밀도·편성·진형을 한 파일에)까지 커져 **모듈 하나만 떼는 게 불가능**했고, 결국 통째로 파킹하고 새로 쓸 수밖에 없었다. 이번 세션에서 실제로 겪은 비용이라 근거로 남긴다.

### 두 지침서를 함께 고침
`소통 규칙`·`작업 방식`·`답변·기록 규칙` 세 섹션이 루트(`D:\.CODE\AXdata\CLAUDE.md`)와 하위(`axdata_01_엘드리아\CLAUDE.md`)에 **중복 존재**한다. 한쪽만 고치면 다음 세션이 갈라진 규칙을 읽으므로 항상 양쪽을 같이 고친다.

### 새 규칙 14 기준 — 현재 활성 소스 점검 (300줄 초과)
| 파일 | 줄수 | 판단 |
|---|---|---|
| `system/core/gear.mjs` | 420 | **파킹된 모듈**이라 당장 문제 아님 |
| `App.js` | 419 | 라우팅 + 상단바 + 5개 모달을 함께 안고 있음 — **분리 후보 1순위** |
| `app/components.js` | 377 | 공용 UI 모음이라 성격상 허용 범위. 계속 커지면 분리 |
| `app/useGame.js` | 357 | 세이브·틱·클라우드·오프라인이 한곳 — **분리 후보 2순위** |
| `app/screens/BattleView.js` | 312 | 경계선. 당장은 유지 |
→ 즉시 손대지 않는다. **규칙 13(승인 게이트)에 걸리는 규모**이므로 Gim 결정을 받은 뒤 진행한다.

## [2026-07-26] 점검 보고서 — AXdata 하위 전체 CLAUDE.md 지침서 일관성

> 새 규칙 `답변·기록 3번(점검·검토·조사·설계는 상세 보고서로)`을 처음 적용한 보고서.

### ① 무엇을 왜 점검했는가
**Gim 지시**: "D:\.CODE\AXdata 경로 하위 전체 작업폴더의 CLAUDE.md 파일들도 내용 확인하고 점검해서 오늘 추가한 사항들과 기존 내용 누락 부분 없는지 점검해줘."
오늘 지침서를 두 곳(루트·엘드리아)만 고쳤기 때문에, 나머지 프로젝트가 옛 규칙을 읽고 있을 위험을 확인하는 것이 목적.

### ② 조사 방법과 근거
1. `find . -iname "claude*.md"` (node_modules·.git 제외) → **11개** 발견.
2. `grep -n "^#\{1,3\} "` 로 각 문서의 섹션 구조 추출.
3. `awk`로 `소통 규칙`·`작업 방식`·`답변·기록 규칙` 세 섹션의 **번호 항목만** 뽑아 제목 단위로 비교.
4. 오늘 추가분 4건을 문자열로 직접 검색 — `"서브" = 서브에이전트` · `Gim이 직접 해야 하는 일` · `이해한 바` · `상세 보고서로`.
5. `md5sum`으로 중복 여부 확인, `diff`로 문장 차이 확인.
6. 각 프로젝트에 `research.md`가 실제로 있는지 확인(기록 규칙의 전제).

### ③ 발견한 사실

**규칙 반영 매트릭스(점검 시점)**
| 문서 | 소통 | 작업방식 | 답변·기록 | 서브/롣 | 직접안내 | 이해확인 | 보고서 |
|---|---|---|---|---|---|---|---|
| 루트(기준) | 8 | 14 | 3 | ✅ | ✅ | ✅ | ✅ |
| axdata_01_엘드리아 | 7 | 14 | 3 | ❌ | ❌ | ✅ | ✅ |
| axdata_05 / 07 / 09 | 5 | 12 | 2 | ❌ | ❌ | ❌ | ❌ |
| axdata_11_엘로그 | 7 | 12 | 2 | ✅ | ❌ | ❌ | ❌ |
| **axdata_13** | 5 | 12 | **0** | ❌ | ❌ | ❌ | ❌ |
| engine_엘로그2_cocos | 7 | 12 | 2 | ✅ | ❌ | ❌ | ❌ |

- **오늘 추가한 4건이 7개 프로젝트에 전부 없었다.**
- **`axdata_13`은 `답변·기록 규칙` 섹션 자체가 없었다.** 그런데 `research.md`(50줄)는 실제로 쓰고 있었다 — 규칙 없이 관행으로만 굴러가던 상태.
- **같은 규칙이 문서마다 다른 문장**이었다. 05 `의사결정은 선택박스로` / 07 `의사결정 질문 형식(항상)` / 09 `의사결정·복수 의견은 체크 선택박스로 (항상)` — 내용은 같고 표현만 셋 다 다름.
- **`.PJT1`·`.PJT2`·`.PJT_씨앗` 3곳은 md5가 완전히 동일한 영문 10원칙 구버전.** `.PJT_씨앗`은 PDF 원고 폴더, `.PJT2`는 CLAUDE.md만 있음 → 코드 프로젝트 아님.
- **정상 확인된 것** — 모든 프로젝트에 `research.md`가 실제로 존재(18~1325줄). 기록 규칙의 전제는 성립.
- **숨어 있던 프로젝트 고유 규칙 2건**(공통 섹션 안에 섞여 있어 그냥 지우면 유실될 뻔함)
  - 엘드리아 소통 4번 `작업 마무리 — docs/play.html 재빌드`
  - **axdata_09의 테스트 명령이 `python -m pytest`** (나머지는 `node --test`). 공통 규칙 7번을 그대로 복사했다면 잘못된 명령을 물려받았을 것.

### ④ 확인하지 못한 것과 이유
- **각 프로젝트의 CLAUDE.md가 실제로 준수되고 있는지**는 확인하지 않았다. 문서 대조만 했고 각 저장소의 커밋 이력·코드 실태는 보지 않았다.
- `.PJT1/.claude/` 하위 설정은 열어보지 않았다(코드 프로젝트가 아니라고 판단해 범위에서 제외).
- 전역 지침서 `D:\.CODE\.Claude\CLAUDE.md`는 **AXdata 경로 밖**이라 이번 점검 범위에서 제외했다. 다만 서브/롣·멤 명령이 거기 있어, 프로젝트 문서에 없어도 실제 동작에는 문제가 없다는 점은 확인했다.

### ⑤ 영향과 위험
- 규칙이 **9벌 복사**돼 있어 한 곳을 고칠 때마다 나머지 8곳이 뒤처진다. 오늘 내가 두 곳만 고친 것이 정확히 그 증상.
- 위험이 큰 쪽은 **잘못된 내용의 전파**다. 공통 규칙 7번(테스트 명령)을 기계적으로 복사했다면 axdata_09가 `node --test`를 물려받아 매번 실패했을 것.

### ⑥ 권고와 조치(Gim 결정 → 실행 완료)
**선택박스 결정 1: "공통규칙은 루트만, 하위는 프로젝트 고유내용만"**
- 하위 7개 문서에서 `소통 규칙`·`작업 방식`·`답변·기록 규칙`을 **삭제**하고, 상위 문서를 가리키는 안내문으로 대체.
- `## 이 프로젝트 전용 규칙` 섹션을 새로 만들어 **프로젝트별 테스트 명령**을 명시(09는 `python -m pytest`).
- 엘드리아에는 `작업 마무리(play.html 재빌드)` + 이번 세션에서 두 번 당한 **빌드 함정**(정적 서버가 dist를 잠그면 옛 내용이 배포됨)을 전용 규칙으로 추가.
- `프로젝트 개요`·`코드 작성 원칙`·`현재 현황·백로그`는 그대로 보존.
- 결과: 72/40/40/63/54/34/54줄 → **25/10/10/34/23/10/23줄**. 공통 규칙 원본은 루트 1벌.
- 검증: `grep -rln "실수 줄이기|## 소통 규칙|## 답변·기록 규칙" axdata_*/CLAUDE.md` → **일치 없음**.

**선택박스 결정 2: `.PJT` 3곳은 그대로 둔다** — 코드 프로젝트가 아니므로 건드리지 않음.

### 앞으로
규칙을 바꿀 때는 **`D:\.CODE\AXdata\CLAUDE.md` 한 파일만** 고치면 된다. 하위 문서에 공통 규칙을 다시 복사해 넣지 말 것.

## [2026-07-26] 호출 명령(서브·롣·멤) 지침 보완

**Gim 지시**: "서브. 롣. 멤 규칙도 추가해서 Axdata 및 하위 경로들 보완해줘."

### 확인한 실제 상태 (근거)
| 문서 | 서브 | 롣 | 멤 | 서브 승인 게이트 |
|---|---|---|---|---|
| 전역 `D:\.CODE\.Claude\CLAUDE.md` | ✅ | ✅ | ✅ | ✅ |
| **AXdata 루트** | ✅(6번) | ✅(7번) | **❌ 없음** | **❌ 없음** |
| 하위 7곳 | — | — | — | — (직전 일원화로 상위 참조) |

즉 실제 누락은 **AXdata 루트의 "멤"과 "서브 승인 게이트"** 두 가지였다.

### 한 일
1. **루트 소통 규칙 보완** — 6번(서브)에 **승인 게이트**를 하위 항목으로 붙이고(실행 규모 · 사용량 흐름 2줄 노티 → 승인 후 진행), **8번 "멤·mem = 기억 시스템 호출"** 신설(검색/기록/단독 되물음, "추측 말고 먼저 검색", 비용). 기존 8번(이해 확인)은 9번으로 밀림 → 소통 규칙 **9개**.
2. **하위 7곳은 복사하지 않았다.** 직전에 Gim이 결정한 "공통규칙은 루트만" 구조를 10분 만에 되돌리게 되기 때문. 대신 **상위 참조 문구에 세 호출 명령을 이름으로 명시**해, 하위 문서만 읽어도 존재를 알 수 있게 했다.
   > `호출 명령 서브(승인 게이트 필수) · 롣/로드/ㄹㄷ(클로드 직접) · 멤/mem(기억 검색·기록) 도 그 문서에 있습니다.`

### 검증
- 하위 7곳 전부 안내 문구 삽입 확인(`grep -c "호출 명령"` = 각 1).
- 하위에 공통 규칙 본문이 복사되지 않았음 확인 — `grep -rln "서브에이전트(Agent 도구)|멤 기록|실수 줄이기" axdata_*/CLAUDE.md` → **일치 없음**.
- 루트 소통 규칙 9개 순서 확인: 어체 · 설명 방식 · 호칭 · 한글 종결 · 직접안내 · **서브** · **롣** · **멤** · 이해 확인.

### 남는 중복 (기록해 둠)
서브·롣·멤은 이제 **전역 지침서와 AXdata 루트 두 곳**에 있다. 방금 하위 9벌 중복을 없앤 것과 같은 종류의 문제가 한 단계 위에 남아 있는 셈이다.
- **당장은 문제 없음** — 전역 문서는 모든 세션에 자동 로드되므로 동작은 동일하고, AXdata 루트에 두면 이 저장소만 읽어도 자족적이다.
- **위험** — 나중에 전역에서 이 규칙을 고치면 AXdata 루트가 뒤처진다. 고칠 때 두 곳을 함께 볼 것.

## [2026-07-26] 지침서 층 구조 확립 — 3층 원칙 + 서브·롣·멤은 전역 1벌

**Gim 질문**: "어떻게 정리하는 게 좋을까?" (전역 ↔ AXdata 루트에 서브·롣·멤이 이중으로 남은 건에 대해)

### 진단
중복이 계속 생기는 진짜 원인은 **"어느 층에 무엇을 두는지 기준이 없다"**는 것. 기준이 없으니 규칙을 추가할 때마다 "일단 여기도 넣자"가 되고, 오늘 하위 9벌을 정리하자마자 한 층 위에서 같은 중복이 생겼다.

### 조사로 확인한 사실 (근거)
- `git rev-parse` — **AXdata 루트도 전역 지침서도 git 밖.** 버전 관리되는 건 하위 프로젝트뿐(`axdata_01`에만 `.git`).
- 전역 문서에 **PC 종속 정보가 이미 다수** — `C:\Users\gimsf\mem-tool\mem.mjs`(멤 도구 실체), `D:\Android\jdk17`, `G:` 드라이브, `/usage` 수치, 평일/주말 시간대.
  → **멤은 PC가 바뀌면 아예 동작하지 않는다.** 저장소 문서에 있을 성질이 아니다.

### 확립한 3층 원칙 (Gim 결정)
> **판단 기준 한 문장** — PC를 바꾸면 달라지는가? → **전역**. 이 코드베이스에서만 통하는가? → **프로젝트**. 둘 다 아니면 → **작업공간 루트**.

| 층 | 파일 | 여기에 적는 것 |
|---|---|---|
| 전역 | `D:\.CODE\.Claude\CLAUDE.md` | **호출 명령(서브·롣·멤)**, 승인 게이트·사용량, 가용 시간대, 도구 경로·JDK/SDK/G드라이브 |
| 작업공간 루트 | `D:\.CODE\AXdata\CLAUDE.md` | 소통 규칙, 작업 방식 14원칙, 답변·기록 규칙 |
| 프로젝트 | `axdata_XX\CLAUDE.md` | 테스트 명령, 개요, 코드 원칙, 그 프로젝트의 함정 |

### 한 일
1. **전역 문서 맨 앞에 `📐 문서 층 구조` 섹션 신설** — 위 표 + 판단 기준 + "아래 층에는 참조 한 줄만, 규칙 본문을 다시 쓰지 않는다" + "규칙을 고칠 때는 층을 먼저 정하고 그 한 곳만".
   → **원칙을 문서에 박은 것이 이번 정리의 핵심.** 안 그러면 다음에 또 번진다.
2. **AXdata 루트에서 서브·롣·멤·승인 게이트 본문 제거** → 참조 한 줄로 대체. 소통 규칙 9개 → **7개**.
   (직전 커밋 `ae6a55b`에서 내가 넣은 것을 도로 뺀 것 — 층 기준을 대보니 그게 층을 어긴 것이었다.)
3. 하위 7곳의 호출 명령 안내 문구는 **그대로 유지**(어느 문서를 봐도 명령의 존재를 알 수 있게).

### 검증
- 전역: `문서 층 구조` 섹션 1개, 호출 명령 원본 유지(서브·멤 정의 2건).
- AXdata 루트 소통 규칙 7개 — 어체 · 설명 방식 · 호칭 · 한글 종결 · 직접안내 · **호출 명령(전역 참조)** · 이해 확인.
- AXdata 루트에 `멤 기록`·`서브에이전트(Agent 도구)`·`/usage` 본문 **없음**(참조 한 줄만).
- 하위 7곳 참조 문구 유지 확인(각 1건).

### 결과
같은 규칙의 원본이 **정확히 한 곳**에만 존재한다. 규칙을 바꿀 때 층 표를 보고 한 파일만 고치면 된다.

## [2026-07-26] 필드·길드·혜택 3탭 골격 구축 (`?v=13`)

**Gim 지시**: "필드/길드/혜택 탭부터 채우고 나머지 부족한 부분 채우자" + **실기 캡처 3장 제공**(호드워에서 해금 후 재촬영).

### 자료가 생겼다 — 이전엔 없던 것
직전 점검에서 "이 3탭은 호드워 캡처에도 잠겨 있어 베낄 화면이 없다"고 보고했는데, **Gim이 해금 후 다시 찍어 자료를 제공**했다. 읽어낸 골격은 `docs/HORDWAR_SPEC.md`의 새 섹션 "필드 · 길드 · 혜택 탭"에 기록.

| 탭 | 호드워 골격 |
|---|---|
| 필드 | 세로 스크롤 **월드맵**. 양피지 지도 위 노드 9개를 좌·우·중앙 **지그재그** 배치. 노드=일러스트+`[아이콘/🔒] 이름 ›` 라벨 알약. 열린 건 컬러 아이콘+❗, 위에 `도전 가능`·`신규 기능` 말풍선 |
| 길드 | 배경 일러스트+**플레이어 카드**(초상·닉·길드Lv·경험치바·⚜전투력)+랭킹 → **검색바** → **길드 목록**(문장·이름·레벨·길드장·전투력·인원수·`신청`) → 하단 `길드 창설`·**`일괄 신청`(금색)** |
| 혜택 | 전면 일러스트+대형 타이틀 → **출석 그리드 2×5**(✅수령/금테=오늘/붉은=특별) → **`수령` 금색 대형** → **하단 서브탭 가로 스크롤**(만뽑기·일일출석·레벨패키지·친구연동) |

### Gim 결정 2건 (선택박스)
1. **"화면만 먼저, 노드는 잠금 표시"** — 파킹 모듈을 되살리지 않는다. 세 탭을 실제로 동작시키려면 `tower`·`arena`·`expedition`·`guild`·`events`·`season`·`shop`을 켜야 하는데, 이번엔 **인터페이스 통일성 우선**.
2. **"이모지 + 라벨 알약으로 먼저"** — 호드워의 정교한 노드 일러스트 대신 이모지. 나중에 이미지만 갈아끼울 수 있게 자리를 분리해 뒀다(PixelLab 생성·기존 Art pack 활용은 보류).

### 만든 것
- **`app/screens/FieldScreen.js`** — 지그재그 월드맵. `NODES` 배열에 노드 9개(용의 시련·재앙의 땅·수호자의 탑·불타는 원정·투기장·심층 던전·현상 게시판·자원 던전·시공의 문). 각 노드에 **`note` 필드로 엘드리아 대응 모듈을 표기**해, 다음 세션이 매핑을 다시 추론하지 않게 했다. 전부 잠금 → 누르면 토스트. 배치는 절대좌표 대신 `alignSelf`(l/c/r)로 지그재그.
- **`app/screens/GuildScreen.js`** — 플레이어 카드는 **실제 데이터**(playerLevel·playerTitle·경험치바·`resolve().score` 전투력). 검색바·목록·하단 2버튼은 골격만, 목록 자리에 "들어올 내용" 안내.
- **`app/screens/PerkScreen.js`** — **출석은 실제로 동작한다.** `daily.mjs`가 코어라 파킹 대상이 아니었다. 호드워는 10일 그리드지만 엘드리아 `ATTENDANCE`는 **7일 순환**이라 7칸으로 맞춤. 수령분 ✅·오늘 금테·마지막 칸 특별(붉은). 나머지 서브탭 3개는 잠금.
- `App.js` — 세 화면 배선, `stub` prop → `onLocked` 로 교체(잠금 토스트 공용).
- `StubScreen.js` → `app/parked/` 로 이동(역할 끝남).

### 검증
- `node --test system/test/*.test.mjs` → **295개 전부 통과**.
- 로컬 스모크 — 세 탭 진입 확인. 필드 노드 9개 라벨·대응 모듈 표기, 길드 플레이어 카드(`⚜354`)·검색바·하단 2버튼, 혜택 출석 7칸(`🪙500 1일차 … 🔮60 7일차`)+`수령` 모두 렌더 확인.
- ⚠️ 셸 인코딩(cp949) 때문에 `grep`으로 play.html 안의 한글 검증이 실패했다. **번들 해시 확인 + 실제 렌더 확인**으로 대체했다(다음에도 한글 문자열 검증은 grep 대신 렌더로 볼 것).
- 배포: `?v=13` → https://gimaxax77-sys.github.io/axdata_01/?v=13

## [2026-07-26] 영웅 탭 호드워식 전면 재작성 (`?v=14`)

**Gim 지시**: "현재의 레이아웃 먼저 다 제거하고 다시 / 영웅 탭 첨부 이미지 참조해서 수정 / 1번=영웅탭 진입 화면, 2번=편성 진입 화면" + **실기 캡처 2장 제공**.

기존 HeroScreen(VS바 + 5열 카드 + 인라인 상세 + 진형 카드 + 하단 3버튼)은 **구조 자체가 달랐다.** 갈아엎고 캡처대로 다시 썼다. 읽어낸 골격은 `docs/HORDWAR_SPEC.md` "영웅 탭" 섹션에 기록.

### 새 구조
**진입 화면** — 우상단 보유수 알약 · **상단 서브탭 3개**(장신구🔒·도감🔒·영웅) · **카드 그리드 4열** · **하단 필터바**(시너지 · ⌃ · ALL · 속성5 · 편성)
- 카드 = 좌측 세로 원형뱃지(**속성 + 역할**) · 상단 **등급 메달**(S+/S/A/B/C, 등급별 색) · 편성 시 ❗점 + **`전장 대기중`** 초록 라벨 · 하단 **`Lv##` 리본**(파란 글씨) · 이름 2줄 · 선택 시 **붉은 테두리**.
- 톤도 호드워에 맞춰 **갈색/주황 계열**로(기존 네이비 카드에서 변경).

**편성 모달** — `app/screens/FormationModal.js` **신규 분리**(규칙 14: 한 파일에 다 넣지 않기)
- 제목 배너 `편성` · 파티 프리셋 카드 세로 목록 · 각 카드에 **슬롯 격자 + 마수 패널 + `파티 편집` 금색 버튼**.

### 의도적 차이 (캡처와 다르게 간 것 · 근거)
| 호드워 | 엘드리아 | 이유 |
|---|---|---|
| 보유수 `107/200` | 보유수만 | 인벤토리 상한 개념이 없음. 가짜 상한을 만들지 않았다 |
| 슬롯 5칸(2+3) | **7칸(2/3/2)** | 엘드리아 진형이 전열2·중열3·후열2. 호드워의 시각 언어를 유지하며 확장 |
| 5인/3인 파티 탭 | 없음 | 파티 인원 모드가 없음 |
| 마수 3칸 | 자물쇠 3칸 | 펫·가디언 파킹 |
| `공명 1레벨(4/5)` | `✦ 시너지 N` | 대응 시스템 없음 → teamSynergy 개수로 대체 |
| `핵심` 라벨 · "상위 5명 최저레벨 공유" | 없음 | 호드워 고유 시스템 |
| 상세 화면 없음 | **카드 탭 → 상세 모달** | 캡처엔 없지만 레벨업·돌파 경로가 사라지면 안 됨 |
| 프리셋 카드가 전부 동일 | **1번 칸 = 현재 편성** | 엘드리아는 활성 파티가 하나뿐이라, 프리셋만 있으면 지금 무엇이 편성됐는지 볼 수 없다 |

- `파티 편집` 버튼 = **탭 적용(loadPreset) · 길게 저장(savePreset)**. 하단에 힌트 문구를 달았다.

### 검증
- `node --test system/test/*.test.mjs` → **295개 전부 통과**.
- 로컬 스모크 — 영웅 탭 `🦸1 / 장신구🔒 도감🔒 영웅 / ✨🛡️ C 전장 대기중 Lv1 기사 / ✦시너지 0 ⌃ ALL 🔥💧🌿✨🌑 👥편성` 확인. 편성 모달 `현재 편성(1/7) · 슬롯 7칸 · 마수🔒×3 · 전열1/2·중열0/3·후열0/2 · 프리셋2~5 파티 편집` 확인.
- 미사용 import·스타일 0건 확인. HeroScreen 272줄 / FormationModal 147줄 (규칙 14 임계 이내).
- 배포: `?v=14` → https://gimaxax77-sys.github.io/axdata_01/?v=14

## [2026-07-26] 편성 7인 → 5인 · 진형 2단 체제 전환 (`?v=15`)

**Gim 지시**: "영웅 편성 7인 > 5인으로 수정" → 선택박스 확인 결과 **"전열 2, 후열 3으로 2단 체제"**(중열 폐지).

### 왜 물어봤나
`MAX_PARTY` 7→5는 명확했지만 **정원을 어떻게 나누느냐가 전투 전략을 바꾼다.** 전열(방어×1.25·공격×0.85) / 중열(전부×1.05) / 후열(공격×1.30·방어×0.80) 계수가 다르기 때문. 선택지 3개를 계수와 함께 제시했고 Gim이 "중열 없이 2/3"을 골랐다.

### 코어 변경
- **`formation.mjs`** — `FORMATION_ROLES = ['front','back']` · `ROLE_CAP = { front:2, back:3 }` · **`PARTY_CAP` 신설**(정원 합에서 파생). `mid`/`midExposed` 계수 제거. `formationSummary`가 `{front, back}`만 반환. `autoFormation`의 하드코딩 `/7`을 `PARTY_CAP`으로 교체 — **두 값이 어긋나 정원 초과가 나던 구조를 없앴다.**
- **`gameState.mjs`** — `MAX_PARTY = PARTY_CAP` 으로 **파생**시킴(상수 두 개가 따로 놀지 않게).
- **`save.mjs` 마이그레이션 3종** — 옛 세이브가 그대로 굴러가면 정원을 넘긴 채 동작한다.
  1. 파티가 5명 초과면 **전투력 상위 5명만** 남긴다(약한 유닛부터 잘라내는 게 자연스럽다).
  2. 옛 `'mid'` 지정은 **후열로 이동**. 그냥 두면 `roleOf`가 전열로 떨어뜨려 **딜러가 탱커석에 앉는다.**
  3. 후열 정원(3) 초과분은 전열로 되돌린다.

### 화면 변경
- `BattleView` — 아군 3열 → **2열**(후열·전열), `EMPTY_FORMATION`에서 mid 제거.
- `IdleScreen` — `heroFormation`에서 mid 제거.
- `FormationModal` — `ROWS = ['front','back']` → **슬롯이 정확히 2+3 = 호드워 캡처와 동일**해졌다(이전엔 2/3/2로 확장했었음). `(1/7)` 하드코딩을 `PARTY_CAP`으로 교체.
- `Onboarding` — 진형 안내 문구를 "전열 2명·후열 3명"으로.

### 테스트
- 기존 진형 테스트 **11개가 깨졌다**(전부 3단 체제 전제). 2단 기준으로 갱신 — 순환(전열→후열), 정원 초과 거부(후열 3), 5인 편성 판정, 전열<후열 공격력, 자동배치 4종, 신규 원형 배치.
- **`system/test/partyShrink.test.mjs` 신설** — ① `MAX_PARTY === ROLE_CAP 합` ② 옛 7인 파티가 상위 5명으로 잘림 ③ `'mid'`가 후열로 이동(전열로 안 떨어짐) ④ 후열 정원 초과분이 전열로.
- 결과 **299개 전부 통과**(295 → 299).

### 검증
- 로컬 스모크 — 편성 모달 `현재 편성 (1/5)` · 슬롯 5칸 · `전열 1/2 · 후열 0/3` 확인.
- 배포: `?v=15` → https://gimaxax77-sys.github.io/axdata_01/?v=15

### 부수 효과 (좋은 쪽)
호드워 캡처의 편성 슬롯이 원래 **2+3=5칸**이었다. 중열을 없애면서 **엘드리아 진형이 호드워 레이아웃과 정확히 일치**하게 됐다 — 이전에 "7칸이라 2/3/2로 확장한다"고 적었던 의도적 차이가 사라졌다.

## [2026-07-26] 영웅 상세 전체화면(HeroDetail) 신규 (`?v=16`)

**Gim 지시**: "영웅탭에서 영웅 클릭이 실행화면임 / 레이아웃 및 디자인 구조 동일하게 적용" + **실기 캡처 2장**(같은 화면, 하단 패널만 `장비`/`속성`으로 다름).

기존에는 **작은 중앙 모달**이었다(캡처엔 상세 화면이 없어 내가 임의로 만든 것). 캡처가 생겨 **전체화면**으로 교체했다.

### 읽어낸 골격
**상단 무대(≈68%)** — 좌상단 뒤로가기 · 상단 **이름 리본**(두루마리, 위에 속성 원형) · 좌측 **`계약` 패널**(초상 2장 + "동시 출전, 방어+15%") · 중앙 **전신 일러스트**(돌 원형 무대) · 우측 **`공략`** 버튼 · 우하단 **`LV 21` / `⚔4.65k`** 금테 라벨 2줄 · 좌하단 **등급 메달 + 역할/속성 원형 + 스킬명 바**
**하단 패널(≈32%)** — 하단 바의 `속성`·`장비` 서브탭으로 전환
- `속성` — 스탯 4개 가로줄 · **스킬 원형 4개**(1번에 `필살기` 라벨, 각 레벨 뱃지) · 재화 2줄(보유/비용) · `무료 부활` + **`5레벨 상승` 금색 대형**
- `장비` — 슬롯 4칸 · `일괄 해제`(어두움) · `일괄 장착`(금색 ❗)

### 만든 것
**`app/screens/HeroDetail.js` 신규**(303줄, 규칙 14로 분리). `HeroScreen`은 카드를 탭하면 목록 대신 이 화면을 **전체 전환**으로 렌더한다(모달 아님 — 캡처가 전체화면).

### 의도적 차이
| 호드워 | 엘드리아 | 이유 |
|---|---|---|
| `계약`(동시 출전 방어+15%) | 잠금 패널 | 대응 시스템 없음 |
| `공략` · `무료 부활` | 잠금 | 대응 시스템 없음 |
| `장비` 슬롯 4칸 | 잠금 4칸 | gear 파킹 |
| `5레벨 상승` | **최대 5회 반복** | 엘드리아는 1레벨씩 오름. 상한·재화 부족에서 멈추고 "N레벨 상승"으로 결과 표시 |
| 스킬 원형 4개 고정 | **랭크 기반 슬롯 수**(`skillSlots`) | 남는 칸은 🔒 |
| 스탯 4개 | ⚔atk ❤hp 🛡def 👣spd | `computeStats` 필드와 1:1 |
| — | **돌파 버튼 추가** | 캡처엔 없지만 레벨 상한을 뚫는 유일한 경로 |

### 정리
상세를 옮기며 `HeroScreen`에서 쓰이지 않게 된 import 12개(`Modal`·`Btn`·`fmt`·`togglePartyMember`·`MAX_PARTY`·`computeStats`·`levelCap`·`levelUp`·`ascend`·`ascendCost`·`recordMission`·`starOf`)와 스타일 7개(`backdrop`·`dcard`·`dname`·`dsub`·`dstats`·`dstat`·`dbtns`)를 제거. HeroScreen 272→**231줄**.

### 검증
- **299개 테스트 전부 통과.**
- 로컬 스모크 — 속성 탭 `◀ ✨기사 / 계약🔒 / 📖공략 / LV 1 / ⚔375 / C 🛡️방어형 ✨빛 / 방어·1★ / ⚔️75 ❤️1,500 🛡️100 👣90 / ＋필살기 ＋ ＋ 🔒 / 💠117.1K/50 🔮130/80 / ➖편성 해제 5레벨 상승 ⭐돌파` 확인. 장비 탭 `🔒×4 / 일괄 해제 · 일괄 장착 / 장비는 준비 중입니다` 확인.
- 파일 크기 — HeroScreen 231 · HeroDetail 303 · FormationModal 147 (규칙 14 임계 근처, HeroDetail은 화면 하나라 유지)
- 배포: `?v=16` → https://gimaxax77-sys.github.io/axdata_01/?v=16

## [2026-07-26] 길드 중복 카드 제거 + 잠긴 자리 전부 개방 (`?v=17`)

**Gim 지시**: "모험가 카드 중복 최상단만 남기고 삭제. 그리고 자물쇠 잠겨있는 탭들도 일단은 모두 개방할 것(표시는 해놓고). 테스트 및 내부 레이아웃 진행해야 하므로 출시전 정식으로 잠그면 됨."

### ① 플레이어 카드 중복 제거
길드 화면이 초상+닉+레벨+경험치바+전투력을 그렸는데, **App.js 글로벌 상단바에 이미 같은 정보**가 있어 한 화면에 두 번 나왔다.
- **원인** — 호드워는 탭마다 상단바가 없어 각 화면이 직접 그린다. 엘드리아는 상단바가 **항상** 떠 있는데 캡처를 그대로 옮기면서 중복이 생겼다.
- **조치** — GuildScreen에서 플레이어 카드 삭제. `랭킹` 버튼은 살려서 목록 패널 헤더 우측으로 옮김. 미사용이 된 import 6개(`fmt`·`playerLevel`·`playerTitle`·`getPartyUnits`·`resolve`·`playStage`·`accountMods`)도 제거. 137→99줄.
- 파일 머리에 **"플레이어 카드는 그리지 않는다"** 이유를 주석으로 못박아, 다음에 캡처를 옮길 때 같은 실수를 반복하지 않게 했다.

### ② 잠긴 자리 전부 개방
"토스트로 막기" → **"준비 중 패널로 실제 진입"** 으로 전환. 🔒 표시는 그대로 남긴다.
- **`app/screens/ComingSoon.js` 신규**(47줄) — 아이콘·제목·설명·"들어올 내용" 목록·뒤로가기를 받는 공용 패널. 20군데가 쓰므로 공용화가 정당하다.
- 적용처
  | 화면 | 개방한 것 |
  |---|---|
  | 필드 | 노드 9개 전부 → 노드별 준비 중 패널(엘드리아 대응 모듈 표기) |
  | 길드 | 검색 · 랭킹 · 길드 창설 · 일괄 신청 |
  | 영웅 | 서브탭 장신구 · 도감 |
  | 영웅 상세 | 계약 · 공략 (장비 버튼 2개는 인라인 메시지) |
  | 혜택 | 서브탭 만뽑기 · 레벨패키지 · 친구연동(토스트 제거, 기존 패널로 바로 전환) |
- 재화 `＋`는 그대로 토스트 — **탭이 아니라 버튼**이고 들어갈 화면 자체가 없다.
- `onLocked` prop이 대부분 불필요해져 4개 화면에서 제거(App.js의 토스트는 재화 ＋용으로 유지).

### ⚠️ 사고 — python 셸 스크립트가 파일을 0바이트로 날림
`io.open(p,'w')`는 **즉시 truncate**하는데, 쓰려던 문자열에 `'\ud83d\udd12'`(자물쇠 이모지를 서로게이트 쌍 이스케이프로 적은 것)가 들어 있어 UTF-8 인코딩에서 예외가 났다. **파일은 이미 비워진 뒤였다.** `HeroDetail.js` 303줄이 0줄이 됨.
- **복구** — 직전 커밋 `a0af1d2`에 있어 `git checkout -- <file>` 로 즉시 원복. 이후 Edit 도구로 다시 작업.
- **교훈** — 셸 heredoc python으로 한글·이모지 치환을 하지 말 것(cp949 콘솔에서 소스 문자열 자체가 깨지는 문제도 이미 두 번 겪음). **Edit 도구를 쓴다.** 커밋을 자주 해둔 덕에 손실이 0이었다.

### 검증
- **299개 테스트 전부 통과.** 미사용 import·스타일 0건.
- 로컬 스모크 — 길드(중복 카드 없음·`🏅랭킹` 헤더) / 길드 랭킹 진입 / 필드 `수호자의 탑` 노드 진입 / 영웅 `장신구` 서브탭 진입 모두 확인.
- 배포: `?v=17` → https://gimaxax77-sys.github.io/axdata_01/?v=17

### 출시 전 되돌릴 것
`ComingSoon`으로 열어둔 자리를 다시 잠그려면 — 각 화면의 `setPage`/`setSub` 호출을 토스트로 되돌리면 된다. 관련 위치는 전부 "Gim 지시 2026-07-26" 주석이 달려 있다.

## [2026-07-26] 세션 마무리 — 멤 기록 + 인수인계 갱신

**Gim 지시**: "멤 기록하고 인수인계 준비"

### 멤(기억) 기록
- **`eldria-seven-revamp.md` 갱신** — 편성 5인·2단 진형, 자물쇠 개방 정책(ComingSoon 패널로 진입), **화면 지도**(app/screens 11개 + app/parked 16개), 그리고 **"캡처를 옮길 때 플레이어 카드는 옮기지 않는다"**(호드워는 탭마다 상단바가 없지만 엘드리아는 항상 떠 있음 — 길드에서 실제로 중복 발생).
- **`shell-edit-hazards.md` 신설**(feedback) — heredoc python 치환 금지. `io.open(p,'w')`가 즉시 truncate하는데 이모지 서로게이트 이스케이프로 인코딩 예외가 나 **HeroDetail.js 303줄이 0바이트로 날아갔다**(커밋 덕에 손실 0). cp949 콘솔이 heredoc 한글을 깨뜨려 치환이 조용히 실패한 건도 2회. → Edit 도구 사용, 한글 검증은 grep 대신 렌더로.
- `MEMORY.md` 색인 갱신.

### 인수인계 갱신 — `docs/HANDOFF.md` 전면 재작성
기존 문서가 **세븐나이츠 기준**이라 통째로 낡아 있었다(머리말만 호드워로 바뀐 상태). 현재 상태로 다시 씀.
- 읽을 순서(HORDWAR_SPEC → PARKED → research → HANDOFF)
- **6탭 현황표**(화면 파일 + 실제 동작 여부)
- **놓치면 사고 나는 규칙 4가지** — 편성 5인/PARTY_CAP 파생 · 자물쇠는 출시 직전 · 옵션 18종 off · 캡처의 플레이어 카드 금지
- 다음 할 일(Gim 결정 대기 3 · 끊긴 코어 기능 4 · 인터페이스 미달 항목)
- **빌드 함정 절차 명문화** — 서버 종료 → 번들 해시 확인 → 렌더 확인 → 배포
- 검증 기준(테스트 299개, 브라우저 페인 한계)
- 소통 규칙은 CLAUDE.md 3층 구조를 가리키게만 함(복사 안 함)

### 이번 세션 전체 요약
커밋 **14개**를 `claude/3d-poc`에 push(`76da912 → ffa3384`). 배포 `?v=17`.
- 코어: 양팀 전투력 비교 · 속성 도감 배정 · 데미지 숫자 고정 슬롯 · 편성 7→5인 2단 진형
- UI: 호드워 전환(모듈 18종 파킹·6탭) · 필드/길드/혜택 3탭 · 영웅 탭 재작성 · 영웅 상세 전체화면 · 편성 모달 · 잠금 전면 개방
- 문서: 지침서 3층 원칙 확립 · 규칙 3/13/14 추가 · 지침서 9벌 → 1벌 일원화
- 테스트 291 → **299개**

---

# 2026-07-26/27 — 소환(모집) 되살리기 · 명세 7번 전제 정정

## 1. 무엇을 왜 했나

인수인계 1순위가 **"소환 되살리기"**였다. 이유는 기능 자체가 아니라 **검증 불가** 때문이다 —
영웅이 1명이라 편성·진형·속성 필터·시너지 UI가 전부 빈 화면으로만 보였다.

Gim 결정(선택박스, 2026-07-26):
| 항목 | 결정 |
|---|---|
| 규모 | **영웅 배너 + 10연 연출** |
| 진입점 | **"기존거 무시하고, 무조건 호드워와 동일한 위치로"** |
| 명세 7번(편성→전투) | **"호드워대로 전환"** |
| 필드·길드·혜택 빈 노드 | **나중에** |

## 2. 조사 방법과 근거

진입점을 "호드워와 동일하게" 하려면 **추측하면 안 되므로** 실기 캡처 24장
(`G:\내 드라이브\인앱트리\Screenshot_20260725_*.jpg`, 1080×2520)을 직접 열어 대조했다.
확인한 캡처 8장: `184716`(요새 맵) · `184722`(영웅 탭) · `184728`(도감) · `184735`(속성 보너스)
· `184747`·`201254`(캐릭터 상세) · `184807`(모험 탭) · `184914`(편성) · `184947`(BOSS COMING)
· `185201`(편성 모달) · `185259`(10연 결과) · `185304`(모집 화면).

코드 쪽 확인: `system/core/gacha.mjs` 전문 · `app/parked/GachaScreen.js`(327줄) ·
`app/useGame.js:69`(초기 지갑) · `system/core/save.mjs:25` · `system/core/features.mjs`.

## 3. 발견한 사실

### 3-1. 🔴 명세 7번의 전제가 **틀렸다**

명세는 "호드워는 편성 화면에서 `전투`를 눌러야 전투가 시작되므로 방치형 정체성과 충돌한다"고
적고 있었고, 그래서 HANDOFF도 "Gim 판단 필요"로 올려두고 있었다. **캡처가 반대를 말한다.**

- `184807`(모험 탭): `전투 시작` 버튼 **바로 왼쪽에 `자동 전투 상태 00:00:06` 타이머가 돌고 있다.**
  → 호드워도 **상시 자동 전투**다. `전투 시작`은 즉시 개시(수동) 버튼일 뿐이다.
- `184914`(편성 화면): 배경에 **VS 바와 좌우 대치 유닛이 그대로 비친다.**
  → 편성은 **전투 위에 겹친 오버레이**이고, 하단 `전투` 버튼은 **닫고 전투로 돌아가는** 버튼이다.

**영향**: Gim이 고른 "호드워대로 전환"이 사실상 **현행 유지 + 편성 화면에 `전투` 버튼 추가**로 줄어든다.
방치형 정체성은 깨지지 않는다. 난이도 "높음" → "낮음". 명세 표와 본문을 정정했다.

### 3-2. 소환 = 요새 맵의 「영웅 제단」, 용어는 "모집"

`184716`(요새 맵)에 건물 노드로 **「영웅 제단」**이 있다(그 밖에: 고블린 상점 · 공명 요새 ·
오크 우리🔒 · 전쟁 로비🔒 · 파티 로비 · 아티팩트 용광로🔒 · 승급 로비🔒).
`185304`가 그 화면이고, `185259`가 10연 결과다. 화면 구성 실측은 `docs/HORDWAR_SPEC.md`에 옮겨 적었다.

> **용어 주의** — 호드워에서 **"계약"은 소환이 아니다.** 캐릭터 상세 좌상단의 계약 슬롯은
> *동시 출전 시 공격+15%* 같은 **페어 시너지**다. 소환은 **"모집"**이다.
> 명세의 "월드맵 계약 노드"라는 표현과 헷갈리지 말 것.

### 3-3. 소환 코어는 이미 온전했다 — 새로 짤 게 없었다

`gacha.mjs`에 단차·10연·천장(`PITY_HARD=90`)·10연 SR 바닥보장이 **전부 이미 있었다.**
막혀 있던 것은 딱 두 가지였다.
1. `features.mjs`의 `gacha: false` 한 줄
2. **화면이 없음**

초기 지갑에 소환석 130(`useGame.js:69`)이 이미 들어 있어 **신규 세이브에서 13회 즉시 소환**이 된다.

### 3-4. 파킹된 `GachaScreen.js`는 되살리면 안 된다

327줄에 배너가 6개인데 영웅을 뺀 5개(장비·룬·펫·정령·코스튬)가 **전부 파킹 모듈**이고
`summonMastery`(=`summon` 플래그, 파킹)까지 끌어온다. 통째로 되살리면 파킹 결정이 무너진다.
게다가 스타일이 세븐 시절 것이다. → **되살리지 않고**, 영웅 배너만 다루는 화면을 새로 만들었다.

## 4. 한 일 (코드)

| 파일 | 변경 |
|---|---|
| `app/screens/SummonScreen.js` | **신규** — 모집 화면(천장 게이지 · 배너 캐러셀 3 · ❓확률 · 1회/10회 · 애니메이션 토글) |
| `app/screens/SummonResult.js` | **신규** — 10연 결과 오버레이(카드 3·4·3 · 등급별 카드색 · 순차 등장) |
| `app/screens/IdleScreen.js` | 우하단에 **🗿영웅 제단** 바로가기 + 누르면 화면 전환 |
| `app/theme.js` | `GRADE`·`GRADE_BG` **승격**(HeroScreen 지역 상수 → 공용) |
| `app/screens/HeroScreen.js` | 위 상수를 theme에서 import(중복 제거) |
| `system/core/gacha.mjs` | `PITY_HARD`·`MULTI_FLOOR` **export**(화면이 숫자를 복제하지 않게) |
| `system/core/features.mjs` | `gacha: true` |
| `system/test/features.test.mjs` | 파킹 목록에서 `gacha` 제외 + on 단언 |
| `system/test/summon-card.test.mjs` | **신규** — 결과 카드 이음매 검증 4건 |

### 설계 판단과 근거

- **진입점** — 호드워는 요새 맵의 건물 노드지만, **엘드리아 요새 탭은 요새 맵이 아니라 전투 화면**이다
  (방치형 정체성 유지, 이전 Gim 결정). 건물을 놓을 맵이 없어 **요새 탭 우하단 바로가기**로 두어
  *동선*을 같게 했다. 요새 맵 전면 개조는 범위가 훨씬 커서 손대지 않았다. **← Gim 확인이 필요한 해석**
- **천장 숫자를 화면에 복제하지 않았다** — `PITY_HARD`를 export해 읽는다. 코어를 90→100으로 바꾸면
  게이지가 자동으로 따라온다.
- **확률표도 하드코딩하지 않았다** — `RARITY`의 `weight`를 백분율로 환산한다(`oddsRows()`).
  파킹된 GachaScreen은 확률을 문자열로 박아두고 있었다(코어와 어긋날 수 있는 자리).
- **빈 껍데기를 만들지 않았다** — 호드워의 `추천`·🔍등장영웅·`오늘 소환 상한`은 대응 기능·개념이
  없어 넣지 않았다. 종족·우정 모집은 자물쇠 정책대로 🔒 표시만 하고 막지는 않는다.
- **`state.gacha` 방어 코드는 넣지 않았다** — `save.mjs:25`가 `state.gacha = state.gacha || {pity:0}`으로
  이미 보장한다. 읽어서 확인한 뒤 뺐다.

## 5. 검증한 것

| 검증 | 결과 |
|---|---|
| 테스트 | **303개 통과**(기존 299 + 신규 4). 회귀 없음 |
| 빌드 | 번들 해시 `7f0f0013…` → **`06a9d6ef…`** 변경 확인(옛 dist 배포 함정 회피) |
| 번들 내용 | `영웅 제단`·`10회 모집`·`일반 모집`·`확정 획득`·`애니메이션` 전부 포함 |
| 렌더 | 요새 탭에 **🗿영웅 제단** 버튼 렌더 확인(접근성 라벨 `영웅 제단 — 모집(소환)`) |
| 콘솔 | 에러 0건 |

### 신규 테스트가 잡는 것 (`summon-card.test.mjs`)
화면의 `toCell()`은 소환 유닛을 `identity(concept, unit)` → 이름·이모지·속성,
`concept.archetypes[...]` → 역할 이모지로 바꿔 카드를 그린다. **여기가 비면 결과 카드가 빈칸으로 뜨는데,
빌드해서 눈으로 봐야만 알 수 있다.** 그 이음매를 코드로 고정했다 — 10장 전부 이름·이모지·역할·등급·레벨이
채워지는지, 10연 SR 보장이 실제로 지켜지는지, 천장 게이지가 `PITY_HARD` 미만을 유지하다 리셋되는지,
재화 부족 시 유닛도 재화도 움직이지 않는지.

## 6. ⚠️ 확인하지 못한 것 (추정과 섞지 말 것)

1. **소환 화면·결과 화면의 실제 조작을 확인하지 못했다.**
   브라우저 페인에서 `resize_window`로 뷰포트를 주면 접근성 트리는 읽히지만,
   **RN-Web `TouchableOpacity`가 합성 클릭을 받지 않는다** — 온보딩 `건너뛰기`조차 눌리지 않았다.
   → 화면 진입 후의 레이아웃·연출·버튼 동작은 **Gim 폰에서 확인해야 한다.** 미확인 상태다.
2. **레이아웃이 1080×2520에서 캡처와 얼마나 일치하는지 실측하지 못했다.** 수치는 캡처를 눈으로 보고
   비율로 옮긴 것이라 여백·크기가 어긋날 수 있다.
3. **미확인 캡처 12장이 남아 있다.** 24장 중 12장만 열었다. 소환 관련 화면(확률 상세·등장 영웅 목록 등)이
   더 있을 수 있다.
4. **소환 밸런스의 게임플레이 영향을 검증하지 않았다.** 13회 소환으로 영웅이 몇 명 늘고 그게 층 진행
   난이도에 어떤 영향을 주는지는 안 봤다. 속성 상성이 실전투에 적용된 뒤(2026-07-25) 밸런스가 이미
   한 번 흔들린 이력이 있어, 영웅이 늘면 또 달라질 수 있다.
5. **배포하지 않았다.** `docs/play.html`만 재빌드했고 gh-pages push는 Gim 승인 대기.

## 7. 권고와 우선순위

| 순위 | 할 일 | 근거 |
|---|---|---|
| 1 | **Gim 폰에서 소환 실제 조작 확인** | 위 6-1. 로컬에서 확인 불가능한 구간 |
| 2 | **편성 화면에 `전투`(닫고 복귀) 버튼** | 명세 7번의 남은 전부. 난이도 낮음 |
| 3 | 진입점 위치 Gim 확인 | "요새 탭 우하단 바로가기"가 "호드워와 동일한 위치"로 인정되는지 |
| 4 | 미확인 캡처 12장 확인 | 놓친 화면이 있는지 |
| 5 | App.js·useGame.js 분리 | 규칙 14 위반 상태 유지 중 |

## 8. 이번에 또 걸린 함정 (문서에 반영함)

1. **EBUSY 함정에 세 번째로 걸렸다.** `npx serve -l 8099 -s .` 프로세스 2개가 dist를 잠그고 있었다.
   → 범인 찾는 PowerShell 한 줄을 HANDOFF에 적어 뒀다.
2. **`play.html` 안의 한글은 `\uXXXX`로 이스케이프된다.** 원문으로 검색해 전부 MISS가 나오는 바람에
   빌드 실패로 오인할 뻔했다. 두 형태를 모두 검사해야 한다. → HANDOFF에 적어 뒀다.
3. **브라우저 페인은 "완전 불가"가 아니라 "부분 가능"이었다.** 기존 인수인계는 "스크린샷·터치 조작 불가"라고만
   적혀 있었는데, 실제로는 `resize_window`로 뷰포트를 주면 **접근성 트리는 읽힌다**(그전엔 0×0 빈 페이지).
   클릭만 안 된다. → 더 정확하게 고쳐 적었다.

---

# 2026-07-27 — 테스트 모드: 인앱 조건·제약 전면 해제

## 1. 무엇을 왜 했나

**Gim 지시**: "현재는 테스트 버전이니 인앱내 모든 조건 및 제약 해제해."

"모든"의 범위가 갈릴 수 있어(해금만? 재화도? 레벨 상한도?) **코드를 건드리기 전에** 실제 제약을
전부 조사해 표로 제시하고 선택박스로 확인받았다. Gim 결정: **전부 해제(A~G)** · **코드 상수 한 줄** 방식.

## 2. 조사로 찾아낸 제약 전부

| 코드 | 제약 | 조건 | 위치 |
|---|---|---|---|
| A | 난이도 해금 | 험난30·지옥60·나락100층 (`peakStage`) | `difficulty.mjs:difficultyUnlocked` |
| B | 콘텐츠 해금 9종 | 소환8·던전20/35·탑40·펫45·문장50·아레나55·정령60·길드75 | `unlocks.mjs:isUnlocked` |
| C | 레벨 상한 | 랭크 × 20 | `units.mjs:levelCap` |
| D | 돌파(랭크업) | 소환석 `20×r²` 또는 동일영웅 중복 1명 | `character.mjs:ascend` |
| E | 캠페인 챕터 | 이전 챕터 클리어 필요 | `campaign.mjs` 2곳 |
| F | 재화 소모 | 잔액 부족 시 실패 | `economy.mjs:spend` |
| G | 스킬 슬롯 | `min(3, rank+1)` | `skills.mjs:skillSlots` |

## 3. 설계 — 스위치 하나, 통로 하나

### 3-1. 왜 규칙마다 뜯지 않았나
각 규칙을 직접 고치면 **출시 때 되돌리다 반드시 하나 빠뜨린다.** `system/core/testmode.mjs`에
`const ON = true` 한 줄을 두고 게이트들이 그걸 참조하게 했다. 출시 직전 **한 줄만 `false`**로 바꾸면 원복된다.

### 3-2. `spend()` 한 곳이 D까지 푼 이유 (핵심)
조사 중 **재화 소모가 전부 `economy.spend()` 한 함수를 지난다**는 걸 확인했다 —
소환·레벨업·돌파·스킬 강화·장비 강화 전부. 그래서 `spend()`에 가드 하나를 넣자
**F(재화)와 D(돌파 조건)가 동시에** 풀렸다. `ascend()`는 손대지 않았다
(`if (spend(...))`가 항상 참이 되어 소환석 경로로 통과하므로 중복영웅 요구가 사라진다).
호출부마다 가드를 넣는 것보다 diff가 작고 빠뜨릴 자리가 없다.

### 3-3. 🔴 가장 위험했던 지점 — 테스트가 조용히 무의미해진다
`spend()`를 무조건 통과시키면 **재화 차감을 단언하는 기존 테스트가 깨진다.** 그런데 더 나쁜 시나리오는
그 반대다 — 테스트가 **깨지지 않고 그냥 통과**해버리면 300여 개가 아무것도 검증하지 못하는 상태가 된다.

해결: `node --test`가 자식 프로세스에 넣는 `NODE_TEST_CONTEXT`를 감지해 **테스트에서는 스스로 꺼진다.**
추측하지 않고 실측으로 확인했다.
```
node --test 안 : NODE_TEST_CONTEXT="child-v8"
일반 실행      : undefined
```
웹 번들 대비로 `globalThis.process && process.env && ...`로 감쌌다(`process`가 없어도 안전).

## 4. 한 일 (코드)

| 파일 | 변경 |
|---|---|
| `system/core/testmode.mjs` | **신규** — `ON` 한 줄 + 테스트 자동 차단 + `TEST_LEVEL_CAP` |
| `system/core/economy.mjs` | `spend()` 통과 (**F + D**) |
| `system/core/difficulty.mjs` | `difficultyUnlocked()` (A) |
| `system/core/unlocks.mjs` | `isUnlocked()` (B) |
| `system/core/units.mjs` | `levelCap()` → 999 (C) |
| `system/core/campaign.mjs` | 챕터 `unlocked` + `fightChapter` 가드 (E) |
| `system/core/skills.mjs` | `skillSlots()` → 3 (G) |
| `system/test/testmode.test.mjs` | **신규** — 안전장치 + 실제 해제 검증 3건 |

**레벨 상한을 `Infinity`가 아니라 999로 둔 이유** — 진행바·`Lv{n}/{cap}` 표시가 `∞`에서 깨질 수 있다.
999면 테스트 목적으로 사실상 무제한이면서 렌더가 안전하다.

## 5. 검증한 것

| 검증 | 결과 |
|---|---|
| 테스트 | **306개 통과**(303 + 신규 3). 자동 차단이 동작해 기존 단언이 그대로 유효 |
| 스위치 ON 실증 | 자식 프로세스(테스트 밖)에서 재화0 지불 통과·나락 열림·길드 열림·상한>20·슬롯3 확인 |
| 웹 번들 실증 | 난이도 버튼이 **`험난 난이도 잠김 · 30층 필요` → `험난 난이도 · 보상 8배`** 로 바뀐 것을 렌더에서 확인 |
| 빌드 | 번들 해시 `06a9d6ef…` → **`938d4444…`** 변경 확인 |

`testmode.test.mjs`는 같은 프로세스에서 확인할 수 없는 것(스위치 ON 동작)을
**`NODE_TEST_CONTEXT`를 지운 자식 프로세스**로 재현해 검증한다. Windows에서는 ESM import에
절대경로를 못 써서 `pathToFileURL`로 `file://` URL을 만들어야 했다(처음에 `ERR_UNSUPPORTED_ESM_URL_SCHEME`로 실패).

## 6. ⚠️ 해제하지 않은 것 · 확인하지 못한 것

**의도적으로 남긴 것**
1. **캠페인 클리어 기록은 순서대로만 오른다.** 12챕터에 바로 들어가 이길 수는 있어도 진행도가
   건너뛰어 기록되지 않는다. 세이브가 앞뒤 안 맞는 상태(`cleared=1`인데 12챕터 클리어)가 되는 걸 막았다.
2. **소환 화면의 `종족 모집`·`우정 모집`** — 제약이 아니라 **구현이 없는 것**이다. 열어도 나올 내용이 없다.
3. **🔒 표시 자체** — 어디가 원래 잠기는 자리인지 보여야 출시 때 되돌릴 곳을 찾는다.

**확인하지 못한 것**
1. **인게임에서 실제로 눌러 확인하지 못했다.** RN-Web이 합성 클릭을 안 받는다(이전 세션과 동일).
   난이도 4단 개방은 렌더로 확인했지만, **레벨업 연타·돌파·캠페인 12챕터 직행·스킬 3슬롯은 미확인**이다.
2. **재화 무한 상태에서 방치 틱·오프라인 정산이 어떻게 되는지 안 봤다.** `earn()`은 손대지 않았으니
   수입은 정상일 것으로 보이나 **확인한 것은 아니다.**
3. **레벨 999까지 올렸을 때 전투력·전투 판정이 정상인지 안 봤다.** `computeStats`가 레벨에 비례하므로
   극단값에서 오버플로·표시 깨짐이 있을 수 있다. 미검증.

## 7. 권고

| 순위 | 할 일 | 근거 |
|---|---|---|
| 1 | **폰에서 제약 해제 실제 확인** | 위 6-1. 특히 레벨업·돌파·캠페인 직행 |
| 2 | **밸런스 판단은 이 빌드로 하지 말 것** | 재화 무한이라 체감이 전부 사라졌다 |
| 3 | 출시 전 `testmode.mjs` `ON = false` | 잊으면 전 제약이 풀린 채 나간다. HANDOFF 상단에 🔴로 적어 뒀다 |

---

# 2026-07-27 — 영웅 상세 반복 수정 · 서브탭 3종 · 파티 편입 경로 복구

## 1. 영웅 상세 반복 수정 (Gim 지적 5회에 걸쳐)

| 지적 | 원인 · 처리 |
|---|---|
| 속성 아이콘이 네임카드에 겹침 | **두 번 틀렸다.** 1차: `zIndex:3`이 있는데도 리본이 나중에 렌더돼 덮고 있었다 → 그리기 순서를 뒤집음. 2차: Gim의 "앞으로 이동"은 z-순서가 아니라 **겹치지 말라**는 뜻이었다 → 겹침 `-6`→`+4`. 3차: 결국 **아이콘 자체를 제거**(속성은 idBar에 이미 있음) |
| 레벨업 버튼 추가로 스크롤바 | 버튼 `paddingVertical 11→8`, 여백 `10→6·8`. 돌파 버튼·소환석 비용 줄이 함께 빠져 공간이 더 생겼다. **Gim 확인: 스크롤바 사라짐** |
| 최대 버튼이 나타날 때 아래 버튼이 밀림 | 조건부 렌더로는 못 고친다 → **자리를 항상 잡아 두고**(`opacity:0` + `pointerEvents:none`) 보이기만 토글 |
| 뒤로가기 2곳 | 좌상단 제거(하단 바에 동일 버튼) |
| LV/전투력 위치 | 절대배치(`bottom:46`) → idBar 줄 오른쪽 끝(`marginLeft:'auto'`). idBar가 비워 두던 `paddingRight:70`도 해제 |
| `pedestal`·`traitBar`가 뭔지 | 캐릭터 발밑 회색 받침대 · `방어 · 1★` 특성 바. 둘 다 장식 → 제거 |
| 역할·속성 아이콘 크기 | 50% 확대(20→30px, 글자 10→15) |

### 🔴 편성 버튼 삭제가 만든 사고
Gim이 `편성 해제`·`돌파` 버튼 삭제를 지시했다. 지시대로 지웠지만 **확인해 보니 그 버튼이
`togglePartyMember()`의 유일한 호출부였다.** `FormationModal`의 5칸 슬롯은 `View`라 누를 수 없고
프리셋은 *이미 편성된* 파티를 저장·적용만 한다. → **소환으로 영웅을 늘려도 전투에 못 내보내는 상태**가 됐다.

지시는 그대로 이행하되 근거(호출부 검색 결과)와 함께 즉시 보고하고 선택지 3개를 제시했다.
**Gim 결정: "파티편입경로는 모험탭에서".**

## 2. 파티 편입 경로 — 모험 탭 하단 `PartyStrip`

`app/screens/PartyStrip.js` 신규. 기준은 호드워 편성 캡처 `184914`.
- 영웅 카드 가로 목록 — **탭하면 편성/해제**(✅ 표시 · `N레벨` · 등급 메달)
- 속성 필터 바(`⌃ ALL` + 속성 원형) · 파티 인원 `N/5`
- 하단 액션 — `일괄 진형 배치`(autoFormation) · `전투`(요새 탭으로 이동)

**호드워와 의도적으로 다른 점** — 호드워는 전투 화면 위에 겹치는 별도 화면이지만,
엘드리아는 모험 탭 하단에 **상주**시켜 한 번의 탭도 없이 편성할 수 있게 했다.
`전투` 버튼은 전투를 *시작*하지 않고 **요새(전투 화면)로 이동**한다 — 엘드리아는 상시 자동 전투이기 때문
(명세 7번 정정 참조).

상한·최소 인원 판정은 `togglePartyMember`가 이미 이유 문자열까지 돌려주므로 화면에서 다시 판정하지 않았다.

## 3. 영웅 상세 서브탭 3종 (Gim 실기 캡처 3장 기준)

`HeroDetail`이 400줄을 넘어 **규칙 14(한 기능 = 한 모듈)** 적용, 패널을 각각 분리했다.

| 탭 | 파일 | 구성 |
|---|---|---|
| 장비 | `HeroGearPanel.js` | 룬 5칸 · 장비 4칸(등급색 + 좌상단 속성 뱃지) · `일괄 해제`/`일괄 장착` |
| 초월 | `HeroAscendPanel.js` | 성급 바 `★ ▶▶▶ ★★` · 효과 2줄 · 재료 2장 `(보유/필요)` · 금색 `초월` |
| 코스튬 | `HeroCostumePanel.js` | 보너스 2줄 · `‹ ›` 카드 가로 목록(`장착 중` 리본) · 상태 버튼 + `?` |

**초월 = 엘드리아 돌파(ascend).** 호드워의 `승성`이 정확히 같은 기능이라, 속성 탭에서 지운 돌파가
이 탭으로 돌아왔다. 재료는 호드워의 영웅 조각 2종 대신 **소환석 · 동일 영웅 중복**을 카드로 놓았다.

**수치를 화면에 복제하지 않았다** — `units.mjs`에 `rankLevelCap(rank)`를 추가하고 `levelCap()`이
그것을 쓰게 했다. 초월 패널은 `rankLevelCap(rank+1)`로 "다음 랭크가 여는 상한"을 얻는다.
랭크×20 공식이 두 곳에 있으면 조용히 어긋난다.

장비·코스튬은 모듈이 파킹이라 **배치·색·버튼만** 맞춰 뒀다. 켜면 아이템만 꽂으면 된다
(`costumesFor(state, unit)`은 이미 목록을 반환한다).

## 4. 검증

- 테스트 **306개 통과**(전 구간). 앱 부팅 **콘솔 에러 0건**
- 번들 해시 매 배포마다 변경 확인 · 배포본과 로컬 `play.html`을 **sha256으로 대조**해 반영 확인
- Gim 실기 확인: **스크롤바 사라짐 확인됨**

### 검증 도구에서 겪은 오탐 3건 (모두 내 스크립트 문제, 코드는 정상)
1. `play.html`의 한글은 `\uXXXX`로 이스케이프된다 → 원문 검색은 전부 MISS. 두 형태 모두 검사해야 한다.
2. **템플릿으로 조합되는 문자열은 통째로 검색되지 않는다.** `{LEVEL_STEP}레벨 상승`·
   `${d.label} 난이도`는 번들에 조각으로만 존재한다. 조각으로 나눠 확인해야 한다.
3. `·`(U+00B7)는 `\uXXXX`가 아닌 다른 형태로 나올 수 있어 그 문자를 포함한 검색이 실패했다.
   스타일 참조 감사 스크립트도 정규식 lookbehind 실수로 전부 오탐을 냈다 —
   **던져 쓰는 검증 스크립트를 디버깅하는 데 시간을 쓰지 말고 실물(빌드·콘솔)로 확인하는 게 빠르다.**

## 5. ⚠️ 확인하지 못한 것

1. **영웅 상세·모험 탭의 실제 조작을 여전히 확인하지 못했다.** RN-Web이 합성 클릭을 받지 않아
   탭 전환조차 불가능하다. 서브탭 3종 패널과 `PartyStrip`은 **한 번도 열어보지 못한 상태**다.
   문자열이 번들에 들어간 것과 부팅 무에러까지만 확인했다.
2. **각 패널이 32% 높이 안에 들어가는지 미검증.** 계산상 장비 탭이 가장 빡빡하다(룬5 + 장비4 + 버튼).
3. **`PartyStrip`이 모험 탭 세로 공간을 약 150px 먹는다.** 챕터 목록이 그만큼 좁아지는데
   실제로 답답한지 보지 못했다.
4. 초월(ascend) 실행 후 스킬 슬롯·레벨 상한이 화면에 제대로 반영되는지 미검증.

## 6. 권고

| 순위 | 할 일 |
|---|---|
| 1 | 폰에서 **모험 탭 편성 줄** 확인 — 카드 탭으로 편성이 되는지, 5명 상한 메시지가 뜨는지 |
| 2 | 폰에서 **서브탭 3종** 레이아웃·스크롤바 확인 |
| 3 | 소환 → 편성 → 전투로 이어지는 한 바퀴가 실제로 도는지 확인. 이번 작업 전체의 목적이다 |
