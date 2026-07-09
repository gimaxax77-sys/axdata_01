import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { T, rarityMeta } from '../theme';
import { Card, Btn, fmt, MultiToggle, multLabel, repeat } from '../components';
import { fx } from '../feedback';
import { RELICS, relicUpgradeCost, upgradeRelic, relicCap } from '../../system/core/relics.mjs';
import { EMBLEMS, emblemUpgradeCost, upgradeEmblem, emblemCap, emblemComplete, EMBLEM_COMPLETE_BONUS } from '../../system/core/emblems.mjs';
import { GUARDIANS, guardianSummon, equipGuardian, unequipGuardian, guardianEffectLabel, GUARDIAN_SUMMON_COST, MAX_ACTIVE_GUARDIANS } from '../../system/core/guardians.mjs';
import { PETS, petSummon, equipPet, unequipPet, petEffectLabel, MAX_ACTIVE_PETS, PET_PULL_COST,
  rerollPetOpt, petFuse, petFuseAvail, petOptLabel, PET_FUSE_COST,
  petShardSummon, SHARD_SUMMON_COST, autoFusePets } from '../../system/core/pets.mjs';
import { MATERIAL_META, SHARD_META, materialCount } from '../../system/core/materials.mjs';
import { isUnlocked, unlockStage } from '../../system/core/unlocks.mjs';

// 등급 인라인 배지 — 등급색 배경 + 어두운 글자(다크 배경 시인성).
function rarityText(r) {
  return { backgroundColor: rarityMeta(r).color, color: '#160f28', fontWeight: '900', fontSize: 11, borderRadius: 4, overflow: 'hidden' };
}

