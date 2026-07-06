import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { T } from '../theme';
import { Card, Btn, fmt } from '../components';
import { effectivePower, powerMultOf } from '../useGame';
import { idleGenre } from '../../system/genres/idle.mjs';
import { getStage } from '../../system/core/progression.mjs';
import { computePower } from '../../system/core/stats.mjs';
import { identity, elementMeta } from '../../system/concepts/index.mjs';
import { affinity, affinityLabel } from '../../system/core/elements.mjs';
import { teamSynergy } from '../../system/core/synergy.mjs';

export default function IdleScreen({ state, bump, lastGain, concept }) {
  const power = effectivePower(state);
  const mult = powerMultOf(state);
  const stageDef = getStage(state.stage);
  const byId = new Map(state.units.map((u) => [u.uid, u]));
  const party = state.party.map((id) => byId.get(id)).filter(Boolean);
  const lead = party.slice().sort((a, b) => computePower(b) - computePower(a))[0];
  const leadMeta = lead ? identity(concept, lead) : null;

  const canPrestige = state.maxStage >= 15;
  const nextGain = Math.floor(Math.sqrt(state.maxStage));
  const synergy = teamSynergy(party);

  return (
    <ScrollView contentContainerStyle={st.wrap}>
      {/* 자동 전투 무대 */}
      <Card style={st.stage}>
        <Text style={st.stageLabel}>{concept.terms.stage} {state.stage}</Text>
        <Text style={st.leadEmoji}>{leadMeta ? leadMeta.emoji : '⚔️'}</Text>
        <View style={st.vs}>
          <Text style={st.vsText}>{leadMeta ? leadMeta.name : '영웅'}</Text>
          <Text style={st.vsMid}>⚔️ 자동 전투 중</Text>
          <Text style={st.vsText}>👹 적</Text>
        </View>
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
      </Card>

      {/* 핵심 지표 */}
      <View style={st.row}>
        <Card style={st.metric}>
          <Text style={st.mLabel}>전투력</Text>
          <Text style={st.mVal}>{fmt(power)}</Text>
        </Card>
        <Card style={st.metric}>
          <Text style={st.mLabel}>역대 최고 {concept.terms.stage}</Text>
          <Text style={st.mVal}>{state.peakStage}</Text>
        </Card>
      </View>

      {/* 초당 수입 */}
      <Card>
        <Text style={st.sec}>방치 수입 (초당)</Text>
        <View style={st.gains}>
          <Text style={st.gain}>{concept.resources.currency.emoji} +{fmt(lastGain.currency)}</Text>
          <Text style={st.gain}>{concept.resources.growth.emoji} +{fmt(lastGain.growth)}</Text>
        </View>
        <Text style={st.hint}>접속하지 않아도 자동으로 전투하고 보상이 쌓입니다.</Text>
      </Card>

      {/* 환생 */}
      <Card style={{ borderColor: canPrestige ? T.accent : T.line }}>
        <Text style={st.sec}>환생 ✨</Text>
        <Text style={st.prestigeStat}>
          환생 {state.prestige}회 · 파워 배수 <Text style={{ color: T.accent }}>×{mult.toFixed(2)}</Text>
        </Text>
        <Text style={st.hint}>
          이번 회차를 리셋하고 영구 파워/수입 배수를 얻습니다.
          {canPrestige ? ` 지금 환생 시 +${nextGain} 포인트.` : ' (최고 15층 도달 시 해금)'}
        </Text>
        <View style={{ height: 10 }} />
        <Btn
          label={canPrestige ? `환생하기 (+${nextGain})` : '15층 도달 필요'}
          kind="gold"
          disabled={!canPrestige}
          onPress={() => { idleGenre.prestige(state); bump(); }}
        />
      </Card>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  wrap: { padding: 14, gap: 12 },
  stage: { alignItems: 'center', backgroundColor: T.surface2 },
  stageLabel: { color: T.accent, fontWeight: '800', fontSize: 18, marginBottom: 4 },
  leadEmoji: { fontSize: 64, marginVertical: 6 },
  vs: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  vsText: { color: T.text, fontWeight: '700', fontSize: 14 },
  vsMid: { color: T.muted, fontSize: 12 },
  enemy: { color: T.muted, fontSize: 12, marginTop: 8 },
  affinity: { color: T.text, fontSize: 12, marginTop: 6, fontWeight: '600' },
  synRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, justifyContent: 'center' },
  synTag: { color: T.accent, fontSize: 11, fontWeight: '800', backgroundColor: T.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: 12 },
  metric: { flex: 1, alignItems: 'center' },
  mLabel: { color: T.muted, fontSize: 12, marginBottom: 4 },
  mVal: { color: T.text, fontWeight: '900', fontSize: 26 },
  sec: { color: T.text, fontWeight: '800', fontSize: 15, marginBottom: 8 },
  gains: { flexDirection: 'row', gap: 18 },
  gain: { color: T.good, fontWeight: '800', fontSize: 18 },
  hint: { color: T.muted, fontSize: 12, marginTop: 8, lineHeight: 17 },
  prestigeStat: { color: T.text, fontSize: 14, fontWeight: '600' },
});
