// 영웅 상세 — 호드워 "영웅 클릭 후" 전체화면. 기준: Gim 실기 캡처 2장(2026-07-26).
//   골격 = 상단 이름 리본 · 좌측 계약 패널 · 중앙 전신 · 우측 공략 · 우하단 LV/전투력
//          · 하단 한 줄(등급/역할/속성 + LV/전투력) · 하단 서브탭 패널 4종.
//   서브탭 패널은 각각 별도 모듈이다 — HeroGearPanel · HeroAscendPanel · HeroCostumePanel.
//   엘드리아 대응 / 의도적 차이
//     · `계약`(동시 출전 보너스) · `공략` — 호드워 고유 시스템이라 잠금 표시만.
//     · `돌파(ascend)`는 속성 탭에서 빠지고 **초월 탭**으로 옮겨갔다(Gim 지시 2026-07-27).
//     · `5레벨 상승` — 엘드리아는 1레벨씩 오르므로 **최대 5회 반복**으로 구현(비용 부족 시 되는 만큼).
//     · 그 버튼을 **연속 3회 이상** 누르면 바로 위에 `최대 레벨 상승`이 생긴다 — 올릴 수 있는
//       데까지 한 번에(Gim 지시 2026-07-27). 반복 상한은 "남은 레벨"이라 무한 루프가 불가능하다.
import React, { useState, useEffect } from 'react';
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
import { levelUp } from '../../system/core/character.mjs';
import { SKILL_CATALOG, skillSlots } from '../../system/core/skills.mjs';
import { recordMission } from '../../system/core/daily.mjs';
import ComingSoon from './ComingSoon';
import HeroGearPanel from './HeroGearPanel';
import HeroAscendPanel from './HeroAscendPanel';
import HeroCostumePanel from './HeroCostumePanel';

// 아직 붙지 않은 자리 — 막지 않고 준비 중 패널로 **들어가게** 한다(Gim 지시 2026-07-26).
const PAGES = {
  pact: { icon: '🤝', title: '계약', plan: ['영웅 2인 계약', '동시 출전 시 능력치 보너스'] },
  guide: { icon: '📖', title: '공략', plan: ['추천 진형·스킬 세팅', '상성 안내'] },
};

// 하단 서브탭 — 호드워 캐릭터 상세의 `속성 · 장비 · 승성 · 코스튬` 자리.
// 각 패널은 별도 모듈이다(규칙 14: 한 기능 = 한 모듈).
const SUBTABS = [
  { k: 'stat', l: '속성', i: '📊' },
  { k: 'gear', l: '장비', i: '⚔️', dot: true },
  { k: 'trans', l: '초월', i: '🌟' },
  { k: 'costume', l: '코스튬', i: '👗' },
];

const GRADE = { UR: 'S+', SSR: 'S', SR: 'A', R: 'B', N: 'C' };
const GRADE_BG = { UR: '#c0392b', SSR: '#c9962a', SR: '#2f8f7f', R: '#3a6ea8', N: '#6b6b6b' };
const LEVEL_STEP = 5; // 호드워 `5레벨 상승` — 한 번에 시도할 레벨업 횟수
const BURST_TAPS = 3; // 이만큼 연속으로 누르면 `최대 레벨 상승` 버튼이 나온다

