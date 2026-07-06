// ─────────────────────────────────────────────────────────────
// 밸런스 상수 단일 소스 — 게임의 "숫자 감각"이 전부 여기 모인다.
// progression/stats/units/enhance/gear 가 모두 이 값을 참조한다.
// 밸런스 시뮬레이터가 이 값을 바꿔가며 성장 곡선을 실험한다.
// (기본값을 바꾸지 않는 한 게임 동작은 그대로다.)
//
// 값을 평면(flat)으로 두어 오버라이드/스냅샷이 단순하도록 했다.
// ─────────────────────────────────────────────────────────────

export const BALANCE = {
  // 적 스탯 (스테이지 곡선)
  enemyBase: { hp: 900, atk: 70, def: 30 },
  // 적 강화율 = 보상 증가율(1.13) → 수입이 난이도를 따라가 벽이 완만.
  // 남는 벽은 "성장 비용의 지수화"라 환생(파워 배수)이 자연스레 이를 넘는다.
  enemyGrowth: 1.13, // 스테이지당 적 강화율

  // 스테이지 보상 (수입 곡선)
  rewardBase: { currency: 20, growth: 8 },
  rewardGrowth: 1.13, // 스테이지당 보상 증가율

  // 유닛 성장 (스탯 곡선)
  statPerLevel: 0.08, // 레벨당 스탯 +8%
  statPerRank: 0.25, // 랭크당 스탯 +25%
  spdPerLevel: 0.01, // 레벨당 속도 +1%

  // 성장 비용 (지출 곡선) — 시뮬레이터가 밝혀낸 핵심 튜닝 포인트
  levelCostBase: 50, levelCostGrowth: 1.15, // 레벨업 (growth)
  enhanceCostBase: 40, enhanceCostGrowth: 1.25, // 각인 (currency)
  gearCostBase: 60, gearCostGrowth: 1.3, // 장비 강화 (currency)

  // 환생(prestige) 영구 보너스 — 지수적 벽을 넘는 곱셈형 루프.
  // 환생 포인트 1당: 방치 수입 배수 + 글로벌 파워 배수(상한 없음).
  // 파워 배수가 상한 없이 커져야 1.13ⁿ 난이도를 매 환생마다 따라잡는다.
  // 포인트당 파워 0.14 → 필요 환생 횟수↓·곡선 매끄러움↑(cv 0.67→0.53).
  prestigeIncomeBonus: 0.5,
  prestigePowerBonus: 0.14,
};

import { relicMods } from './relics.mjs';
import { petMods } from './pets.mjs';

// 계정 단위 보정 = 환생(prestige) + 유물(relic) + 펫(pet) 합산.
//   powerMult    : resolve()에 넘겨 전투력에 곱함
//   currencyMult / growthMult : 방치 수입에 곱함
// 새 계정 성장 축을 붙일 때도 여기 한 곳만 곱해주면 전 시스템에 반영된다.
export function accountMods(state) {
  const pr = state.prestige || 0;
  const income = 1 + pr * BALANCE.prestigeIncomeBonus;
  const rm = relicMods(state);
  const pm = petMods(state);
  return {
    powerMult: (1 + pr * BALANCE.prestigePowerBonus) * rm.power * pm.power,
    currencyMult: income * rm.currency * pm.currency,
    growthMult: income * rm.growth * pm.growth,
  };
}
