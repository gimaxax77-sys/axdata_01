# 인수인계 — 엘드리아 호드워 UI 전환

> **최종 갱신 2026-07-27.** 이전 세븐나이츠 기준 인수인계는 폐기하고 현재 상태로 다시 씀.
> **작업 폴더: `D:\.CODE\AXdata\axdata_01_eldria`** (이 문서의 모든 경로는 여기 기준)
> 폰 확인 링크 **https://gimaxax77-sys.github.io/axdata_01/?v=38**
> 브랜치 `claude/3d-poc` · 테스트 **309개** 통과

## 0. 먼저 읽을 순서

1. **`docs/HORDWAR_SPEC.md`** — 기준 명세. Gim 실기 캡처(1080×2520) 기반. **코드 고치기 전에 여기부터.**
2. **`docs/PARKED.md`** — 무엇이 왜 꺼져 있고 어떻게 되살리는지.
3. **`research.md`** — 전체 작업 이력·결정과 근거(누적, 아래로 갈수록 최신).
4. 이 문서 — 지금 상태와 다음 할 일.

세븐 자료(`docs/SEVEN_REVAMP.md`·`docs/seven_real.html`)는 **폐기가 아니라 참고자료로 강등**. 코드에 남은 세븐 흔적은 없다.

## 1. 지금 어떤 상태인가

**기준**: 「호드워: 어벤저의 소환」. 전투화면 레이아웃은 이번이 4번째 기준 변경이다 — **갈아엎기 전에 반드시 명세·캡처를 먼저 대조할 것.**

### 하단 메뉴바 6탭 (전부 진입 가능)

> **⚠️ 2026-07-27 탭 구조 개편(Gim 지시).** 요새 탭이 **전투 화면 → 요새 맵**으로 바뀌고,
> 전투 화면은 **모험 탭 아래**로 내려갔다. 옛 `IdleScreen.js`는 `BattleScreen.js`로 이름이 바뀌었다.

| 탭 | 화면 | 실제 동작 여부 |
|---|---|---|
| 🏰 요새 | `FortressScreen` → `SummonScreen` | 건물 노드 8개. **영웅 제단(모집)만 실제 동작**, 나머지는 준비 중 패널 |
| 🌄 필드 | `FieldScreen` | 월드맵 노드 9개(준비 중 패널). **스크롤 없이 한 화면**에 담는다 |
| 🏛️ 길드 | `GuildScreen` | 골격만(검색·랭킹·창설·일괄신청 → 준비 중 패널) |
| 🦸 영웅 | `HeroScreen` → `HeroDetail` · `FormationModal` | ✅ 카드 그리드·속성 필터·상세(서브탭 4종)·**좌우 영웅 전환 화살표** |
| 🎁 혜택 | `PerkScreen` | ✅ **일일 출석만 실제 동작**(7일 순환), 나머지 서브탭은 준비 중 |
| ⚔️ 모험 | `AdventureScreen` → `BattleScreen` + `PartyStrip` | ✅ 스테이지 화면(마일스톤=캠페인 12챕터 · 난이도 4단) → `전투 시작` → 전투 화면 |

**영웅 상세 서브탭 4종** — 각각 별도 모듈(규칙 14).
`속성`(HeroDetail 내장) · `장비`(`HeroGearPanel`) · `초월`(`HeroAscendPanel`) · `코스튬`(`HeroCostumePanel`).
**초월 = 돌파(ascend)** 다 — 속성 탭의 `돌파` 버튼을 없애면서 이 탭으로 옮겼다.

### 핵심 규칙 (놓치면 사고 남)

- **파티 편입은 모험 탭 하단 `PartyStrip` 한 곳뿐이다**(Gim 결정 2026-07-27).
  영웅 상세의 `편성` 버튼을 없앤 뒤 `togglePartyMember` 호출부가 사라져 파티를 못 바꾸던 것을 여기로 옮겼다.
  편성 모달(`FormationModal`)의 슬롯은 **표시 전용**이라 누를 수 없다 — 프리셋 저장·적용만 한다.
