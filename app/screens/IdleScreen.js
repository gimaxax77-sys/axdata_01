// 요새(메인) 화면 — 호드워 전투 화면 골격. 기준 docs/HORDWAR_SPEC.md.
//   세로 배분 = VS 바 + 전투력 비교 줄 · 전투 필드(flex:1).
//   필드 위 오버레이 = 우상단 전투 컨트롤(배속×2·⏸) · 우하단 재화/방치상자/모험.
//   ※ 세븐 잔재(좌측 AUTO·🎥·💬 / 하단 스킬바 6칸 / 격자·기둥 장식)는 걷어냈다.
//     호드워는 엘드리아처럼 상시 자동전투이므로 요새 탭은 전투 화면을 유지한다(Gim 결정).
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from '../theme';
import { fmt, pctW } from '../components';
import { stageZone } from '../../system/core/progression.mjs';
import { playStage, difficultyDef, DIFFICULTIES, difficultyUnlocked, setDifficulty } from '../../system/core/difficulty.mjs';
import { identity, elementMeta } from '../../system/concepts/index.mjs';
import { resolve } from '../../system/core/resolution.mjs';
import { getPartyUnits } from '../../system/core/gameState.mjs';
import { formationSummary } from '../../system/core/formation.mjs';
import { accountMods } from '../../system/core/balance.mjs';
import { canClaimAttendance, missionList, claimAllDaily } from '../../system/core/daily.mjs';
import { unreadMailCount, claimAllMail } from '../../system/core/mailbox.mjs';
import { fx } from '../feedback';
import BattleView from './BattleView';

// 난이도별 색조 오버레이(필드 위에 은은히) — 일반은 없음.
const DIFF_TINT = {
  normal: 'transparent',
  hard: 'rgba(255,150,50,0.12)',
  hell: 'rgba(215,50,50,0.16)',
  abyss: 'rgba(60,120,220,0.18)',
};

// onGo(tabKey) — 필드 위 바로가기에서 다른 탭으로 보낸다(App이 라우팅).
export default function IdleScreen({ state, bump, lastGain, concept, background, onGo }) {
  const [speed, setSpeed] = useState(1);    // 호드워 배속 ×2
  const [paused, setPaused] = useState(false); // 호드워 ⏸
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
  // 편성(전열2·중열3·후열2)을 전투 화면에 그대로 표시 — 방치 틱마다 새 객체를
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
    return { front: sum.front.map(slotOf), mid: sum.mid.map(slotOf), back: sum.back.map(slotOf) };
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
      {/* 양팀 전투력 비교 — 큰 쪽이 반드시 이긴다(resolve 승리조건과 동치). */}
      <View style={st.powRow}>
        <Text style={[st.pow, st.powMine]} numberOfLines={1}>⚔ {fmt(battle.score || 0)}</Text>
        <View style={st.stageProg}>
          <View style={[st.stageProgFill, { width: `${progPct}%` }]} />
          <View style={st.stageProgTxWrap} pointerEvents="none">
            {/* 난이도는 아래 전용 줄에서 보여주므로 여기선 뺀다(중복 방지). */}
            <Text style={st.stageProgTx}>{Math.round(progPct)}% · 최고 {state.peakStage}</Text>
          </View>
        </View>
        <Text style={[st.pow, st.powFoe]} numberOfLines={1}>{fmt(battle.enemyScore || 0)} ⚔</Text>
      </View>

      {/* 난이도 선택 — 파킹된 ContentScreen과 함께 경로가 사라졌던 것을 되살림.
          해금은 역대 최고층 기준. 잠긴 것은 필요 층수를 보여준다. */}
      <View style={st.diffRow}>
        {DIFFICULTIES.map((d) => {
          const on = curDiff.id === d.id;
          const open = difficultyUnlocked(state, d.id);
          return (
            <TouchableOpacity key={d.id} style={[st.diff, on && st.diffOn, !open && st.diffLocked]} activeOpacity={0.85}
              onPress={() => {
                const r = setDifficulty(state, d.id);
                fx(r.ok ? 'success' : 'error');
                bump();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: on, disabled: !open }}
              accessibilityLabel={open ? `${d.label} 난이도 · 보상 ${d.rewardMult}배` : `${d.label} 난이도 잠김 · ${d.unlock}층 필요`}>
              <Text style={[st.diffTx, on && st.diffTxOn]} numberOfLines={1}>
                {d.emoji}{d.label}{open ? ` ×${d.rewardMult}` : ` ${d.unlock}층`}
              </Text>
            </TouchableOpacity>
          );
        })}
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

        {/* 우측 하단 — 다이아 · 방치상자 · 모험 바로가기 */}
        <View style={st.rightCol}>
          <View style={st.rbtn}><Text style={st.rbtnIc}>{concept.resources.gem.emoji}</Text><Text style={st.rbtnTx}>{fmt(state.wallet.gem || 0)}</Text></View>
          <TouchableOpacity style={st.rbtn} activeOpacity={0.85} onPress={doClaimAll}
            accessibilityRole="button" accessibilityLabel="방치상자 수령">
            <Text style={st.rbtnIc}>🎁</Text>
            <Text style={st.rbtnTx}>방치 +{fmt(lastGain?.currency || 0)}/s</Text>
            {claimN > 0 && <View style={st.rbtnDot} />}
          </TouchableOpacity>
          <TouchableOpacity style={st.rbtn} activeOpacity={0.85} onPress={() => { fx('tap'); onGo?.('adventure'); }}
            accessibilityRole="button" accessibilityLabel="모험(스토리)">
            <Text style={st.rbtnIc}>🧭</Text><Text style={st.rbtnTx}>모험</Text>
          </TouchableOpacity>
        </View>
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
  powRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3 },
  pow: { fontSize: 11, fontWeight: '900', minWidth: 62 },
  powMine: { color: T.accent, textAlign: 'right' },
  powFoe: { color: T.danger, textAlign: 'left' },

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

  stageProg: { height: 12, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6, overflow: 'hidden', marginTop: 2 },
  stageProgFill: { height: 12, backgroundColor: T.accent, borderRadius: 6 },
  stageProgTxWrap: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  stageProgTx: { color: '#fff', fontSize: 8, fontWeight: '800', textShadowColor: '#000', textShadowRadius: 2 },

  // ── 전투 필드 ── flex:1로 남는 세로 전부
  field: { flex: 1, position: 'relative', overflow: 'hidden' },
  fieldBg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  fieldTint: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },



  // 우측 하단 재화/기능(알약형 3개).
  rightCol: { position: 'absolute', right: 6, bottom: 10, gap: 6, zIndex: 6, alignItems: 'flex-end' },
  rbtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(10,14,24,0.72)', borderWidth: 1, borderColor: 'rgba(150,180,230,0.3)', borderRadius: 16, paddingLeft: 5, paddingRight: 8, paddingVertical: 3 },
  rbtnIc: { fontSize: 13 },
  rbtnTx: { fontSize: 8, color: '#e8ecf5', fontWeight: '700' },
  rbtnDot: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: T.danger },


});
