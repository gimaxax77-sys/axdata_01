// ─────────────────────────────────────────────────────────────
// 캐릭터 성장 축 검증 — 전용무기 · 룬 · 시그니처 각성.
// 새 축이 (1) 전투력을 실제로 올리고 (2) 상한을 지키며
// (3) 세이브 왕복 후에도 동일 결과를 내는지 단언.
// 실행:  node system/verify-character.mjs   (실패 시 종료코드 1)
// ─────────────────────────────────────────────────────────────

import { createGameState } from './core/gameState.mjs';
import { createUnit } from './core/units.mjs';
import { earn } from './core/economy.mjs';
import { computePower } from './core/stats.mjs';
import { collectUnitModifiers } from './core/modifiers.mjs';
import { serialize, deserialize } from './core/save.mjs';
import {
  unlockSigWeapon, enhanceSigWeapon, hasSigWeapon, sigWeaponBoost, SIGWEAPON_MAX,
} from './core/sigweapon.mjs';
import {
  summonRune, equipRune, unequipRune, enhanceRune, activeRuneSets, RUNE_SLOTS, RUNE_MAX_LEVEL,
} from './core/runes.mjs';
import { awakenSignature } from './core/character.mjs';
import { AWAKEN_MAX } from './core/skills.mjs';

let passed = 0; const fails = [];
const ok = (n, c) => { if (c) { passed++; console.log(`  ✓ ${n}`); } else { fails.push(n); console.log(`  ✗ ${n}`); } };

function rich() {
  const u = createUnit('STRIKER', { level: 40, rank: 3, signature: 'SIG_FLAME_EDGE', element: 'FIRE' });
  const s = createGameState({ units: [u], party: [u.uid] });
  earn(s.wallet, { currency: 1e8, growth: 1e6, summon: 5000, gem: 5000 });
  return { s, u };
}

console.log('\n■ 캐릭터 성장 축 검증 (assert)\n');

// ── 전용무기 ───────────────────────────────────────────────────
{
  const { s, u } = rich();
  const p0 = computePower(u);
  ok('전용무기 미보유 상태', !hasSigWeapon(u));
  ok('전용무기 획득 성공', unlockSigWeapon(s, u.uid).ok && hasSigWeapon(u));
  const p1 = computePower(u);
  ok('전용무기가 전투력 상승', p1 > p0);
  for (let i = 0; i < 4; i++) enhanceSigWeapon(s, u.uid); // Lv5
  ok('5레벨에서 시그니처 부스트 +10%', Math.abs(sigWeaponBoost(u) - 0.1) < 1e-9);
  while (enhanceSigWeapon(s, u.uid).ok) { /* to max */ }
  ok('전용무기 강화 상한 준수', u.sigWeapon.level === SIGWEAPON_MAX);
  ok('중복 획득 차단', unlockSigWeapon(s, u.uid).ok === false);
}

// ── 룬 ─────────────────────────────────────────────────────────
{
  const { s, u } = rich();
  const p0 = computePower(u);
  // 같은 계열(RAGE) 룬 3개 발굴 → 3세트
  for (let i = 0; i < 6; i++) summonRune(s, () => 0.02);
  ok('룬 발굴이 가방에 적재', s.runeBag.length >= 3);
  const first = s.runeBag[0];
  for (let sl = 0; sl < RUNE_SLOTS; sl++) equipRune(s, u.uid, sl, s.runeBag[0].uid);
  ok('룬 3슬롯 장착', u.runes.filter(Boolean).length === RUNE_SLOTS);
  const sets = activeRuneSets(u.runes);
  ok('동일 계열 3개 → 3세트 보너스 활성', sets.length === 1 && sets[0].active3);
  const p1 = computePower(u);
  ok('룬(메인+세트)이 전투력 상승', p1 > p0);
  // 강화
  const before = collectUnitModifiers(u).statPct.atk;
  enhanceRune(s, u.runes[0].uid);
  ok('룬 강화가 메인스탯 증가', collectUnitModifiers(u).statPct.atk > before);
  while (enhanceRune(s, u.runes[0].uid).ok) { /* to max */ }
  ok('룬 강화 상한 준수', u.runes[0].level === RUNE_MAX_LEVEL);
  // 해제 → 세트 해제
  unequipRune(s, u.uid, 2);
  ok('룬 해제 시 슬롯 비고 가방 복귀', u.runes[2] === null && s.runeBag.some((r) => r));
  ok('3세트 → 2세트로 강등', activeRuneSets(u.runes)[0].active3 === false && activeRuneSets(u.runes)[0].active2);
}

// ── 시그니처 각성 ──────────────────────────────────────────────
{
  const { s, u } = rich();
  const effBefore = collectUnitModifiers(u).effect.defPierce; // SIG_FLAME_EDGE 각성=관통
  ok('각성 1회 성공', awakenSignature(s, u.uid).ok && u.sigAwaken === 1);
  ok('각성이 2차 효과(관통) 부여', collectUnitModifiers(u).effect.defPierce > effBefore);
  while (awakenSignature(s, u.uid).ok) { /* to max */ }
  ok('각성 상한 준수', u.sigAwaken === AWAKEN_MAX);
}

// ── 세이브 왕복 ────────────────────────────────────────────────
{
  const { s, u } = rich();
  unlockSigWeapon(s, u.uid); enhanceSigWeapon(s, u.uid); enhanceSigWeapon(s, u.uid);
  awakenSignature(s, u.uid);
  for (let i = 0; i < 4; i++) summonRune(s, () => 0.3);
  equipRune(s, u.uid, 0, s.runeBag[0].uid);
  const r = deserialize(serialize(s));
  const ru = r.units[0];
  ok('세이브 왕복: 전용무기/각성/룬 보존',
    ru.sigWeapon.level === u.sigWeapon.level && ru.sigAwaken === u.sigAwaken &&
    ru.runes.filter(Boolean).length === u.runes.filter(Boolean).length);
  ok('세이브 왕복: 전투력 동일', computePower(ru) === computePower(u));
  ok('세이브 왕복: 룬 가방 보존', r.runeBag.length === s.runeBag.length);
}

console.log(`\n결과: ${passed} 통과 / ${fails.length} 실패`);
if (fails.length) { console.log('실패:', fails.join(', ')); process.exit(1); }
console.log('→ 전용무기·룬·각성 세 축이 모디파이어 파이프라인에 정상 합산됨이 검증됨.\n');
