import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { T, rarityMeta } from '../theme';
import { Card, Btn, fmt, MultiToggle, multLabel, repeat } from '../components';
import {
  ATTENDANCE, canClaimAttendance, claimAttendance,
  missionList, claimMission, DUNGEONS, dungeonEntriesLeft, enterDungeon,
} from '../../system/core/daily.mjs';
import { RELICS, relicUpgradeCost, upgradeRelic, relicCap } from '../../system/core/relics.mjs';
import { PETS, petSummon, equipPet, unequipPet, petEffectLabel, MAX_ACTIVE_PETS, PET_PULL_COST,
  rerollPetOpt, petFuse, petFuseAvail, petOptLabel, PET_FUSE_COST } from '../../system/core/pets.mjs';
import { getStage } from '../../system/core/progression.mjs';
import { GEAR_CATALOG, GEAR_RARITY } from '../../system/core/gear.mjs';
import { isUnlocked, unlockStage } from '../../system/core/unlocks.mjs';
import { campaignChapters, fightChapter, CAMPAIGN_CHAPTER_COUNT } from '../../system/core/campaign.mjs';
import { elementMeta } from '../../system/concepts/index.mjs';

function rewardText(concept, reward) {
  return Object.entries(reward)
    .map(([k, v]) => `${concept.resources[k]?.emoji || ''}${fmt(v)}`)
    .join(' ');
}

// 던전별 해금 게이트 + 표시.
const DUNGEON_META = {
  GOLD: { feature: 'dungeonGold' },
  ESSENCE: { feature: 'dungeonEssence' },
  GEAR: { feature: 'dungeonEssence', label: '⚔️ 장비 던전', drop: '장비 드롭(등급 랜덤)' },
  RUNE: { feature: 'dungeonEssence', label: '🔷 룬 던전', drop: '룬 드롭(등급 랜덤)' },
};

