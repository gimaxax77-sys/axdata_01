// ─────────────────────────────────────────────────────────────
// 유닛 원형(Archetype) — 시스템 레벨의 "역할" 정의.
// 컨셉(판타지/SF)과 무관하게 시스템은 오직 이 역할 ID만 안다.
// 컨셉 레이어가 나중에 ID를 표시 이름으로 바꿔준다.
//   VANGUARD(방어형) · STRIKER(공격형) · SUPPORT(지원형)
// ─────────────────────────────────────────────────────────────

export const ARCHETYPES = {
  VANGUARD: {
    id: 'VANGUARD',
    role: '방어',
    base: { hp: 1200, atk: 60, def: 80, spd: 90 },
    // 지원형이 아니므로 팀 버프 없음
    teamBuff: null,
  },
  STRIKER: {
    id: 'STRIKER',
    role: '공격',
    base: { hp: 600, atk: 150, def: 30, spd: 130 },
    teamBuff: null,
  },
  SUPPORT: {
    id: 'SUPPORT',
    role: '지원',
    base: { hp: 700, atk: 50, def: 40, spd: 110 },
    // 팀 전체 공격력 +15% (지원형의 시스템적 정체성)
    teamBuff: { stat: 'atk', mult: 0.15 },
  },
};

export function getArchetype(id) {
  const a = ARCHETYPES[id];
  if (!a) throw new Error(`알 수 없는 원형: ${id}`);
  return a;
}
