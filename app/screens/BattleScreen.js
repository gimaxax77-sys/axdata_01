// 전투 화면 — 호드워 `전투 시작` 이후 화면. 기준: Gim 실기 캡처(2026-07-27).
//   ⚠️ 2026-07-27 구조 변경 — 옛 IdleScreen(요새 탭)이 여기로 내려왔다(Gim 지시).
//      요새 탭에는 요새 맵(FortressScreen)이 들어갔고, 이 화면은 모험 탭 → `전투 시작`으로 들어온다.
//   골격 = VS 바 + 전투력 비교 · 전투 필드 · 하단 편성 패널(PartyStrip) · 최하단 뒤로.
//   난이도 4단과 요새/모험 바로가기는 여기서 빠졌다 — 각각 모험 스테이지 화면과 요새 맵으로 갔다.
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from '../theme';
import { fmt, pctW } from '../components';
import { stageZone } from '../../system/core/progression.mjs';
import { playStage, difficultyDef } from '../../system/core/difficulty.mjs';
import { identity, elementMeta } from '../../system/concepts/index.mjs';
import { resolve } from '../../system/core/resolution.mjs';
import { getPartyUnits } from '../../system/core/gameState.mjs';
import { formationSummary } from '../../system/core/formation.mjs';
import { accountMods } from '../../system/core/balance.mjs';
import { canClaimAttendance, missionList, claimAllDaily } from '../../system/core/daily.mjs';
import { unreadMailCount, claimAllMail } from '../../system/core/mailbox.mjs';
import { fx } from '../feedback';
import BattleView from './BattleView';
import PartyStrip from './PartyStrip';

// 난이도별 색조 오버레이(필드 위에 은은히) — 일반은 없음.
const DIFF_TINT = {
  normal: 'transparent',
  hard: 'rgba(255,150,50,0.12)',
  hell: 'rgba(215,50,50,0.16)',
  abyss: 'rgba(60,120,220,0.18)',
};

