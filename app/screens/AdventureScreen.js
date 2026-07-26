// 모험 탭 — 호드워 스테이지 화면. 기준: Gim 실기 캡처(2026-07-27).
//   골격 = 스테이지명 알약 · 마일스톤 진행바(보상 아이콘) · 파티 대기(모닥불 주위)
//          · 좌하단 `자동 전투 상태` 타이머 · 중앙 붉은 `전투 시작`.
//   ⚠️ 2026-07-27 구조 변경(Gim 지시) — 캠페인 챕터 목록이 이 화면으로 흡수됐다.
//      캡처의 `7-4 · 7-8 · 7-12` 마일스톤 자리에 **캠페인 12챕터**를 얹었다.
//      챕터 아이콘을 누르면 그 챕터 보스에 도전한다(옛 `도전` 버튼을 대신한다).
//      난이도 4단도 여기로 왔다 — 없애면 난이도를 고를 경로가 사라진다.
//   `전투 시작` → BattleScreen(전투 화면). 엘드리아는 상시 자동 전투이므로
//      "시작"이 아니라 **전투를 보러 들어가는** 버튼이다(docs/HORDWAR_SPEC.md 7번 정정).
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from '../theme';
import { fmt, pctW, Portrait } from '../components';
import { charImage } from '../charImages';
import { fx } from '../feedback';
import { identity, elementMeta } from '../../system/concepts/index.mjs';
import { stageZone } from '../../system/core/progression.mjs';
import { difficultyDef, DIFFICULTIES, difficultyUnlocked, setDifficulty } from '../../system/core/difficulty.mjs';
import { formationSummary } from '../../system/core/formation.mjs';
import { campaignChapters, fightChapter, CAMPAIGN_CHAPTER_COUNT } from '../../system/core/campaign.mjs';
import BattleScreen from './BattleScreen';

const hhmmss = (sec) => {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return [h, m, s].map((x) => String(x).padStart(2, '0')).join(':');
};

