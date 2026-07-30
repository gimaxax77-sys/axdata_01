// 테스트 모드 — 인앱 조건·제약 전면 해제 (Gim 지시 2026-07-27)
//
// ┌─────────────────────────────────────────────────────────────┐
// │ ⚠️ 출시 직전에 아래 ON 을 false 로 바꾸면 전부 원복된다.      │
// │    다른 파일은 손대지 않아도 된다.                            │
// └─────────────────────────────────────────────────────────────┘
//
// 이 스위치가 푸는 것 (docs/PARKED.md "테스트 모드" 절과 같은 목록)
//   A 난이도 해금   difficulty.mjs  험난30·지옥60·나락100층 → 전부 선택 가능
//   B 콘텐츠 해금   unlocks.mjs     소환8·던전20/35·탑40·펫45… → 전부 열림
//   C 레벨 상한     units.mjs       랭크×20 → TEST_LEVEL_CAP
//   D 돌파 조건     (F로 해결)      소환석·중복영웅 요구가 사라진다
//   E 캠페인 챕터   campaign.mjs    이전 챕터 클리어 요구 없이 전부 진입
//   F 재화 소모     economy.mjs     spend() 가 항상 통과(차감도 안 한다)
//   G 스킬 슬롯     skills.mjs      랭크 무관 3칸 전부 개방
//
// 자물쇠 🔒 표시는 그대로 둔다 — 어디가 원래 잠기는 자리인지 보여야
// 출시 때 되돌릴 곳을 찾을 수 있다(자물쇠 정책, docs/PARKED.md).

const ON = true; // ← 출시 직전 false

// 자동화 테스트는 제약이 **살아 있는** 상태를 검증해야 하므로 강제로 끈다.
// node --test 는 자식 프로세스에 NODE_TEST_CONTEXT 를 넣는다(확인: "child-v8").
// 이게 없으면 재화 차감·해금 단언 테스트가 전부 무의미해진다.
const IN_TEST = !!(globalThis.process && globalThis.process.env && globalThis.process.env.NODE_TEST_CONTEXT);

export const TEST_MODE = ON && !IN_TEST;

// 해제 시 레벨 상한. 무한(Infinity)으로 두면 진행바·표시가 깨지므로 큰 유한값을 쓴다.
export const TEST_LEVEL_CAP = 999;
