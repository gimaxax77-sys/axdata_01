import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGameState } from '../core/gameState.mjs';
import { createUnit } from '../core/units.mjs';
import { earn } from '../core/economy.mjs';
import {
  canClaimAttendance, claimAttendance, recordMission, missionList, claimMission,
  enterDungeon, dungeonEntriesLeft, DUNGEONS,
} from '../core/daily.mjs';
import { purchase, adLeft, SHOP } from '../core/shop.mjs';
import { arenaFight, arenaEntriesLeft, ARENA_ENTRIES } from '../core/arena.mjs';
import { guildAttack, guildAttacksLeft, GUILD_ATTACKS } from '../core/guild.mjs';
import { compPurchase } from '../core/compshop.mjs';
import { fightChapter, CAMPAIGN_CHAPTER_COUNT } from '../core/campaign.mjs';
import { claimAchievement, achievementList, seasonTier, claimSeason, buySeasonPremium } from '../core/meta.mjs';
import { nextObjective } from '../core/tutorial.mjs';
import { climbTower, towerChallenge } from '../core/tower.mjs';

function strongState(peak = 60) {
  const units = [
    createUnit('STRIKER', { level: 60, rank: 4, characterId: 'kael', element: 'FIRE' }),
    createUnit('VANGUARD', { level: 60, rank: 4, characterId: 'gwen', element: 'WATER' }),
  ];
  units.forEach((u) => (u.rarity = 'SR'));
  const s = createGameState({ units, party: units.map((u) => u.uid) });
  earn(s.wallet, { currency: 1e8, growth: 1e6, summon: 5000, gem: 5000 });
  s.peakStage = peak; s.maxStage = peak; s.stage = peak;
  return s;
}

test('daily: 출석 수령은 하루 1회', () => {
  const s = strongState();
  assert.equal(canClaimAttendance(s), true);
  assert.equal(claimAttendance(s).ok, true);
  assert.equal(canClaimAttendance(s), false, '재수령 차단');
});

test('daily: 미션 진행→완료→수령', () => {
  const s = strongState();
  const m0 = missionList(s).find((m) => m.id === 'summon');
  recordMission(s, 'summon', m0.goal);
  const m1 = missionList(s).find((m) => m.id === 'summon');
  assert.equal(m1.done, true);
  assert.equal(claimMission(s, 'summon').ok, true);
  assert.equal(claimMission(s, 'summon').ok, false, '중복 수령 차단');
});

test('daily: 던전 일일 입장 제한', () => {
  const s = strongState();
  const type = Object.keys(DUNGEONS)[0];
  const cap = DUNGEONS[type].entriesPerDay;
  let ok = 0;
  while (enterDungeon(s, type).ok) ok++;
  assert.equal(ok, cap);
  assert.equal(dungeonEntriesLeft(s, type), 0);
});

test('shop: 광고 일일 제한 + 다이아 구매', () => {
  const s = strongState();
  const ad = SHOP.ad[0];
  let n = 0; while (purchase(s, ad.id).ok) n++;
  assert.equal(n, ad.limit);
  assert.equal(adLeft(s, ad.id), 0);
  const gemItem = SHOP.gem[0];
  const before = s.wallet.summon;
  assert.equal(purchase(s, gemItem.id).ok, true);
  assert.ok(s.wallet.summon >= before, '보상 지급');
});

test('arena: 일일 입장 소진 + 포인트 변동', () => {
  const s = strongState();
  assert.equal(arenaEntriesLeft(s), ARENA_ENTRIES);
  for (let i = 0; i < ARENA_ENTRIES; i++) assert.equal(arenaFight(s, () => 0.1).ok, true);
  assert.equal(arenaEntriesLeft(s), 0);
  assert.equal(arenaFight(s).ok, false, '소진');
  assert.ok(s.arena.points >= 0);
});

test('guild: 일일 공격 소진 + 보스 피해 누적', () => {
  const s = strongState();
  assert.equal(guildAttacksLeft(s), GUILD_ATTACKS);
  const first = guildAttack(s);
  assert.equal(first.ok, true);
  assert.ok(first.dmg > 0);
  let n = 1; while (guildAttack(s).ok) n++;
  assert.equal(n, GUILD_ATTACKS);
});

test('compshop: 경쟁 재화 소모 환전 + 부족 차단', () => {
  const s = strongState();
  s.arena.points = 400;
  assert.equal(compPurchase(s, 'arena', 'AP_SUMMON').ok, true);
  assert.ok(s.arena.points < 400);
  s.arena.points = 0;
  assert.equal(compPurchase(s, 'arena', 'AP_GEM').ok, false);
});

test('campaign: 챕터 클리어/잠금/보상', () => {
  const s = strongState(60);
  assert.equal(fightChapter(s, 3).ok, false, '이전 챕터 먼저');
  const r = fightChapter(s, 0);
  assert.equal(r.ok, true);
  if (r.win) { assert.equal(s.campaign.cleared, 1); assert.ok(r.reward); }
  assert.ok(CAMPAIGN_CHAPTER_COUNT === 8);
});

test('meta: 업적 수령 1회 + 시즌 프리미엄 게이팅', () => {
  const s = strongState(60);
  const done = achievementList(s).find((a) => a.done && !a.claimed);
  if (done) {
    assert.equal(claimAchievement(s, done.id).ok, true);
    assert.equal(claimAchievement(s, done.id).ok, false, '중복 차단');
  }
  const tier = seasonTier(s);
  if (tier >= 1) {
    assert.equal(claimSeason(s, 1, 'premium').ok, false, '패스 없이 프리미엄 차단');
    buySeasonPremium(s);
    assert.equal(claimSeason(s, 1, 'premium').ok, true);
  }
});

test('tower: 승리 시 전진·보상, 층 난이도 단조 증가', () => {
  const s = strongState(60);
  s.prestige = 200; // 계정 배수로 상위 층 등반 가능
  assert.ok(towerChallenge(10).hp > towerChallenge(1).hp, '층 난이도↑');
  const f0 = s.tower.floor;
  const r = climbTower(s);
  assert.equal(r.ok, true);
  if (r.win) {
    assert.equal(s.tower.floor, f0 + 1, '승리 시 전진');
    assert.ok(s.tower.best >= s.tower.floor);
    assert.ok(r.reward.gem >= 2);
  }
  // 5층 마일스톤 보상
  s.tower.floor = 5;
  const r5 = climbTower(s);
  if (r5.win) assert.ok(r5.milestone && r5.reward.summon, '5층 마일스톤');
});

test('tutorial: 목표 전이 level→summon→party→완료', () => {
  const u = createUnit('STRIKER', { level: 1, rank: 2, characterId: 'mir' }); u.rarity = 'N';
  const s = createGameState({ units: [u], party: [u.uid] });
  assert.equal(nextObjective(s).id, 'level');
  s.peakStage = 8;
  assert.equal(nextObjective(s).id, 'summon');
  s.units.push(createUnit('VANGUARD', { level: 1, rank: 1 }));
  assert.equal(nextObjective(s).id, 'party');
  s.party.push(s.units[1].uid);
  assert.equal(nextObjective(s), null, '완료');
});
