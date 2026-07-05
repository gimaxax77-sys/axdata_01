import { getArchetype } from './archetypes.mjs';
import { collectUnitModifiers } from './modifiers.mjs';

// ─────────────────────────────────────────────────────────────
// 스탯 성장 공식 — 장르/컨셉 무관.
// 계산 순서:
//   1) 기본스탯 × 레벨배수 × 랭크배수   (원형 성장)
//   2) × (1 + 강화·스킬의 statPct)       (방향성 성장)
//   3) + 장비의 statFlat                 (착용 성장)
//
//   레벨: 스탯 +8%/레벨 (곱연산)
//   랭크: 스탯 +25%/랭크 (곱연산)
//   속도(spd): 성장 완만 +1%/레벨
// ─────────────────────────────────────────────────────────────

const PER_LEVEL = 0.08;
const PER_RANK = 0.25;
const SPD_PER_LEVEL = 0.01;

// 성장 요소를 반영하지 않은 "원형 성장"만 계산.
function baseGrownStats(unit) {
  const { base } = getArchetype(unit.archetype);
  const levelMult = 1 + (unit.level - 1) * PER_LEVEL;
  const rankMult = 1 + (unit.rank - 1) * PER_RANK;
  const growth = levelMult * rankMult;
  const spdMult = 1 + (unit.level - 1) * SPD_PER_LEVEL;
  return {
    hp: base.hp * growth,
    atk: base.atk * growth,
    def: base.def * growth,
    spd: base.spd * spdMult,
  };
}

// 스킬·강화까지 반영한 최종 스탯.
export function computeStats(unit) {
  const g = baseGrownStats(unit);
  const mods = collectUnitModifiers(unit);
  return {
    hp: Math.round(g.hp * (1 + mods.statPct.hp) + mods.statFlat.hp),
    atk: Math.round(g.atk * (1 + mods.statPct.atk) + mods.statFlat.atk),
    def: Math.round(g.def * (1 + mods.statPct.def) + mods.statFlat.def),
    spd: Math.round(g.spd * (1 + mods.statPct.spd) + mods.statFlat.spd),
  };
}

// 표시용 단일 전투력 지표(밸런싱/정렬용). 판정 자체는 stats로 한다.
export function computePower(unit) {
  const s = computeStats(unit);
  return Math.round(s.hp * 0.15 + s.atk * 1.2 + s.def * 0.6 + s.spd * 1.0);
}
