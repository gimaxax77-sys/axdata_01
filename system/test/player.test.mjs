// 플레이어 레벨·칭호 파생 규칙 테스트
import test from 'node:test';
import assert from 'node:assert/strict';
import { playerLevel, playerTitle } from '../core/player.mjs';

test('플레이어 레벨: 최고층이 오르면 레벨도 오른다(제곱근 완만)', () => {
  assert.equal(playerLevel({ peakStage: 1, prestige: 0 }), 3);   // floor(1*2)+0+1
  assert.equal(playerLevel({ peakStage: 100, prestige: 0 }), 21); // floor(10*2)+0+1
  assert.ok(playerLevel({ peakStage: 400 }) > playerLevel({ peakStage: 100 }));
});

test('플레이어 레벨: 환생 1회당 +5', () => {
  const base = playerLevel({ peakStage: 100, prestige: 0 });
  assert.equal(playerLevel({ peakStage: 100, prestige: 3 }), base + 15);
});

test('플레이어 레벨: 빈 상태·손상된 값에도 최소 레벨을 낸다', () => {
  assert.equal(playerLevel(undefined), 3);
  assert.equal(playerLevel({}), 3);
  assert.equal(playerLevel({ peakStage: -5, prestige: -2 }), 3);
});

test('칭호: 레벨 구간을 넘을 때만 바뀐다', () => {
  assert.equal(playerTitle(1), '견습');
  assert.equal(playerTitle(7), '견습');
  assert.equal(playerTitle(8), '모험가');
  assert.equal(playerTitle(28), '기사단장');
  assert.equal(playerTitle(999), '전설');
});
