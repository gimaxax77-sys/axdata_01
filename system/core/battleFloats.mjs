// 전투 데미지 숫자(플로팅 텍스트) 슬롯 관리 — 순수 함수.
//   화면(BattleView)에서 쓰지만 JSX가 없어야 테스트가 되므로 코어에 둔다(의존 방향 화면 → 코어).
//
// ⚠️ 왜 "목록"이 아니라 "고정 슬롯"인가 (2026-07-26 Gim 폰 화면 제보로 재설계)
//   이전 구현은 배열에 계속 push하고 filter/slice로 줄였다. 그런데 실기에서는 14개가
//   동시에 남아 겹쳐 보였다 — 렌더에서 slice(-5)로 잘랐는데도 그랬다. 즉 "리스트 길이를
//   줄이면 DOM도 줄어든다"는 전제가 실제 기기에서 성립하지 않았다.
//   그래서 길이를 **구조적으로 못 늘리게** 바꿨다: 슬롯 N칸을 라운드로빈으로 덮어쓴다.
//   배열 길이가 항상 N이라 몇 개가 쌓이는 상황 자체가 불가능하다.

export const FLOAT_MS = 1100; // 숫자 한 개의 수명
export const FLOAT_SLOTS = 5; // 동시 표시 칸 수(고정)

export function emptySlots() {
  return Array.from({ length: FLOAT_SLOTS }, () => null);
}

// 다음에 덮어쓸 칸 — 라운드로빈이라 가장 오래된 것이 밀려난다.
export function nextSlot(idx) {
  return (idx + 1) % FLOAT_SLOTS;
}

// 슬롯 하나를 덮어쓴 새 배열. 길이는 언제나 FLOAT_SLOTS.
export function writeSlot(slots, idx, float) {
  const next = slots.slice();
  next[idx % FLOAT_SLOTS] = float;
  return next;
}

// 수명이 다한 칸을 비운다. 바뀐 게 없으면 같은 배열을 돌려줘 불필요한 리렌더를 막는다.
export function expireSlots(slots, now) {
  let changed = false;
  const next = slots.map((f) => {
    if (f && now - f.born >= FLOAT_MS) { changed = true; return null; }
    return f;
  });
  return changed ? next : slots;
}
