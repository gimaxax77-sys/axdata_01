import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { T } from '../theme';
import { Card, Btn, fmt } from '../components';
import { computeStats, computePower } from '../../system/core/stats.mjs';
import { levelCap } from '../../system/core/units.mjs';
import { skillSlots, SKILL_CATALOG } from '../../system/core/skills.mjs';
import { GEAR_SLOTS, GEAR_CATALOG, gearEnhanceCost } from '../../system/core/gear.mjs';
import { levelUp, ascend, enhanceNode, equipSkill, unequipSkill, upgradeSkill } from '../../system/core/character.mjs';
import { craftGear, equipGear, enhanceGear, unequipGear } from '../../system/core/gear.mjs';

const SLOT_KO = { weapon: '무기', armor: '방어구', accessory: '장신구' };

// 효과 객체 → 사람이 읽는 문자열
function describeEffect(e = {}) {
  const p = [];
  if (e.critChance) p.push(`치명 +${Math.round(e.critChance * 100)}%`);
  if (e.critDamage) p.push(`치피 +${Math.round(e.critDamage * 100)}%`);
  if (e.lifesteal) p.push(`흡혈 +${Math.round(e.lifesteal * 100)}%`);
  if (e.defPierce) p.push(`관통 +${Math.round(e.defPierce * 100)}%`);
  return p;
}
function describeSkill(id) {
  const s = SKILL_CATALOG[id];
  const p = [];
  if (s.statPct) for (const [k, v] of Object.entries(s.statPct)) p.push(`${k.toUpperCase()} +${Math.round(v * 100)}%`);
  p.push(...describeEffect(s.effect));
  if (s.teamBuff?.atk) p.push(`팀ATK +${Math.round(s.teamBuff.atk * 100)}%`);
  return p.join(' · ');
}
function describeGear(bp) {
  const p = [];
  for (const [k, v] of Object.entries(bp.flat || {})) p.push(`${k.toUpperCase()} +${v}`);
  p.push(...describeEffect(bp.effect));
  return p.join(' · ');
}

export default function RosterScreen({ state, bump, concept }) {
  const [selId, setSel] = useState(state.party[0] || state.units[0]?.uid);
  const [picker, setPicker] = useState(null); // {mode:'skill'|'gear', slot}
  const unit = state.units.find((u) => u.uid === selId) || state.units[0];
  const list = state.units.slice().sort((a, b) => computePower(b) - computePower(a));

  const act = (fn) => { fn(); bump(); };
  const st8 = computeStats(unit);
  const meta = concept.archetypes[unit.archetype];
  const atCap = unit.level >= levelCap(unit);
  const slots = skillSlots(unit);

  return (
    <ScrollView contentContainerStyle={g.wrap}>
      {/* 보유 유닛 */}
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

      {/* 상세 */}
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
      </Card>

      {/* 스킬 편성 (수동) */}
      <Card style={{ marginTop: 12 }}>
        <Text style={g.sec}>스킬 편성 <Text style={g.dim}>({unit.skills.filter(Boolean).length}/{slots})</Text></Text>
        {[0, 1, 2].map((i) => {
          const locked = i >= slots;
          const sk = unit.skills[i];
          return (
            <TouchableOpacity key={i} disabled={locked} onPress={() => setPicker({ mode: 'skill', slot: i })}
              style={[g.slotRow, locked && g.slotLocked]} activeOpacity={0.8}>
              <View style={{ flex: 1 }}>
                {locked ? <Text style={g.dim}>슬롯 {i + 1} · 잠김 (돌파 필요)</Text>
                  : sk ? (<>
                    <Text style={g.slotName}>{SKILL_CATALOG[sk.id].label} +{sk.level}</Text>
                    <Text style={g.slotDesc}>{describeSkill(sk.id)}</Text>
                  </>) : <Text style={g.slotEmpty}>＋ 슬롯 {i + 1} 비어있음</Text>}
              </View>
              {!locked && <Text style={g.chev}>›</Text>}
            </TouchableOpacity>
          );
        })}
      </Card>

      {/* 장비 (수동) */}
      <Card style={{ marginTop: 12 }}>
        <Text style={g.sec}>장비</Text>
        {GEAR_SLOTS.map((slot) => {
          const item = unit.gear[slot];
          return (
            <TouchableOpacity key={slot} onPress={() => setPicker({ mode: 'gear', slot })} style={g.slotRow} activeOpacity={0.8}>
              <View style={{ flex: 1 }}>
                <Text style={g.slotTag}>{SLOT_KO[slot]}</Text>
                {item ? (<>
                  <Text style={g.slotName}>{GEAR_CATALOG[item.blueprint].label} +{item.level - 1}</Text>
                  <Text style={g.slotDesc}>{describeGear(GEAR_CATALOG[item.blueprint])}</Text>
                </>) : <Text style={g.slotEmpty}>＋ 비어있음</Text>}
              </View>
              <Text style={g.chev}>›</Text>
            </TouchableOpacity>
          );
        })}
      </Card>

      {/* 성장 */}
      <Card style={{ marginTop: 12, marginBottom: 24 }}>
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
      </Card>

      {/* 편성 모달 */}
      <PickerModal picker={picker} unit={unit} state={state} concept={concept}
        onClose={() => setPicker(null)} onChange={bump} />
    </ScrollView>
  );
}

