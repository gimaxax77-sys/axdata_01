// 장비/스킬/룬 선택·강화 모달 — RosterScreen에서 분리(파일 비대화 정리).
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, FlatList, Image } from 'react-native';
import { T } from '../theme';
import { Btn, fmt, MultiToggle, multLabel, repeat } from '../components';
import { isOn } from '../../system/core/features.mjs';
import { computePower } from '../../system/core/stats.mjs';
import { gearIcon } from '../uiIcons';
import { fx } from '../feedback';
import { SKILL_CATALOG, skillPower, equippableSkills } from '../../system/core/skills.mjs';
import { equipSkill, unequipSkill, upgradeSkill } from '../../system/core/character.mjs';
import {
  GEAR_CATALOG, SLOT_META, gearEnhanceCost, craftGear, equipGear, enhanceGear, unequipGear,
  gearCraftCost, rerollGearSubs, GEAR_RARITY, grantGearElementOption, ELEM_OPTION_COST, GEAR_SUB_MAX,
  enchantGear, rerollEnchant, enchantInfo, enchantCost, ENCHANT_MAX,
} from '../../system/core/gear.mjs';
import { materialCount, MATERIAL_META } from '../../system/core/materials.mjs';
import {
  RUNE_SETS, RUNE_RARITY, equipRune, unequipRune, enhanceRune,
  runeMainValue, runeEnhanceCost, RUNE_MAX_LEVEL, rerollRuneSubs,
} from '../../system/core/runes.mjs';
import {
  RARITY_RANK, rarityColor, rarityText, ov, DeltaText,
  describeRune, describeSkill, describeGear, describeGearItem, describeSubs,
  powerWithGearItem, powerWithRuneItem,
} from './rosterShared';

const SLOT_KO = Object.fromEntries(Object.entries(SLOT_META).map(([k, v]) => [k, v.label]));

