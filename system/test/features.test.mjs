// 기능 플래그(옵션 모듈) 검증 — Phase2: 속성(element) 옵션화
import { test } from 'node:test';
import assert from 'node:assert';
import { FEATURES, isOn, simplePreset } from '../core/features.mjs';
import { affinity } from '../core/elements.mjs';
import { teamSynergy } from '../core/synergy.mjs';
import { rarityBaseMult } from '../core/seed.mjs';

test('기본값은 풀 모드(전 플래그 on)', () => {
  assert.equal(isOn('elements'), true);
  assert.equal(isOn('rarity'), true);
  assert.equal(simplePreset().elements, false);
});

test('속성 on: 상성이 적용된다(FIRE>WOOD 유리)', () => {
  FEATURES.elements = true;
  assert.ok(affinity('FIRE', 'WOOD') > 1);
  assert.ok(affinity('WOOD', 'FIRE') < 1);
});

test('속성 off: 상성 무관(항상 1, 스탯 전용)', () => {
  FEATURES.elements = false;
  try {
    assert.equal(affinity('FIRE', 'WOOD'), 1);
    assert.equal(affinity('LIGHT', 'DARK'), 1);
    // 동일 속성 3인 파티 — off면 속성 결속이 안 붙는다
    const units = [{ archetype: 'STRIKER', element: 'FIRE' }, { archetype: 'MAGE', element: 'FIRE' }, { archetype: 'SUPPORT', element: 'FIRE' }];
    const syn = teamSynergy(units);
    assert.ok(!syn.list.some((s) => s.id === 'elem_bond'), '속성 off면 속성 결속 없음');
  } finally {
    FEATURES.elements = true; // 다른 테스트 영향 없게 복구
  }
});

test('등급 on: 전투력 등급 배수 적용', () => {
  FEATURES.rarity = true;
  assert.ok(rarityBaseMult({ rarity: 'UR' }) > rarityBaseMult({ rarity: 'N' }));
});

test('등급 off: 전투력 등급 무관(항상 1, 스탯 전용)', () => {
  FEATURES.rarity = false;
  try {
    assert.equal(rarityBaseMult({ rarity: 'UR' }), 1.0);
    assert.equal(rarityBaseMult({ rarity: 'N' }), 1.0);
  } finally {
    FEATURES.rarity = true; // 복구
  }
});