// ── 모달: 스킬/장비 선택 ──────────────────────────────────────
function PickerModal({ picker, unit, state, onClose, onChange }) {
  if (!picker) return null;
  const apply = (fn) => { fn(); onChange(); };

  let body;
  if (picker.mode === 'skill') {
    const i = picker.slot;
    const equipped = unit.skills[i];
    body = (
      <>
        <Text style={m.title}>스킬 선택 · 슬롯 {i + 1}</Text>
        {equipped && (
          <View style={m.equippedRow}>
            <Text style={m.equippedName}>장착: {SKILL_CATALOG[equipped.id].label} +{equipped.level}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Btn small kind="gold" label="강화" onPress={() => apply(() => upgradeSkill(state, unit.uid, i))} />
              <Btn small kind="ghost" label="해제" onPress={() => apply(() => unequipSkill(state, unit.uid, i))} />
            </View>
          </View>
        )}
        <ScrollView style={{ maxHeight: 360 }}>
          {Object.values(SKILL_CATALOG).map((s) => {
            const on = equipped && equipped.id === s.id;
            const dupOther = unit.skills.some((x, j) => x && x.id === s.id && j !== i);
            return (
              <TouchableOpacity key={s.id} disabled={dupOther} onPress={() => apply(() => { equipSkill(state, unit.uid, i, s.id); onClose(); })}
                style={[m.opt, on && m.optOn, dupOther && m.optDim]} activeOpacity={0.8}>
                <Text style={m.optName}>{s.label} {on ? '✓' : ''}{dupOther ? ' (다른 슬롯 장착중)' : ''}</Text>
                <Text style={m.optDesc}>{describeSkill(s.id)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </>
    );
  } else {
    const slot = picker.slot;
    const item = unit.gear[slot];
    const bps = Object.values(GEAR_CATALOG).filter((b) => b.slot === slot);
    const owned = state.inventory.filter((g2) => g2.slot === slot);
    body = (
      <>
        <Text style={m.title}>{SLOT_KO[slot]} 선택</Text>
        {item && (
          <View style={m.equippedRow}>
            <Text style={m.equippedName}>장착: {GEAR_CATALOG[item.blueprint].label} +{item.level - 1}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Btn small kind="gold" label={`강화 (${fmt(gearEnhanceCost(item.level).currency)})`} onPress={() => apply(() => enhanceGear(state, item.uid))} />
              <Btn small kind="ghost" label="해제" onPress={() => apply(() => unequipGear(state, unit.uid, slot))} />
            </View>
          </View>
        )}
        <ScrollView style={{ maxHeight: 340 }}>
          <Text style={m.group}>제작 (150 골드)</Text>
          {bps.map((b) => (
            <TouchableOpacity key={b.id} onPress={() => apply(() => { const c = craftGear(state, b.id); if (c.ok) { equipGear(state, unit.uid, c.item.uid); onClose(); } })}
              style={m.opt} activeOpacity={0.8}>
              <Text style={m.optName}>{b.label}</Text>
              <Text style={m.optDesc}>{describeGear(b)}</Text>
            </TouchableOpacity>
          ))}
          {owned.length > 0 && <Text style={m.group}>보유 장비</Text>}
          {owned.map((it) => (
            <TouchableOpacity key={it.uid} onPress={() => apply(() => { equipGear(state, unit.uid, it.uid); onClose(); })}
              style={m.opt} activeOpacity={0.8}>
              <Text style={m.optName}>{GEAR_CATALOG[it.blueprint].label} +{it.level - 1}</Text>
              <Text style={m.optDesc}>{describeGear(GEAR_CATALOG[it.blueprint])}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </>
    );
  }

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <TouchableOpacity style={m.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={m.sheet}>
          {body}
          <View style={{ height: 8 }} />
          <Btn label="닫기" kind="ghost" onPress={onClose} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
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
  slotRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface2, borderRadius: 12, padding: 12, marginBottom: 8 },
  slotLocked: { opacity: 0.5 },
  slotName: { color: T.text, fontWeight: '800', fontSize: 14 },
  slotDesc: { color: T.muted, fontSize: 12, marginTop: 2 },
  slotEmpty: { color: T.primary, fontWeight: '700', fontSize: 14 },
  slotTag: { color: T.accent, fontSize: 11, fontWeight: '700', marginBottom: 2 },
  chev: { color: T.muted, fontSize: 22, marginLeft: 8 },
  dim: { color: T.muted, fontSize: 12, fontWeight: '400' },
  btnRow: { flexDirection: 'row', gap: 8 },
});

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: T.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, borderTopWidth: 1, borderColor: T.line },
  title: { color: T.text, fontWeight: '900', fontSize: 18, marginBottom: 12 },
  equippedRow: { backgroundColor: T.surface2, borderRadius: 12, padding: 12, marginBottom: 10, gap: 8 },
  equippedName: { color: T.text, fontWeight: '700', fontSize: 14 },
  group: { color: T.muted, fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 6 },
  opt: { backgroundColor: T.surface2, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  optOn: { borderColor: T.accent },
  optDim: { opacity: 0.4 },
  optName: { color: T.text, fontWeight: '800', fontSize: 14 },
  optDesc: { color: T.muted, fontSize: 12, marginTop: 2 },
});
