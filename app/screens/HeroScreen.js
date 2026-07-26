// 영웅 탭 — 호드워 편성 화면 골격(속성 필터 바 · 영웅 카드 그리드 · 하단 액션 바).
//   기준: docs/HORDWAR_SPEC.md "편성 화면 (전투 준비)".
//   코어 모듈만 쓴다(장비·룬·코스튬 등 선택 모듈은 파킹 — docs/PARKED.md).
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { T, rarityMeta } from '../theme';
import { Card, Btn, fmt, Portrait } from '../components';
import { charImage } from '../charImages';
import { fx } from '../feedback';
import { isOn } from '../../system/core/features.mjs';
import { identity, elementMeta } from '../../system/concepts/index.mjs';
import { togglePartyMember, MAX_PARTY, getPartyUnits, autoParty } from '../../system/core/gameState.mjs';
import { toggleFormation, formationSummary, autoFormation, ROLE_CAP, ROLE_LABEL, FORMATION_ROLES } from '../../system/core/formation.mjs';
import { teamSynergy } from '../../system/core/synergy.mjs';
import { computeStats, computePower } from '../../system/core/stats.mjs';
import { levelCap } from '../../system/core/units.mjs';
import { levelUp, ascend, ascendCost } from '../../system/core/character.mjs';
import { recordMission } from '../../system/core/daily.mjs';
import { starOf } from '../../system/core/starGrade.mjs';
import { resolve } from '../../system/core/resolution.mjs';
import { playStage } from '../../system/core/difficulty.mjs';
import { accountMods } from '../../system/core/balance.mjs';

// 호드워 등급 뱃지는 S+/S/A 표기 — 엘드리아 등급(N~UR)을 같은 자리에 원형으로 얹는다.
const GRADE_TX = { UR: 'S+', SSR: 'S', SR: 'A', R: 'B', N: 'C' };