- **편성 5인 · 진형 2단(전열2·후열3).** `MAX_PARTY`는 `formation.PARTY_CAP`에서 **파생**된다. 인원을 바꾸려면 `ROLE_CAP`만 고치면 전부 따라온다. 중열(`mid`)은 **없다.**
- **자물쇠는 지금 안 잠근다.** 구축·테스트 중이라 전부 개통해 두고 🔒 표시만 남겼다. **출시 직전에 잠근다**(Gim 지시). 되돌릴 자리엔 `Gim 지시 2026-07-26` 주석이 있다.
- **🔴 테스트 모드가 켜져 있다 — 인앱 제약이 전부 풀린 상태다.**
  난이도 해금 · 콘텐츠 해금 · 레벨 상한 · 돌파 조건 · 캠페인 챕터 · **재화 소모** · 스킬 슬롯이 전부 무력화돼 있다.
  **스위치는 `system/core/testmode.mjs` 의 `const ON = true` 한 줄** — 출시 직전 `false`로 바꾸면 전부 원복.
  상세 표는 `docs/PARKED.md` "테스트 모드".
  > ⚠️ **밸런스를 이 상태에서 판단하지 말 것.** 재화가 무한이라 체감 난이도·소환 아쉬움이 전부 사라져 있다.
  > 자동화 테스트에서는 강제로 꺼지므로 테스트 결과는 여전히 유효하다.
- **옵션 모듈 18종이 꺼져 있다.** `elements`·`rarity` 2종만 켜져 있다(호드워 UI 자체의 부품 — 속성 필터·등급 메달). 되살리는 절차는 `docs/PARKED.md`.
- **캡처의 플레이어 카드는 옮기지 않는다.** 호드워는 탭마다 상단바가 없어 각 화면이 직접 그리지만, 엘드리아는 글로벌 상단바가 항상 떠 있다. 그대로 옮기면 **한 화면에 두 번** 나온다(길드에서 실제로 발생, Gim 지적).

### 소환(모집) — 2026-07-26 되살림 ✅

요새 맵의 **🗿 영웅 제단** 건물 → `SummonScreen`. 호드워 실기 캡처 2장 기준으로 새로 만들었다.

- `system/core/gacha.mjs`는 **손대지 않았다**(단차·10연·천장 90·SR 바닥보장 전부 이미 있었다). 화면만 새로 씌웠다.
- 파킹된 `GachaScreen.js`는 **되살리지 않았다** — 배너 6개 중 5개가 파킹 모듈이라 통째로 되살리면 파킹 결정이 무너진다.
- 신규 세이브 지갑에 소환석 130 → **13회 즉시 소환 가능**.
- 등급 메달 표기(`GRADE`·`GRADE_BG`)는 영웅 카드와 공유하므로 **`app/theme.js`로 옮겼다**(HeroScreen이 갖고 있던 지역 상수를 승격).

## 2. 다음에 할 일

### 🔴 Gim 결정 대기
1. ~~**명세 7번**~~ — **해결됨.** 호드워도 **상시 자동 전투**였다(전제가 틀렸다). `PartyStrip`의 `전투` 버튼까지 붙어 마무리됐다. 상세는 `docs/HORDWAR_SPEC.md` "7번 전제 정정".
2. **필드/길드/혜택 노드 안을 채울 것인가** — Gim 결정(2026-07-26): **나중에.**
3. **App.js·useGame.js(357줄) 분리** — 규칙 14 대상인데 이 작업 자체가 규칙 13(승인 게이트)에 걸린다.
4. **진행 속도** — Gim이 "전체가 빠르다"고 했고 **연출만** 늦추기로 했다(2026-07-27).
   실제 진행 속도(`useGame` `TICK_GAME_SEC`=24 → 실제 1초에 게임 24초, `idle.mjs` `AUTO_ADVANCE_MARGIN`=2.5초)는
   **손대지 않았다.** 밸런스를 볼 때 다시 꺼낼 항목.

### 🔧 경로가 끊긴 코어 기능 (우선순위)
| 순위 | 기능 | 영향 |
|---|---|---|
| ~~1~~ | ~~소환~~ | **✅ 2026-07-26 되살림** (요새 탭 → 영웅 제단) |
| 1 | 환생 | `accountMods.powerMult`가 ×1 고정 |
| 2 | 도감·업적·시즌 | 리텐션 축이 통째로 없음 |
| 3 | 본진 | 코어만 살아 있음 |

### 🎨 "인터페이스 온전히 동일" 미달
VICTORY 팝업 · 이벤트 팝업 · 장비/유물 인벤토리 · 속성 보너스 화면 · 일일 임무 목록 · 소환 10연 연출 · 월드맵 계약 노드
- 상단 초상화가 아직 **이모지 🧝**, 닉네임은 데이터가 없어 **칭호로 대체** 중.
- 노드·카드 아트는 전부 이모지(Gim 결정: 나중에 이미지만 교체).

## 3. 빌드·배포 (함정 있음)

작업 폴더 = `D:\.CODE\AXdata\axdata_01_eldria` (여기가 프로젝트 루트).
```
EXPO_OFFLINE=1 npx expo export --platform web && node scripts/build-play.mjs
```
→ `docs/play.html` (약 24.5MB 단일 파일). Windows npm run은 env prefix가 안 먹어 **Git Bash에서 직접** 실행.

