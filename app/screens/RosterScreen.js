import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { T } from '../theme';
import { Card, Btn, fmt, MultiToggle, repeat } from '../components';
import { togglePartyMember, MAX_PARTY, getPartyUnits } from '../../system/core/gameState.mjs';
import { teamSynergy } from '../../system/core/synergy.mjs';
import { computeStats, computePower } from '../../system/core/stats.mjs';
import { levelCap } from '../../system/core/units.mjs';
import { skillSlots, SKILL_CATALOG, equippableSkills } from '../../system/core/skills.mjs';
import { identity, elementMeta } from '../../system/concepts/index.mjs';
import { GEAR_SLOTS, GEAR_CATALOG, gearEnhanceCost } from '../../system/core/gear.mjs';
import { levelUp, ascend, enhanceNode, equipSkill, unequipSkill, upgradeSkill, awakenSignature } from '../../system/core/character.mjs';
import { AWAKEN_MAX, awakenCost } from '../../system/core/skills.mjs';
import { craftGear, equipGear, enhanceGear, unequipGear } from '../../system/core/gear.mjs';
import { recordMission } from '../../system/core/daily.mjs';
import { intimacyLevel, intimacyProgress, giftCost, giveGift, INTIMACY_MAX } from '../../system/core/intimacy.mjs';
import { seedConditions, seedProgress } from '../../system/core/seed.mjs';
import { linesOf, costumesOf, equipCostume, unequipCostume, sigWeaponOf } from '../../system/concepts/index.mjs';
import {
  hasSigWeapon, canOwnSigWeapon, unlockSigWeapon, enhanceSigWeapon,
  sigWeaponUnlockCost, sigWeaponEnhanceCost, sigWeaponBoost, SIGWEAPON_MAX,
} from '../../system/core/sigweapon.mjs';
import {
  RUNE_SLOTS, RUNE_SETS, RUNE_RARITY, summonRune, equipRune, unequipRune,
  enhanceRune, runeMainValue, runeEnhanceCost, RUNE_MAX_LEVEL, RUNE_SUMMON_COST, activeRuneSets,
} from '../../system/core/runes.mjs';

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
// 시그니처 각성 2차 효과 설명
function describeAwaken(a = {}) {
  const p = [];
  if (a.statPct) for (const [k, v] of Object.entries(a.statPct)) p.push(`${k.toUpperCase()} +${Math.round(v * 100)}%`);
  p.push(...describeEffect(a.effect));
  if (a.teamBuff?.atk) p.push(`팀ATK +${Math.round(a.teamBuff.atk * 100)}%`);
  return p.join(' · ');
}
// 룬 한 개 요약 (메인스탯 + 등급)
function describeRune(rune) {
  const set = RUNE_SETS[rune.set];
  const val = runeMainValue(rune);
  const stat = set.main.stat.toUpperCase();
  const pct = `${(val * 100).toFixed(1)}%`;
  return { title: `${set.emoji} ${set.label} +${rune.level}`, sub: `${stat} ${pct} · ${RUNE_RARITY[rune.rarity].label}` };
}

