import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { T } from '../theme';
import { Card, Btn, fmt, Portrait } from '../components';
import { charImage } from '../charImages';
import { elementMeta } from '../../system/concepts/index.mjs';
import { getArchetype } from '../../system/core/archetypes.mjs';
import { SKILL_CATALOG } from '../../system/core/skills.mjs';
import {
  achievementList, claimAchievement, collectionList, claimCollection,
  seasonProgress, seasonTierList, claimSeason, buySeasonPremium, ownedCharacterIds, metaGrantPreview,
} from '../../system/core/meta.mjs';

// 도감 캐릭터 상세 — 서사·직업·전용 스킬 (수집 동기)
function DexModal({ concept, ch, onClose }) {
  if (!ch) return null;
  const arch = concept.archetypes[ch.archetype] || { name: ch.archetype, emoji: '❔' };
  const role = getArchetype(ch.archetype);
  const em = ch.element && elementMeta(concept, ch.element);
  const sig = ch.signature && SKILL_CATALOG[ch.signature];
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <TouchableOpacity style={dm.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={dm.sheet}>
          <View style={dm.head}>
            <Portrait emoji={ch.emoji} image={charImage(concept.id, ch.id)} rarity={ch.rarity} size={72} badge />
            <View style={{ flex: 1 }}>
              <Text style={dm.name}>{ch.name} <Text style={dm.rarity}>{ch.rarity}</Text></Text>
              <Text style={dm.title}>{ch.title}{ch.personality ? ` · ${ch.personality}` : ''}</Text>
              <Text style={dm.sub}>{arch.emoji} {arch.name} · {role.roleLabel}{em ? ` · ${em.emoji}${em.name}` : ''}</Text>
            </View>
          </View>
          <Text style={dm.trait}>{role.trait}</Text>
          {ch.lines?.greet && <Text style={dm.quote}>“{ch.lines.greet}”</Text>}
          {sig && (
            <View style={dm.sigBox}>
              <Text style={dm.sigLabel}>전용 스킬 · {sig.label}</Text>
              <Text style={dm.sigDesc}>{sig.desc}</Text>
            </View>
          )}
          <View style={{ height: 10 }} />
          <Btn label="닫기" onPress={onClose} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
const dm = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: T.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, borderTopWidth: 1, borderColor: T.line },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  name: { color: T.text, fontWeight: '900', fontSize: 20 },
  rarity: { color: T.accent, fontSize: 13, fontWeight: '800' },
  title: { color: T.primary, fontSize: 13, fontWeight: '700', marginTop: 2 },
  sub: { color: T.muted, fontSize: 12, marginTop: 3 },
  trait: { color: T.text, fontSize: 13, lineHeight: 19 },
  quote: { color: T.muted, fontSize: 14, fontStyle: 'italic', marginTop: 10 },
  sigBox: { marginTop: 12, backgroundColor: T.surface2, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: T.accent },
  sigLabel: { color: T.accent, fontWeight: '800', fontSize: 13 },
  sigDesc: { color: T.muted, fontSize: 12, marginTop: 4 },
});

function rewardText(state, concept, reward) {
  const g = metaGrantPreview(state, reward);
  return Object.entries(g).map(([k, v]) => `${concept.resources[k]?.emoji || ''}${fmt(v)}`).join(' ');
}

