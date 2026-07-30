// 영웅 탭 — 호드워 영웅 화면. 기준: Gim 실기 캡처 2장(2026-07-26), docs/HORDWAR_SPEC.md.
//   골격 = 상단 서브탭(장신구·도감·영웅) + 보유수 알약 · 카드 그리드 4열 · 하단 필터바([공명] ⌃ ALL 속성 [편성]).
//   카드 = 좌측 세로 원형뱃지(속성·역할) · 상단 등급 메달(S+/S/A) · ❗ · 전장 대기중 라벨 · Lv 리본 · 이름.
//   엘드리아 대응 / 의도적 차이
//     · 장신구=장비(gear) · 도감=meta — 둘 다 파킹이라 잠금 서브탭(docs/PARKED.md).
//     · 보유수 — 호드워는 107/200(용량 과금). 엘드리아엔 상한 개념이 없어 **보유수만** 표시.
//     · '핵심' 라벨, '상위 5명 최저레벨 공유' 안내 — 호드워 고유 시스템이라 넣지 않음.
//     · 공명 — 대응이 없어 팀 시너지 개수로 대체.
//     · 상세 — 카드를 탭하면 **전체화면 HeroDetail**로 전환한다(호드워 캐프처와 동일).
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { T, GRADE, GRADE_BG } from '../theme';
import { Portrait } from '../components';
import { charImage } from '../charImages';
import { fx } from '../feedback';
import { isOn } from '../../system/core/features.mjs';
import { identity, elementMeta } from '../../system/concepts/index.mjs';
import { getPartyUnits } from '../../system/core/gameState.mjs';
import { teamSynergy } from '../../system/core/synergy.mjs';
import { computePower } from '../../system/core/stats.mjs';
import FormationModal from './FormationModal';
import HeroDetail from './HeroDetail';
import ComingSoon from './ComingSoon';

// 등급 메달 표기(GRADE·GRADE_BG)는 소환 결과와 공유하므로 theme.js에 있다.

// lock 이 있어도 **막지 않고 들어간다** — 준비 중 패널을 보여준다(Gim 지시 2026-07-26).
// 🔒 표시만 남기고, 출시 전에 정식으로 잠근다.
const SUBS = [
  { key: 'gear', label: '장신구', lock: true, icon: '💍', plan: ['장비·장신구 착용 슬롯', '강화·분해', '세트 효과'] },
  { key: 'dex', label: '도감', lock: true, icon: '📖', plan: ['보유 영웅 도감', '업적', '시즌 패스'] },
  { key: 'hero', label: '영웅' },
];

