// 모집(소환) 결과 카드가 실제로 그려질 수 있는지 — SummonScreen이 쓰는 이음매를 그대로 검증.
// 화면(app/screens/SummonScreen.js)의 toCell()은 소환된 유닛을
//   identity(concept, unit) → 이름·이모지·속성
//   concept.archetypes[unit.archetype] → 역할 이모지
// 로 바꿔 카드를 그린다. 여기가 비면 결과 카드가 빈칸으로 뜬다(렌더로만 알 수 있는 사고).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../core/gameState.mjs';
import { earn } from '../core/economy.mjs';
import { summonOne, summonMulti, PULL_COST, PITY_HARD, MULTI_FLOOR, RARITY } from '../core/gacha.mjs';
import { fantasyConcept } from '../concepts/fantasy.mjs';
import { identity } from '../concepts/index.mjs';

function fresh(summon = 1000) {
  const s = createGameState({ units: [], party: [] });
  earn(s.wallet, { summon });
  return s;
}

test('모집 결과: 10장 전부 이름·이모지·역할이 채워진다(빈 카드 없음)', () => {
  const s = fresh();
  const r = summonMulti(s, 10, Math.random, fantasyConcept.roster);
  assert.equal(r.ok, true);
  assert.equal(r.results.length, 10);
  for (const res of r.results) {
    const id = identity(fantasyConcept, res.unit);
    assert.ok(id.name, '카드 이름이 비면 안 됨');
    assert.ok(id.emoji, '카드 이모지가 비면 안 됨');
    assert.ok(fantasyConcept.archetypes[res.unit.archetype], `역할(${res.unit.archetype}) 정의가 있어야 함`);
    assert.ok(RARITY[res.rarity], `등급(${res.rarity})이 RARITY에 있어야 메달을 그린다`);
    assert.ok(Number.isFinite(res.unit.level), '리본에 쓸 레벨이 숫자여야 함');
  }
});

test('모집 결과: 10회는 A급(SR) 이상 1장 이상 — 화면 문구와 일치', () => {
  const s = fresh(10000);
  const rank = { N: 0, R: 1, SR: 2, SSR: 3, UR: 4 };
  for (let i = 0; i < 20; i++) {
    const r = summonMulti(s, 10, Math.random, fantasyConcept.roster);
    assert.equal(r.ok, true);
    assert.ok(
      r.results.some((x) => rank[x.rarity] >= rank[MULTI_FLOOR]),
      '10회 모집은 최소 1장 SR 이상 보장',
    );
  }
});

test('천장 게이지: pity가 PITY_HARD를 넘지 않고, 도달하면 최고 등급 후 0으로 리셋', () => {
  const s = fresh(PULL_COST.summon * (PITY_HARD + 5));
  let hitCeiling = false;
  for (let i = 0; i < PITY_HARD + 5; i++) {
    const r = summonOne(s, () => 0.999, fantasyConcept.roster); // 최저 등급만 나오게 고정
    if (!r.ok) break;
    assert.ok(s.gacha.pity >= 0 && s.gacha.pity < PITY_HARD, `게이지가 ${PITY_HARD} 미만이어야 함(=${s.gacha.pity})`);
    if (s.gacha.pity === 0 && i > 0) hitCeiling = true;
  }
  assert.ok(hitCeiling, '천장에 도달해 게이지가 리셋되어야 함');
});

test('재화 부족: 모집이 실패하고 유닛도 재화도 늘지 않는다', () => {
  const s = fresh(PULL_COST.summon * 3); // 10연 비용에 못 미침
  const before = { units: s.units.length, summon: s.wallet.summon };
  const r = summonMulti(s, 10, Math.random, fantasyConcept.roster);
  assert.equal(r.ok, false);
  assert.equal(s.units.length, before.units, '실패했는데 유닛이 늘면 안 됨');
  assert.equal(s.wallet.summon, before.summon, '실패했는데 재화가 빠지면 안 됨');
});