// onBack() — 모험 스테이지 화면으로 돌아간다.
export default function BattleScreen({ state, bump, lastGain, concept, background, onBack }) {
  const [speed, setSpeed] = useState(1);    // 호드워 배속 ×2
  const [paused, setPaused] = useState(false); // 호드워 ⏸
  const [showParty, setShowParty] = useState(true); // 하단 편성 패널(캡처 기본 상태 = 펼침)
  const stageDef = playStage(state); // 난이도 배수 반영
  const zone = stageZone(state.stage);
  const curDiff = difficultyDef(state.difficulty);
  const byId = new Map(state.units.map((u) => [u.uid, u]));

  // 받을 보상 집계(출석+미션+우편) — 우측 '방치상자' 버튼에서 원탭 전체수령.
  //   (주간 이벤트는 events 모듈 파킹으로 제외 — docs/PARKED.md)
  const claimN = (canClaimAttendance(state) ? 1 : 0)
    + missionList(state).filter((m) => m.done && !m.claimed).length
    + unreadMailCount(state);
  const doClaimAll = () => { claimAllDaily(state); claimAllMail(state); fx('success'); bump(); };

  const battle = resolve(getPartyUnits(state), stageDef.challenge, accountMods(state), state.formation);
  // 편성(전열2·후열3)을 전투 화면에 그대로 표시 — 방치 틱마다 새 객체를
  // 만들면 BattleView(React.memo)가 매번 재렌더되므로, 편성이 실제로 바뀔 때만
  // (uid 구성·역할) 재계산해 레퍼런스를 안정시킨다.
  //   레벨도 키에 넣는다 — 슬롯이 u.level을 숫자로 복사해 담으므로, 레벨이 빠지면
  //   레벨업해도 전투 화면 뱃지가 옛 숫자로 남는다(실제 있던 버그).
  const formKey = `${state.party.map((id) => `${id}:${byId.get(id)?.level ?? 0}`).join(',')}|${JSON.stringify(state.formation)}`;
  const heroFormation = useMemo(() => {
    const sum = formationSummary(state);
    // 호드워 유닛 표시 = 이모지 + 속성 아이콘 + 레벨 뱃지(BattleView가 머리 위에 얹는다).
    const slotOf = (uid) => {
      const u = byId.get(uid);
      if (!u) return { emoji: '⚔️' };
      const id = identity(concept, u);
      return { emoji: id.emoji, elem: elementMeta(concept, id.element)?.emoji || null, level: u.level };
    };
    return { front: sum.front.map(slotOf), back: sum.back.map(slotOf) };
  }, [formKey]);

  const progPct = pctW(((state.stage - zone.start) / Math.max(1, zone.end - zone.start)) * 100);
  const zoneMeta = elementMeta(concept, zone.element); // 속성 구역명 = 적 스테이지 이름


  return (
    <View style={st.wrap}>
      {/* 호드워 VS 바 — 아군 진영명(적색) ⚔문장 적 스테이지(청색), 양쪽 끝에 별 문장. */}
      <View style={st.vsRow}>
        <Text style={st.crest}>★</Text>
        <View style={[st.vsSide, st.vsSideMine]}>
          <Text style={st.vsName} numberOfLines={1}>{concept.terms.party}</Text>
        </View>
        <Text style={st.vsSword}>⚔</Text>
        <View style={[st.vsSide, st.vsSideFoe]}>
          <Text style={st.vsName} numberOfLines={1}>
            {zoneMeta ? `${zoneMeta.emoji}${zoneMeta.name}` : ''} {state.stage}{concept.terms.stage}
          </Text>
        </View>
        <Text style={st.crest}>★</Text>
      </View>
      {/* 양팀 전투력 비교 — 큰 쪽이 반드시 이긴다(resolve 승리조건과 동치).
          양 끝의 보이지 않는 ★은 **자리맞춤용**이다(Gim 지시 2026-07-27).
          위 VS 바가 [★][진영명]…[스테이지][★] 구조라, 같은 폭의 별을 여기도 두어야
          전투력 숫자가 위 패널의 좌·우 끝과 정확히 맞는다. 별 크기를 바꿔도 같이 따라온다
          (여백을 숫자로 박아두면 폰트가 바뀔 때 조용히 어긋난다). */}
      <View style={st.powRow}>
        <Text style={[st.crest, st.crestGhost]}>★</Text>
        <Text style={[st.pow, st.powMine]} numberOfLines={1}>⚔ {fmt(battle.score || 0)}</Text>
        <View style={st.stageProg}>
          <View style={[st.stageProgFill, { width: `${progPct}%` }]} />
          <View style={st.stageProgTxWrap} pointerEvents="none">
            {/* 난이도는 아래 전용 줄에서 보여주므로 여기선 뺀다(중복 방지). */}
            <Text style={st.stageProgTx}>{Math.round(progPct)}% · 최고 {state.peakStage}</Text>
          </View>
        </View>
        <Text style={[st.pow, st.powFoe]} numberOfLines={1}>{fmt(battle.enemyScore || 0)} ⚔</Text>
        <Text style={[st.crest, st.crestGhost]}>★</Text>
      </View>


      {/* 전투 필드 — 남는 세로를 전부 흡수(flex:1). */}
      <View style={st.field}>
        <LinearGradient colors={['#3a5480', '#24375a', '#162034', '#111828']} locations={[0, 0.35, 0.7, 1]} style={st.fieldBg} pointerEvents="none" />
        <View style={[st.fieldTint, { backgroundColor: DIFF_TINT[curDiff.id] || 'transparent' }]} pointerEvents="none" />

        <BattleView
          party={heroFormation}
          win={battle.win}
          margin={battle.margin}
          reduce={state.settings.reduceMotion || background}
          speed={speed}
          paused={paused}
        />

        {/* 호드워 전투 컨트롤 — 배속 ×2 · ⏸ 일시정지. 우상단. */}
        <View style={st.ctrl}>
          <TouchableOpacity style={[st.ctrlBtn, speed === 2 && st.ctrlBtnOn]} activeOpacity={0.85}
            onPress={() => { fx('tap'); setSpeed((v) => (v === 2 ? 1 : 2)); }}
            accessibilityRole="button" accessibilityLabel={`전투 배속 ${speed === 2 ? '해제' : '2배'}`}>
            <Text style={[st.ctrlTx, speed === 2 && st.ctrlTxOn]}>×{speed}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.ctrlBtn, paused && st.ctrlBtnOn]} activeOpacity={0.85}
            onPress={() => { fx('tap'); setPaused((v) => !v); }}
            accessibilityRole="button" accessibilityLabel={paused ? '전투 재개' : '전투 일시정지'}>
            <Text style={[st.ctrlTx, paused && st.ctrlTxOn]}>{paused ? '▶' : '⏸'}</Text>
          </TouchableOpacity>
        </View>

        {/* 좌하단 방치 수령 — 캡처의 `클리어 영상` 자리. 실제로 되는 것을 둔다. */}
        <TouchableOpacity style={st.claim} activeOpacity={0.85} onPress={doClaimAll}
          accessibilityRole="button" accessibilityLabel="방치 보상 수령">
          <Text style={st.claimIc}>🎁</Text>
          <Text style={st.claimTx}>+{fmt(lastGain?.currency || 0)}/s</Text>
          {claimN > 0 && <View style={st.claimDot} />}
        </TouchableOpacity>
      </View>

      {/* 하단 편성 패널 — 호드워 캡처와 동일. `전투`를 누르면 접고 전투만 본다. */}
      {showParty && (
        <PartyStrip state={state} bump={bump} concept={concept} onBattle={() => setShowParty(false)} />
      )}

      {/* 최하단 — 좌 뒤로 · (접었을 때) 편성 다시 열기 */}
      <View style={st.foot}>
        <TouchableOpacity style={st.back} activeOpacity={0.85} onPress={onBack}
          accessibilityRole="button" accessibilityLabel="모험으로 돌아가기">
          <Text style={st.backTx}>◀</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {!showParty && (
          <TouchableOpacity style={st.openParty} activeOpacity={0.85}
            onPress={() => { fx('tap'); setShowParty(true); }}
            accessibilityRole="button" accessibilityLabel="편성 열기">
            <Text style={st.openPartyTx}>👥 편성</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  // 스크롤 없이 한 화면 고정. 필드가 남는 세로를 전부 흡수한다.
  wrap: { flex: 1 },

  // ── 호드워 VS 바 ── 아군 진영명(적색) ⚔ 적 스테이지(청색) + 양쪽 별 문장.
  vsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingTop: 4 },
  crest: { color: T.accent, fontSize: 12, fontWeight: '900' },
  vsSide: { flex: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  vsSideMine: { backgroundColor: 'rgba(190,55,60,0.85)' },
  vsSideFoe: { backgroundColor: 'rgba(45,95,180,0.85)' },
  vsName: { color: '#fff', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  vsSword: { color: T.accent, fontSize: 13, fontWeight: '900' },

  // 양팀 전투력 비교 — 아군 금색 · 적 적색. 가운데는 스테이지 진행바.
  // vsRow와 gap·padding을 똑같이 맞춘다 — 그래야 양 끝이 위 패널과 정렬된다.
  powRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3 },
  crestGhost: { opacity: 0 }, // 자리만 차지하는 별(위 VS 바의 ★과 같은 폭)
  pow: { flex: 1, fontSize: 11, fontWeight: '900' },
  powMine: { color: T.accent, textAlign: 'left' },  // 아군 — 원정대 패널 왼쪽 끝에 맞춤
  powFoe: { color: T.danger, textAlign: 'right' },  // 적군 — 스테이지 패널 오른쪽 끝에 맞춤

  // 난이도 선택 줄 — 4단계 균등. 잠긴 것은 흐리게 + 필요 층수 표시.
  diffRow: { flexDirection: 'row', gap: 3, paddingHorizontal: 8, paddingBottom: 3 },
  diff: { flex: 1, borderRadius: 8, paddingVertical: 4, alignItems: 'center', backgroundColor: T.surface, borderWidth: 1, borderColor: T.line },
  diffOn: { backgroundColor: T.accent, borderColor: T.accent },
  diffLocked: { opacity: 0.45 },
  diffTx: { color: T.muted, fontSize: 8, fontWeight: '800' },
  diffTxOn: { color: '#241a00', fontWeight: '900' },

  // 전투 컨트롤(배속·일시정지) — 필드 우상단.
  ctrl: { position: 'absolute', right: 6, top: 6, flexDirection: 'row', gap: 5, zIndex: 6 },
  ctrlBtn: { minWidth: 30, height: 26, borderRadius: 13, paddingHorizontal: 8, backgroundColor: 'rgba(10,14,24,0.72)', borderWidth: 1, borderColor: 'rgba(150,180,230,0.3)', alignItems: 'center', justifyContent: 'center' },
  ctrlBtnOn: { borderColor: T.accent, backgroundColor: 'rgba(255,201,60,0.18)' },
  ctrlTx: { color: '#cdd6e8', fontSize: 11, fontWeight: '900' },
  ctrlTxOn: { color: T.accent },

  // 게이지는 고정 폭으로 가운데만 차지한다(Gim 지시 2026-07-27 "길이 축소").
  // flex를 주면 남는 폭을 전부 먹어 화면 끝까지 늘어난다 — 남는 폭은 양옆 전투력이 나눠 갖는다.
  stageProg: { width: 132, height: 12, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6, overflow: 'hidden', marginTop: 2 },
  stageProgFill: { height: 12, backgroundColor: T.accent, borderRadius: 6 },
  stageProgTxWrap: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  stageProgTx: { color: '#fff', fontSize: 8, fontWeight: '800', textShadowColor: '#000', textShadowRadius: 2 },

  // ── 전투 필드 ── flex:1로 남는 세로 전부
  field: { flex: 1, position: 'relative', overflow: 'hidden' },
  fieldBg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  fieldTint: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },



  // 우측 하단 재화/기능(알약형 3개).
  // 좌하단 방치 수령
  claim: { position: 'absolute', left: 6, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(10,14,24,0.72)', borderWidth: 1, borderColor: 'rgba(150,180,230,0.3)', borderRadius: 16, paddingLeft: 6, paddingRight: 9, paddingVertical: 3, zIndex: 6 },
  claimIc: { fontSize: 13 },
  claimTx: { fontSize: 9, color: '#e8ecf5', fontWeight: '800' },
  claimDot: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: T.danger },

  // 최하단 바 — 뒤로 · 편성 다시 열기
  foot: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#3b2d1d', borderTopWidth: 1, borderTopColor: '#6b543a' },
  back: { width: 42, height: 30, borderRadius: 8, backgroundColor: '#7a2f22', borderWidth: 2, borderColor: '#b8543c', alignItems: 'center', justifyContent: 'center' },
  backTx: { color: '#ffd9c8', fontSize: 14, fontWeight: '900' },
  openParty: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: T.accent, borderWidth: 2, borderColor: '#c8951f' },
  openPartyTx: { color: '#3d2a00', fontSize: 12, fontWeight: '900' },

  rightCol: { position: 'absolute', right: 6, bottom: 10, gap: 6, zIndex: 6, alignItems: 'flex-end' },
  rbtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(10,14,24,0.72)', borderWidth: 1, borderColor: 'rgba(150,180,230,0.3)', borderRadius: 16, paddingLeft: 5, paddingRight: 8, paddingVertical: 3 },
  rbtnIc: { fontSize: 13 },
  rbtnTx: { fontSize: 8, color: '#e8ecf5', fontWeight: '700' },
  rbtnDot: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: T.danger },


});
