import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { Card, Btn, fmt } from '../components';
import { computeStats, computePower } from '../../system/core/stats.mjs';
import { levelCap } from '../../system/core/units.mjs';
import { skillSlots, SKILL_CATALOG } from '../../system/core/skills.mjs';
import { GEAR_SLOTS } from '../../system/core/gear.mjs';
import {
  levelUp, ascend, enhanceNode, equipSkill,
} from '../../system/core/character.mjs';
import { craftGear, equipGear, enhanceGear } from '../../system/core/gear.mjs';

const DEFAULT_SKILLS = { STRIKER: ['BERSERK', 'PRECISION', 'SWIFT'], VANGUARD: ['FORTRESS', 'RALLY', 'VAMPIRIC'], SUPPORT: ['RALLY', 'PRECISION', 'FORTRESS'] };
const DEFAULT_GEAR = { weapon: 'RUNE_BLADE', armor: 'PLATE_ARMOR', accessory: 'CRIT_RING' };

export default function RosterScreen({ state, bump, concept }) {
  const [selId, setSel] = useState(state.party[0] || state.units[0]?.uid);
  const unit = state.units.find((u) => u.uid === selId) || state.units[0];

  // 유닛 목록 (전투력순)
  const list = state.units.slice().sort((a, b) => computePower(b) - computePower(a));

  const act = (fn) => { fn(); bump(); };
  const autoSkills = () => {
    const order = DEFAULT_SKILLS[unit.archetype] || [];
    for (let i = 0; i < skillSlots(unit); i++) if (!unit.skills[i] && order[i]) equipSkill(state, unit.uid, i, order[i]);
    bump();
  };
  const fillGear = () => {
    for (const slot of GEAR_SLOTS) if (!unit.gear[slot]) { const c = craftGear(state, DEFAULT_GEAR[slot]); if (c.ok) equipGear(state, unit.uid, c.item.uid); }
    bump();
  };

  const st8 = computeStats(unit);
  const meta = concept.archetypes[unit.archetype];
  const atCap = unit.level >= levelCap(unit);

  return (
    <ScrollView contentContainerStyle={g.wrap}>
      {/* 보유 유닛 가로 스크롤 */}
      <Text style={g.sec}>보유 {concept.terms.unit} ({list.length})</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={g.hlist}>
        {list.map((u) => {
          const m = concept.archetypes[u.archetype];
          const on = u.uid === unit.uid;
          return (
            <TouchableOpacity key={u.uid} onPress={() => setSel(u.uid)} style={[g.chip, on && g.chipOn]} activeOpacity={0.8}>
              <Text style={g.chipEmoji}>{m.emoji}</Text>
              <Text style={g.chipName} numberOfLines={1}>{m.name}</Text>
              <Text style={g.chipLv}>Lv.{u.level}{u.rarity ? ` · ${u.rarity}` : ''}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 선택 유닛 상세 */}
      <Card style={{ marginTop: 6 }}>
        <View style={g.head}>
          <Text style={g.headEmoji}>{meta.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={g.headName}>{meta.name}</Text>
            <Text style={g.headSub}>Lv.{unit.level}/{levelCap(unit)} · R{unit.rank} · 전투력 {fmt(computePower(unit))}</Text>
          </View>
        </View>
        <View style={g.statGrid}>
          {[['HP', st8.hp], ['ATK', st8.atk], ['DEF', st8.def], ['SPD', st8.spd]].map(([k, v]) => (
            <View key={k} style={g.stat}><Text style={g.statK}>{k}</Text><Text style={g.statV}>{fmt(v)}</Text></View>
          ))}
        </View>

        {/* 스킬/장비 요약 */}
        <Text style={g.subsec}>스킬 {unit.skills.filter(Boolean).length}/{skillSlots(unit)}</Text>
        <View style={g.tagRow}>
          {unit.skills.filter(Boolean).map((sk, i) => (
            <Text key={i} style={g.tag}>{SKILL_CATALOG[sk.id].label}+{sk.level}</Text>
          ))}
          {unit.skills.filter(Boolean).length === 0 && <Text style={g.dim}>없음</Text>}
        </View>
        <View style={g.tagRow}>
          {GEAR_SLOTS.map((slot) => (
            <Text key={slot} style={[g.tag, !unit.gear[slot] && g.tagEmpty]}>
              {unit.gear[slot] ? `${slot} +${unit.gear[slot].level}` : slot}
            </Text>
          ))}
        </View>
      </Card>

      {/* 성장 액션 */}
      <Card style={{ marginTop: 12 }}>
        <Text style={g.sec}>성장</Text>
        <View style={g.btnRow}>
          <View style={{ flex: 1 }}><Btn small label={atCap ? '상한 (돌파 필요)' : '레벨업'} disabled={atCap} onPress={() => act(() => levelUp(state, unit.uid))} /></View>
          <View style={{ flex: 1 }}><Btn small kind="ghost" label="돌파 (랭크↑)" onPress={() => act(() => ascend(state, unit.uid))} /></View>
        </View>
        <Text style={g.subsec}>각인 (특정 스탯 집중)</Text>
        <View style={g.btnRow}>
          {['atk', 'hp', 'def', 'crit'].map((s2) => (
            <View key={s2} style={{ flex: 1 }}>
              <Btn small kind="ghost" label={`${s2}+${unit.enhance[s2]}`} onPress={() => act(() => enhanceNode(state, unit.uid, s2))} />
            </View>
          ))}
        </View>
        <View style={{ height: 8 }} />
        <View style={g.btnRow}>
          <View style={{ flex: 1 }}><Btn small label="스킬 자동장착" onPress={autoSkills} /></View>
          <View style={{ flex: 1 }}><Btn small label="장비 제작·장착" kind="gold" onPress={fillGear} /></View>
        </View>
        <Text style={g.subsec}>장비 강화</Text>
        <View style={g.btnRow}>
          {GEAR_SLOTS.map((slot) => (
            <View key={slot} style={{ flex: 1 }}>
              <Btn small kind="ghost" label={unit.gear[slot] ? `${slot}↑` : slot} disabled={!unit.gear[slot]} onPress={() => act(() => enhanceGear(state, unit.gear[slot].uid))} />
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

const g = StyleSheet.create({
  wrap: { padding: 14, paddingBottom: 30 },
  sec: { color: T.text, fontWeight: '800', fontSize: 15, marginBottom: 8 },
  subsec: { color: T.muted, fontSize: 12, marginTop: 12, marginBottom: 6, fontWeight: '700' },
  hlist: { gap: 10, paddingVertical: 4, paddingRight: 8 },
  chip: { width: 84, backgroundColor: T.surface, borderRadius: 14, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: T.line },
  chipOn: { borderColor: T.accent, backgroundColor: T.surface2 },
  chipEmoji: { fontSize: 28 },
  chipName: { color: T.text, fontSize: 12, fontWeight: '700', marginTop: 4 },
  chipLv: { color: T.muted, fontSize: 11, marginTop: 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headEmoji: { fontSize: 44 },
  headName: { color: T.text, fontWeight: '900', fontSize: 20 },
  headSub: { color: T.muted, fontSize: 13, marginTop: 2 },
  statGrid: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: { flex: 1, backgroundColor: T.surface2, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  statK: { color: T.muted, fontSize: 11 },
  statV: { color: T.text, fontWeight: '800', fontSize: 15, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 2 },
  tag: { color: T.text, backgroundColor: T.surface2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, overflow: 'hidden' },
  tagEmpty: { color: T.muted, backgroundColor: 'transparent', borderWidth: 1, borderColor: T.line },
  dim: { color: T.muted, fontSize: 12 },
  btnRow: { flexDirection: 'row', gap: 8 },
});
