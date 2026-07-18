// 원정 런 한정 강화(boon) 카탈로그 — 런 종료까지만 유지(영구 아님).
//   필드: power(파워 배수) · heal(즉시 회복) · healDelta(즉시 감소) ·
//        regen(관문마다 회복) · shield(피해 1회 무효 충전) · attritionMult(생명소모 배수)
//   → 단순 강화뿐 아니라 리스크·보호·재생의 '선택 깊이'를 만든다.

export const BOONS = [
  { id: 'might',    label: '전투력 +18%',              icon: '⚔️', power: 1.18 },
  { id: 'surge',    label: '전투력 +28%',              icon: '⚔️', power: 1.28 },
  { id: 'berserk',  label: '전투력 +45% · 생명소모↑',   icon: '🔥', power: 1.45, attritionMult: 1.7 },
  { id: 'bulwark',  label: '전투력 +12% · 생명소모↓',   icon: '🛡️', power: 1.12, attritionMult: 0.72 },
  { id: 'mend',     label: '생명 +35%',                icon: '💖', heal: 0.35 },
  { id: 'vitality', label: '생명 +20% · 전투력 +8%',    icon: '💗', heal: 0.20, power: 1.08 },
  { id: 'regen',    label: '재생: 관문마다 생명 +8%',    icon: '🌿', regen: 0.08 },
  { id: 'ward',     label: '보호막: 피해 1회 무효',       icon: '🔰', shield: 1 },
  { id: 'fortune',  label: '전투력 +15% · 재생 +5%',     icon: '🍀', power: 1.15, regen: 0.05 },
  { id: 'gambit',   label: '생명 -15% · 전투력 +38%',    icon: '🎲', power: 1.38, healDelta: -0.15 },
];

export const BOON_BY_ID = Object.fromEntries(BOONS.map((b) => [b.id, b]));

// boon 하나를 런 상태에 적용(누적). runHP는 상한 1, 하한 0.05(즉사 방지).
export function applyBoon(run, id) {
  const b = BOON_BY_ID[id];
  if (!b) return false;
  run.boons.push(id);
  if (b.power) run.powerMult *= b.power;
  if (b.attritionMult) run.attritionMult *= b.attritionMult;
  if (b.regen) run.regen += b.regen;
  if (b.shield) run.shield += b.shield;
  if (b.heal) run.runHP = Math.min(1, run.runHP + b.heal);
  if (b.healDelta) run.runHP = Math.max(0.05, Math.min(1, run.runHP + b.healDelta));
  return true;
}