export default function AdventureScreen({ state, bump, lastGain, concept, background, onGo }) {
  const [inBattle, setInBattle] = useState(false);
  const [msg, setMsg] = useState(null);
  // `자동 전투 상태` 타이머 — 이 화면에 머문 시간. 화면을 벗어나면 멈춘다(초당 갱신은 여기뿐).
  const [sec, setSec] = useState(0);
  const t0 = useRef(Date.now());
  useEffect(() => {
    if (inBattle) return;
    const id = setInterval(() => setSec(Math.floor((Date.now() - t0.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [inBattle]);

  if (inBattle) {
    return <BattleScreen state={state} bump={bump} lastGain={lastGain} concept={concept}
      background={background} onBack={() => setInBattle(false)} />;
  }

  const zone = stageZone(state.stage);
  const zoneMeta = elementMeta(concept, zone.element);
  const curDiff = difficultyDef(state.difficulty);
  const chapters = campaignChapters(state, concept.campaign || []);
  const cleared = (state.campaign && state.campaign.cleared) || 0;
  const progPct = pctW((cleared / CAMPAIGN_CHAPTER_COUNT) * 100);
  const sum = formationSummary(state);
  const byId = new Map(state.units.map((u) => [u.uid, u]));

  const doFight = (i) => {
    const r = fightChapter(state, i);
    if (!r.ok) setMsg(`⚠ ${r.reason}`);
    else if (r.win) setMsg(`🏆 VICTORY — 챕터 ${i + 1} 클리어!${r.reward ? ` 💎+${r.reward.gem} 🔮+${r.reward.summon}` : ''}`);
    else setMsg('💀 DEFEAT — 영웅을 더 키운 뒤 다시 도전하세요');
    fx(r.ok && r.win ? 'success' : 'error');
    bump();
  };

  // 파티를 모닥불 주위에 세운다 — 전열은 앞줄, 후열은 뒷줄.
  const slot = (uid, key) => {
    const u = byId.get(uid);
    if (!u) return null;
    const id = identity(concept, u);
    return (
      <View key={key} style={v.unit}>
        <Portrait emoji={id.emoji} image={charImage(concept.id, u.characterId)} rarity={u.rarity} size={46} />
        <Text style={v.unitLv}>{u.level}</Text>
      </View>
    );
  };

  return (
    <View style={v.wrap}>
      <LinearGradient colors={['#2e3a24', '#3c4a2c', '#4a5533', '#33401f']} style={v.bg} pointerEvents="none" />

      {/* 스테이지명 알약 */}
      <View style={v.stagePill}>
        <Text style={v.stagePillTx} numberOfLines={1}>
          {zoneMeta ? `${zoneMeta.emoji}${zoneMeta.name}` : ''} {state.stage}{concept.terms.stage}
        </Text>
      </View>

      {/* 마일스톤 진행바 — 캠페인 챕터. 누르면 그 챕터 보스에 도전한다. */}
      <View style={v.track}>
        <View style={v.trackBar}><View style={[v.trackFill, { width: `${progPct}%` }]} /></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={v.milestones}>
          {chapters.map((c) => (
            <TouchableOpacity key={c.index} style={[v.ms, c.cleared && v.msDone, c.isNext && v.msNext]}
              activeOpacity={0.85} onPress={() => { fx('tap'); doFight(c.index); }}
              accessibilityRole="button"
              accessibilityLabel={`챕터 ${c.index + 1} ${c.title} · 권장 ${c.bossStage}층${c.cleared ? ' 클리어됨' : ''}`}>
              <Text style={v.msIc}>{c.cleared ? '✅' : c.isNext ? '⚔️' : '🎁'}</Text>
              <Text style={v.msTx}>{c.bossStage}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 난이도 4단 */}
      <View style={v.diffRow}>
        {DIFFICULTIES.map((d) => {
          const on = curDiff.id === d.id;
          const open = difficultyUnlocked(state, d.id);
          return (
            <TouchableOpacity key={d.id} style={[v.diff, on && v.diffOn, !open && v.diffLocked]} activeOpacity={0.85}
              onPress={() => { const r = setDifficulty(state, d.id); fx(r.ok ? 'success' : 'error'); bump(); }}
              accessibilityRole="button" accessibilityState={{ selected: on, disabled: !open }}
              accessibilityLabel={open ? `${d.label} 난이도 · 보상 ${d.rewardMult}배` : `${d.label} 난이도 잠김 · ${d.unlock}층 필요`}>
              <Text style={[v.diffTx, on && v.diffTxOn]} numberOfLines={1}>
                {d.emoji}{d.label}{open ? ` ×${d.rewardMult}` : ` ${d.unlock}층`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 파티 대기 — 모닥불 주위 */}
      <View style={v.camp}>
        <View style={v.row}>{sum.back.map((uid, i) => slot(uid, `b${i}`))}</View>
        <Text style={v.fire}>🔥</Text>
        <View style={v.row}>{sum.front.map((uid, i) => slot(uid, `f${i}`))}</View>
        {state.party.length === 0 && <Text style={v.empty}>편성된 영웅이 없습니다 — 전투 시작 후 편성하세요</Text>}
      </View>

      {msg ? <Text style={v.msg}>{msg}</Text> : null}

      {/* 좌하단 자동 전투 상태 + 중앙 전투 시작 */}
      <View style={v.foot}>
        <View style={v.auto}>
          <Text style={v.autoIc}>💰</Text>
          <View>
            <Text style={v.autoTx}>자동 전투 상태</Text>
            <Text style={v.autoTime}>{hhmmss(sec)}</Text>
          </View>
        </View>
        <TouchableOpacity style={v.start} activeOpacity={0.85}
          onPress={() => { fx('tap'); setInBattle(true); }}
          accessibilityRole="button" accessibilityLabel="전투 시작 — 전투 화면으로">
          <Text style={v.startTx}>전투 시작</Text>
        </TouchableOpacity>
        <View style={v.gain}>
          <Text style={v.gainTx}>+{fmt(lastGain?.currency || 0)}/s</Text>
        </View>
      </View>
    </View>
  );
}

const v = StyleSheet.create({
  wrap: { flex: 1 },
  bg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },

  stagePill: { alignSelf: 'center', marginTop: 6, backgroundColor: 'rgba(35,22,12,0.9)', borderWidth: 2, borderColor: '#c8ab74', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 4 },
  stagePillTx: { color: '#f5e6c8', fontSize: 13, fontWeight: '900' },

  track: { paddingHorizontal: 8, paddingTop: 8 },
  trackBar: { height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: '#8a6d47', overflow: 'hidden' },
  trackFill: { height: 8, backgroundColor: T.accent },
  milestones: { gap: 6, paddingTop: 5 },
  ms: { width: 46, height: 42, borderRadius: 7, backgroundColor: 'rgba(30,40,25,0.85)', borderWidth: 2, borderColor: '#6b7a52', alignItems: 'center', justifyContent: 'center' },
  msDone: { borderColor: '#4fd98a' },
  msNext: { borderColor: T.accent, backgroundColor: 'rgba(90,70,20,0.9)' },
  msIc: { fontSize: 15 },
  msTx: { color: '#e6d3ae', fontSize: 8, fontWeight: '900' },

  diffRow: { flexDirection: 'row', gap: 3, paddingHorizontal: 8, paddingTop: 7 },
  diff: { flex: 1, borderRadius: 8, paddingVertical: 4, alignItems: 'center', backgroundColor: 'rgba(20,28,16,0.8)', borderWidth: 1, borderColor: '#6b7a52' },
  diffOn: { backgroundColor: T.accent, borderColor: T.accent },
  diffLocked: { opacity: 0.45 },
  diffTx: { color: '#b9c8a2', fontSize: 8, fontWeight: '800' },
  diffTxOn: { color: '#241a00', fontWeight: '900' },

  camp: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  unit: { alignItems: 'center' },
  unitLv: { color: '#f0e0c0', fontSize: 9, fontWeight: '900', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingHorizontal: 5, marginTop: -4 },
  fire: { fontSize: 34 },
  empty: { color: '#d8e0c8', fontSize: 11, fontWeight: '800', marginTop: 10 },

  msg: { color: T.accent, fontSize: 11, fontWeight: '900', textAlign: 'center', paddingBottom: 4 },

  foot: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 10, gap: 8 },
  auto: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 96 },
  autoIc: { fontSize: 20 },
  autoTx: { color: '#e6d3ae', fontSize: 8, fontWeight: '800' },
  autoTime: { color: '#fff', fontSize: 11, fontWeight: '900', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 4, paddingHorizontal: 4 },
  start: { flex: 1, paddingVertical: 11, borderRadius: 8, backgroundColor: '#d8402a', borderWidth: 2, borderColor: '#ffb37a', alignItems: 'center' },
  startTx: { color: '#fff', fontSize: 16, fontWeight: '900', textShadowColor: '#7a1a0a', textShadowRadius: 2 },
  gain: { width: 62, alignItems: 'flex-end' },
  gainTx: { color: T.accent, fontSize: 9, fontWeight: '900' },
});
