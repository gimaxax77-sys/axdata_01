import { toCombatProfile } from './units.mjs';

// ─────────────────────────────────────────────────────────────
// 전투 판정 엔진 — 시스템의 심장.
// 파티 vs 도전(challenge)을 결정론적으로 계산해
//   { win, duration } 를 반환한다.
//
//   · win      : RPG 장르가 사용 (승패로 진행 게이팅)
//   · duration : 방치형 장르가 사용 (클리어 소요 초 → 초당 보상)
//
// 같은 함수가 두 장르를 모두 굴린다. 이게 이 IP의 핵심.
// ─────────────────────────────────────────────────────────────

// 방어(def)에 의한 피해 감쇠 계수: 100/(100+def)
function mitigation(def) {
  return 100 / (100 + def);
}

// challenge 형태: { hp, atk, def }  (스칼라 적)
export function resolve(party, challenge) {
  if (!party.length) return { win: false, duration: Infinity, log: '파티 없음' };

  const profiles = party.map(toCombatProfile);

  // 지원형 팀 버프 합산 (예: 공격력 +15%)
  let atkMult = 1;
  for (const p of profiles) {
    if (p.teamBuff && p.teamBuff.stat === 'atk') atkMult += p.teamBuff.mult;
  }

  const partyHP = profiles.reduce((s, p) => s + p.hp, 0);
  const rawDPS = profiles.reduce((s, p) => s + p.dps, 0) * atkMult;
  const avgDef = profiles.reduce((s, p) => s + p.def, 0) / profiles.length;

  // 파티가 적에게 넣는 유효 DPS (적 방어 반영)
  const partyEffDPS = Math.max(1, rawDPS * mitigation(challenge.def));
  // 적이 파티에게 넣는 유효 DPS (파티 평균 방어 반영)
  const enemyEffDPS = Math.max(1, challenge.atk * mitigation(avgDef));

  const timeToKillEnemy = challenge.hp / partyEffDPS;
  const timeToKillParty = partyHP / enemyEffDPS;

  const win = timeToKillEnemy <= timeToKillParty;
  return {
    win,
    duration: win ? timeToKillEnemy : timeToKillParty, // 초
    partyPower: Math.round(rawDPS),
    partyHP: Math.round(partyHP),
    log: win
      ? `승리 (${timeToKillEnemy.toFixed(1)}초 소요)`
      : `패배 (${timeToKillParty.toFixed(1)}초 버팀)`,
  };
}
