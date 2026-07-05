import { getArchetype } from './archetypes.mjs';

// ─────────────────────────────────────────────────────────────
// 스탯 성장 공식 — 장르/컨셉 무관. 레벨과 랭크(성급)로만 결정된다.
//   레벨: 스탯 +8%/레벨 (곱연산)
//   랭크: 스탯 +25%/랭크 (곱연산)
//   속도(spd)는 성장 완만: +1%/레벨
// ─────────────────────────────────────────────────────────────

const PER_LEVEL = 0.08;
const PER_RANK = 0.25;
const SPD_PER_LEVEL = 0.01;

// 하나의 유닛에 대해 최종 스탯을 계산한다.
export function computeStats(unit) {
  const { base } = getArchetype(unit.archetype);
  const levelMult = 1 + (unit.level - 1) * PER_LEVEL;
  const rankMult = 1 + (unit.rank - 1) * PER_RANK;
  const growth = levelMult * rankMult;
  const spdMult = 1 + (unit.level - 1) * SPD_PER_LEVEL;

  return {
    hp: Math.round(base.hp * growth),
    atk: Math.round(base.atk * growth),
    def: Math.round(base.def * growth),
    spd: Math.round(base.spd * spdMult),
  };
}

// 표시용 단일 전투력 지표(밸런싱/정렬용). 판정 자체는 stats로 한다.
export function computePower(unit) {
  const s = computeStats(unit);
  return Math.round(s.hp * 0.15 + s.atk * 1.2 + s.def * 0.6 + s.spd * 1.0);
}
