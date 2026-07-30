// ─────────────────────────────────────────────────────────────
// 자원/경제 — 장르/컨셉 무관.
// 자원은 추상 키로만 다룬다:
//   currency : 소프트 재화 (컨셉에서 골드/크레딧 등으로 표시)
//   growth   : 성장 재료 (레벨업에 소모)
//   summon   : 소환 재화 (신규 유닛 획득)
//   gem      : 프리미엄 재화 (BM/상점 — 다이아 등)
// ─────────────────────────────────────────────────────────────
import { TEST_MODE } from './testmode.mjs';

export function createWallet(init = {}) {
  return { currency: 0, growth: 0, summon: 0, gem: 0, ...init };
}

export function earn(wallet, gains) {
  for (const [k, v] of Object.entries(gains)) {
    wallet[k] = (wallet[k] || 0) + v;
  }
  return wallet;
}

// 비용을 지불할 수 있으면 차감하고 true, 아니면 false.
// 테스트 모드에서는 항상 통과하고 차감하지 않는다(system/core/testmode.mjs).
//   ※ 재화 소모는 전부 이 함수를 지난다 — 소환·레벨업·돌파·스킬·강화.
//     그래서 여기 한 곳만 뚫으면 "재화 제약"과 "돌파 조건"이 동시에 풀린다.
export function spend(wallet, cost) {
  if (TEST_MODE) return true;
  for (const [k, v] of Object.entries(cost)) {
    if ((wallet[k] || 0) < v) return false;
  }
  for (const [k, v] of Object.entries(cost)) {
    wallet[k] -= v;
  }
  return true;
}