배포는 gh-pages 임시 클론에 일반 push(force·`gh api POST`는 차단됨):
```
SP="<scratchpad>"; cp docs/play.html "$SP/ghp/index.html"
cd "$SP/ghp" && git add index.html && git commit -qm "..." && git push origin gh-pages
```

> ### ⚠️ 세 번 당한 함정 — 옛 내용이 조용히 배포된다
> 로컬 확인용 정적 서버가 `dist`를 잠그면 `expo export`가 **EBUSY로 실패**하는데, `build-play.mjs`는 **옛 dist로 성공**한다.
> **순서를 지킬 것** — ① 서버 종료 → ② export 출력에서 **번들 해시가 바뀐 것 확인** → ③ 서버 재기동 후 **실제 렌더 확인** → ④ 배포.
> 한글 문자열을 `grep`으로 검증하지 말 것(콘솔 인코딩으로 검색어가 깨진다). 렌더로 본다.
>
> **잠근 프로세스 찾는 법**(2026-07-26에 또 걸렸다):
> ```
> Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Select ProcessId, CommandLine
> ```
> `npx serve -l 8099 -s .` 가 범인이었다. `Stop-Process -Id <PID> -Force` 후 export.
>
> **`play.html` 안의 한글은 `\uXXXX`로 이스케이프된다.** 번들에 새 문자열이 들어갔는지 확인할 때
> 원문으로 찾으면 전부 MISS가 나와 빌드 실패로 오인한다. 두 형태를 **모두** 검사할 것.

### 안드로이드 APK (로컬 빌드)

```
$env:JAVA_HOME="D:\Android\jdk17"; $env:ANDROID_HOME="D:\Android\Sdk"
cd android; .\gradlew.bat assembleRelease --no-daemon
```
→ `android/app/build/outputs/apk/release/app-release.apk` (약 6분 30초, 87.8MB).
`G:\내 드라이브\APK\`로 복사하면 폰에서 받는다. 릴리스는 **debug 키스토어로 서명**돼 있어 사이드로딩 전용이다.

> ### ⚠️ 한글 폴더명 때문에 반드시 두 줄이 필요하다
> `android/gradle.properties`에 아래가 없으면 빌드가 **시작도 못 하고** 실패한다.
> ```
> org.gradle.jvmargs=… -Dfile.encoding=UTF-8
> android.overridePathCheck=true
> ```
> - 없을 때 증상 ① `Included build '…@react-native\gradle-plugin' does not exist` — **폴더는 실제로 있다.**
>   `settings.gradle:7`이 node 출력(UTF-8)을 JVM 기본 문자셋(MS949)으로 읽어 `엘드리아`가 깨진다.
> - 없을 때 증상 ② `Your project path contains non-ASCII characters.` — AGP의 경로 차단.
> - **셸(PowerShell/Git Bash) 문제가 아니다.** 둘 다 똑같이 실패한다. `chcp`가 65001이어도 JVM은 MS949다.
> - **`android/`는 `.gitignore` 대상이라 이 두 줄이 커밋되지 않는다.** `expo prebuild`로 폴더가
>   재생성되면 사라지고 같은 실패를 처음부터 다시 겪는다(2026-07-29에 실제로 재발).

## 4. 검증

- 테스트 **309개** — `node --test system/test/*.test.mjs`. **완료 보고 전에 반드시 돌린다.**
- 브라우저 페인 — `resize_window`로 뷰포트를 주면(예: mobile 375×812) **접근성 트리를 읽을 수 있다**(그전엔 0×0으로 빈 페이지가 나온다).
  하지만 **RN-Web `TouchableOpacity`는 합성 클릭을 받지 않는다** — 버튼을 눌러도 아무 일이 없다.
  → **렌더 텍스트·접근성 라벨 확인까지만 신뢰하고, 조작 확인은 Gim 폰에 맡긴다.**

## 5. 소통 (Gim)

- 규칙은 **`D:\.CODE\AXdata\CLAUDE.md`(공통) + 이 폴더 `CLAUDE.md`(프로젝트 전용)**. 호출 명령(`서브`·`롣`·`멤`)은 전역 문서. 같은 규칙을 여러 문서에 복사하지 말 것.
- **결론 먼저, 초보자 눈높이, 한글은 마침표 종결.** 결정 지점은 **선택박스**로.
- **큰 수정은 착수 전 승인**(파일 3개↑·이동/삭제·동작 변경·배포). **요청이 불명확하면 이해한 바를 먼저 확인.**
- 코드 변경 후 **항상 play.html 재빌드·재배포**해 폰 링크로 확인시킨다.
- 점검·검토·조사·설계는 **`research.md`에 상세 보고서**로 남긴다(확인 못 한 것도 반드시 적는다).