// ─────────────────────────────────────────────────────────────
// GrowthPanel — 계정 성장 시스템(펫·유물·엠블럼·정령) 묶음.
//   원래 콘텐츠 탭에 있던 걸 영웅 탭 '성장' 서브탭으로 이전(재사용 컴포넌트).
//   자체 ScrollView 없음 — 부모(영웅 탭 ScrollView) 안에 배치된다.
// ─────────────────────────────────────────────────────────────
export default function GrowthPanel({ state, bump, concept }) {
  const [mult, setMult] = useState(1);
  const [msg, setMsg] = useState(null);
  const act = (fn) => { fn(); bump(); };
  const actN = (fn) => { repeat(fn, mult); bump(); };
  const doAutoFuse = (opts) => {
    const r = autoFusePets(state, Math.random, opts);
    if (r.ok) { fx('success'); setMsg(`🔁 자동 합성 ${r.fused}회${opts && opts.stopAt ? ` (${opts.stopAt} 보호)` : ''}`); } else { fx('error'); }
    bump();
  };

  return (
    <View>
      {/* 보유 재료 요약(펫조각·돌파석·정수) */}
      <View style={c.matBar}>
        <Text style={c.matChip}>{MATERIAL_META.ascendStone.emoji} {MATERIAL_META.ascendStone.label} {fmt(materialCount(state, 'ascendStone'))}</Text>
        <Text style={c.matChip}>{MATERIAL_META.elemEssence.emoji} {MATERIAL_META.elemEssence.label} {fmt(materialCount(state, 'elemEssence'))}</Text>
        {['R', 'SR', 'SSR', 'UR'].map((g) => (
          <Text key={g} style={c.matChip}>{SHARD_META.emoji}{g} {fmt(materialCount(state, 'petShard', g))}</Text>
        ))}
      </View>
      {msg ? <Text style={c.msg}>{msg}</Text> : null}

      {/* 펫 */}
      <Card style={{ marginTop: 4 }}>
        <View style={c.petHead}>
          <Text style={c.sec}>🐾 펫 <Text style={c.dim}>(장착 {state.pets.active.length}/{MAX_ACTIVE_PETS})</Text></Text>
          {isUnlocked(state, 'pets') && <MultiToggle value={mult} onChange={setMult} />}
        </View>
        {isUnlocked(state, 'pets') && (
          <Btn small kind="gold" label={`펫 소환 ${multLabel(mult)} ${concept.resources.gem.emoji}${mult === 'Max' ? '' : fmt(PET_PULL_COST.gem * mult)}`}
            disabled={(state.wallet.gem || 0) < PET_PULL_COST.gem} onPress={() => actN(() => petSummon(state))} />
        )}
        {!isUnlocked(state, 'pets') && <Text style={c.sub}>🔒 스테이지 {unlockStage('pets')} 도달 시 해금</Text>}
        {isUnlocked(state, 'pets') && Object.keys(state.pets.owned).length === 0 && <Text style={c.sub}>보유 펫 없음 — 소환으로 획득하세요.</Text>}
        {isUnlocked(state, 'pets') && (
          <View style={c.fuseRow}>
            {['R', 'SR', 'SSR', 'UR'].map((g) => {
              const have = materialCount(state, 'petShard', g);
              const can = have >= SHARD_SUMMON_COST;
              return (
                <Btn key={g} small kind={can ? 'gold' : 'ghost'} disabled={!can}
                  label={`${SHARD_META.emoji}${g} 소환 ${Math.min(have, SHARD_SUMMON_COST)}/${SHARD_SUMMON_COST}`}
                  onPress={() => act(() => petShardSummon(state, g))} />
              );
            })}
          </View>
        )}
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
            <Btn small kind="primary"
              disabled={!['R', 'SR', 'SSR'].some((rar) => petFuseAvail(state, rar) >= PET_FUSE_COST)}
              label="🔁 자동 합성" onPress={() => doAutoFuse()} />
            <Btn small kind="ghost"
              disabled={!['R', 'SR'].some((rar) => petFuseAvail(state, rar) >= PET_FUSE_COST)}
              label="🛡️ SSR 보호 합성" onPress={() => doAutoFuse({ stopAt: 'SSR' })} />
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
                <Text style={c.mLabel}>{p.label} <Text style={c.dim}>Lv.{lv}</Text> <Text style={rarityText(p.rarity)}> {p.rarity} </Text></Text>
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
      <Card style={{ marginTop: 12 }}>
        <View style={c.petHead}>
          <Text style={c.sec}>🏺 유물 <Text style={c.dim}>(계정 영구 성장)</Text></Text>
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
                <Text style={c.mLabel}>{r.label} <Text style={c.dim}>Lv.{lv}/{cap}</Text> <Text style={rarityText(r.rarity)}> {r.rarity} </Text></Text>
                <Text style={c.mReward}>{eff} +{Math.round(r.per * lv * 100)}%{maxed ? ' (MAX)' : ` → +${Math.round(r.per * (lv + 1) * 100)}%`}</Text>
              </View>
              <Btn small kind="ghost" disabled={maxed} label={maxed ? 'MAX' : `강화 ×${mult} ${concept.resources.currency.emoji}${fmt(cost.currency)}`}
                onPress={() => actN(() => upgradeRelic(state, r.id))} />
            </View>
          );
        })}
      </Card>

      {/* 엠블럼(문장) */}
      <Card style={{ marginTop: 12 }}>
        <View style={c.petHead}>
          <Text style={c.sec}>🎖️ 엠블럼 <Text style={c.dim}>(문장 · 계정 공유)</Text></Text>
          {isUnlocked(state, 'emblem') && <MultiToggle value={mult} onChange={setMult} />}
        </View>
        {!isUnlocked(state, 'emblem') && <Text style={c.sub}>🔒 스테이지 {unlockStage('emblem')} 도달 시 해금</Text>}
        {isUnlocked(state, 'emblem') && <Text style={c.sub}>{emblemComplete(state) ? `✨ 도감 완성 · 전투력 +${Math.round(EMBLEM_COMPLETE_BONUS * 100)}%` : '전 문장 1레벨↑ 수집 시 완성 보너스'}</Text>}
        {isUnlocked(state, 'emblem') && Object.values(EMBLEMS).map((e) => {
          const lv = (state.emblems && state.emblems[e.id]) || 0;
          const cost = emblemUpgradeCost(lv);
          const eff = e.kind === 'power' ? '전투력' : e.kind === 'currency' ? `${concept.resources.currency.name} 수입` : `${concept.resources.growth.name} 수입`;
          const cap = emblemCap(e.id);
          const maxed = lv >= cap;
          return (
            <View key={e.id} style={c.dRow}>
              <Text style={c.petEmoji}>{e.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={c.mLabel}>{e.label} <Text style={c.dim}>Lv.{lv}/{cap}</Text> <Text style={rarityText(e.rarity)}> {e.rarity} </Text></Text>
                <Text style={c.mReward}>{eff} +{Math.round(e.per * lv * 100)}%{maxed ? ' (MAX)' : ` → +${Math.round(e.per * (lv + 1) * 100)}%`}</Text>
              </View>
              <Btn small kind="ghost" disabled={maxed} label={maxed ? 'MAX' : `강화 ×${mult} ${concept.resources.gem.emoji}${fmt(cost.gem)}`}
                onPress={() => actN(() => upgradeEmblem(state, e.id))} />
            </View>
          );
        })}
      </Card>

      {/* 정령/가디언 */}
      <Card style={{ marginTop: 12, marginBottom: 12 }}>
        <View style={c.petHead}>
          <Text style={c.sec}>🧚 정령 <Text style={c.dim}>(장착 {state.guardians.active.length}/{MAX_ACTIVE_GUARDIANS})</Text></Text>
        </View>
        {!isUnlocked(state, 'guardian') && <Text style={c.sub}>🔒 스테이지 {unlockStage('guardian')} 도달 시 해금</Text>}
        {isUnlocked(state, 'guardian') && (<>
          <Btn small kind="gold" label={`정령 소환 ${multLabel(mult)} ${concept.resources.gem.emoji}${mult === 'Max' ? '' : fmt(GUARDIAN_SUMMON_COST.gem * mult)}`}
            disabled={(state.wallet.gem || 0) < GUARDIAN_SUMMON_COST.gem} onPress={() => actN(() => guardianSummon(state))} />
          {Object.keys(state.guardians.owned).length === 0 && <Text style={c.sub}>보유 정령 없음 — 소환으로 획득하세요.</Text>}
        </>)}
        {isUnlocked(state, 'guardian') && Object.entries(state.guardians.owned).map(([id, lv]) => {
          const gd = GUARDIANS[id];
          const active = state.guardians.active.includes(id);
          const full = state.guardians.active.length >= MAX_ACTIVE_GUARDIANS;
          return (
            <View key={id} style={c.dRow}>
              <Text style={c.petEmoji}>{gd.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={c.mLabel}>{gd.label} <Text style={c.dim}>Lv.{lv}</Text> <Text style={rarityText(gd.rarity)}> {gd.rarity} </Text></Text>
                <Text style={c.mReward}>{guardianEffectLabel(gd.kind, concept)} +{Math.round(gd.per * lv * 100)}%</Text>
              </View>
              <Btn small kind={active ? 'ghost' : 'primary'} disabled={!active && full}
                label={active ? '해제' : full ? '슬롯참' : '장착'}
                onPress={() => act(() => (active ? unequipGuardian(state, id) : equipGuardian(state, id)))} />
            </View>
          );
        })}
      </Card>
    </View>
  );
}

const c = StyleSheet.create({
  sec: { color: T.text, fontWeight: '800', fontSize: 15, marginBottom: 4 },
  sub: { color: T.muted, fontSize: 12, marginBottom: 12 },
  dim: { color: T.muted, fontSize: 12, fontWeight: '400' },
  mLabel: { color: T.text, fontWeight: '700', fontSize: 14 },
  mReward: { color: T.muted, fontSize: 12, marginTop: 3 },
  dRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: T.line },
  petHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  petEmoji: { fontSize: 26, width: 34, textAlign: 'center' },
  fuseRow: { flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 6, flexWrap: 'wrap' },
  matBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  matChip: { color: T.muted, fontSize: 11, fontWeight: '700', backgroundColor: T.surface2, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  msg: { color: T.accent, fontSize: 12, fontWeight: '800', marginBottom: 6 },
});
