import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../core/gameState.mjs';
import { earn } from '../core/economy.mjs';
import {
  summonGear, summonRune, summonCosmetic,
  GEAR_PULL_COST, RUNE_PULL_COST, COSTUME_PULL_COST, COSTUME_DUP_REFUND,
} from '../core/summon.mjs';
import { ownsCosmetic } from '../core/cosmetics.mjs';
import { PROFILE_FRAMES, PROFILE_TITLES } from '../core/cosmetics.mjs';

function fresh(gem = 10000) {
  const s = createGameState({ units: [], party: [] });
  earn(s.wallet, { gem });
  return s;
}

test('장비 소환: 다이아 소모 → 인벤토리에 장비', () => {
  const s = fresh();
  const before = s.wallet.gem;
  const r = summonGear(s);
  assert.equal(r.ok, true);
  assert.equal(s.wallet.gem, before - GEAR_PULL_COST.gem);
  assert.equal(s.inventory.length, 1);
  assert.ok(r.item && r.rarity && r.label);
});

test('룬 소환: 다이아 소모 → 룬 가방', () => {
  const s = fresh();
  const before = s.wallet.gem;
  const r = summonRune(s);
  assert.equal(r.ok, true);
  assert.equal(s.wallet.gem, before - RUNE_PULL_COST.gem);
  assert.equal(s.runeBag.length, 1);
  assert.ok(r.rune && r.rarity);
});

test('소환: 다이아 부족 시 실패 (지급 없음)', () => {
  const s = fresh(0);
  assert.equal(summonGear(s).ok, false);
  assert.equal(summonRune(s).ok, false);
  assert.equal(summonCosmetic(s).ok, false);
  assert.equal(s.inventory.length, 0);
  assert.equal(s.runeBag.length, 0);
});

test('코스튬 소환: 미보유 외형 지급', () => {
  const s = fresh();
  const before = s.wallet.gem;
  const r = summonCosmetic(s);
  assert.equal(r.ok, true);
  assert.equal(s.wallet.gem, before - COSTUME_PULL_COST.gem);
  assert.equal(r.duplicate, undefined);
  assert.ok(ownsCosmetic(s, r.item.kind, r.item.id), '지급된 외형 보유');
});

test('코스튬 소환: 전부 보유 시 환급', () => {
  const s = fresh();
  // 유료 프레임/칭호 전부 미리 보유시킴
  const payFrames = Object.values(PROFILE_FRAMES).filter((f) => f.cost);
  const payTitles = Object.values(PROFILE_TITLES).filter((t) => t.cost);
  s.profile = s.profile || {}; s.profile.owned = { frame: {}, title: {} };
  for (const f of payFrames) s.profile.owned.frame[f.id] = true;
  for (const t of payTitles) s.profile.owned.title[t.id] = true;
  const before = s.wallet.gem;
  const r = summonCosmetic(s);
  assert.equal(r.ok, true);
  assert.equal(r.duplicate, true);
  // 소모 후 환급 → 순비용 = 뽑기값 - 환급값
  assert.equal(s.wallet.gem, before - COSTUME_PULL_COST.gem + COSTUME_DUP_REFUND.gem);
});

test('코스튬 소환: 결정론적 pool 소진 (모든 외형 획득 가능)', () => {
  const s = fresh(100000);
  const total = Object.values(PROFILE_FRAMES).filter((f) => f.cost).length
    + Object.values(PROFILE_TITLES).filter((t) => t.cost).length;
  const got = new Set();
  for (let i = 0; i < 100 && got.size < total; i++) {
    const r = summonCosmetic(s);
    if (r.ok && !r.duplicate) got.add(`${r.item.kind}:${r.item.id}`);
  }
  assert.equal(got.size, total, '모든 유료 외형을 소환으로 획득 가능');
});
