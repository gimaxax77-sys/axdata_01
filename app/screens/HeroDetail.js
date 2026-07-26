// 영웅 상세 — 호드워 "영웅 클릭 후" 전체화면. 기준: Gim 실기 캡처 2장(2026-07-26).
//   골격 = 상단 이름 리본 · 좌측 계약 패널 · 중앙 전신 · 우측 공략 · 우하단 LV/전투력
//          · 좌하단 등급/역할/속성/스킬명 바 · 하단 서브탭 패널(속성 | 장비).
//   엘드리아 대응 / 의도적 차이
//     · `계약`(동시 출전 보너스) · `공략` · `무료 부활` — 호드워 고유 시스템이라 잠금 표시만.
//     · `장비` 탭 — gear 파킹이라 슬롯 4칸을 잠금으로 두고 버튼도 잠금(docs/PARKED.md).
//     · `5레벨 상승` — 엘드리아는 1레벨씩 오르므로 **최대 5회 반복**으로 구현(비용 부족 시 되는 만큼).
//     · 그 버튼을 **연속 3회 이상** 누르면 바로 위에 `최대 레벨 상승`이 생긴다 — 올릴 수 있는
//       데까지 한 번에(Gim 지시 2026-07-27). 반복 상한은 "남은 레벨"이라 무한 루프가 불가능하다.
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { fmt, Portrait } from '../components';
import { charImage } from '../charImages';
import { fx } from '../feedback';
import { isOn } from '../../system/core/features.mjs';
import { identity, elementMeta } from '../../system/concepts/index.mjs';
import { getArchetype } from '../../system/core/archetypes.mjs';
import { computeStats, computePower } from '../../system/core/stats.mjs';
import { levelCap, levelUpCost } from '../../system/core/units.mjs';
import { levelUp, ascend, ascendCost } from '../../system/core/character.mjs';
import { SKILL_CATALOG, skillSlots } from '../../system/core/skills.mjs';
import { recordMission } from '../../system/core/daily.mjs';
import { togglePartyMember, MAX_PARTY } from '../../system/core/gameState.mjs';
import { starOf } from '../../system/core/starGrade.mjs';
import ComingSoon from './ComingSoon';

// 아직 붙지 않은 자리 — 막지 않고 준비 중 패널로 **들어가게** 한다(Gim 지시 2026-07-26).
const PAGES = {
  pact: { icon: '🤝', title: '계약', plan: ['영웅 2인 계약', '동시 출전 시 능력치 보너스'] },
  guide: { icon: '📖', title: '공략', plan: ['추천 진형·스킬 세팅', '상성 안내'] },
};

const GRADE = { UR: 'S+', SSR: 'S', SR: 'A', R: 'B', N: 'C' };
const GRADE_BG = { UR: '#c0392b', SSR: '#c9962a', SR: '#2f8f7f', R: '#3a6ea8', N: '#6b6b6b' };
const LEVEL_STEP = 5; // 호드워 `5레벨 상승` — 한 번에 시도할 레벨업 횟수
const BURST_TAPS = 3; // 이만큼 연속으로 누르면 `최대 레벨 상승` 버튼이 나온다