export default function HeroDetail({ state, bump, concept, unit, onClose, onStep, stepInfo }) {
  const [tab, setTab] = useState('stat'); // 'stat' | 'gear'
  const [page, setPage] = useState(null); // 'pact' | 'guide'
  const [msg, setMsg] = useState(null);
  // `5레벨 상승`을 연속 3회 이상 누르면 위에 `최대 레벨 상승` 버튼이 생긴다(Gim 지시 2026-07-27).
  // uid를 같이 들고 있어야 다른 영웅으로 넘어갔을 때 카운트가 새로 시작된다.
  const [burst, setBurst] = useState({ uid: null, taps: 0 });
  // 영웅을 넘기면 이전 영웅의 안내 문구가 남아 헷갈린다 — 비운다.
  const uid = unit && unit.uid;
  useEffect(() => { setMsg(null); }, [uid]);
  if (!unit) return null;
  if (page) {
    return <ComingSoon {...PAGES[page]} onBack={() => setPage(null)}
      note="이 기능이 아직 붙어 있지 않습니다. 자리와 동선만 잡아 둔 상태예요." />;
  }

  const id = identity(concept, unit);
  const arch = getArchetype(unit.archetype);
  const em = id.element && elementMeta(concept, id.element);
  const st8 = computeStats(unit);
  const lvCost = levelUpCost(unit);
  const atCap = unit.level >= levelCap(unit);
  const slots = skillSlots(unit);

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
        {/* 좌상단 뒤로가기는 제거 — 하단 바에 같은 버튼이 있어 2곳이었다(Gim 지시 2026-07-27) */}

        {/* 이름 리본 — 위쪽 속성 원형은 제거(속성은 아래 idBar에 이미 있다, Gim 지시) */}
        <View style={d.nameWrap}>
          <View style={d.ribbon}><Text style={d.ribbonTx} numberOfLines={1}>{id.name}</Text></View>
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

        {/* 중앙 전신 — 발밑 돌 받침대(pedestal)는 Gim 지시로 제거(2026-07-27) */}
        <View style={d.art}>
          <Portrait emoji={id.emoji} image={charImage(concept.id, unit.characterId)} rarity={unit.rarity} size={168} glow />
        </View>

        {/* 좌우 영웅 전환 화살표 — 목록으로 나가지 않고 넘긴다(Gim 지시 2026-07-27).
            영웅이 1명뿐이면 넘길 곳이 없어 아예 그리지 않는다. */}
        {onStep && (<>
          <TouchableOpacity style={[d.nav, d.navL]} activeOpacity={0.7}
            onPress={() => { fx('tap'); onStep(-1); }}
            accessibilityRole="button" accessibilityLabel="이전 영웅">
            <Text style={d.navTx}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[d.nav, d.navR]} activeOpacity={0.7}
            onPress={() => { fx('tap'); onStep(1); }}
            accessibilityRole="button" accessibilityLabel="다음 영웅">
            <Text style={d.navTx}>›</Text>
          </TouchableOpacity>
          {stepInfo ? <Text style={d.navInfo}>{stepInfo}</Text> : null}
        </>)}

        {/* 하단 한 줄 — 좌: 등급·역할·속성 / 우: LV·전투력.
            LV/전투력을 띄워 두지 않고 이 줄에 맞춰 내렸다(Gim 지시 2026-07-27). */}
        <View style={d.idBar}>
          {isOn('rarity') && (
            <View style={[d.medal, { backgroundColor: GRADE_BG[unit.rarity] || '#6b6b6b' }]}>
              <Text style={d.medalTx}>{GRADE[unit.rarity] || 'C'}</Text>
            </View>
          )}
          <View style={d.tagRing}><Text style={d.tagIc}>{arch.emoji || '🛡️'}</Text></View>
          <Text style={d.tagLb}>{arch.roleLabel}</Text>
          {em ? (<><View style={d.tagRing}><Text style={d.tagIc}>{em.emoji}</Text></View><Text style={d.tagLb}>{em.name}</Text></>) : null}

          <View style={d.meters}>
            <View style={d.meter}><Text style={d.meterKey}>LV</Text><Text style={d.meterVal}>{unit.level}</Text></View>
            <View style={d.meter}><Text style={d.meterKey}>⚔</Text><Text style={d.meterVal}>{fmt(computePower(unit))}</Text></View>
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

            {/* 레벨업 비용 — 돌파(소환석) 줄은 돌파 버튼과 함께 제거했다(Gim 지시 2026-07-27) */}
            <View style={d.costs}>
              <Text style={d.cost}>
                {concept.resources.growth.emoji} {fmt(state.wallet.growth || 0)}/{fmt(lvCost.growth || 0)}
              </Text>
            </View>

            {/* `최대 레벨 상승` — 연속 3회 이상 눌러야 보인다.
                자리는 **항상 잡아 둔다**(안 보일 땐 투명). 나타날 때 아래 버튼이
                밀려 내려가면 거슬리기 때문(Gim 지시 2026-07-27). */}
            <View style={[d.actions, !showBurst && d.ghost]} pointerEvents={showBurst ? 'auto' : 'none'}>
              <TouchableOpacity style={[d.mainBtn, d.maxBtn]} activeOpacity={0.85} onPress={doLevelUpMax}
                accessibilityElementsHidden={!showBurst} importantForAccessibility={showBurst ? 'auto' : 'no-hide-descendants'}
                accessibilityRole="button" accessibilityLabel={`최대 레벨 상승 — 상한 ${levelCap(unit)}까지 한 번에`}>
                <Text style={[d.mainTx, d.maxTx]}>⏫ 최대 레벨 상승</Text>
              </TouchableOpacity>
            </View>

            <View style={d.actions}>
              <TouchableOpacity style={d.mainBtn} activeOpacity={0.85} onPress={doLevelUp}
                accessibilityRole="button" accessibilityLabel={`최대 ${LEVEL_STEP}레벨 상승`}>
                <Text style={d.mainTx}>{LEVEL_STEP}레벨 상승</Text>
              </TouchableOpacity>
            </View>
            {msg ? <Text style={d.msg}>{msg}</Text> : null}
          </ScrollView>
        ) : tab === 'gear' ? (
          <HeroGearPanel concept={concept} unit={unit} onMsg={setMsg} />
        ) : tab === 'trans' ? (
          <HeroAscendPanel state={state} bump={bump} concept={concept} unit={unit} onMsg={setMsg} />
        ) : (
          <HeroCostumePanel state={state} concept={concept} unit={unit} onMsg={setMsg} />
        )}
        {/* 속성 탭 밖에서는 메시지를 패널 아래에 한 줄로 보여준다 */}
        {tab !== 'stat' && msg ? <Text style={d.msg}>{msg}</Text> : null}
      </View>

      {/* 하단 바 — 좌 뒤로 · 우 서브탭(속성 · 장비) */}
      <View style={d.tabbar}>
        <TouchableOpacity style={d.tabBack} activeOpacity={0.85} onPress={onClose}
          accessibilityRole="button" accessibilityLabel="영웅 목록으로">
          <Text style={d.tabBackTx}>◀</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {SUBTABS.map((x) => (
          <TouchableOpacity key={x.k} style={[d.tab, tab === x.k && d.tabOn]} activeOpacity={0.85}
            onPress={() => { fx('tap'); setTab(x.k); setMsg(null); }}
            accessibilityRole="tab" accessibilityState={{ selected: tab === x.k }} accessibilityLabel={x.l}>
            <Text style={d.tabIc}>{x.i}</Text>
            <Text style={[d.tabTx, tab === x.k && d.tabTxOn]}>{x.l}</Text>
            {x.dot && <Text style={d.tabDot}>❗</Text>}
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

  nameWrap: { alignItems: 'center', marginTop: 8 },
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

  // 좌우 영웅 전환 화살표 — 캡처처럼 전신 양옆 중간 높이에 띄운다.
  nav: { position: 'absolute', top: '46%', width: 38, height: 46, alignItems: 'center', justifyContent: 'center', zIndex: 6 },
  navL: { left: 4 },
  navR: { right: 4 },
  navTx: { color: T.accent, fontSize: 40, fontWeight: '900', lineHeight: 44, textShadowColor: 'rgba(0,0,0,0.75)', textShadowRadius: 4 },
  navInfo: { position: 'absolute', top: '58%', alignSelf: 'center', color: '#e6d3ae', fontSize: 9, fontWeight: '900', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 1, overflow: 'hidden', zIndex: 6 },

  // LV/전투력 — 띄우지 않고 idBar 줄 오른쪽 끝에 붙인다(marginLeft:'auto').
  meters: { marginLeft: 'auto', gap: 3, alignItems: 'flex-end' },
  meter: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(40,25,15,0.85)', borderWidth: 1, borderColor: '#c8ab74', borderRadius: 6, overflow: 'hidden' },
  meterKey: { color: '#f0d9a0', fontSize: 10, fontWeight: '900', paddingHorizontal: 7, paddingVertical: 2, backgroundColor: 'rgba(90,60,30,0.9)' },
  meterVal: { color: '#ffd873', fontSize: 13, fontWeight: '900', paddingHorizontal: 10 },

  idBar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 6, paddingRight: 6, paddingBottom: 8 },
  medal: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#f0d9a0', alignItems: 'center', justifyContent: 'center' },
  medalTx: { color: '#fff', fontSize: 12, fontWeight: '900' },
  // 역할·속성 원형 — Gim 지시로 50% 확대(20→30, 글자 10→15).
  tagRing: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(30,20,30,0.8)', borderWidth: 1, borderColor: '#d090b0', alignItems: 'center', justifyContent: 'center' },
  tagIc: { fontSize: 15 },
  tagLb: { color: '#f0e0c8', fontSize: 9, fontWeight: '800' },

  // ── 하단 패널 ──
  panel: { height: '32%', backgroundColor: '#e8d5ae', borderTopWidth: 2, borderTopColor: '#8a6d47' },
  panelIn: { padding: 10 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#d3bd93', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 },
  stat: { color: '#3b2a12', fontSize: 11, fontWeight: '900' },

  skills: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  skill: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#b9a888', borderWidth: 2, borderColor: '#8a6d47', alignItems: 'center', justifyContent: 'center' },
  skillOn: { backgroundColor: '#8a3a2a', borderWidth: 2, borderColor: '#e0a050' },
  skillLocked: { opacity: 0.45 },
  skillIc: { fontSize: 18 },
  skillLv: { position: 'absolute', bottom: -2, minWidth: 16, borderRadius: 8, backgroundColor: '#3b2a12', alignItems: 'center' },
  skillLvTx: { color: '#f0d9a0', fontSize: 9, fontWeight: '900' },
  ult: { position: 'absolute', top: -8, color: '#3d2a00', backgroundColor: T.accent, fontSize: 7, fontWeight: '900', borderRadius: 4, paddingHorizontal: 3, overflow: 'hidden' },

  costs: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 8 },
  cost: { color: '#2f6b30', fontSize: 11, fontWeight: '900' },

  // 버튼 2개가 세로로 쌓여도 패널(32%) 안에 들어가도록 높이를 줄였다 — 스크롤바 방지
  // (Gim 지적 2026-07-27: paddingVertical 11 · marginTop 10 이던 것을 8 · 6 으로).
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 6 },
  mainBtn: { flex: 1, maxWidth: 220, paddingVertical: 8, borderRadius: 8, backgroundColor: T.accent, borderWidth: 2, borderColor: '#c8951f', alignItems: 'center' },
  mainTx: { color: '#3d2a00', fontSize: 15, fontWeight: '900' },
  // `최대 레벨 상승` — 크기는 아래 버튼과 동일, 색만 달리해 다른 동작임을 알린다.
  maxBtn: { backgroundColor: '#e07a2a', borderColor: '#a8531a' },
  maxTx: { color: '#fff4e2' },
  // 자리는 차지하되 안 보이게 — 버튼이 나타날 때 아래가 밀리지 않게 한다.
  ghost: { opacity: 0 },
  msg: { color: '#7a3a1a', fontSize: 10, fontWeight: '800', textAlign: 'center', marginTop: 6 },


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
