import { getArchetype } from './archetypes.mjs';
import { computeStats } from './stats.mjs';

// ─────────────────────────────────────────────────────────────
// 유닛 인스턴스 — 시스템이 다루는 최소 단위.
// archetype(역할) + 성장 상태(level/rank)만 가진다.
// "이름/외형"은 저장하지 않는다 → 그건 컨셉 레이어의 몫.
// ─────────────────────────────────────────────────────────────

let _seq = 0;
export function createUnit(archetype, { level = 1, rank = 1 } = {}) {
  getArchetype(archetype); // 검증
  return {
    uid: `u${++_seq}`,
    archetype,
    level,
    rank,
  };
}

// 레벨업 비용(성장 재화). 레벨이 오를수록 비용 증가.
export function levelUpCost(unit) {
  return Math.round(50 * Math.pow(1.15, unit.level - 1));
}

// 한 유닛을 팀 판정에 쓸 "전투 프로필"로 변환.
export function toCombatProfile(unit) {
  const s = computeStats(unit);
  const arch = getArchetype(unit.archetype);
  // dps = 공격력 * (1 + 속도/200)  → 속도가 공격 빈도에 기여
  const dps = s.atk * (1 + s.spd / 200);
  return { uid: unit.uid, hp: s.hp, dps, def: s.def, teamBuff: arch.teamBuff };
}
