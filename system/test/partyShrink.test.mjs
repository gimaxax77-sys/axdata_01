// 편성 5인 축소 마이그레이션 — 옛 7인·중열 세이브가 로드 시 정리되는지
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUnit } from '../core/units.mjs';
import { createGameState, MAX_PARTY } from '../core/gameState.mjs';
import { serialize, deserialize } from '../core/save.mjs';
import { formationSummary, ROLE_CAP, unitRole } from '../core/formation.mjs';

test('편성 축소: MAX_PARTY / ROLE_CAP 이 서로 어긋나지 않는다', () => {
  assert.equal(MAX_PARTY, ROLE_CAP.front + ROLE_CAP.back);
  assert.equal(MAX_PARTY, 5);
});

test('편성 축소: 옛 7인 파티 세이브는 로드 시 전투력 상위 5명만 남는다', () => {
  const s = createGameState({ units: [], party: [] });
  const units = Array.from({ length: 7 }, (_, i) => createUnit('STRIKER', { level: 10 + i * 10, rank: 2 }));
  s.units.push(...units);
  s.party = units.map((u) => u.uid); // 구버전 상태를 직접 만든다(7명)

  const loaded = deserialize(serialize(s));
  assert.equal(loaded.party.length, MAX_PARTY, '5명으로 잘림');
  // 레벨이 낮은 두 명(10·20)이 잘려야 한다.
  const kept = new Set(loaded.party);
  assert.ok(!kept.has(units[0].uid) && !kept.has(units[1].uid), '전투력 하위가 잘림');
  assert.ok(kept.has(units[6].uid), '최강은 남음');
});

test("편성 축소: 옛 'mid' 지정은 후열로 옮겨진다 (전열로 떨어지지 않음)", () => {
  const s = createGameState({ units: [], party: [] });
  const units = Array.from({ length: 3 }, () => createUnit('MAGE', { level: 20, rank: 2 }));
  s.units.push(...units);
  s.party = units.map((u) => u.uid);
  s.formation = { [units[0].uid]: 'mid', [units[1].uid]: 'back' };

  const loaded = deserialize(serialize(s));
  assert.equal(unitRole(loaded, units[0].uid), 'back', "'mid' -> 후열");
  assert.equal(unitRole(loaded, units[1].uid), 'back');
  assert.equal(unitRole(loaded, units[2].uid), 'front', '미지정은 전열 유지');
});

test('편성 축소: 후열 정원(3)을 넘긴 옛 세이브는 초과분이 전열로 되돌려진다', () => {
  const s = createGameState({ units: [], party: [] });
  const units = Array.from({ length: 5 }, () => createUnit('MAGE', { level: 20, rank: 2 }));
  s.units.push(...units);
  s.party = units.map((u) => u.uid);
  // 구버전에서 중열3 + 후열2 였던 상태 → 전부 후열이 되면 정원 3을 넘는다.
  s.formation = {};
  for (const u of units) s.formation[u.uid] = 'mid';

  const loaded = deserialize(serialize(s));
  const sum = formationSummary(loaded);
  assert.equal(sum.back.length, ROLE_CAP.back, '후열 정원 준수');
  assert.equal(sum.front.length, MAX_PARTY - ROLE_CAP.back, '초과분은 전열로');
});
