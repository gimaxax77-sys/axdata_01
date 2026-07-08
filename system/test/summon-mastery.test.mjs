import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../core/gameState.mjs';
import { accountMods } from '../core/balance.mjs';
import {
  recordSummon, summonMasteryInfo, claimSummonLevel, claimAllSummonLevels,
  summonMasteryPower, levelForCount, levelReward, levelPowerBonus,
  SUMMON_LEVEL_MAX, SUMMON_LEVEL_THRESHOLDS, SUMMON_BANNERS,
} from '../core/summonMastery.mjs';
import { serialize, deserialize } from '../core/save.mjs';

function fresh() {
  const s = createGameState({ units: [], party: [] });
  s.peakStage = 50;
  return s;
}

test('숙련도: 누적 횟수 → 레벨 환산', () => {
  assert.equal(levelForCount(0), 0);
  assert.equal(levelForCount(3), 1);
  assert.equal(levelForCount(7), 1);
  assert.equal(levelForCount(8), 2);
  assert.equal(levelForCount(1e9), SUMMON_LEVEL_MAX);
});

test('숙련도: 레벨 미달이면 청구 실패, 도달 시 순차 청구', () => {
  const s = fresh();
  assert.equal(claimSummonLevel(s, 'gear').ok, false, '0회 → 청구 불가');
  recordSummon(s, 'gear', 3); // 레벨1 도달
  const info = summonMasteryInfo(s, 'gear');
  assert.equal(info.level, 1);
  assert.equal(info.claimable, true);
  const r1 = claimSummonLevel(s, 'gear');
  assert.equal(r1.ok, true); assert.equal(r1.level, 1);
  assert.equal(claimSummonLevel(s, 'gear').ok, false, 'Lv2 미도달 → 재청구 불가');
});

test('숙련도: 홀수=뽑기권+능력치, 짝수=뽑기권+재화', () => {
  const s = fresh();
  const r1 = levelReward(s, 'hero', 1);
  assert.equal(r1.type, 'stat');
  assert.ok(r1.summon > 0 && r1.power > 0);
  assert.equal(r1.currency, undefined);
  const r2 = levelReward(s, 'hero', 2);
  assert.equal(r2.type, 'currency');
  assert.ok(r2.summon > 0 && r2.currency > 0 && r2.growth > 0);
  assert.equal(r2.power, undefined);
});

test('숙련도: 배너별 뽑기권 재화 (영웅=소환권, 그 외=다이아)', () => {
  const s = fresh();
  assert.equal(levelReward(s, 'hero', 1).ticket, 'summon');
  assert.ok(levelReward(s, 'hero', 1).summon > 0);
  for (const bn of ['pet', 'gear', 'rune', 'cosmetic']) {
    const r = levelReward(s, bn, 1);
    assert.equal(r.ticket, 'gem', `${bn} 뽑기권=다이아`);
    assert.ok(r.gem > 0);
    assert.equal(r.summon, undefined, `${bn}은 소환권 아님`);
  }
});

test('숙련도: 청구 시 배너 재화로 지급', () => {
  const s = fresh();
  // 영웅 → 소환권 지급
  recordSummon(s, 'hero', SUMMON_LEVEL_THRESHOLDS[0]);
  const sumBefore = s.wallet.summon || 0;
  const rh = claimSummonLevel(s, 'hero');
  assert.equal(rh.ok, true);
  assert.equal(s.wallet.summon, sumBefore + rh.reward.summon, '영웅=소환권 지급');
  // 펫 → 다이아 지급
  recordSummon(s, 'pet', SUMMON_LEVEL_THRESHOLDS[0]);
  const gemBefore = s.wallet.gem || 0;
  const rp = claimSummonLevel(s, 'pet');
  assert.equal(rp.ok, true);
  assert.equal(s.wallet.gem, gemBefore + rp.reward.gem, '펫=다이아 지급');
});

test('숙련도: 능력치 보상이 계정 파워에 반영', () => {
  const s = fresh();
  const base = accountMods(s).powerMult;
  recordSummon(s, 'gear', 1e9); // 전 레벨 도달
  // 홀수 레벨 몇 개 청구
  claimSummonLevel(s, 'gear'); // Lv1 (+1%)
  claimSummonLevel(s, 'gear'); // Lv2 (재화)
  claimSummonLevel(s, 'gear'); // Lv3 (+2%)
  const expected = 1 + levelPowerBonus(1) + levelPowerBonus(3);
  assert.ok(Math.abs(summonMasteryPower(s) - expected) < 1e-9, '홀수 레벨 파워 합');
  assert.ok(accountMods(s).powerMult > base, '계정 파워 상승');
});

test('숙련도: 전체 청구 편의 + 세이브 왕복 보존', () => {
  const s = fresh();
  for (const bn of SUMMON_BANNERS) recordSummon(s, bn, SUMMON_LEVEL_THRESHOLDS[2]); // 각 레벨3
  const r = claimAllSummonLevels(s);
  assert.equal(r.ok, true);
  assert.equal(r.claimed.length, SUMMON_BANNERS.length * 3, '배너×3레벨 청구');
  const loaded = deserialize(serialize(s));
  for (const bn of SUMMON_BANNERS) assert.equal(loaded.summonMastery[bn].claimed, 3, '청구 레벨 보존');
  assert.equal(summonMasteryPower(loaded), summonMasteryPower(s), '파워 보너스 보존');
});

test('숙련도: 최대 레벨에서 더는 청구 불가', () => {
  const s = fresh();
  recordSummon(s, 'rune', 1e9);
  let n = 0; while (claimSummonLevel(s, 'rune').ok) n++;
  assert.equal(n, SUMMON_LEVEL_MAX);
  assert.equal(summonMasteryInfo(s, 'rune').maxed, true);
});
