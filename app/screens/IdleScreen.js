import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { Card, Btn, fmt } from '../components';
import { effectivePower, powerMultOf } from '../useGame';
import { idleGenre } from '../../system/genres/idle.mjs';
import { getStage, stageZone } from '../../system/core/progression.mjs';
import { playStage, DIFFICULTIES, difficultyDef, difficultyUnlocked, setDifficulty } from '../../system/core/difficulty.mjs';
import { computePower } from '../../system/core/stats.mjs';
import { identity, elementMeta } from '../../system/concepts/index.mjs';
import { affinityLabel } from '../../system/core/elements.mjs';
import { teamSynergy } from '../../system/core/synergy.mjs';
import { resolve } from '../../system/core/resolution.mjs';
import { getPartyUnits } from '../../system/core/gameState.mjs';
import { accountMods } from '../../system/core/balance.mjs';
import { canClaimAttendance, missionList, claimAllDaily } from '../../system/core/daily.mjs';
import { weeklyEvent, claimWeekly } from '../../system/core/events.mjs';
import { fx } from '../feedback';
import BattleView from './BattleView';

export default function IdleScreen({ state, bump, lastGain, concept }) {
  const [boxMsg, setBoxMsg] = useState(null);
  const power = effectivePower(state);
  const mult = powerMultOf(state);
  const stageDef = playStage(state); // 난이도 배수 반영
  const zone = stageZone(state.stage);
  const curDiff = difficultyDef(state.difficulty);
  const byId = new Map(state.units.map((u) => [u.uid, u]));
  const party = state.party.map((id) => byId.get(id)).filter(Boolean);
  const lead = party.slice().sort((a, b) => computePower(b) - computePower(a))[0];
  const leadMeta = lead ? identity(concept, lead) : null;

  const canPrestige = state.maxStage >= 15;
  const nextGain = Math.floor(Math.sqrt(state.maxStage));
  // 받을 보상 집계(출석+미션+주간) — 홈에서 원탭 전체수령.
  const wev = weeklyEvent(state);
  const claimN = (canClaimAttendance(state) ? 1 : 0)
    + missionList(state).filter((m) => m.done && !m.claimed).length
    + (wev.done && !wev.claimed ? 1 : 0);
  const doClaimAll = () => { claimAllDaily(state); claimWeekly(state); fx('success'); bump(); };
  const synergy = teamSynergy(party);
  const battle = resolve(getPartyUnits(state), stageDef.challenge, accountMods(state), state.formation);

  return (
    <View style={st.wrap}>
      {/* 원탭 전체수령 — 받을 보상(출석·미션·주간)이 있을 때만 노출. */}
      {claimN > 0 && (
        <TouchableOpacity style={st.claimRow} activeOpacity={0.85} onPress={doClaimAll}
          accessibilityRole="button" accessibilityLabel={`받을 보상 ${claimN}건 한번에 받기`}>
          <Text style={st.claimTxt}>🎁 받을 보상 {claimN}건 — 한번에 받기</Text>
          <Text style={st.claimGo}>›</Text>
        </TouchableOpacity>
      )}
      {/* 난이도 선택 */}
      <View style={st.diffRow}>
        {DIFFICULTIES.map((d) => {
          const unlocked = difficultyUnlocked(state, d.id);
          const on = curDiff.id === d.id;
          return (
            <TouchableOpacity key={d.id} activeOpacity={0.8} disabled={!unlocked}
              onPress={() => { if (setDifficulty(state, d.id).ok) bump(); }}
              style={[st.diffCell, on && st.diffCellOn, !unlocked && st.diffCellLock]}>
              <Text style={[st.diffLabel, on && st.diffLabelOn]}>{d.emoji} {d.label}</Text>
              <Text style={st.diffSub}>{unlocked ? `보상 ×${d.rewardMult}` : `${d.unlock}층`}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 자동 전투 무대 */}
      <Card style={st.stage}>
        <Text style={st.stageLabel}>
          {concept.terms.stage} {state.stage}
          {curDiff.id !== 'normal' ? <Text style={st.diffBadge}>  {curDiff.emoji}{curDiff.label} ×{curDiff.rewardMult}</Text> : null}
        </Text>
        <Text style={st.zone}>{elementMeta(concept, zone.element)?.emoji}{elementMeta(concept, zone.element)?.name} 구역 ({zone.start}~{zone.end}층) · 다음 {elementMeta(concept, zone.nextElement)?.emoji}</Text>
        <BattleView
          heroEmoji={leadMeta ? leadMeta.emoji : '⚔️'}
          enemyEmoji={elementMeta(concept, stageDef.challenge.element)?.emoji || '👹'}
          win={battle.win}
          margin={battle.margin}
          reduce={state.settings.reduceMotion}
        />
        <Text style={st.enemy}>적 HP {fmt(stageDef.challenge.hp)} · ATK {fmt(stageDef.challenge.atk)}</Text>
        {(() => {
          const enemyEl = stageDef.challenge.element;
          const em = elementMeta(concept, enemyEl);
          const lm = lead && lead.element ? elementMeta(concept, lead.element) : null;
          const lab = lead ? affinityLabel(lead.element, enemyEl) : '무관';
          const col = lab === '유리' ? T.good : lab === '불리' ? T.danger : T.muted;
          return (
            <Text style={st.affinity}>
              적 속성 {em.emoji}{em.name}
              {lm ? <Text> · 내 {lm.emoji}{lm.name} → <Text style={{ color: col, fontWeight: '800' }}>{lab}</Text></Text> : null}
            </Text>
          );
        })()}
        {synergy.list.length > 0 && (
          <View style={st.synRow}>
            {synergy.list.map((s) => <Text key={s.id} style={st.synTag}>✦ {s.label}</Text>)}
          </View>
        )}
        {/* 구역 진행 게이지 — 현재 구역(start~end)에서 어디쯤인지 한눈에. */}
        <View style={st.zoneBar}>
          <View style={[st.zoneBarFill, { width: `${Math.round(((state.stage - zone.start) / Math.max(1, zone.end - zone.start)) * 100)}%` }]} />
        </View>
      </Card>

      {/* 핵심 지표 스트립 — 전투력·최고층·초당수입 한 줄(세나키우기식 요약). */}
      <Card style={st.strip}>
        <View style={st.stripCell}>
          <Text style={st.mLabel}>전투력</Text>
          <Text style={st.mVal}>{fmt(power)}</Text>
        </View>
        <View style={st.stripDiv} />
        <View style={st.stripCell}>
          <Text style={st.mLabel}>최고 {concept.terms.stage}</Text>
          <Text style={st.mVal}>{state.peakStage}</Text>
        </View>
        <View style={st.stripDiv} />
        <View style={st.stripCell}>
          <Text style={st.mLabel}>초당 수입</Text>
          <Text style={st.gainSm} numberOfLines={1}>{concept.resources.currency.emoji}{fmt(lastGain.currency)}</Text>
          <Text style={st.gainSm} numberOfLines={1}>{concept.resources.growth.emoji}{fmt(lastGain.growth)}</Text>
        </View>
      </Card>

      {/* 환생 — 컴팩트 CTA(요약 + 버튼 한 줄). */}
      <Card style={[st.prestigeRow, { borderColor: canPrestige ? T.accent : T.line }]}>
        <View style={{ flex: 1 }}>
          <Text style={st.prestigeStat}>✨ 환생 {state.prestige}회 · <Text style={{ color: T.accent }}>×{mult.toFixed(2)}</Text></Text>
          <Text style={st.hintSm}>{canPrestige ? `지금 환생 시 +${nextGain}P (영구 배수)` : '최고 15층 도달 시 해금'}</Text>
          {boxMsg ? <Text style={st.boxMsg} numberOfLines={1}>{boxMsg}</Text> : null}
        </View>
        <Btn small
          label={canPrestige ? `환생 +${nextGain}` : '🔒 15층'}
          kind="gold"
          disabled={!canPrestige}
          onPress={() => {
            const r = idleGenre.prestige(state);
            if (r.box) {
              const parts = [];
              if (r.box.gear) parts.push(`⚔️장비 ${r.box.gear}`);
              if (r.box.rune) parts.push(`🔷룬 ${r.box.rune}`);
              if (r.box.gem) parts.push(`💎${r.box.gem}`);
              if (r.box.summon) parts.push(`🔮${r.box.summon}`);
              setBoxMsg(parts.length ? `🎁 전리품 상자: ${parts.join(' · ')}` : null);
            }
            bump();
          }}
        />
      </Card>
    </View>
  );
}

const st = StyleSheet.create({
  flex: { flex: 1 },
  // 스크롤 없이 한 화면에 고정 — 전투무대(stage)가 남는 세로 공간을 흡수.
  wrap: { flex: 1, padding: 12, gap: 8 },
  stage: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.surface2 },
  stageLabel: { color: T.accent, fontWeight: '800', fontSize: 18, marginBottom: 2 },
  diffBadge: { color: T.danger, fontSize: 13, fontWeight: '800' },
  zone: { color: T.muted, fontSize: 12, marginBottom: 4, fontWeight: '600' },
  diffRow: { flexDirection: 'row', gap: 6 },
  diffCell: { flex: 1, backgroundColor: T.surface2, borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  diffCellOn: { borderColor: T.accent, backgroundColor: T.surface },
  diffCellLock: { opacity: 0.45 },
  diffLabel: { color: T.muted, fontSize: 13, fontWeight: '800' },
  diffLabelOn: { color: T.accent },
  diffSub: { color: T.muted, fontSize: 10, marginTop: 2 },
  enemy: { color: T.muted, fontSize: 12, marginTop: 8 },
  affinity: { color: T.text, fontSize: 12, marginTop: 6, fontWeight: '600' },
  synRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, justifyContent: 'center' },
  synTag: { color: T.accent, fontSize: 11, fontWeight: '800', backgroundColor: T.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: 12 },
  metric: { flex: 1, alignItems: 'center' },
  mLabel: { color: T.muted, fontSize: 11, marginBottom: 3 },
  mVal: { color: T.text, fontWeight: '900', fontSize: 20 },
  // 지표 스트립(전투력·최고층·수입 한 줄) + 세로 구분선.
  strip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  stripCell: { flex: 1, alignItems: 'center' },
  stripDiv: { width: 1, height: 30, backgroundColor: T.line },
  gainSm: { color: T.good, fontWeight: '800', fontSize: 12 },
  // 환생 컴팩트 행.
  prestigeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  hintSm: { color: T.muted, fontSize: 11, marginTop: 2 },
  // 구역 진행 게이지.
  zoneBar: { alignSelf: 'stretch', height: 5, backgroundColor: T.bg, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  zoneBarFill: { height: 5, backgroundColor: T.accent, borderRadius: 3 },
  // 원탭 전체수령 배너.
  claimRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface, borderRadius: 12, borderWidth: 1.5, borderColor: T.good, paddingHorizontal: 14, paddingVertical: 10 },
  claimTxt: { color: T.good, fontSize: 13, fontWeight: '900', flex: 1 },
  claimGo: { color: T.good, fontSize: 20, fontWeight: '900' },
  sec: { color: T.text, fontWeight: '800', fontSize: 15, marginBottom: 8 },
  gains: { flexDirection: 'row', gap: 18 },
  gain: { color: T.good, fontWeight: '800', fontSize: 18 },
  hint: { color: T.muted, fontSize: 12, marginTop: 8, lineHeight: 17 },
  prestigeStat: { color: T.text, fontSize: 14, fontWeight: '600' },
  boxMsg: { color: T.accent, fontSize: 13, fontWeight: '800', marginTop: 10, textAlign: 'center' },
});