export default function MetaScreen({ state, bump, concept, embedded }) {
  const act = (fn) => { fn(); bump(); };
  const [dexChar, setDexChar] = useState(null);
  const sp = seasonProgress(state);
  const tiers = seasonTierList(state);
  const achv = achievementList(state);
  const coll = collectionList(state);
  const owned = ownedCharacterIds(state);
  const claimableTiers = tiers.filter((t) => t.reached && (!t.free.claimed || (sp.premium && !t.premium.claimed)));

  // embedded면 자체 스크롤 없이 호스트(영웅 탭) ScrollView에 편승.
  const Container = embedded ? View : ScrollView;
  const cProps = embedded ? {} : { style: c.flex, contentContainerStyle: c.wrap };
  return (
    <Container {...cProps}>
      {/* 시즌패스 */}
      <Card>
        <View style={c.head}>
          <Text style={c.sec}>🎟️ 시즌패스 <Text style={c.dim}>Tier {sp.tier}</Text></Text>
          {!sp.premium && <Btn small kind="gold" label="프리미엄 ₩9,900" onPress={() => act(() => buySeasonPremium(state))} />}
          {sp.premium && <Text style={c.premiumOn}>프리미엄 보유</Text>}
        </View>
        <Text style={c.sub}>진행도로 XP가 쌓입니다 · 다음 티어까지 {sp.per - sp.into}/{sp.per}</Text>
        <View style={c.bar}><View style={[c.barFill, { width: `${(sp.into / sp.per) * 100}%` }]} /></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={c.tierRow}>
          {tiers.map((t) => (
            <View key={t.tier} style={[c.tier, t.reached && c.tierOn]}>
              <Text style={c.tierNum}>T{t.tier}</Text>
              <Btn small kind={t.free.claimed ? 'ghost' : 'primary'} disabled={!t.reached || t.free.claimed}
                label={t.free.claimed ? '완료' : rewardText(state, concept, t.free.reward)}
                onPress={() => act(() => claimSeason(state, t.tier, 'free'))} />
              <View style={{ height: 5 }} />
              <Btn small kind={t.premium.claimed ? 'ghost' : 'gold'} disabled={!t.reached || !sp.premium || t.premium.claimed}
                label={t.premium.claimed ? '완료' : `⭐${rewardText(state, concept, t.premium.reward)}`}
                onPress={() => act(() => claimSeason(state, t.tier, 'premium'))} />
            </View>
          ))}
        </ScrollView>
        {claimableTiers.length > 0 && <Text style={c.hint}>받을 수 있는 보상 {claimableTiers.length}개</Text>}
      </Card>

      {/* 업적 */}
      <Card style={{ marginTop: 12 }}>
        <Text style={c.sec}>🏆 업적</Text>
        {achv.map((a) => (
          <View key={a.id} style={c.row}>
            <View style={{ flex: 1 }}>
              <Text style={c.label}>{a.label} <Text style={c.dim}>{Math.min(a.cur, a.goal)}/{a.goal}</Text></Text>
              <Text style={c.rowSub}>{a.desc} · 보상 {rewardText(state, concept, a.reward)}</Text>
            </View>
            <Btn small kind={a.claimed ? 'ghost' : 'gold'} disabled={!a.done || a.claimed}
              label={a.claimed ? '완료' : a.done ? '받기' : '진행중'} onPress={() => act(() => claimAchievement(state, a.id))} />
          </View>
        ))}
      </Card>

      {/* 도감 */}
      <Card style={{ marginTop: 12, marginBottom: 24 }}>
        <Text style={c.sec}>📖 도감 <Text style={c.dim}>{owned.size}/{concept.roster.length} 수집</Text></Text>
        <View style={c.grid}>
          {concept.roster.map((ch) => {
            const has = owned.has(ch.id);
            return (
              <TouchableOpacity key={ch.id} activeOpacity={has ? 0.7 : 1} style={[c.dex, has && c.dexOn]}
                onPress={() => has && setDexChar(ch)}
                accessibilityRole="button" accessibilityLabel={has ? `${ch.name} 도감 상세` : '미획득 캐릭터'}>
                <Portrait emoji={has ? ch.emoji : '❔'} image={has ? charImage(concept.id, ch.id) : null} rarity={has ? ch.rarity : 'N'} size={40} dim={!has} glow={has} />
                <Text style={c.dexName} numberOfLines={1}>{has ? ch.name : '???'}</Text>
                {has ? <Text style={c.dexRarity}>{ch.rarity}</Text> : <Text style={c.dexRarity}> </Text>}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 6 }} />
        {coll.map((m) => (
          <View key={m.id} style={c.row}>
            <View style={{ flex: 1 }}>
              <Text style={c.label}>{m.need}종 수집 <Text style={c.dim}>{Math.min(m.owned, m.need)}/{m.need}</Text></Text>
              <Text style={c.rowSub}>보상 {rewardText(state, concept, m.reward)}</Text>
            </View>
            <Btn small kind={m.claimed ? 'ghost' : 'gold'} disabled={!m.done || m.claimed}
              label={m.claimed ? '완료' : m.done ? '받기' : '진행중'} onPress={() => act(() => claimCollection(state, m.id))} />
          </View>
        ))}
      </Card>

      <DexModal concept={concept} ch={dexChar} onClose={() => setDexChar(null)} />
    </Container>
  );
}

const c = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { padding: 14 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sec: { color: T.text, fontWeight: '800', fontSize: 15, marginBottom: 4 },
  dim: { color: T.muted, fontSize: 12, fontWeight: '400' },
  sub: { color: T.muted, fontSize: 12, marginBottom: 8 },
  premiumOn: { color: T.accent, fontWeight: '800', fontSize: 12 },
  bar: { height: 8, backgroundColor: T.surface2, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  barFill: { height: 8, backgroundColor: T.accent, borderRadius: 4 },
  tierRow: { gap: 8, paddingRight: 8 },
  tier: { width: 96, backgroundColor: T.surface2, borderRadius: 12, padding: 8, alignItems: 'stretch', borderWidth: 1, borderColor: 'transparent' },
  tierOn: { borderColor: T.accent },
  tierNum: { color: T.text, fontWeight: '800', fontSize: 12, textAlign: 'center', marginBottom: 6 },
  hint: { color: T.accent, fontSize: 12, fontWeight: '700', marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: T.line },
  label: { color: T.text, fontWeight: '700', fontSize: 14 },
  rowSub: { color: T.muted, fontSize: 12, marginTop: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dex: { width: 72, backgroundColor: T.surface2, borderRadius: 12, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  dexOn: { borderColor: T.accent },
  dexName: { color: T.text, fontSize: 11, fontWeight: '700', marginTop: 3 },
  dexRarity: { color: T.accent, fontSize: 10, fontWeight: '800', marginTop: 1 },
});