export default function HeroDetail({ state, bump, concept, unit, onClose }) {
  const [tab, setTab] = useState('stat'); // 'stat' | 'gear'
  const [page, setPage] = useState(null); // 'pact' | 'guide'
  const [msg, setMsg] = useState(null);
  // `5레벨 상승`을 연속 3회 이상 누르면 위에 `최대 레벨 상승` 버튼이 생긴다(Gim 지시 2026-07-27).
  // uid를 같이 들고 있어야 다른 영웅으로 넘어갔을 때 카운트가 새로 시작된다.
  const [burst, setBurst] = useState({ uid: null, taps: 0 });
  if (!unit) return null;
  if (page) {
    return <ComingSoon {...PAGES[page]} onBack={() => setPage(null)}
      note="이 기능이 아직 붙어 있지 않습니다. 자리와 동선만 잡아 둔 상태예요." />;
  }

  const id = identity(concept, unit);
  const arch = getArchetype(unit.archetype);
  const em = id.element && elementMeta(concept, id.element);
  const st8 = computeStats(unit);
  const asc = ascendCost(unit);
  const lvCost = levelUpCost(unit);
  const atCap = unit.level >= levelCap(unit);
  const inParty = state.party.includes(unit.uid);
  const slots = skillSlots(unit);
  const gearMsg = () => { fx('error'); setMsg('🔒 장비 모듈이 아직 붙어 있지 않습니다'); };

  // 레벨업 공통 — times회까지 시도하고 상한·재화 부족에서 멈춘다.
  const runLevelUp = (times) => {
    let n = 0;
    for (let i = 0; i < times; i++) { if (!levelUp(state, unit.uid).ok) break; n++; }
    if (n > 0) recordMission(state, 'upgrade', n);
    setMsg(n > 0 ? `⬆ ${n}레벨 상승` : (atCap ? '⚠ 레벨 상한 — 돌파가 필요합니다' : '⚠ 성장 재료 부족'));
    fx(n > 0 ? 'success' : 'error'); bump();
  };

  // `5레벨 상승` — 되는 만큼 올린다. 연속 탭 수를 세어 3회째부터 최대 버튼을 띄운다.
  const doLevelUp = () => {
    setBurst((b) => (b.uid === unit.uid ? { uid: unit.uid, taps: b.taps + 1 } : { uid: unit.uid, taps: 1 }));
    runLevelUp(LEVEL_STEP);
  };

  // `최대 레벨 상승` — 올릴 수 있는 데까지 한 번에.
  // 반복 상한을 "남은 레벨"로 잡아 무한 루프가 원천적으로 불가능하게 한다.
  const doLevelUpMax = () => runLevelUp(Math.max(0, levelCap(unit) - unit.level));

  const showBurst = burst.uid === unit.uid && burst.taps >= BURST_TAPS;

  return (
    <View style={d.wrap}>
      {/* ── 상단: 배경 + 전신 ── */}
      <View style={d.stage}>
        <TouchableOpacity style={d.back} activeOpacity={0.85} onPress={onClose}
          accessibilityRole="button" accessibilityLabel="뒤로">
          <Text style={d.backTx}>◀</Text>
        </TouchableOpacity>

        {/* 이름 리본 + 위쪽 속성 원형
            속성 원형을 **리본보다 나중에** 그린다 — 먼저 그리면 리본이 위를 덮는다
            (zIndex는 RN-Web에서 확실하지 않아 그리기 순서로 해결. Gim 지적 2026-07-27). */}
        <View style={d.nameWrap}>
          <View style={d.ribbon}><Text style={d.ribbonTx} numberOfLines={1}>{id.name}</Text></View>
          {em ? <View style={d.elemRing}><Text style={d.elemTx}>{em.emoji}</Text></View> : null}
        </View>

        {/* 좌측 계약 패널 — 호드워 고유 시스템이라 잠금 */}
        <TouchableOpacity style={d.pact} activeOpacity={0.85} onPress={() => { fx('tap'); setPage('pact'); }}
          accessibilityRole="button" accessibilityLabel="계약 (준비 중)">
          <Text style={d.pactTitle}>계약</Text>
          <View style={d.pactCard}>
            <Portrait emoji={id.emoji} image={charImage(concept.id, unit.characterId)} rarity={unit.rarity} size={38} />
          </View>
          <View style={[d.pactCard, d.pactLocked]}><Text style={d.pactLock}>🔒</Text></View>
          <Text style={d.pactNote}>동시 출전{'\n'}보너스</Text>
        </TouchableOpacity>

        {/* 우측 공략 — 잠금 */}
        <TouchableOpacity style={d.guide} activeOpacity={0.85} onPress={() => { fx('tap'); setPage('guide'); }}
          accessibilityRole="button" accessibilityLabel="공략 (준비 중)">
          <Text style={d.guideIc}>📖</Text><Text style={d.guideTx}>공략</Text>
        </TouchableOpacity>

        {/* 중앙 전신 */}
        <View style={d.art}>
          <Portrait emoji={id.emoji} image={charImage(concept.id, unit.characterId)} rarity={unit.rarity} size={168} glow />
          <View style={d.pedestal} />
        </View>

        {/* 우하단 LV / 전투력 */}
        <View style={d.meters}>
          <View style={d.meter}><Text style={d.meterKey}>LV</Text><Text style={d.meterVal}>{unit.level}</Text></View>
          <View style={d.meter}><Text style={d.meterKey}>⚔</Text><Text style={d.meterVal}>{fmt(computePower(unit))}</Text></View>
        </View>

        {/* 좌하단 등급 · 역할 · 속성 · 스킬명 */}
        <View style={d.idBar}>
          {isOn('rarity') && (
            <View style={[d.medal, { backgroundColor: GRADE_BG[unit.rarity] || '#6b6b6b' }]}>
              <Text style={d.medalTx}>{GRADE[unit.rarity] || 'C'}</Text>
            </View>
          )}
          <View style={d.tagRing}><Text style={d.tagIc}>{arch.emoji || '🛡️'}</Text></View>
          <Text style={d.tagLb}>{arch.roleLabel}</Text>
          {em ? (<><View style={d.tagRing}><Text style={d.tagIc}>{em.emoji}</Text></View><Text style={d.tagLb}>{em.name}</Text></>) : null}
          <View style={d.traitBar}>
            <Text style={d.traitTx} numberOfLines={1}>
              {unit.signature && SKILL_CATALOG[unit.signature] ? SKILL_CATALOG[unit.signature].label : arch.role} · {starOf(unit)}★
            </Text>
          </View>
        </View>
      </View>

      {/* ── 하단 패널 (속성 | 장비) ── */}
      <View style={d.panel}>
        {tab === 'stat' ? (
          <ScrollView contentContainerStyle={d.panelIn}>
            <View style={d.statRow}>
              <Text style={d.stat}>⚔️ {fmt(st8.atk)}</Text>
              <Text style={d.stat}>❤️ {fmt(st8.hp)}</Text>
              <Text style={d.stat}>🛡️ {fmt(st8.def)}</Text>
              <Text style={d.stat}>👣 {fmt(st8.spd)}</Text>
            </View>

            {/* 스킬 원형 — 슬롯 수만큼. 빈 칸은 회색. */}
            <View style={d.skills}>
              {Array.from({ length: 4 }).map((_, i) => {
                const locked = i >= slots;
                const sk = unit.skills && unit.skills[i];
                const meta = sk && SKILL_CATALOG[sk.id];
                return (
                  <View key={i} style={[d.skill, sk && d.skillOn, locked && d.skillLocked]}>
                    <Text style={d.skillIc}>{locked ? '🔒' : meta ? '✨' : '＋'}</Text>
                    {sk && <View style={d.skillLv}><Text style={d.skillLvTx}>{sk.level}</Text></View>}
                    {i === 0 && !locked && <Text style={d.ult}>필살기</Text>}
                  </View>
                );
              })}
            </View>

            {/* 비용 2줄 — 레벨업(정수) · 돌파(소환석) */}
            <View style={d.costs}>
              <Text style={d.cost}>
                {concept.resources.growth.emoji} {fmt(state.wallet.growth || 0)}/{fmt(lvCost.growth || 0)}
              </Text>
              <Text style={d.cost}>
                {concept.resources.summon.emoji} {fmt(state.wallet.summon || 0)}/{fmt(asc.summon || 0)}
              </Text>
            </View>

            {/* 연속 3회 이상 눌렀을 때만 나오는 `최대 레벨 상승`.
                아래 버튼과 크기를 똑같이 맞추려고 같은 행 구조(side 폭 자리)를 그대로 쓴다. */}
            {showBurst && (
              <View style={d.actions}>
                <View style={d.side} />
                <TouchableOpacity style={[d.mainBtn, d.maxBtn]} activeOpacity={0.85} onPress={doLevelUpMax}
                  accessibilityRole="button" accessibilityLabel={`최대 레벨 상승 — 상한 ${levelCap(unit)}까지 한 번에`}>
                  <Text style={[d.mainTx, d.maxTx]}>⏫ 최대 레벨 상승</Text>
                </TouchableOpacity>
                <View style={d.side} />
              </View>
            )}

            <View style={d.actions}>
              <TouchableOpacity style={d.side} activeOpacity={0.85}
                onPress={() => { togglePartyMember(state, unit.uid); fx('tap'); bump(); }}
                disabled={!inParty && state.party.length >= MAX_PARTY}
                accessibilityRole="button" accessibilityLabel={inParty ? '편성 해제' : '편성'}>
                <Text style={d.sideIc}>{inParty ? '➖' : '➕'}</Text>
                <Text style={d.sideTx}>{inParty ? '편성 해제' : '편성'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={d.mainBtn} activeOpacity={0.85} onPress={doLevelUp}
                accessibilityRole="button" accessibilityLabel={`최대 ${LEVEL_STEP}레벨 상승`}>
                <Text style={d.mainTx}>{LEVEL_STEP}레벨 상승</Text>
              </TouchableOpacity>
              <TouchableOpacity style={d.side} activeOpacity={0.85}
                onPress={() => { const r = ascend(state, unit.uid); if (r.ok) recordMission(state, 'upgrade', 1); setMsg(r.ok ? '⭐ 돌파 성공' : `⚠ ${r.reason}`); fx(r.ok ? 'success' : 'error'); bump(); }}
                accessibilityRole="button" accessibilityLabel="돌파">
                <Text style={d.sideIc}>⭐</Text><Text style={d.sideTx}>돌파</Text>
              </TouchableOpacity>
            </View>
            {msg ? <Text style={d.msg}>{msg}</Text> : null}
          </ScrollView>
        ) : (
          <View style={d.panelIn}>
            <View style={d.gearRow}>
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={d.gearSlot}><Text style={d.gearIc}>🔒</Text></View>
              ))}
            </View>
            <View style={d.actions}>
              <TouchableOpacity style={d.gearOff} activeOpacity={0.85} onPress={gearMsg}
                accessibilityRole="button" accessibilityLabel="일괄 해제">
                <Text style={d.gearOffTx}>일괄 해제</Text>
              </TouchableOpacity>
              <TouchableOpacity style={d.mainBtn} activeOpacity={0.85} onPress={gearMsg}
                accessibilityRole="button" accessibilityLabel="일괄 장착">
                <Text style={d.mainTx}>일괄 장착</Text>
              </TouchableOpacity>
            </View>
            <Text style={d.gearNote}>{msg || '장비 슬롯 4칸 · 세트 효과가 들어올 자리입니다'}</Text>
          </View>
        )}
      </View>

      {/* 하단 바 — 좌 뒤로 · 우 서브탭(속성 · 장비) */}
      <View style={d.tabbar}>
        <TouchableOpacity style={d.tabBack} activeOpacity={0.85} onPress={onClose}
          accessibilityRole="button" accessibilityLabel="영웅 목록으로">
          <Text style={d.tabBackTx}>◀</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {[{ k: 'stat', l: '속성', i: '📊' }, { k: 'gear', l: '장비', i: '⚔️' }].map((x) => (
          <TouchableOpacity key={x.k} style={[d.tab, tab === x.k && d.tabOn]} activeOpacity={0.85}
            onPress={() => { fx('tap'); setTab(x.k); }}
            accessibilityRole="tab" accessibilityState={{ selected: tab === x.k }} accessibilityLabel={x.l}>
            <Text style={d.tabIc}>{x.i}</Text>
            <Text style={[d.tabTx, tab === x.k && d.tabTxOn]}>{x.l}</Text>
            {x.k === 'gear' && <Text style={d.tabDot}>❗</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const d = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#6f9bb5' },

  // ── 상단 무대 ──
  stage: { flex: 1, position: 'relative' },
  back: { position: 'absolute', left: 8, top: 8, width: 32, height: 32, borderRadius: 8, backgroundColor: '#4a3a26', borderWidth: 1, borderColor: '#8a6d47', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  backTx: { color: '#e6d3ae', fontSize: 14, fontWeight: '900' },

  // 리본 위쪽 20px을 비워 두고 그 자리에 속성 원형을 절대배치한다.
  // (원형 26px 중 6px이 리본에 겹쳐 물리는 모양 — 겹침 값은 종전과 동일)
  nameWrap: { alignItems: 'center', marginTop: 10, paddingTop: 20 },
  elemRing: { position: 'absolute', top: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(20,30,45,0.8)', borderWidth: 2, borderColor: '#cfe3f2', alignItems: 'center', justifyContent: 'center' },
  elemTx: { fontSize: 13 },
  ribbon: { minWidth: 180, maxWidth: '70%', paddingHorizontal: 26, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f2e6c8', borderWidth: 2, borderColor: '#c8ab74' },
  ribbonTx: { color: '#3b2a12', fontSize: 15, fontWeight: '900', textAlign: 'center' },

  // 좌측 계약 패널
  pact: { position: 'absolute', left: 6, top: 52, width: 62, alignItems: 'center', backgroundColor: 'rgba(30,40,55,0.45)', borderRadius: 8, paddingVertical: 5, zIndex: 4 },
  pactTitle: { color: T.accent, fontSize: 10, fontWeight: '900' },
  pactCard: { width: 44, height: 44, borderRadius: 6, borderWidth: 2, borderColor: '#e08a3a', backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  pactLocked: { borderColor: '#8f9aa6' },
  pactLock: { fontSize: 16 },
  pactNote: { color: '#d8e4ee', fontSize: 8, fontWeight: '800', textAlign: 'center', marginTop: 3 },

  guide: { position: 'absolute', right: 6, top: '32%', alignItems: 'center', backgroundColor: '#4a3a26', borderRadius: 8, borderWidth: 1, borderColor: '#8a6d47', paddingHorizontal: 6, paddingVertical: 4, zIndex: 4 },
  guideIc: { fontSize: 16 },
  guideTx: { color: '#e6d3ae', fontSize: 9, fontWeight: '900' },

  art: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // 돌 원형 무대
  pedestal: { position: 'absolute', bottom: -6, width: 200, height: 34, borderRadius: 100, backgroundColor: 'rgba(120,130,140,0.45)', zIndex: -1 },

  meters: { position: 'absolute', right: 6, bottom: 46, gap: 4, alignItems: 'flex-end', zIndex: 4 },
  meter: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(40,25,15,0.85)', borderWidth: 1, borderColor: '#c8ab74', borderRadius: 6, overflow: 'hidden' },
  meterKey: { color: '#f0d9a0', fontSize: 10, fontWeight: '900', paddingHorizontal: 7, paddingVertical: 3, backgroundColor: 'rgba(90,60,30,0.9)' },
  meterVal: { color: '#ffd873', fontSize: 13, fontWeight: '900', paddingHorizontal: 10 },

  idBar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 6, paddingRight: 70, paddingBottom: 8 },
  medal: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#f0d9a0', alignItems: 'center', justifyContent: 'center' },
  medalTx: { color: '#fff', fontSize: 12, fontWeight: '900' },
  tagRing: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(30,20,30,0.8)', borderWidth: 1, borderColor: '#d090b0', alignItems: 'center', justifyContent: 'center' },
  tagIc: { fontSize: 10 },
  tagLb: { color: '#f0e0c8', fontSize: 9, fontWeight: '800' },
  traitBar: { flex: 1, backgroundColor: 'rgba(40,25,15,0.8)', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 3 },
  traitTx: { color: '#f0e0c8', fontSize: 10, fontWeight: '800' },

  // ── 하단 패널 ──
  panel: { height: '32%', backgroundColor: '#e8d5ae', borderTopWidth: 2, borderTopColor: '#8a6d47' },
  panelIn: { padding: 10 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#d3bd93', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 },
  stat: { color: '#3b2a12', fontSize: 11, fontWeight: '900' },

  skills: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  skill: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#b9a888', borderWidth: 2, borderColor: '#8a6d47', alignItems: 'center', justifyContent: 'center' },
  skillOn: { backgroundColor: '#8a3a2a', borderWidth: 2, borderColor: '#e0a050' },
  skillLocked: { opacity: 0.45 },
  skillIc: { fontSize: 18 },
  skillLv: { position: 'absolute', bottom: -2, minWidth: 16, borderRadius: 8, backgroundColor: '#3b2a12', alignItems: 'center' },
  skillLvTx: { color: '#f0d9a0', fontSize: 9, fontWeight: '900' },
  ult: { position: 'absolute', top: -8, color: '#3d2a00', backgroundColor: T.accent, fontSize: 7, fontWeight: '900', borderRadius: 4, paddingHorizontal: 3, overflow: 'hidden' },

  costs: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 10 },
  cost: { color: '#2f6b30', fontSize: 11, fontWeight: '900' },

  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  side: { alignItems: 'center', minWidth: 52 },
  sideIc: { fontSize: 16 },
  sideTx: { color: '#5c4526', fontSize: 9, fontWeight: '900' },
  mainBtn: { flex: 1, maxWidth: 190, paddingVertical: 11, borderRadius: 8, backgroundColor: T.accent, borderWidth: 2, borderColor: '#c8951f', alignItems: 'center' },
  mainTx: { color: '#3d2a00', fontSize: 15, fontWeight: '900' },
  // `최대 레벨 상승` — 크기는 아래 버튼과 동일, 색만 달리해 다른 동작임을 알린다.
  maxBtn: { backgroundColor: '#e07a2a', borderColor: '#a8531a' },
  maxTx: { color: '#fff4e2' },
  msg: { color: '#7a3a1a', fontSize: 10, fontWeight: '800', textAlign: 'center', marginTop: 8 },

  gearRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 },
  gearSlot: { width: 58, height: 58, borderRadius: 7, backgroundColor: '#9b9b9b', borderWidth: 2, borderColor: '#7d7d7d', alignItems: 'center', justifyContent: 'center' },
  gearIc: { fontSize: 20, opacity: 0.7 },
  gearOff: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: '#8a6d47', alignItems: 'center' },
  gearOffTx: { color: '#e8d5ae', fontSize: 12, fontWeight: '900' },
  gearNote: { color: '#7a6238', fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 10 },

  // ── 하단 바 ──
  tabbar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#3b2d1d', borderTopWidth: 1, borderTopColor: '#6b543a' },
  tabBack: { width: 40, height: 32, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  tabBackTx: { color: T.danger, fontSize: 17, fontWeight: '900' },
  tab: { minWidth: 52, alignItems: 'center', paddingVertical: 3, borderRadius: 7 },
  tabOn: { backgroundColor: '#5a4630' },
  tabIc: { fontSize: 16, opacity: 0.85 },
  tabTx: { color: '#b09a76', fontSize: 9, fontWeight: '900' },
  tabTxOn: { color: T.accent },
  tabDot: { position: 'absolute', top: 0, right: 4, fontSize: 8 },
});