export default function RosterScreen({ state, bump, concept }) {
  const [selId, setSel] = useState(state.party[0] || state.units[0]?.uid);
  const [picker, setPicker] = useState(null); // {mode:'skill'|'gear', slot}
  const [bubble, setBubble] = useState(null); // 현재 대사
  const [mult, setMult] = useState(1); // 성장 배수 (×1/×10/×100)
  const unit = state.units.find((u) => u.uid === selId) || state.units[0];
  const lines = unit && linesOf(concept, unit);
  // 선택 캐릭터가 바뀌면 인사 대사로 초기화
  useEffect(() => { setBubble(lines ? lines.greet : null); }, [selId]);
  const list = state.units.slice().sort((a, b) => computePower(b) - computePower(a));
  const inParty = state.party.includes(unit.uid);

  const act = (fn) => { fn(); bump(); };
  // 성장 액션은 일일 미션(강화) 진행에 카운트. mult 배수만큼 반복 실행.
  const grow = (fn) => { const n = repeat(fn, mult); if (n > 0) recordMission(state, 'upgrade', n); bump(); };
  const st8 = computeStats(unit);
  const meta = identity(concept, unit);
  const atCap = unit.level >= levelCap(unit);
  const slots = skillSlots(unit);

  return (
    <ScrollView style={g.flex} contentContainerStyle={g.wrap}>
      {/* 파티 편성 — 전투는 편성된 전원 합산 */}
      <Card style={{ marginBottom: 12 }}>
        <View style={g.intiHead}>
          <Text style={g.sec}>파티 편성 <Text style={g.dim}>{state.party.length}/{MAX_PARTY}</Text></Text>
          <Text style={g.dim}>전투는 편성 전원 합산</Text>
        </View>
        <View style={g.partyRow}>
          {Array.from({ length: MAX_PARTY }).map((_, i) => {
            const uid = state.party[i];
            const pu = uid && state.units.find((u) => u.uid === uid);
            const pm = pu && identity(concept, pu);
            return (
              <TouchableOpacity key={i} activeOpacity={0.8}
                onPress={() => pu && setSel(pu.uid)}
                style={[g.partySlot, pu && g.partySlotOn, pu && pu.uid === unit.uid && g.partySlotSel]}>
                {pu ? (<>
                  <Text style={g.partyEmoji}>{pm.emoji}</Text>
                  <Text style={g.partyName} numberOfLines={1}>{pm.name}</Text>
                </>) : <Text style={g.partyEmpty}>＋</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
        {/* 팀 시너지 — 편성 구성 보너스 */}
        {(() => {
          const syn = teamSynergy(getPartyUnits(state));
          if (!syn.list.length) return <Text style={g.synNone}>시너지 없음 — 3원형/동일 속성/전원 다른 속성으로 보너스</Text>;
          return (
            <View style={g.synWrap}>
              {syn.list.map((s) => (
                <View key={s.id} style={g.synChip}><Text style={g.synChipText}>✦ {s.label}</Text><Text style={g.synChipDesc}>{s.desc}</Text></View>
              ))}
            </View>
          );
        })()}
      </Card>

      {/* 보유 유닛 */}
      <Text style={g.sec}>보유 {concept.terms.unit} ({list.length})</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={g.hlist}>
        {list.map((u) => {
          const m = identity(concept, u);
          const on = u.uid === unit.uid;
          const party = state.party.includes(u.uid);
          return (
            <TouchableOpacity key={u.uid} onPress={() => setSel(u.uid)} style={[g.chip, on && g.chipOn]} activeOpacity={0.8}>
              {party && <Text style={g.chipStar}>⭐</Text>}
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
            <Text style={g.headName}>{meta.name}{unit.rarity ? <Text style={g.rarity}>  {unit.rarity}</Text> : null}</Text>
            {(meta.title || meta.personality) && (
              <Text style={g.headTitle}>
                {meta.title}{meta.personality ? ` · ${meta.personality}` : ''}
                {meta.element ? ` · ${elementMeta(concept, meta.element).emoji}${elementMeta(concept, meta.element).name}` : ''}
              </Text>
            )}
            <Text style={g.headSub}>Lv.{unit.level}/{levelCap(unit)} · R{unit.rank} · 전투력 {fmt(computePower(unit))}</Text>
          </View>
          <Btn small kind={inParty ? 'ghost' : 'gold'}
            label={inParty ? '편성 해제' : '편성'}
            disabled={!inParty && state.party.length >= MAX_PARTY}
            onPress={() => act(() => togglePartyMember(state, unit.uid))} />
        </View>
        <View style={g.statGrid}>
          {[['HP', st8.hp], ['ATK', st8.atk], ['DEF', st8.def], ['SPD', st8.spd]].map(([k, v]) => (
            <View key={k} style={g.stat}><Text style={g.statK}>{k}</Text><Text style={g.statV}>{fmt(v)}</Text></View>
          ))}
        </View>
      </Card>

      {/* 친밀도 + 대사 */}
      {lines && (
        <Card style={{ marginTop: 12 }}>
          <View style={g.bubble}>
            <Text style={g.bubbleEmoji}>{meta.emoji}</Text>
            <Text style={g.bubbleText}>“{bubble || lines.greet}”</Text>
          </View>
          <View style={g.intiHead}>
            <Text style={g.sec}>친밀도 <Text style={g.dim}>Lv.{intimacyLevel(unit)}/{INTIMACY_MAX} · 전 스탯 +{intimacyLevel(unit) * 2}%</Text></Text>
            <Btn small kind="gold" disabled={intimacyLevel(unit) >= INTIMACY_MAX}
              label={intimacyLevel(unit) >= INTIMACY_MAX ? 'MAX' : `선물 ${concept.resources.currency.emoji}${fmt(giftCost(unit).currency)}`}
              onPress={() => {
                const r = giveGift(state, unit.uid);
                if (r.ok) setBubble(r.leveledUp ? lines.levelup : lines.bond);
                bump();
              }} />
          </View>
          <View style={g.bar}><View style={[g.barFill, { width: `${intimacyProgress(unit).ratio * 100}%` }]} /></View>
        </Card>
      )}

      {/* 코스튬 — 외형 변경 + 소량 보너스 (친밀도로 해금) */}
      {costumesOf(concept, unit).length > 0 && (
        <Card style={{ marginTop: 12 }}>
          <Text style={g.sec}>코스튬</Text>
          {costumesOf(concept, unit).map((cos) => (
            <View key={cos.id} style={g.slotRow}>
              <Text style={g.cosEmoji}>{cos.unlocked ? cos.emoji : '🔒'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={g.slotName}>{cos.name}</Text>
                <Text style={g.slotDesc}>전 스탯 +{Math.round((cos.bonus.atk || 0) * 100)}%{cos.unlocked ? '' : ` · 친밀도 Lv.${cos.unlock} 필요`}</Text>
              </View>
              <Btn small kind={cos.equipped ? 'ghost' : 'gold'} disabled={!cos.unlocked}
                label={cos.equipped ? '해제' : cos.unlocked ? '장착' : '잠김'}
                onPress={() => act(() => (cos.equipped ? unequipCostume(unit) : equipCostume(concept, unit, cos.id)))} />
            </View>
          ))}
        </Card>
      )}

      {/* 씨앗 — 서사 발현 (등급별 보정, 6조건 달성분 능력치) */}
      {(() => {
        const sp = seedProgress(unit);
        if (!sp.hasSeed) return null;
        const conds = seedConditions(unit);
        const STAT_KO = { atk: '공격', hp: '체력', def: '방어', spd: '속도' };
        return (
          <Card style={{ marginTop: 12, borderColor: sp.fullyUnlocked ? T.good : T.line }}>
            <View style={g.sigHead}>
              <Text style={g.sec}>🌱 씨앗 <Text style={g.dim}>서사 발현</Text></Text>
              {sp.fullyUnlocked
                ? <Text style={g.seedFull}>완전 발현</Text>
                : <Text style={g.dim}>{sp.met}/{sp.total}</Text>}
            </View>
            <Text style={g.slotDesc}>{unit.rarity || '?'}등급 · 완전 발현 시 전 스탯 최대 +{Math.round(sp.full * 100)}%. 낮은 등급일수록 보정이 크지만, 완전 발현해도 최고등급을 살짝 넘지 못합니다.</Text>
            <View style={{ height: 8 }} />
            {conds.map((c) => (
              <View key={c.id} style={[g.seedRow, c.met && g.seedRowMet]}>
                <Text style={g.seedIcon}>{c.met ? '🌸' : '🔒'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={g.seedLabel}>{c.label} <Text style={g.dim}>· {c.narrative}</Text></Text>
                  <Text style={g.seedSub}>{c.unitLabel} {c.cur}/{c.need} · {STAT_KO[c.stat]} +{(c.value * 100).toFixed(1)}%</Text>
                </View>
                <View style={c.met ? g.seedBadgeOn : g.seedBadgeOff}><Text style={c.met ? g.seedBadgeTextOn : g.seedBadgeTextOff}>{c.met ? '발현' : `${c.cur}/${c.need}`}</Text></View>
              </View>
            ))}
          </Card>
        );
      })()}

      {/* 전용 스킬 (시그니처) — 항상 발동, 교체 불가. 각성으로 2차 효과 개방 */}
      {unit.signature && (() => {
        const sig = SKILL_CATALOG[unit.signature];
        const aw = unit.sigAwaken || 0;
        const boost = sigWeaponBoost(unit);
        const awCost = awakenCost(aw);
        const canAwaken = aw < AWAKEN_MAX && (state.wallet.summon || 0) >= awCost.summon && (state.wallet.gem || 0) >= awCost.gem;
        return (
          <Card style={{ marginTop: 12, borderColor: T.accent }}>
            <View style={g.sigHead}>
              <Text style={g.sec}>전용 스킬</Text>
              <Text style={g.sigBadge}>시그니처</Text>
            </View>
            <Text style={g.slotName}>{sig.label} <Text style={g.dim}>(R{unit.rank} 강도{boost ? ` · 무기 +${Math.round(boost * 100)}%` : ''})</Text></Text>
            <Text style={g.slotDesc}>{describeSkill(unit.signature)}</Text>
            {/* 각성 */}
            <View style={g.awHead}>
              <Text style={g.subsec2}>각성 <Text style={g.dim}>{aw}/{AWAKEN_MAX}</Text></Text>
              <Btn small kind={aw >= AWAKEN_MAX ? 'ghost' : 'gold'} disabled={!canAwaken}
                label={aw >= AWAKEN_MAX ? 'MAX' : `각성 ${concept.resources.summon.emoji}${awCost.summon} ${concept.resources.gem.emoji}${awCost.gem}`}
                onPress={() => act(() => awakenSignature(state, unit.uid))} />
            </View>
            {sig.awaken && <Text style={[g.slotDesc, aw > 0 && { color: T.good }]}>2차 효과: {describeAwaken(sig.awaken)}{aw > 0 ? ` ×${aw}` : ' (각성 시 개방)'}</Text>}
          </Card>
        );
      })()}

      {/* 전용무기 — 캐릭터 전용 슬롯 (일반 장비와 별개). 시그니처 증폭 */}
      {canOwnSigWeapon(unit) && (() => {
        const w = sigWeaponOf(concept, unit);
        const owned = hasSigWeapon(unit);
        const lv = owned ? unit.sigWeapon.level : 0;
        const unlockCost = sigWeaponUnlockCost();
        const enhCost = sigWeaponEnhanceCost(lv);
        const canUnlock = (state.wallet.gem || 0) >= unlockCost.gem;
        const maxed = lv >= SIGWEAPON_MAX;
        const canEnh = owned && !maxed && (state.wallet.currency || 0) >= enhCost.currency;
        return (
          <Card style={{ marginTop: 12 }}>
            <Text style={g.sec}>전용무기</Text>
            <View style={g.slotRow}>
              <Text style={g.cosEmoji}>{owned ? w.emoji : '🔒'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={g.slotName}>{w.name} {owned ? <Text style={g.dim}>Lv.{lv}/{SIGWEAPON_MAX}</Text> : null}</Text>
                <Text style={g.slotDesc}>{owned
                  ? `원형 전용 스탯 · 5레벨마다 시그니처 +10% (현재 +${Math.round(sigWeaponBoost(unit) * 100)}%)`
                  : `획득 시 전용 스탯 + 시그니처 증폭`}</Text>
              </View>
              {owned
                ? <Btn small kind="gold" disabled={!canEnh} label={maxed ? 'MAX' : `강화 ${concept.resources.currency.emoji}${fmt(enhCost.currency)}`}
                    onPress={() => grow(() => enhanceSigWeapon(state, unit.uid))} />
                : <Btn small kind="gold" disabled={!canUnlock} label={`획득 ${concept.resources.gem.emoji}${unlockCost.gem}`}
                    onPress={() => act(() => unlockSigWeapon(state, unit.uid))} />}
            </View>
          </Card>
        );
      })()}

      {/* 룬 — 소켓형 서브스탯 + 세트 보너스 */}
      <Card style={{ marginTop: 12 }}>
        <View style={g.intiHead}>
          <Text style={g.sec}>룬 <Text style={g.dim}>({(unit.runes || []).filter(Boolean).length}/{RUNE_SLOTS})</Text></Text>
          <Btn small kind="gold" disabled={(state.wallet.currency || 0) < RUNE_SUMMON_COST.currency}
            label={`발굴 ${concept.resources.currency.emoji}${fmt(RUNE_SUMMON_COST.currency)}`}
            onPress={() => act(() => summonRune(state, Math.random))} />
        </View>
        {(state.runeBag || []).length > 0 && <Text style={g.dim}>가방 보유 {state.runeBag.length}개</Text>}
        {[0, 1, 2].map((i) => {
          const rune = (unit.runes || [])[i];
          const d = rune && describeRune(rune);
          return (
            <TouchableOpacity key={i} onPress={() => setPicker({ mode: 'rune', slot: i })} style={g.slotRow} activeOpacity={0.8}>
              <View style={{ flex: 1 }}>
                {rune ? (<>
                  <Text style={g.slotName}>{d.title}</Text>
                  <Text style={g.slotDesc}>{d.sub}</Text>
                </>) : <Text style={g.slotEmpty}>＋ 룬 슬롯 {i + 1}</Text>}
              </View>
              <Text style={g.chev}>›</Text>
            </TouchableOpacity>
          );
        })}
        {activeRuneSets(unit.runes).filter((s) => s.active2).map((s) => (
          <Text key={s.set} style={g.setBonus}>{s.emoji} {s.label} {s.active3 ? '3세트' : '2세트'} 보너스 활성</Text>
        ))}
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
        <View style={g.intiHead}>
          <Text style={g.sec}>성장</Text>
          <MultiToggle value={mult} onChange={setMult} />
        </View>
        <View style={g.btnRow}>
          <View style={{ flex: 1 }}><Btn small label={atCap ? '상한 (돌파 필요)' : `레벨업 ×${mult}`} disabled={atCap} onPress={() => grow(() => levelUp(state, unit.uid))} /></View>
          <View style={{ flex: 1 }}><Btn small kind="ghost" label={`돌파 (랭크↑) ×${mult}`} onPress={() => grow(() => ascend(state, unit.uid))} /></View>
        </View>
        <Text style={g.subsec}>각인 (특정 스탯 집중) · ×{mult}</Text>
        <View style={g.btnRow}>
          {['atk', 'hp', 'def', 'crit'].map((s2) => (
            <View key={s2} style={{ flex: 1 }}>
              <Btn small kind="ghost" label={`${s2}+${unit.enhance[s2]}`} onPress={() => grow(() => enhanceNode(state, unit.uid, s2))} />
            </View>
          ))}
        </View>
      </Card>

      {/* 편성 모달 */}
      <PickerModal picker={picker} unit={unit} state={state} concept={concept}
        onClose={() => setPicker(null)} onChange={bump} key={picker ? picker.mode + picker.slot : 'none'} />
    </ScrollView>
  );
}

// ── 모달: 스킬/장비/룬 선택 ───────────────────────────────────
function PickerModal({ picker, unit, state, onClose, onChange, concept }) {
  if (!picker) return null;
  const apply = (fn) => { fn(); onChange(); };

  let body;
  if (picker.mode === 'rune') {
    const i = picker.slot;
    const equipped = (unit.runes || [])[i];
    const bag = state.runeBag || [];
    body = (
      <>
        <Text style={m.title}>룬 선택 · 슬롯 {i + 1}</Text>
        {equipped && (() => {
          const d = describeRune(equipped);
          const maxed = equipped.level >= RUNE_MAX_LEVEL;
          const cost = runeEnhanceCost(equipped.level);
          return (
            <View style={m.equippedRow}>
              <Text style={m.equippedName}>장착: {d.title} · {d.sub}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Btn small kind="gold" disabled={maxed || (state.wallet.currency || 0) < cost.currency}
                  label={maxed ? 'MAX' : `강화 ${fmt(cost.currency)}`} onPress={() => apply(() => enhanceRune(state, equipped.uid))} />
                <Btn small kind="ghost" label="해제" onPress={() => apply(() => unequipRune(state, unit.uid, i))} />
              </View>
            </View>
          );
        })()}
        <ScrollView style={{ maxHeight: 360 }}>
          {bag.length === 0 && <Text style={m.optDesc}>가방이 비었습니다. 룬 카드에서 발굴하세요.</Text>}
          {bag.map((r) => {
            const d = describeRune(r);
            return (
              <TouchableOpacity key={r.uid} onPress={() => apply(() => { equipRune(state, unit.uid, i, r.uid); onClose(); })}
                style={m.opt} activeOpacity={0.8}>
                <Text style={m.optName}>{d.title}</Text>
                <Text style={m.optDesc}>{d.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
            <Text style={m.equippedName}>장착: {SKILL_CATALOG[equipped.id].label} +{equipped.level}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Btn small kind="gold" label="강화" onPress={() => apply(() => upgradeSkill(state, unit.uid, i))} />
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
  flex: { flex: 1 },
  wrap: { padding: 14, paddingBottom: 30 },
  sec: { color: T.text, fontWeight: '800', fontSize: 15, marginBottom: 8 },
  subsec: { color: T.muted, fontSize: 12, marginTop: 12, marginBottom: 6, fontWeight: '700' },
  hlist: { gap: 10, paddingVertical: 4, paddingRight: 8 },
  chip: { width: 84, backgroundColor: T.surface, borderRadius: 14, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: T.line },
  chipOn: { borderColor: T.accent, backgroundColor: T.surface2 },
  chipStar: { position: 'absolute', top: 4, right: 6, fontSize: 12 },
  chipEmoji: { fontSize: 28 },
  partyRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  partySlot: { flex: 1, aspectRatio: 1, backgroundColor: T.surface2, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent', padding: 4 },
  partySlotOn: { borderColor: T.line },
  partySlotSel: { borderColor: T.accent },
  partyEmoji: { fontSize: 26 },
  partyName: { color: T.text, fontSize: 10, fontWeight: '700', marginTop: 2 },
  partyEmpty: { color: T.muted, fontSize: 24, fontWeight: '400' },
  synNone: { color: T.muted, fontSize: 12, marginTop: 10 },
  synWrap: { marginTop: 10, gap: 6 },
  synChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.surface2, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: T.accent },
  synChipText: { color: T.accent, fontWeight: '800', fontSize: 12 },
  synChipDesc: { color: T.muted, fontSize: 11, flex: 1 },
  chipName: { color: T.text, fontSize: 12, fontWeight: '700', marginTop: 4 },
  chipLv: { color: T.muted, fontSize: 11, marginTop: 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headEmoji: { fontSize: 44 },
  headName: { color: T.text, fontWeight: '900', fontSize: 20 },
  rarity: { color: T.accent, fontSize: 13, fontWeight: '800' },
  headTitle: { color: T.primary, fontSize: 13, fontWeight: '700', marginTop: 1 },
  headSub: { color: T.muted, fontSize: 13, marginTop: 2 },
  bubble: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: T.surface2, borderRadius: 12, padding: 12, marginBottom: 12 },
  bubbleEmoji: { fontSize: 26 },
  cosEmoji: { fontSize: 26, width: 34, textAlign: 'center' },
  bubbleText: { flex: 1, color: T.text, fontSize: 14, fontStyle: 'italic' },
  intiHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bar: { height: 6, backgroundColor: T.surface2, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: T.accent, borderRadius: 3 },
  sigHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sigBadge: { color: '#3a2a05', backgroundColor: T.accent, fontSize: 11, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  sigNote: { color: T.muted, fontSize: 11, marginTop: 6 },
  awHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  subsec2: { color: T.text, fontSize: 13, fontWeight: '700' },
  setBonus: { color: T.good, fontSize: 12, fontWeight: '700', marginTop: 6 },
  seedFull: { color: '#183a1d', backgroundColor: T.good, fontSize: 11, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  seedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: T.line },
  seedRowMet: {},
  seedIcon: { fontSize: 20, width: 26, textAlign: 'center' },
  seedLabel: { color: T.text, fontWeight: '700', fontSize: 13 },
  seedSub: { color: T.muted, fontSize: 12, marginTop: 2 },
  seedBadgeOn: { backgroundColor: T.good, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  seedBadgeOff: { backgroundColor: T.surface2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  seedBadgeTextOn: { color: '#183a1d', fontWeight: '800', fontSize: 11 },
  seedBadgeTextOff: { color: T.muted, fontWeight: '700', fontSize: 11 },
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
