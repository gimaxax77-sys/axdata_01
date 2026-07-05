// ─────────────────────────────────────────────────────────────
// 스킬 시스템 — 장착(선택)으로 같은 유닛을 다른 빌드로 만든다.
// 스킬은 시스템 레벨의 "효과 ID"다. 표시 이름은 컨셉이 붙일 수 있다.
//
// 스킬이 줄 수 있는 것:
//   statPct  : 자기 스탯 % 증가 (atk/hp/def/spd)
//   effect   : 전투 효과 (치명타/흡혈/방어관통) → 판정 엔진이 읽음
//   teamBuff : 팀 전체 버프 (예: 공격력 %)
//   level    : 스킬 레벨(강화 가능) → 효과가 레벨에 비례
// ─────────────────────────────────────────────────────────────

export const SKILL_CATALOG = {
  BERSERK: {
    id: 'BERSERK', label: '광폭', desc: '공격력 대폭 상승',
    statPct: { atk: 0.30 },
  },
  FORTRESS: {
    id: 'FORTRESS', label: '요새', desc: '체력·방어 상승',
    statPct: { hp: 0.25, def: 0.20 },
  },
  PRECISION: {
    id: 'PRECISION', label: '정밀', desc: '치명타 확률/피해',
    effect: { critChance: 0.25, critDamage: 0.5 },
  },
  VAMPIRIC: {
    id: 'VAMPIRIC', label: '흡혈', desc: '가한 피해로 생존력 확보',
    effect: { lifesteal: 0.30 },
  },
  PIERCE: {
    id: 'PIERCE', label: '관통', desc: '적 방어 무시',
    effect: { defPierce: 0.40 },
  },
  RALLY: {
    id: 'RALLY', label: '지휘', desc: '팀 전체 공격력 상승',
    teamBuff: { atk: 0.20 },
  },
  SWIFT: {
    id: 'SWIFT', label: '신속', desc: '속도 상승(공격 빈도)',
    statPct: { spd: 0.40 },
  },
};

export function getSkill(id) {
  const s = SKILL_CATALOG[id];
  if (!s) throw new Error(`알 수 없는 스킬: ${id}`);
  return s;
}

// 스킬 슬롯 수 = 랭크에 비례 (랭크가 곧 빌드 자유도). 최대 3.
export function skillSlots(unit) {
  return Math.min(3, unit.rank + 1);
}

// 스킬 레벨당 효과 배수. Lv1=1.0, Lv2=1.15 ...
export function skillPower(skillLevel) {
  return 1 + (skillLevel - 1) * 0.15;
}

// 스킬 레벨업(강화) 비용 — 소환 재화와 성장 재화 소모.
export function skillUpCost(skillLevel) {
  return { growth: Math.round(30 * Math.pow(1.3, skillLevel - 1)) };
}
