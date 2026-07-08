import { toCombatProfile } from './units.mjs';
import { affinity } from './elements.mjs';
import { teamSynergy } from './synergy.mjs';
import { FORMATION_MODS, formationActive } from './formation.mjs';

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
export function resolve(party, challenge, accountMods = {}, formation = null) {
  if (!party.length) return { win: false, duration: Infinity, log: '파티 없음' };
  const powerMult = accountMods.powerMult || 1;

  const profiles = party.map(toCombatProfile);
  // 진형: 후열이 1명 이상일 때만 발동(하위호환). 전열=방어벽, 후열=보호받는 딜러.
  if (formationActive(formation, party)) {
    const hasFront = party.some((u) => formation[u.uid] !== 'back');
    for (const p of profiles) {
      const m = formation[p.uid] === 'back'
        ? (hasFront ? FORMATION_MODS.back : FORMATION_MODS.backExposed)
        : FORMATION_MODS.front;
      p.dps *= m.dps || 1; p.def *= m.def || 1; p.hp *= m.hp || 1;
    }
  }
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
  // 받는 피해 감소 — 파티 평균(상한 60%). 방어와 별개의 생존 축.
  const dmgReduce = Math.min(
    0.6,
    profiles.reduce((s, p) => s + (p.effect?.dmgReduce || 0), 0) / profiles.length
  );
  // ── 신규 능력치 ──
  // 절대공격(고정 딜) — 방어 감쇠를 우회하는 딜 비율. 파티 최댓값(상한 90%).
  const trueDamage = Math.min(0.9, Math.max(0, ...profiles.map((p) => p.effect?.trueDamage || 0)));
  // 명중 — 적 회피를 상쇄(파티 최댓값). 회피 — 파티 평균으로 적 명중 대비 회피율(상한 50%).
  const accuracy = Math.max(0, ...profiles.map((p) => p.effect?.accuracy || 0));
  const evasion = profiles.reduce((s, p) => s + (p.effect?.evasion || 0), 0) / profiles.length;
  // 절대방어 — 상한(피해감소 60%)을 우회하는 별도 경감(상한 50%). 파티 평균.
  const absDef = Math.min(0.5, profiles.reduce((s, p) => s + (p.effect?.absDef || 0), 0) / profiles.length);
  // 적 회피/명중(고난이도·보스에서 부여). 우리 명중이 적 회피를, 적 명중이 우리 회피를 상쇄.
  const enemyEva = Math.min(0.9, Math.max(0, (challenge.eva || 0) - accuracy));
  const effEvasion = Math.min(0.5, Math.max(0, evasion - (challenge.acc || 0)));

  const partyHP = profiles.reduce((s, p) => s + p.hp, 0);
  const partyHPeff = partyHP * (1 + lifesteal) * powerMult * syn.hp;
  // 각 유닛의 dps에 속성 상성 배수 적용 (적 속성 대비 유리/불리)
  const rawDPS = profiles.reduce((s, p) => s + p.dps * affinity(p.element, challenge.element), 0)
    * atkMult * critMult * powerMult * syn.atk;
  const avgDef = profiles.reduce((s, p) => s + p.def, 0) / profiles.length * syn.def;

  const enemyDefEff = challenge.def * (1 - defPierce);
  // 방어 감쇠 후 통과율. 절대공격은 감쇠된 부분 일부를 고정 딜로 회수(상한 100%).
  const mitig = mitigation(enemyDefEff);
  const throughput = mitig + trueDamage * (1 - mitig);
  // 파티가 적에게 넣는 유효 DPS (적 방어 + 절대공격 + 적 회피 반영)
  const partyEffDPS = Math.max(1, rawDPS * throughput * (1 - enemyEva));
  // 적이 파티에게 넣는 유효 DPS (방어 + 팀방어 + 받는피해감소 + 절대방어 + 회피 반영)
  const enemyEffDPS = Math.max(1, challenge.atk * mitigation(avgDef)
    * (1 - teamDefReduce) * (1 - dmgReduce) * (1 - absDef) * (1 - effEvasion));

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
