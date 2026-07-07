import { toCombatProfile } from './units.mjs';
import { affinity } from './elements.mjs';
import { teamSynergy } from './synergy.mjs';

// ─────────────────────────────────────────────────────────────
// 전투 판정 엔진 — 시스템의 심장.
// 파티 vs 도전(challenge)을 결정론적으로 계산해
//   { win, duration } 를 반환한다.
//
//   · win      : RPG 장르가 사용 (승패로 진행 게이팅)
//   · duration : 방치형 장르가 사용 (클리어 소요 초 → 초당 보상)
//
// 스킬 전투 효과를 반영한다:
//   치명타 → dps에 이미 반영(프로필 단계)
//   흡혈(lifesteal)  → 파티 유효 HP 증가
//   관통(defPierce)  → 적 방어 무시
//   팀버프(teamBuffAtk) → 파티 dps 배수
// ─────────────────────────────────────────────────────────────

// 방어(def)에 의한 피해 감쇠 계수: 100/(100+def)
function mitigation(def) {
  return 100 / (100 + Math.max(0, def));
}

// challenge 형태: { hp, atk, def }  (스칼라 적)
// accountMods.powerMult: 계정 단위 영구 파워 배수(환생 보너스 등). 기본 1.
export function resolve(party, challenge, accountMods = {}) {
  if (!party.length) return { win: false, duration: Infinity, log: '파티 없음' };
  const powerMult = accountMods.powerMult || 1;

  const profiles = party.map(toCombatProfile);
  // 파티 구성 시너지 (삼위일체·진형·속성 결속) — 팀 전체 배수
  const syn = teamSynergy(party).mult;

  // 팀 버프 합산 (지원형 원형 + 지휘 스킬 등)
  const atkMult = 1 + profiles.reduce((s, p) => s + (p.teamBuffAtk || 0), 0);
  // 팀 치명 버프 → 파티 dps 배수 (치명 지원형)
  const critMult = 1 + profiles.reduce((s, p) => s + (p.teamBuffCrit || 0), 0);
  // 팀 방어 버프 → 파티 피해경감 (수호 지원형, 상한 60%)
  const teamDefReduce = Math.min(0.6, profiles.reduce((s, p) => s + (p.teamBuffDef || 0), 0));
  // 흡혈 합산 (상한 60%) → 파티 실효 HP 증가
  const lifesteal = Math.min(
    0.6,
    profiles.reduce((s, p) => s + (p.effect?.lifesteal || 0), 0)
  );
  // 방어 관통은 파티 내 최댓값 사용
  const defPierce = Math.min(
    0.9,
    Math.max(0, ...profiles.map((p) => p.effect?.defPierce || 0))
  );

  const partyHP = profiles.reduce((s, p) => s + p.hp, 0);
  const partyHPeff = partyHP * (1 + lifesteal) * powerMult * syn.hp;
  // 각 유닛의 dps에 속성 상성 배수 적용 (적 속성 대비 유리/불리)
  const rawDPS = profiles.reduce((s, p) => s + p.dps * affinity(p.element, challenge.element), 0)
    * atkMult * critMult * powerMult * syn.atk;
  const avgDef = profiles.reduce((s, p) => s + p.def, 0) / profiles.length * syn.def;

  const enemyDefEff = challenge.def * (1 - defPierce);
  // 파티가 적에게 넣는 유효 DPS (적 방어 반영)
  const partyEffDPS = Math.max(1, rawDPS * mitigation(enemyDefEff));
  // 적이 파티에게 넣는 유효 DPS (파티 평균 방어 + 팀 방어버프 반영)
  const enemyEffDPS = Math.max(1, challenge.atk * mitigation(avgDef) * (1 - teamDefReduce));

  const timeToKillEnemy = challenge.hp / partyEffDPS;
  const timeToKillParty = partyHPeff / enemyEffDPS;

  const win = timeToKillEnemy <= timeToKillParty;
  return {
    win,
    duration: win ? timeToKillEnemy : timeToKillParty, // 초
    // 승부 여유: 파티전멸시간/적처치시간. >1이면 승리, 클수록 여유.
    margin: timeToKillParty / timeToKillEnemy,
    partyPower: Math.round(rawDPS),
    partyHP: Math.round(partyHPeff),
    log: win
      ? `승리 (${timeToKillEnemy.toFixed(1)}초 소요)`
      : `패배 (${timeToKillParty.toFixed(1)}초 버팀)`,
  };
}
