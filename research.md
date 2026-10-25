# axdata_01 엘드리아 연대기 — research.md

> 규칙: 루트 CLAUDE.md «보고 · 기록» — 100줄 상한, 쌓지 않고 지금 상태로 유지.
> 10-25 이전 원문은 `research_archive_~20261025.md`(1,776줄, 지우지 않음). 옛 절은 그 파일에서 날짜로 찾습니다.
> 할 일은 루트 `checklist.md`(3트랙 게임 셋 — 무기한 보류). 함정 · 교훈은 이 폴더 기억(MEMORY.md).

## 지금 상태 (2026-10-25)

- 무기한 보류. 진행 중인 작업 없음.
- 시험 309/309 통과 · `verify-genres` · `verify-character` 통과.
- 웹판 `docs/play.html` 08-30 빌드(25.2MB) = 공개 GitHub Pages 판(gimaxax77-sys.github.io/axdata_01)과 SHA-1 같음.
- APK 08-31 09:37 · 46,677,611 B(`android/app/build/outputs/apk/release/`). 드라이브 AX_Desk\APK 에는 올리지 않음(Gim 10-25 «보류 중이니 그대로»).
- 백엔드: Supabase 프로젝트(btmwstrcnxqqbdluqdrt)는 삭제됨(Gim 10-25 확인). 다시 열면 새 프로젝트 · 새 키로 시작하고 RLS 를 실서버에서 잰다.

## 요약 히스토리

- 07-13: 답변 · 기록 규칙을 7개 저장소에 횡전개. 아트 브릿지 확인 + 캐릭터 매핑 초안(33명 · 원형→몸 · 속성→색).
- 07-15: QoL 4종 — 던전 일괄 소탕 · 읽은 우편 비우기 · 재화 낭비 알림 · 하급 장비 자동 분해(시험 267).
- 07-16: 단순화 재설계 — 최소 코어 + 기능 플래그(features.mjs) · 컨트롤 판넬 · 21 KayKit 로스터(이름+원형만).
- 07-16: 전투 스프라이트 16프레임 · 첫 EAS APK · 네이티브 크래시 방어(pctW · ErrorBoundary 원인 표시).
- 07-17: 크래시 원인 확정(PowerBadge 네이티브 드라이버 혼용) · 등급 · 속성 모듈 끄기 · 전투 4상태 애니 · 배경 10종 · 적 몬스터 스프라이트 · 전체 재점검.
- 07-18: 원정(로그라이트) 모드 P0~P4 — run.mjs · boon 10종 · 원정 강화 상점 · RosterScreen 파일 분리(1401→1057줄).
- 07-19: 버벅거림 수정(SpriteAnim 리렌더 0) · 3D(expo-gl) 빌드 분리 · 플래그 가드 15개 보완 · 전투 연출 1~3차 · 로컬 안드로이드 빌드 환경.
- 07-23: 코어 라이브러리화 — `system/core/index.mjs` barrel(65모듈) · 엘로그와 공유는 안 함(루트 CORE_LIBRARY_REVIEW.md).
- 07-25: 전투 세로 자유 산개 · 세로형 방치형 GUI 조사 · 벤치마크를 세븐나이츠 키우기 → 호드워로 교체(docs/HORDWAR_SPEC.md).
- 07-25: 호드워 인터페이스 전환 — 옵션 모듈 18종 파킹(docs/PARKED.md) + 6탭 골격 → 구축 단계엔 6탭 전부 개통(`?v=10`).
- 07-26: 데미지 숫자 고정 슬롯 · 전체 재점검 · 지침서 3층 구조 정비(작업공간 전체 일 · 원문은 보관본).
- 07-26: 필드 · 길드 · 혜택 탭 · 영웅 탭 재작성 · 편성 7→5인 · 영웅 상세 전체화면 · 길드 중복 카드 제거(`?v=17`).
- 07-27: 소환(모집) 되살리기 · 테스트 모드(인앱 조건 · 제약 전면 해제 스위치 하나) · 영웅 상세 서브탭 3종 · 파티 편입 경로 복구 · 탭 구조 개편.
- 07-29: 로컬 APK 한글 경로 함정(Gradle · 네이티브 C++ 2단, 기억 eldria-apk-korean-path) · 뒤로가기 하단 통일 · 좌우 이동 화살표.
- 07-30: APK 재빌드 판정법 — 코드가 같으면 Gradle 이 다시 안 만듦 · 동일 판정은 `assets/index.android.bundle` 해시로.
- 08-10: 05 폴더 개명 반영(render tools → render studio) · 소급 기록.
- 08-31: R1 — assemble 스크립트 3개의 DST 를 자기 저장소 기준으로(b6b11a0). APK 46.7MB 재빌드.
- 10-13: 깃허브 작업 정리 — ci.yml(푸시마다 6시간 멈춤) · build.yml · ota.yml · 시연 3개 · 밸런스 모의(system/sim) 삭제(3838484).
- 10-25: 상태 점검(전부 정상) · P11 공개 저장소 .env 추적 해제(d689b70) · Supabase 삭제 확인 · P4 기록 가지치기(이 파일).

## 남은 것 · 확인 못 한 것 (다시 열 때 볼 것)

- 폰 실기 확인 못 한 화면: 소환 결과 · 영웅 상세 서브탭 3종(32% 높이) · 초월 뒤 스킬 슬롯 · 좌우 화살표 · 4자리 데미지 한 줄. 브라우저 pane 은 RN-Web 합성 클릭을 안 받아 PC 에서 못 누름.
- 진단용 ErrorBoundary(원인 표시)는 릴리스 전에 원복.
- 3D(expo-gl) Gradle 실패 원인은 미규명 — Model3D.js · yellowdragon.gltf 는 보존.
- 방어구 · 장신구 아이콘 아트 없음(이모지 폴백).
- 원격 옛 가지 2개(claude/3d-poc · claude/git-connection-status-rkjuko) 미정리.
- 빌드 전 로컬 정적 서버를 내린다 — dist 잠금이면 `build-play.mjs` 가 옛 dist 로 조용히 성공(이 폴더 CLAUDE.md 3).

## 기록

### 2026-10-25 20:55 — P4 기록 가지치기

- 요청: Gim «p4 진행계획 수립후 보고» → 계획 페이지 https://claude.ai/artifact/NbYxNXpTcagbu1VwKU54cK → 선택박스 «계획대로 진행»(이름 바꾸기 승인).
- 한 일: 옛 research.md 를 `git mv` 로 `research_archive_~20261025.md` 로(지문 ee0256ebd11b 전후 같음), 이 요약을 새로 씀. 앞선 사례 13 · 05 · 23(`research_archive_~20261008.md`) 방식 그대로.
- 결정: checklist.md · context-notes.md 는 만들지 않음 — 보류 중이라 할 일은 루트 checklist 한 곳, 함정은 기억 파일에 있음.

### 2026-10-25 18:50 — 공개 저장소 .env 정리 + Supabase 점검(P11)

- 루트 현황판 세션 요청 · Gim 선택박스 승인. `.env` 추적 해제 + `.gitignore` 에 `.env`(로컬 파일 유지 · 이력 청소 안 함).
- Supabase 주소는 통신사 · 구글 DNS 둘 다 «없는 이름», 대조군 slime-kingdom-g 는 응답 → Gim 이 삭제 확인. 설계 SQL 의 표 5개(profiles · saves · purchases · mail · remote_config)는 모두 RLS + 정책.
- 현황판 → 01 요청은 P11 한 건뿐(대화 기록 검색). 상세 원문은 보관본 맨 끝 절.