export default function ContentScreen({ state, bump, concept }) {
  const [mult, setMult] = useState(1);
  const [camResult, setCamResult] = useState(null);
  const [dropMsg, setDropMsg] = useState(null);
  const act = (fn) => { fn(); bump(); };
  const actN = (fn) => { repeat(fn, mult); bump(); };
  // 아이템 던전: mult회 입장 → 마지막 드롭 요약 표시.
  const runDungeon = (type) => {
    let last = null, count = 0;
    repeat(() => { const r = enterDungeon(state, type); if (r.ok) { count++; last = r; } return r; }, mult);
    if (last && last.kind === 'gear') setDropMsg(`⚔️ 장비 ${count}개 · 최근 [${(GEAR_RARITY[last.rarity] || {}).label || last.rarity}] ${GEAR_CATALOG[last.item.blueprint].label}`);
    else if (last && last.kind === 'rune') setDropMsg(`🔷 룬 ${count}개 · 최근 [${last.rarity}]`);
    bump();
  };

  const chapters = campaignChapters(state, concept.campaign || []);
  const nextCh = chapters.find((c) => c.isNext);
  const allClear = state.campaign.cleared >= CAMPAIGN_CHAPTER_COUNT;
  const doFight = () => { const r = fightChapter(state, nextCh.index); setCamResult(r); bump(); };
  const streakIdx = state.daily.streak % ATTENDANCE.length;
  const canAtt = canClaimAttendance(state);
  const missions = missionList(state);

  return (
    <ScrollView style={c.flex} contentContainerStyle={c.wrap}>
      {/* 스토리 캠페인 */}
      <Card style={{ borderColor: T.accent }}>
        <Text style={c.sec}>📖 스토리 <Text style={c.dim}>챕터 {state.campaign.cleared}/{CAMPAIGN_CHAPTER_COUNT}</Text></Text>
        {allClear ? (
          <Text style={c.storyText}>모든 챕터를 완결했습니다. 새로운 서사가 곧 이어집니다…</Text>
        ) : (<>
          <Text style={c.chTitle}>Ch.{nextCh.index + 1} · {nextCh.title}</Text>
          <Text style={c.storyText}>{nextCh.story}</Text>
          <View style={c.bossRow}>
            <Text style={c.bossInfo}>
              보스 {elementMeta(concept, nextCh.boss.element)?.emoji} · HP {fmt(nextCh.boss.hp)} · ATK {fmt(nextCh.boss.atk)}
            </Text>
            <Text style={c.bossReward}>보상 {concept.resources.gem.emoji}{nextCh.reward.gem} {concept.resources.summon.emoji}{nextCh.reward.summon}</Text>
          </View>
          {camResult && (
            <Text style={[c.camResult, { color: camResult.win ? T.good : T.danger }]}>
              {camResult.win
                ? `승리! ${camResult.reward ? '챕터 클리어 · 보상 획득' : '(이미 클리어)'}`
                : `패배 — 더 강해진 뒤 다시 도전 (여유 ${camResult.margin?.toFixed(2)})`}
            </Text>
          )}
          <View style={{ height: 10 }} />
          <Btn label="보스 도전" kind="gold" onPress={doFight} />
        </>)}
        {/* 진행 도트 */}
        <View style={c.dots}>
          {chapters.map((ch) => (
            <View key={ch.index} style={[c.dot, ch.cleared && c.dotDone, ch.isNext && c.dotNext]} />
          ))}
        </View>
      </Card>

      {/* 출석 */}
      <Card style={{ marginTop: 12 }}>
        <Text style={c.sec}>출석 체크</Text>
        <Text style={c.sub}>연속 {state.daily.streak}일 · 오늘 보상 {rewardText(concept, ATTENDANCE[streakIdx])}</Text>
        <View style={c.attRow}>
          {ATTENDANCE.map((r, i) => (
            <View key={i} style={[c.attCell, i === streakIdx && canAtt && c.attToday, i < streakIdx % ATTENDANCE.length && c.attDone]}>
              <Text style={c.attDay}>{i + 1}</Text>
              <Text style={c.attEmoji}>{concept.resources[Object.keys(r)[0]]?.emoji}</Text>
            </View>
          ))}
        </View>
        <Btn label={canAtt ? '출석 보상 받기' : '오늘 수령 완료'} kind="gold" disabled={!canAtt}
          onPress={() => act(() => claimAttendance(state))} />
      </Card>

      {/* 일일 미션 */}
      <Card style={{ marginTop: 12 }}>
        <Text style={c.sec}>일일 미션</Text>
        {missions.map((m) => (
          <View key={m.id} style={c.mRow}>
            <View style={{ flex: 1 }}>
              <Text style={c.mLabel}>{m.label} <Text style={c.dim}>{m.progress}/{m.goal}</Text></Text>
              <View style={c.bar}><View style={[c.barFill, { width: `${(m.progress / m.goal) * 100}%` }]} /></View>
              <Text style={c.mReward}>보상 {rewardText(concept, m.reward)}</Text>
            </View>
            <Btn small kind={m.claimed ? 'ghost' : 'gold'} disabled={!m.done || m.claimed}
              label={m.claimed ? '완료' : '받기'} onPress={() => act(() => claimMission(state, m.id))} />
          </View>
        ))}
      </Card>

      {/* 던전 */}
      <Card style={{ marginTop: 12 }}>
        <Text style={c.sec}>던전</Text>
        <Text style={c.sub}>자원·아이템 파밍 · 하루 입장 제한</Text>
        {Object.entries(DUNGEONS).map(([type, d]) => {
          const meta = DUNGEON_META[type];
          const unlocked = isUnlocked(state, meta.feature);
          const left = dungeonEntriesLeft(state, type);
          const isItem = d.kind === 'gear' || d.kind === 'rune';
          const res = d.resource ? concept.resources[d.resource] : null;
          const label = isItem ? meta.label : `${res.emoji} ${res.name} 던전`;
          const amount = res ? Math.round(getStage(state.peakStage).rewards[d.resource] * 40) : 0;
          const rewardTxt = isItem
            ? `1회 ${meta.drop} · 입장 ${left}/${d.entriesPerDay}`
            : `1회 ${res.emoji}+${fmt(amount)} · 입장 ${left}/${d.entriesPerDay}`;
          return (
            <View key={type} style={c.dRow}>
              <View style={{ flex: 1 }}>
                <Text style={c.mLabel}>{label}</Text>
                {unlocked
                  ? <Text style={c.mReward}>{rewardTxt}</Text>
                  : <Text style={c.mReward}>🔒 스테이지 {unlockStage(meta.feature)} 해금</Text>}
              </View>
              <Btn small label={unlocked ? '입장' : '잠김'} disabled={!unlocked || left <= 0}
                onPress={() => (isItem ? runDungeon(type) : actN(() => enterDungeon(state, type)))} />
            </View>
          );
        })}
        {dropMsg ? <Text style={c.dropMsg}>{dropMsg}</Text> : null}
      </Card>

      {/* 펫 */}
      <Card style={{ marginTop: 12 }}>
        <View style={c.petHead}>
          <Text style={c.sec}>펫 <Text style={c.dim}>(장착 {state.pets.active.length}/{MAX_ACTIVE_PETS})</Text></Text>
          {isUnlocked(state, 'pets') && <MultiToggle value={mult} onChange={setMult} />}
        </View>
        {isUnlocked(state, 'pets') && (
          <Btn small kind="gold" label={`펫 소환 ${multLabel(mult)} ${concept.resources.gem.emoji}${mult === 'Max' ? '' : fmt(PET_PULL_COST.gem * mult)}`}
            disabled={(state.wallet.gem || 0) < PET_PULL_COST.gem} onPress={() => actN(() => petSummon(state))} />
        )}
        {!isUnlocked(state, 'pets') && <Text style={c.sub}>🔒 스테이지 {unlockStage('pets')} 도달 시 해금</Text>}
        {isUnlocked(state, 'pets') && Object.keys(state.pets.owned).length === 0 && <Text style={c.sub}>보유 펫 없음 — 소환으로 획득하세요.</Text>}
        {/* 합성(승급): 하위 등급 펫 레벨 소모 → 상위 1 */}
        {isUnlocked(state, 'pets') && Object.keys(state.pets.owned).length > 0 && (
          <View style={c.fuseRow}>
            {['R', 'SR', 'SSR'].map((rar) => {
              const avail = petFuseAvail(state, rar);
              const can = avail >= PET_FUSE_COST;
              return (
                <Btn key={rar} small kind={can ? 'gold' : 'ghost'} disabled={!can}
                  label={`${rar} 합성 ${Math.min(avail, PET_FUSE_COST)}/${PET_FUSE_COST}`}
                  onPress={() => act(() => petFuse(state, rar))} />
              );
            })}
          </View>
        )}
        {isUnlocked(state, 'pets') && Object.entries(state.pets.owned).map(([id, lv]) => {
          const p = PETS[id];
          const active = state.pets.active.includes(id);
          const full = state.pets.active.length >= MAX_ACTIVE_PETS;
          const opt = state.pets.opts && state.pets.opts[id];
          return (
            <View key={id} style={c.dRow}>
              <Text style={c.petEmoji}>{p.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={c.mLabel}>{p.label} <Text style={c.dim}>Lv.{lv}</Text> <Text style={{ color: rarityMeta(p.rarity).color, fontWeight: '900', fontSize: 12 }}>{p.rarity}</Text></Text>
                <Text style={c.mReward}>{petEffectLabel(p.type, concept)} +{Math.round(p.per * lv * 100)}%{opt ? ` · 옵션 ${petOptLabel(opt, concept)}` : ''}</Text>
              </View>
              <View style={{ gap: 5 }}>
                <Btn small kind={active ? 'ghost' : 'primary'} disabled={!active && full}
                  label={active ? '해제' : full ? '슬롯참' : '장착'}
                  onPress={() => act(() => (active ? unequipPet(state, id) : equipPet(state, id)))} />
                <Btn small kind="ghost" label="옵션재련 💎15" onPress={() => act(() => rerollPetOpt(state, id))} />
              </View>
            </View>
          );
        })}
      </Card>

      {/* 유물 */}
      <Card style={{ marginTop: 12, marginBottom: 24 }}>
        <View style={c.petHead}>
          <Text style={c.sec}>유물 <Text style={c.dim}>(계정 영구 성장)</Text></Text>
          <MultiToggle value={mult} onChange={setMult} />
        </View>
        {Object.values(RELICS).map((r) => {
          const lv = (state.relics && state.relics[r.id]) || 0;
          const cost = relicUpgradeCost(lv);
          const eff = r.kind === 'power' ? '전투력' : r.kind === 'currency' ? `${concept.resources.currency.name} 수입` : `${concept.resources.growth.name} 수입`;
          const cap = relicCap(r.id);
          const maxed = lv >= cap;
          return (
            <View key={r.id} style={c.dRow}>
              <Text style={c.petEmoji}>{r.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={c.mLabel}>{r.label} <Text style={c.dim}>Lv.{lv}/{cap}</Text> <Text style={{ color: rarityMeta(r.rarity).color, fontWeight: '900', fontSize: 12 }}>{r.rarity}</Text></Text>
                <Text style={c.mReward}>{eff} +{Math.round(r.per * lv * 100)}%{maxed ? ' (MAX)' : ` → +${Math.round(r.per * (lv + 1) * 100)}%`}</Text>
              </View>
              <Btn small kind="ghost" disabled={maxed} label={maxed ? 'MAX' : `강화 ×${mult} ${concept.resources.currency.emoji}${fmt(cost.currency)}`}
                onPress={() => actN(() => upgradeRelic(state, r.id))} />
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}

const c = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { padding: 14 },
  sec: { color: T.text, fontWeight: '800', fontSize: 15, marginBottom: 4 },
  sub: { color: T.muted, fontSize: 12, marginBottom: 12 },
  dim: { color: T.muted, fontSize: 12, fontWeight: '400' },
  attRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  attCell: { flex: 1, backgroundColor: T.surface2, borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  attToday: { borderColor: T.accent },
  attDone: { opacity: 0.4 },
  attDay: { color: T.muted, fontSize: 10 },
  attEmoji: { fontSize: 16, marginTop: 2 },
  mRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: T.line },
  mLabel: { color: T.text, fontWeight: '700', fontSize: 14 },
  mReward: { color: T.muted, fontSize: 12, marginTop: 3 },
  dropMsg: { color: T.accent, fontSize: 12, fontWeight: '700', marginTop: 8 },
  bar: { height: 6, backgroundColor: T.surface2, borderRadius: 3, marginTop: 5, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: T.good, borderRadius: 3 },
  dRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: T.line },
  petHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  petEmoji: { fontSize: 26, width: 34, textAlign: 'center' },
  fuseRow: { flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 6, flexWrap: 'wrap' },
  chTitle: { color: T.accent, fontWeight: '800', fontSize: 14, marginTop: 6 },
  storyText: { color: T.text, fontSize: 13, lineHeight: 19, marginTop: 6, fontStyle: 'italic' },
  bossRow: { marginTop: 10 },
  bossInfo: { color: T.muted, fontSize: 12 },
  bossReward: { color: T.good, fontSize: 12, fontWeight: '700', marginTop: 3 },
  camResult: { fontSize: 13, fontWeight: '800', marginTop: 10 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 12, justifyContent: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: T.surface2 },
  dotDone: { backgroundColor: T.good },
  dotNext: { backgroundColor: T.accent },
});