// 영웅 카드 한 장 — 세로 장식 카드.
const HeroCard = React.memo(function HeroCard({ u, name, emoji, elemIc, roleIc, img, sel, inParty, onPress }) {
  const g = GRADE[u.rarity] || 'C';
  return (
    <TouchableOpacity style={[c.card, sel && c.cardSel]} activeOpacity={0.85} onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name} ${g}등급 ${u.level}레벨${inParty ? ' 편성됨' : ''}`}>
      {/* 좌측 세로 원형 뱃지 — 속성 · 역할 */}
      <View style={c.badges}>
        {elemIc ? <View style={c.badge}><Text style={c.badgeTx}>{elemIc}</Text></View> : null}
        <View style={c.badge}><Text style={c.badgeTx}>{roleIc}</Text></View>
      </View>
      {/* 상단 중앙 등급 메달 */}
      {isOn('rarity') && (
        <View style={[c.medal, { backgroundColor: GRADE_BG[u.rarity] || '#6b6b6b' }]}>
          <Text style={c.medalTx}>{g}</Text>
        </View>
      )}
      {inParty && <View style={c.dot} />}

      <View style={c.art}>
        <Portrait emoji={emoji} image={img} rarity={u.rarity} size={54} />
      </View>
      {inParty && <Text style={c.standby}>전장 대기중</Text>}
      {/* 하단 리본 — Lv */}
      <View style={c.ribbon}><Text style={c.ribbonTx}>Lv{u.level}</Text></View>
      <Text style={c.name} numberOfLines={2}>{name}</Text>
    </TouchableOpacity>
  );
});

export default function HeroScreen({ state, bump, concept }) {
  const [sub, setSub] = useState('hero');
  const [elemFilter, setElemFilter] = useState(null);
  const [barOpen, setBarOpen] = useState(true);
  const [detail, setDetail] = useState(null);   // 상세 전환 대상 uid
  const [formOpen, setFormOpen] = useState(false);
  const [msg, setMsg] = useState(null);

  // 동일 캐릭터는 한 칸으로 묶고(대표=최강) 편성된 영웅을 앞으로.
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

  const synCount = teamSynergy(getPartyUnits(state)).list.length;
  const unit = detail && state.units.find((u) => u.uid === detail);

  // 영웅을 고르면 목록 대신 **전체화면 상세**로 바뀐다(호드워 캡처와 동일).
  if (unit) {
    // 좌우 화살표로 목록을 벗어나지 않고 영웅을 넘긴다(Gim 지시 2026-07-27).
    // 순환식 — 끝에서 누르면 반대쪽 끝으로 간다. 기준 목록은 화면에 보이는 것과 같다.
    const idx = cards.findIndex((u) => u.uid === detail);
    const step = (delta) => {
      if (cards.length < 2 || idx < 0) return;
      setDetail(cards[(idx + delta + cards.length) % cards.length].uid);
    };
    return (
      <HeroDetail state={state} bump={bump} concept={concept} unit={unit}
        onStep={cards.length > 1 ? step : null}
        stepInfo={idx >= 0 ? `${idx + 1}/${cards.length}` : null}
        onClose={() => setDetail(null)} />
    );
  }

  return (
    <View style={c.wrap}>
      {/* 상단 — 보유수 알약 + 서브탭 3개 */}
      <View style={c.top}>
        <View style={{ flex: 1 }} />
        <View style={c.cap}><Text style={c.capTx}>🦸 {state.units.length}</Text></View>
      </View>
      <View style={c.subbar}>
        {SUBS.map((s) => {
          const on = s.key === sub;
          return (
            <TouchableOpacity key={s.key} style={[c.sub, on && c.subOn]} activeOpacity={0.85}
              onPress={() => { fx('tap'); setSub(s.key); }}
              accessibilityRole="tab" accessibilityState={{ selected: on }}
              accessibilityLabel={s.lock ? `${s.label} (준비 중)` : s.label}>
              <Text style={[c.subTx, on && c.subTxOn]}>{s.label}</Text>
              {s.lock && <Text style={c.subLock}>🔒</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 장신구·도감 서브탭 — 막지 않고 준비 중 패널로 들어간다 */}
      {sub !== 'hero' && (() => {
        const s = SUBS.find((x) => x.key === sub);
        return <ComingSoon icon={s.icon} title={s.label} plan={s.plan}
          note="해당 모듈이 아직 붙어 있지 않습니다. 자리와 동선만 잡아 둔 상태예요." />;
      })()}

      {/* 카드 그리드 4열 */}
      {sub === 'hero' && (<>
      <ScrollView style={c.flex} contentContainerStyle={c.grid}>
        {shown.length === 0 && <Text style={c.empty}>이 속성의 {concept.terms.unit}이 없습니다</Text>}
        {shown.map((u) => {
          const id = identity(concept, u);
          const arch = concept.archetypes[u.archetype];
          return (
            <HeroCard key={u.uid} u={u} name={id.name} emoji={id.emoji}
              elemIc={elementMeta(concept, id.element)?.emoji}
              roleIc={arch ? arch.emoji : '❔'}
              img={charImage(concept.id, u.characterId)}
              sel={u.uid === detail} inParty={partySet.has(u.uid)}
              onPress={() => { fx('tap'); setDetail(u.uid); }} />
          );
        })}
      </ScrollView>

      {/* 하단 필터바 — [공명] ⌃ ALL 속성… [편성] */}
      <View style={c.filter}>
        <View style={c.reso}>
          <Text style={c.resoIc}>✦</Text>
          <Text style={c.resoTx}>시너지 {synCount}</Text>
        </View>
        {isOn('elements') && (<>
          <TouchableOpacity onPress={() => setBarOpen((v) => !v)} activeOpacity={0.8}
            accessibilityRole="button" accessibilityLabel={barOpen ? '속성 필터 접기' : '속성 필터 펼치기'}>
            <Text style={c.fold}>{barOpen ? '⌃' : '⌄'}</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => setElemFilter(null)}
            style={[c.all, !elemFilter && c.allOn]} accessibilityRole="button" accessibilityLabel="전체 속성">
            <Text style={[c.allTx, !elemFilter && c.allTxOn]}>ALL</Text>
          </TouchableOpacity>
          {barOpen && Object.keys(concept.elements || {}).map((eid) => {
            const on = elemFilter === eid;
            return (
              <TouchableOpacity key={eid} activeOpacity={0.8} style={[c.eChip, on && c.eChipOn]}
                onPress={() => setElemFilter(on ? null : eid)}
                accessibilityRole="button" accessibilityLabel={`${concept.elements[eid].name} 속성`}>
                <Text style={c.eChipIc}>{concept.elements[eid].emoji}</Text>
              </TouchableOpacity>
            );
          })}
        </>)}
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={c.formBtn} activeOpacity={0.85}
          onPress={() => { fx('tap'); setFormOpen(true); }}
          accessibilityRole="button" accessibilityLabel="편성 열기">
          <Text style={c.formIc}>👥</Text><Text style={c.formTx}>편성</Text>
        </TouchableOpacity>
      </View>
      {/* 자리를 항상 차지한다 — 뜰 때 필터바(편성 버튼)가 밀리지 않게(Gim 지시 2026-07-27) */}
      <Text style={c.msg} numberOfLines={1}>{msg || ' '}</Text>
      </>)}

      <FormationModal visible={formOpen} state={state} bump={bump} concept={concept}
        onClose={() => setFormOpen(false)} onMsg={setMsg} />
    </View>
  );
}

const c = StyleSheet.create({
  wrap: { flex: 1 },
  flex: { flex: 1 },

  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 6 },
  cap: { backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: T.line, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 2 },
  capTx: { color: T.text, fontSize: 10, fontWeight: '800' },

  // 상단 서브탭 — 선택된 것만 밝게(호드워: 카드형 탭)
  subbar: { flexDirection: 'row', gap: 4, paddingHorizontal: 10, paddingTop: 6 },
  sub: { flex: 1, alignItems: 'center', paddingVertical: 7, borderTopLeftRadius: 8, borderTopRightRadius: 8, backgroundColor: '#3b2d1d', borderWidth: 1, borderColor: '#6b543a' },
  subOn: { backgroundColor: T.accent, borderColor: T.accent },
  subTx: { color: '#b09a76', fontSize: 12, fontWeight: '900' },
  subTxOn: { color: '#3d2a00' },
  subLock: { position: 'absolute', top: 3, right: 6, fontSize: 9 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, paddingHorizontal: 8, paddingTop: 8 },
  empty: { color: T.muted, fontSize: 11, padding: 12 },

  // 카드 — 세로 장식형
  card: { width: '23.5%', backgroundColor: '#8a5a2b', borderRadius: 8, borderWidth: 2, borderColor: '#c08b4a', paddingTop: 8, paddingBottom: 4, alignItems: 'center' },
  cardSel: { borderColor: T.danger, backgroundColor: '#9b4a34' },
  badges: { position: 'absolute', left: 3, top: 4, gap: 3, zIndex: 3 },
  badge: { width: 15, height: 15, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: '#e0c08a', alignItems: 'center', justifyContent: 'center' },
  badgeTx: { fontSize: 8 },
  medal: { position: 'absolute', top: -1, alignSelf: 'center', minWidth: 22, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#f0d9a0', alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  medalTx: { color: '#fff', fontSize: 10, fontWeight: '900' },
  dot: { position: 'absolute', top: 3, right: 3, width: 8, height: 8, borderRadius: 4, backgroundColor: T.danger, zIndex: 3 },
  art: { marginTop: 8 },
  standby: { color: '#eaffe0', backgroundColor: 'rgba(40,120,50,0.9)', fontSize: 7, fontWeight: '900', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, overflow: 'hidden', marginTop: 2 },
  // 하단 Lv 리본
  ribbon: { alignSelf: 'stretch', marginTop: 4, marginHorizontal: 3, backgroundColor: '#f0e0bd', borderRadius: 4, alignItems: 'center', paddingVertical: 1 },
  ribbonTx: { color: '#2c62a8', fontSize: 11, fontWeight: '900' },
  name: { color: '#f5e6c8', fontSize: 9, fontWeight: '800', textAlign: 'center', marginTop: 2, paddingHorizontal: 2 },

  // 하단 필터바
  filter: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#2b2013', borderTopWidth: 1, borderTopColor: '#6b543a' },
  reso: { alignItems: 'center', paddingRight: 3 },
  resoIc: { color: T.accent, fontSize: 14, fontWeight: '900' },
  resoTx: { color: '#b09a76', fontSize: 8, fontWeight: '800' },
  fold: { color: '#b09a76', fontSize: 14, fontWeight: '900', width: 14, textAlign: 'center' },
  all: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#6b543a', alignItems: 'center', justifyContent: 'center' },
  allOn: { borderColor: T.accent, backgroundColor: 'rgba(255,201,60,0.15)' },
  allTx: { color: '#b09a76', fontSize: 9, fontWeight: '900' },
  allTxOn: { color: T.accent },
  eChip: { width: 27, height: 27, borderRadius: 14, backgroundColor: '#3b2d1d', borderWidth: 1, borderColor: '#6b543a', alignItems: 'center', justifyContent: 'center' },
  eChipOn: { borderColor: T.accent, borderWidth: 2 },
  eChipIc: { fontSize: 13 },
  formBtn: { alignItems: 'center', paddingHorizontal: 4 },
  formIc: { fontSize: 17 },
  formTx: { color: '#e6d3ae', fontSize: 8, fontWeight: '900' },
  msg: { color: T.accent, fontSize: 10, fontWeight: '800', textAlign: 'center', paddingBottom: 4, backgroundColor: '#2b2013' },
});