// 영웅 카드 한 장 — 호드워: 등급 원형 뱃지 + 속성 아이콘 + ✅편성됨 + `21레벨`.
const HeroCard = React.memo(function HeroCard({ u, meta, em, img, sel, inParty, onPress }) {
  const rm = rarityMeta(u.rarity);
  return (
    <TouchableOpacity style={[h.card, sel && h.cardOn]} activeOpacity={0.85} onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${meta.name} ${u.level}레벨${inParty ? ' 편성됨' : ''}`}>
      {isOn('rarity') && (
        <View style={[h.grade, { backgroundColor: rm.color }]}>
          <Text style={h.gradeTx}>{GRADE_TX[u.rarity] || 'C'}</Text>
        </View>
      )}
      {em ? <Text style={h.elem}>{em.emoji}</Text> : null}
      {inParty && <Text style={h.check}>✅</Text>}
      <Portrait emoji={meta.emoji} image={img} rarity={u.rarity} size={42} />
      <Text style={h.cardLv} numberOfLines={1}>{u.level}레벨</Text>
    </TouchableOpacity>
  );
});

export default function HeroScreen({ state, bump, concept, onGo }) {
  const [selId, setSel] = useState(state.party[0] || state.units[0]?.uid);
  const [elemFilter, setElemFilter] = useState(null); // null = ALL
  const [barOpen, setBarOpen] = useState(true);       // 호드워 ⌃접기
  const [msg, setMsg] = useState(null);

  const unit = state.units.find((u) => u.uid === selId) || state.units[0];
  const meta = unit && identity(concept, unit);

  // 동일 캐릭터는 한 칸으로 묶고(대표=최강) 편성된 영웅을 앞으로 — 카드 줄의 밀도를 유지한다.
  const pw = new Map();
  const powOf = (u) => { let v = pw.get(u.uid); if (v === undefined) { v = computePower(u); pw.set(u.uid, v); } return v; };
  const seen = new Set();
  const cards = [];
  for (const u of state.units.slice().sort((a, b) => powOf(b) - powOf(a))) {
    const key = u.characterId || u.uid;
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push(u);
  }
  const partySet = new Set(state.party);
  cards.sort((a, b) => (partySet.has(b.uid) ? 1 : 0) - (partySet.has(a.uid) ? 1 : 0));
  const shown = elemFilter ? cards.filter((u) => identity(concept, u).element === elemFilter) : cards;

  // 호드워 상단 VS — 편성 화면에서도 양팀 전투력을 나란히 본다.
  const battle = resolve(getPartyUnits(state), playStage(state).challenge, accountMods(state), state.formation);
  const sum = formationSummary(state);
  const groups = { front: sum.front, mid: sum.mid, back: sum.back };
  const chipStyle = { front: h.roleFront, mid: h.roleMid, back: h.roleBack };

  const act = (fn) => { fn(); bump(); };
  const inParty = unit && state.party.includes(unit.uid);
  const st8 = unit && computeStats(unit);
  const atCap = unit && unit.level >= levelCap(unit);
  const asc = unit && ascendCost(unit);

  return (
    <View style={h.wrap}>
      {/* 양팀 전투력 비교(호드워 VS 바) */}
      <View style={h.vs}>
        <Text style={[h.vsPow, h.vsMine]} numberOfLines={1}>⚔ {fmt(battle.score || 0)}</Text>
        <Text style={h.vsMark}>VS</Text>
        <Text style={[h.vsPow, h.vsFoe]} numberOfLines={1}>{fmt(battle.enemyScore || 0)} ⚔</Text>
      </View>

      {/* 속성 필터 바 — ⌃접기 · ALL(금색 활성) · 속성 원형 아이콘 */}
      {isOn('elements') && (
        <View style={h.filterBar}>
          <TouchableOpacity onPress={() => setBarOpen((v) => !v)} activeOpacity={0.8}
            accessibilityRole="button" accessibilityLabel={barOpen ? '필터 접기' : '필터 펼치기'}>
            <Text style={h.fold}>{barOpen ? '⌃' : '⌄'}</Text>
          </TouchableOpacity>
          {barOpen && (<>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setElemFilter(null)}
              style={[h.all, !elemFilter && h.allOn]}>
              <Text style={[h.allTx, !elemFilter && h.allTxOn]}>ALL</Text>
            </TouchableOpacity>
            {Object.keys(concept.elements || {}).map((eid) => {
              const on = elemFilter === eid;
              return (
                <TouchableOpacity key={eid} activeOpacity={0.8}
                  onPress={() => setElemFilter(on ? null : eid)}
                  accessibilityRole="button" accessibilityLabel={`${concept.elements[eid].name} 속성`}
                  style={[h.eChip, on && h.eChipOn]}>
                  <Text style={h.eChipIc}>{concept.elements[eid].emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </>)}
        </View>
      )}

      <ScrollView style={h.flex} contentContainerStyle={h.scroll}>
        {/* 영웅 카드 그리드 */}
        <View style={h.grid}>
          {shown.length === 0 && <Text style={h.dim}>이 속성의 {concept.terms.unit}이 없습니다</Text>}
          {shown.map((u) => (
            <HeroCard key={u.uid} u={u} meta={identity(concept, u)}
              em={elementMeta(concept, identity(concept, u).element)}
              img={charImage(concept.id, u.characterId)}
              sel={u.uid === selId} inParty={partySet.has(u.uid)}
              onPress={() => { fx('tap'); setSel(u.uid); }} />
          ))}
        </View>

        {/* 선택 영웅 상세 — 스탯 + 육성(레벨업·돌파) */}
        {unit && (
          <Card style={{ marginTop: 8 }}>
            <View style={h.detHead}>
              <Portrait emoji={meta.emoji} image={charImage(concept.id, unit.characterId)} rarity={unit.rarity} size={54} badge />
              <View style={h.flex}>
                <Text style={h.detName} numberOfLines={1}>
                  {meta.element ? `${elementMeta(concept, meta.element).emoji} ` : ''}{meta.name}
                </Text>
                <Text style={h.detSub}>Lv.{unit.level}/{levelCap(unit)} · R{unit.rank} · {starOf(unit)}★</Text>
              </View>
              <Text style={h.detPow}>⚔ {fmt(computePower(unit))}</Text>
            </View>
            <View style={h.statRow}>
              <Text style={h.stat}>❤️ {fmt(st8.hp)}</Text>
              <Text style={h.stat}>⚔️ {fmt(st8.atk)}</Text>
              <Text style={h.stat}>🛡️ {fmt(st8.def)}</Text>
            </View>
            <View style={h.btnRow}>
              <Btn small kind={inParty ? 'ghost' : 'gold'} label={inParty ? '편성 해제' : '편성'}
                disabled={!inParty && state.party.length >= MAX_PARTY}
                onPress={() => act(() => togglePartyMember(state, unit.uid))} />
              <Btn small kind="primary" label="레벨업" disabled={atCap}
                onPress={() => { const r = levelUp(state, unit.uid); if (r.ok) recordMission(state, 'upgrade', 1); else setMsg(`⚠ ${r.reason}`); fx(r.ok ? 'success' : 'error'); bump(); }} />
              {/* 돌파 비용은 소환석(summon)이다 — growth로 읽어 항상 0으로 뜨던 버그 수정. */}
              <Btn small kind="ghost" label={`돌파 ${concept.resources.summon.emoji}${fmt(asc.summon || 0)}`}
                onPress={() => { const r = ascend(state, unit.uid); if (r.ok) recordMission(state, 'upgrade', 1); setMsg(r.ok ? '⭐ 돌파 성공' : `⚠ ${r.reason}`); fx(r.ok ? 'success' : 'error'); bump(); }} />
            </View>
          </Card>
        )}

        {/* 진형 — 전열2·중열3·후열2. 탭하면 순환. */}
        <Card style={{ marginTop: 8 }}>
          <Text style={h.sec}>⚔️ 진형 <Text style={h.dim}>{state.party.length}/{MAX_PARTY}</Text></Text>
          {FORMATION_ROLES.map((role) => (
            <View key={role} style={h.roleRow}>
              <Text style={h.roleLb}>{ROLE_LABEL[role]} <Text style={h.dim}>{groups[role].length}/{ROLE_CAP[role]}</Text></Text>
              <View style={h.roleChips}>
                {groups[role].length === 0 && <Text style={h.dim}>비어있음</Text>}
                {groups[role].map((uid) => {
                  const u = state.units.find((x) => x.uid === uid);
                  if (!u) return null;
                  return (
                    <TouchableOpacity key={uid} activeOpacity={0.8} style={[h.roleChip, chipStyle[role]]}
                      onPress={() => { const r = toggleFormation(state, uid); if (!r.ok) { fx('error'); setMsg(`⚠ ${r.reason}`); } bump(); }}>
                      <Text style={h.roleChipTx} numberOfLines={1}>{identity(concept, u).name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          {sum.exposed
            ? <Text style={h.warn}>⚠️ 전열이 없어 중열·후열이 노출됨 — 공격 보너스 상실</Text>
            : <Text style={h.dim}>탭하여 전열→중열→후열 순환</Text>}
          {(() => {
            const syn = teamSynergy(getPartyUnits(state));
            if (!syn.list.length) return null;
            return <Text style={h.syn}>✦ {syn.list.map((x) => x.label).join(' · ')}</Text>;
          })()}
        </Card>

        {msg ? <Text style={h.msg}>{msg}</Text> : null}
        <View style={{ height: 8 }} />
      </ScrollView>

      {/* 하단 액션 바(호드워: ◀뒤로 · 일괄 진형 배치 · 전투(금색 대형)) */}
      <View style={h.actions}>
        <TouchableOpacity style={h.actGhost} activeOpacity={0.85}
          onPress={() => {
            const rp = autoParty(state);
            const r = rp.ok ? autoFormation(state) : rp;
            setMsg(r.ok ? `🎯 자동편성 ${state.party.length}명` : `⚠ ${r.reason}`);
            fx(r.ok ? 'success' : 'error'); bump();
          }}>
          <Text style={h.actGhostTx}>🎯 자동편성</Text>
        </TouchableOpacity>
        <TouchableOpacity style={h.actGhost} activeOpacity={0.85}
          onPress={() => {
            const r = autoFormation(state);
            setMsg(r.ok ? '🪄 일괄 진형 배치 완료' : `⚠ ${r.reason}`);
            fx(r.ok ? 'success' : 'error'); bump();
          }}>
          <Text style={h.actGhostTx}>🪄 일괄 진형 배치</Text>
        </TouchableOpacity>
        <TouchableOpacity style={h.actGold} activeOpacity={0.85}
          onPress={() => { fx('tap'); onGo?.('idle'); }}
          accessibilityRole="button" accessibilityLabel="전투로 이동">
          <Text style={h.actGoldTx}>전투</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const h = StyleSheet.create({
  wrap: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 10, paddingTop: 6 },
  dim: { color: T.muted, fontSize: 10 },

  // VS 바(호드워: 아군 금색 · 적 적색)
  vs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  vsPow: { maxWidth: 120, fontSize: 11, fontWeight: '800', borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  vsMine: { color: T.accent, borderColor: 'rgba(255,201,60,0.55)', textAlign: 'right' },
  vsFoe: { color: T.danger, borderColor: 'rgba(255,93,108,0.55)', textAlign: 'left' },
  vsMark: { color: T.muted, fontSize: 9, fontWeight: '800' },

  // 속성 필터 바
  filterBar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingBottom: 6 },
  fold: { color: T.muted, fontSize: 14, fontWeight: '900', width: 16, textAlign: 'center' },
  all: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 13, backgroundColor: T.surface, borderWidth: 1, borderColor: T.line },
  allOn: { backgroundColor: T.accent, borderColor: T.accent },
  allTx: { fontSize: 11, fontWeight: '900', color: T.muted },
  allTxOn: { color: '#1a1400' },
  eChip: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: T.surface, borderWidth: 1, borderColor: T.line },
  eChipOn: { borderColor: T.accent, borderWidth: 2, backgroundColor: T.surface2 },
  eChipIc: { fontSize: 14 },

  // 영웅 카드 그리드 — 5열
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  card: { width: '19%', alignItems: 'center', paddingVertical: 5, borderRadius: 10, backgroundColor: T.surface, borderWidth: 1, borderColor: T.line },
  cardOn: { borderColor: T.accent, backgroundColor: T.surface2 },
  grade: { position: 'absolute', top: 2, left: 3, minWidth: 16, borderRadius: 8, alignItems: 'center', zIndex: 2 },
  gradeTx: { fontSize: 8, fontWeight: '900', color: '#141a26' },
  elem: { position: 'absolute', top: 2, right: 3, fontSize: 10, zIndex: 2 },
  check: { position: 'absolute', bottom: 2, right: 3, fontSize: 9, zIndex: 2 },
  cardLv: { color: T.muted, fontSize: 8, fontWeight: '800', marginTop: 2 },

  // 상세
  detHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detName: { color: T.text, fontSize: 14, fontWeight: '900' },
  detSub: { color: T.muted, fontSize: 10, fontWeight: '700', marginTop: 1 },
  detPow: { color: T.accent, fontSize: 12, fontWeight: '900' },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  stat: { color: T.text, fontSize: 11, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 6, marginTop: 8 },

  // 진형
  sec: { color: T.text, fontSize: 12, fontWeight: '900', marginBottom: 4 },
  roleRow: { marginTop: 4 },
  roleLb: { color: T.text, fontSize: 10, fontWeight: '800' },
  roleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 },
  roleChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9, borderWidth: 1 },
  roleFront: { borderColor: T.good, backgroundColor: 'rgba(79,217,138,0.12)' },
  roleMid: { borderColor: T.primary, backgroundColor: 'rgba(63,155,255,0.12)' },
  roleBack: { borderColor: T.accent, backgroundColor: 'rgba(255,201,60,0.12)' },
  roleChipTx: { color: T.text, fontSize: 10, fontWeight: '700' },
  warn: { color: T.danger, fontSize: 10, fontWeight: '700', marginTop: 6 },
  syn: { color: T.accent, fontSize: 10, fontWeight: '800', marginTop: 6 },
  msg: { color: T.accent, fontSize: 11, fontWeight: '700', marginTop: 8, textAlign: 'center' },

  // 하단 액션 바 — '전투'만 금색 대형(호드워 주버튼)
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.line },
  actGhost: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: T.line, backgroundColor: T.surface2, alignItems: 'center' },
  actGhostTx: { color: T.text, fontSize: 10, fontWeight: '800' },
  actGold: { flex: 1.2, paddingVertical: 11, borderRadius: 10, backgroundColor: T.accent, alignItems: 'center' },
  actGoldTx: { color: '#1a1400', fontSize: 14, fontWeight: '900' },
});