// ── 모달: 스킬/장비/룬 선택 ───────────────────────────────────
export default function PickerModal({ picker, unit, state, onClose, onChange, concept }) {
  const [emult, setEmult] = useState(1); // 강화 배수 (×1/×10/×100/Max)
  const [dmsg, setDmsg] = useState(null); // 강화 결과(전투력 증가) 표시
  if (!picker) return null;
  const apply = (fn) => { fn(); onChange(); };
  // 강화 전용 — 선택 배수만큼 반복 + 전투력 증가분을 명확히 표시.
  const applyN = (fn) => {
    const before = computePower(unit);
    const n = repeat(fn, emult);
    const gained = computePower(unit) - before;
    if (n > 0) { setDmsg(`⚔️ 전투력 +${fmt(gained)} (강화 ${n}회)`); fx('success'); }
    else { setDmsg('재화 부족 또는 상한'); fx('error'); }
    onChange();
  };

  let body;
  if (picker.mode === 'rune') {
    const i = picker.slot;
    const equipped = (unit.runes || [])[i];
    const curP = computePower(unit); // 변경 전 전투력(후보별 비교 기준)
    // 가방: 등급↓ → 메인값↓ 정렬(상위 우선).
    const bag = (state.runeBag || []).slice()
      .sort((a, b) => (RARITY_RANK[b.rarity] || 0) - (RARITY_RANK[a.rarity] || 0) || (runeMainValue(b) - runeMainValue(a)));
    body = (
      <>
        <Text style={m.title}>룬 선택 · 슬롯 {i + 1} <Text style={m.optDesc}>(가방 {bag.length})</Text></Text>
        {equipped && (() => {
          const d = describeRune(equipped);
          const maxed = equipped.level >= RUNE_MAX_LEVEL;
          const cost = runeEnhanceCost(equipped.level);
          return (
            <View style={[m.equippedRow, { borderWidth: 1.5, borderColor: rarityColor(equipped.rarity) }]}>
              <View style={m.equippedHead}>
                <Text style={m.equippedBadge}>✅ 장착중</Text>
                <Text style={m.equippedName}>{d.title} <Text style={rarityText(equipped.rarity)}> {d.rarityLabel} </Text></Text>
              </View>
              <Text style={m.equippedDesc}>{ov(d.sub)}</Text>
              {!maxed && <MultiToggle value={emult} onChange={setEmult} />}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Btn small kind="gold" disabled={maxed || (state.wallet.currency || 0) < cost.currency}
                  label={maxed ? 'MAX' : `강화 ${multLabel(emult)} ${fmt(cost.currency)}`} onPress={() => applyN(() => enhanceRune(state, equipped.uid))} />
                {(equipped.subs || []).length > 0 && <Btn small kind="primary" label="재련 💎15" onPress={() => apply(() => rerollRuneSubs(state, equipped.uid))} />}
                <Btn small kind="ghost" label="해제" onPress={() => apply(() => unequipRune(state, unit.uid, i))} />
              </View>
            </View>
          );
        })()}
        {/* 가상화(FlatList) — 가방이 수백 개여도 보이는 행만 렌더(렉 제거). */}
        <FlatList style={{ maxHeight: 360 }} data={bag} keyExtractor={(r) => r.uid}
          initialNumToRender={10} maxToRenderPerBatch={10} windowSize={5}
          ListEmptyComponent={<Text style={m.optDesc}>가방이 비었습니다. 룬 카드에서 발굴하세요.</Text>}
          renderItem={({ item: r }) => {
            const d = describeRune(r);
            return (
              <TouchableOpacity onPress={() => apply(() => { equipRune(state, unit.uid, i, r.uid); onClose(); })}
                style={[m.opt, { borderColor: rarityColor(r.rarity) }]} activeOpacity={0.8}>
                <Text style={m.optName}>{d.title} <Text style={rarityText(r.rarity)}> {RUNE_RARITY[r.rarity].label} </Text></Text>
                <Text style={m.optDesc}>{ov(d.sub)}</Text>
                <DeltaText cur={curP} next={powerWithRuneItem(unit, i, r)} />
              </TouchableOpacity>
            );
          }} />
      </>
    );
  } else if (picker.mode === 'skill') {
    const i = picker.slot;
    const equipped = unit.skills[i];
    body = (
      <>
        <Text style={m.title}>스킬 선택 · 슬롯 {i + 1}</Text>
        {equipped && (
          <View style={m.equippedRow}>
            <View style={m.equippedHead}>
              <Text style={m.equippedBadge}>✅ 장착중</Text>
              <Text style={m.equippedName}>{SKILL_CATALOG[equipped.id].label} +{equipped.level}</Text>
            </View>
            <Text style={m.equippedDesc}>{ov(describeSkill(equipped.id, skillPower(equipped.level)))}</Text>
            <MultiToggle value={emult} onChange={setEmult} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Btn small kind="gold" label={`강화 ${multLabel(emult)}`} onPress={() => applyN(() => upgradeSkill(state, unit.uid, i))} />
              <Btn small kind="ghost" label="해제" onPress={() => apply(() => unequipSkill(state, unit.uid, i))} />
            </View>
          </View>
        )}
        <ScrollView style={{ maxHeight: 360 }}>
          {equippableSkills().map((s) => {
            const on = equipped && equipped.id === s.id;
            const dupOther = unit.skills.some((x, j) => x && x.id === s.id && j !== i);
            return (
              <TouchableOpacity key={s.id} disabled={dupOther} onPress={() => apply(() => { equipSkill(state, unit.uid, i, s.id); onClose(); })}
                style={[m.opt, on && m.optOn, dupOther && m.optDim]} activeOpacity={0.8}>
                <Text style={m.optName}>{s.label} {on ? '✓' : ''}{dupOther ? ' (다른 슬롯 장착중)' : ''}</Text>
                <Text style={m.optDesc}>{ov(describeSkill(s.id))}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </>
    );
  } else {
    const slot = picker.slot;
    const item = unit.gear[slot];
    const curP = computePower(unit); // 변경 전 전투력(후보별 비교 기준)
    const bps = Object.values(GEAR_CATALOG).filter((b) => b.slot === slot);
    // 인벤토리: 등급↓ → 강화레벨↓ 로 정렬(상위 우선).
    const owned = state.inventory.filter((g2) => g2.slot === slot)
      .sort((a, b) => (RARITY_RANK[b.rarity] || 0) - (RARITY_RANK[a.rarity] || 0) || (b.level - a.level));
    body = (
      <>
        <Text style={m.title}>{SLOT_KO[slot]} 선택</Text>
        {item && (
          <View style={[m.equippedRow, item.rarity && { borderWidth: 1.5, borderColor: rarityColor(item.rarity) }]}>
            <View style={m.equippedHead}>
              <Text style={m.equippedBadge}>✅ 장착중</Text>
              <Text style={m.equippedName}>
                {GEAR_CATALOG[item.blueprint].label} +{item.level - 1}
                {item.rarity ? <Text style={rarityText(item.rarity)}> {(GEAR_RARITY[item.rarity] || {}).label || item.rarity} </Text> : null}
              </Text>
            </View>
            <Text style={m.equippedDesc}>{ov(describeGearItem(item))}</Text>
            {(item.subs || []).length > 0 && <Text style={m.subLine}>부옵션: {ov(describeSubs(item.subs))}</Text>}
            {(() => {
              const en = enchantInfo(item);
              return en
                ? <Text style={m.subLine}>✨ 인챈트: {en.label} +{Math.round(en.value * 100)}% <Text style={m.dim}>Lv.{en.level}/{ENCHANT_MAX}</Text></Text>
                : <Text style={m.subLine}>✨ 인챈트: 없음</Text>;
            })()}
            <MultiToggle value={emult} onChange={setEmult} />
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Btn small kind="gold" label={`강화 ${multLabel(emult)} (${fmt(gearEnhanceCost(item.level).currency)})`} onPress={() => applyN(() => enhanceGear(state, item.uid))} />
              {(item.subs || []).length > 0 && <Btn small kind="primary" label="재련 💎20" onPress={() => apply(() => rerollGearSubs(state, item.uid))} />}
              {isOn('elements') && <Btn small kind="gold" disabled={materialCount(state, 'elemEssence') < ELEM_OPTION_COST || (item.subs || []).length >= GEAR_SUB_MAX}
                label={`속성 부여 ${MATERIAL_META.elemEssence.emoji}${ELEM_OPTION_COST}`}
                onPress={() => apply(() => { const r = grantGearElementOption(state, item.uid); setDmsg(r.ok ? `${MATERIAL_META.elemEssence.emoji} 속성옵션 부여 (부옵션 ${r.subs.length})` : (r.reason || '실패')); })} />}
              {(() => {
                const en = enchantInfo(item);
                const lv = en ? en.level : 0;
                const c = enchantCost(lv).elemEssence;
                return (<>
                  <Btn small kind="primary" disabled={lv >= ENCHANT_MAX || materialCount(state, 'elemEssence') < c}
                    label={`인챈트 ${MATERIAL_META.elemEssence.emoji}${c}`}
                    onPress={() => apply(() => { const r = enchantGear(state, item.uid); setDmsg(r.ok ? `✨ ${r.info.label} 인챈트 Lv.${r.info.level}` : (r.reason || '실패')); })} />
                  {en && <Btn small kind="ghost" label="효과변경 💎25" onPress={() => apply(() => { const r = rerollEnchant(state, item.uid); setDmsg(r.ok ? `✨ 인챈트 변경: ${r.info.label}` : (r.reason || '실패')); })} />}
                </>);
              })()}
              <Btn small kind="ghost" label="해제" onPress={() => apply(() => unequipGear(state, unit.uid, slot))} />
            </View>
          </View>
        )}
        {/* 가상화 — 보유 장비가 많아도 보이는 행만 렌더. 제작 목록은 헤더로. */}
        <FlatList style={{ maxHeight: 340 }} data={owned} keyExtractor={(it) => it.uid}
          initialNumToRender={8} maxToRenderPerBatch={10} windowSize={5}
          ListHeaderComponent={(
            <>
              <Text style={m.group}>제작</Text>
              {bps.map((b) => (
                <TouchableOpacity key={b.id} onPress={() => apply(() => { const c = craftGear(state, b.id); if (c.ok) { equipGear(state, unit.uid, c.item.uid); onClose(); } })}
                  style={m.opt} activeOpacity={0.8}>
                  <View style={m.optHead}>
                    {gearIcon(b.id) && <Image source={gearIcon(b.id)} style={m.optIcon} resizeMode="contain" />}
                    <Text style={m.optName}>{b.label} <Text style={m.optCost}>🪙{fmt(gearCraftCost(b.id).currency)}</Text></Text>
                  </View>
                  <Text style={m.optDesc}>{describeGear(b)}</Text>
                </TouchableOpacity>
              ))}
              {owned.length > 0 && <Text style={m.group}>보유 장비</Text>}
            </>
          )}
          renderItem={({ item: it }) => (
            <TouchableOpacity onPress={() => apply(() => { equipGear(state, unit.uid, it.uid); onClose(); })}
              style={[m.opt, it.rarity && { borderColor: rarityColor(it.rarity) }]} activeOpacity={0.8}>
              <View style={m.optHead}>
                {gearIcon(it.blueprint) && <Image source={gearIcon(it.blueprint)} style={m.optIcon} resizeMode="contain" />}
                <Text style={m.optName}>{GEAR_CATALOG[it.blueprint].label} +{it.level - 1}
                  {it.rarity ? <Text style={rarityText(it.rarity)}> {(GEAR_RARITY[it.rarity] || {}).label || it.rarity} </Text> : null}</Text>
              </View>
              <Text style={m.optDesc}>{ov(describeGearItem(it))}</Text>
              <DeltaText cur={curP} next={powerWithGearItem(unit, slot, it)} />
            </TouchableOpacity>
          )} />
      </>
    );
  }

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <TouchableOpacity style={m.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={m.sheet}>
          {body}
          {dmsg && <Text style={m.dmsg}>{dmsg}</Text>}
          <View style={{ height: 8 }} />
          <Btn label="닫기" kind="ghost" onPress={onClose} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: T.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, borderTopWidth: 1, borderColor: T.line },
  title: { color: T.text, fontWeight: '900', fontSize: 18, marginBottom: 12 },
  dim: { color: T.muted, fontSize: 12, fontWeight: '400' },
  equippedRow: { backgroundColor: T.surface2, borderRadius: 12, padding: 12, marginBottom: 10, gap: 8 },
  equippedBadge: { color: '#0f2a17', backgroundColor: T.good, fontSize: 11, fontWeight: '900', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 1, alignSelf: 'flex-start', overflow: 'hidden' },
  equippedHead: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  equippedName: { color: T.text, fontWeight: '700', fontSize: 14 },
  equippedDesc: { color: T.muted, fontSize: 12 },
  subLine: { color: T.accent, fontSize: 11, fontWeight: '600' },
  group: { color: T.muted, fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 6 },
  opt: { backgroundColor: T.surface2, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  optOn: { borderColor: T.accent },
  optDim: { opacity: 0.4 },
  optHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  optIcon: { width: 30, height: 30 },
  optName: { color: T.text, fontWeight: '800', fontSize: 14, flexShrink: 1 },
  optCost: { color: T.accent, fontWeight: '700', fontSize: 12 },
  optDesc: { color: T.muted, fontSize: 12, marginTop: 2 },
  dmsg: { color: T.accent, fontSize: 13, fontWeight: '800', textAlign: 'center', marginTop: 8 },
});
