// 원정(로그라이트) 화면 — 시작 / 진행(노드맵·생명·전투·보상3택) / 종료 정산
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { T } from '../theme';
import { Card, Btn, fmt } from '../components';
import { identity } from '../../system/concepts/index.mjs';
import { formationSummary } from '../../system/core/formation.mjs';
import { getPartyUnits } from '../../system/core/gameState.mjs';
import { resolve } from '../../system/core/resolution.mjs';
import { accountMods } from '../../system/core/balance.mjs';
import { effectivePower } from '../useGame';
import { startRun, fightNode, pickBoon, endRun, currentNode, BOONS, RUN_NODES } from '../../system/core/run.mjs';
import { fx } from '../feedback';
import BattleView from './BattleView';

const BATTLE_BGS = [
  require('../../assets/pixel/bg-battle-0.png'), require('../../assets/pixel/bg-battle-1.png'),
  require('../../assets/pixel/bg-battle-2.png'), require('../../assets/pixel/bg-battle-3.png'),
  require('../../assets/pixel/bg-battle-4.png'), require('../../assets/pixel/bg-battle-5.png'),
  require('../../assets/pixel/bg-battle-6.png'), require('../../assets/pixel/bg-battle-7.png'),
  require('../../assets/pixel/bg-battle-8.png'), require('../../assets/pixel/bg-battle-9.png'),
];
const ENEMY_KEYS = ['skeleton_minion', 'skeleton_warrior', 'werewolf_wolf', 'skeleton_mage', 'skeleton_golem', 'demon', 'greendemon', 'cthulhu', 'cyclops', 'yeti', 'alien'];
const BOON_BY_ID = Object.fromEntries(BOONS.map((b) => [b.id, b]));

function enemyKeyFor(node, i) {
  if (node.type === 'boss') return 'cthulhu';   // 보스 = 크툴루(위압감)
  if (node.type === 'elite') return 'cyclops';  // 엘리트 = 사이클롭스
  return ENEMY_KEYS[i % ENEMY_KEYS.length];
}

export default function RunScreen({ state, bump, concept }) {
  const [floor, setFloor] = useState(1);
  const [flash, setFlash] = useState(null); // 최근 전투 결과 문구
  const r = state.run;
  const ended = !!r && r.status !== 'active';
  const reduce = state.settings && state.settings.reduceMotion;

  // 생명값 안전 정규화(세이브 손상·구버전 대비) — 0~1 유한수만 허용.
  const safeHP = r && Number.isFinite(r.runHP) ? Math.max(0, Math.min(1, r.runHP)) : 1;
  // 연출 애니메이션 — 생명바 증감·결과 플래시 팝·종료 등장·진격 펄스.
  //   (훅은 조기 반환보다 위에서 무조건 호출 — 규칙 준수.)
  const hpAnim = useRef(new Animated.Value(safeHP)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const endAnim = useRef(new Animated.Value(0)).current;
  const advAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!r) return;
    if (reduce) { hpAnim.setValue(safeHP); return; }
    Animated.timing(hpAnim, { toValue: safeHP, duration: 450, useNativeDriver: false }).start();
  }, [safeHP, r]);
  useEffect(() => {
    if (!flash) return;
    if (reduce) { flashAnim.setValue(1); return; }
    flashAnim.setValue(0);
    Animated.spring(flashAnim, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
  }, [flash]);
  useEffect(() => {
    if (!ended) { endAnim.setValue(0); return; }
    if (reduce) { endAnim.setValue(1); return; }
    endAnim.setValue(0);
    Animated.spring(endAnim, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }).start();
  }, [ended]);
  useEffect(() => {
    if (!r || reduce) return;
    advAnim.setValue(0.7);
    Animated.spring(advAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [r ? r.idx : -1]);

  // 파티 편성 슬롯(스프라이트/이모지) — BattleView용.
  const byId = new Map(state.units.map((u) => [u.uid, u]));
  const slotOf = (uid) => {
    const u = byId.get(uid);
    if (!u) return { emoji: '⚔️' };
    return { emoji: identity(concept, u).emoji, cid: concept.id, key: u.characterId };
  };
  const sum = formationSummary(state);
  const heroFormation = { front: sum.front.map(slotOf), mid: sum.mid.map(slotOf), back: sum.back.map(slotOf) };

  // ── 시작 화면 (진행 중 런 없음) ─────────────────────────────
  if (!r) {
    const power = effectivePower(state);
    const canStart = state.party.length > 0;
    return (
      <View style={s.wrap}>
        <Card style={s.panel}>
          <Text style={s.h1}>⚔️ 원정</Text>
          <Text style={s.desc}>파티를 이끌고 {RUN_NODES}개 관문을 좌→우로 진격합니다. 전투마다 강화 3택을 고르고, 아슬한 승리일수록 생명이 더 깎입니다. 쓰러지면 런 종료 — 도달한 만큼 보상을 얻습니다.</Text>
          <View style={s.floorRow}>
            <Text style={s.floorLabel}>난이도(층)</Text>
            <TouchableOpacity style={s.step} onPress={() => { fx('tap'); setFloor((f) => Math.max(1, f - 1)); }}><Text style={s.stepTxt}>−</Text></TouchableOpacity>
            <Text style={s.floorVal}>{floor}</Text>
            <TouchableOpacity style={s.step} onPress={() => { fx('tap'); setFloor((f) => Math.min(30, f + 1)); }}><Text style={s.stepTxt}>+</Text></TouchableOpacity>
          </View>
          <Text style={s.partyLine}>내 파티 {state.party.length}명 · 전투력 {fmt(power)}</Text>
          <Btn label="원정 시작" disabled={!canStart}
            onPress={() => { if (startRun(state, { floor }).ok) { fx('success'); setFlash(null); bump(); } }} />
          {!canStart && <Text style={s.warn}>영웅 탭에서 파티를 먼저 편성하세요.</Text>}
        </Card>
      </View>
    );
  }

  const node = currentNode(state);
  const hpColor = safeHP > 0.5 ? T.good : safeHP > 0.25 ? '#e0a83a' : T.danger;
  const hpWidth = hpAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  // 전투 미리보기(연출용) — 현재 파티 vs 현재 노드.
  let preview = { win: true, margin: 1.5 };
  if (node) {
    const mods = { ...accountMods(state) };
    preview = resolve(getPartyUnits(state), node.challenge, mods, r.formation);
  }

  return (
    <View style={s.wrap}>
      {/* 노드맵 진행바 */}
      <View style={s.nodeRow}>
        {r.nodes.map((nd, i) => {
          const done = i < r.idx;
          const cur = i === r.idx && !ended;
          const icon = nd.type === 'boss' ? '👑' : nd.type === 'elite' ? '💀' : '⚔️';
          return (
            <View key={i} style={[s.node, done && s.nodeDone, cur && s.nodeCur]}>
              <Text style={[s.nodeIcon, done && s.nodeIconDone]}>{done ? '✓' : icon}</Text>
            </View>
          );
        })}
      </View>
      <Animated.Text style={[s.progressTxt, { transform: [{ scale: advAnim }] }]}>{r.floor}층 원정 · 관문 {Math.min(r.idx + (ended ? 0 : 1), RUN_NODES)}/{RUN_NODES}</Animated.Text>

      {/* 생명바 — 소모/회복이 부드럽게 증감 */}
      <View style={s.hpWrap}>
        <Text style={s.hpLabel}>생명</Text>
        <View style={s.hpBg}><Animated.View style={[s.hpFill, { width: hpWidth, backgroundColor: hpColor }]} /></View>
        <Text style={s.hpVal}>{Math.round(safeHP * 100)}%</Text>
      </View>

      {/* 전투 무대 */}
      <Card style={s.stage}>
        <Image source={BATTLE_BGS[(r.floor + r.idx) % BATTLE_BGS.length]} style={s.stageBg} resizeMode="cover" pointerEvents="none" />
        {node && (
          <BattleView
            party={heroFormation}
            enemyEmoji={node.type === 'boss' ? '👑' : '👹'}
            enemyKey={enemyKeyFor(node, r.idx)}
            win={preview.win} margin={preview.margin}
            reduce={state.settings.reduceMotion}
          />
        )}
        {ended && (
          <Animated.View style={[s.endOverlay, { opacity: endAnim }]} pointerEvents="none">
            <Animated.Text style={[s.endBig, { transform: [{ scale: endAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }]}>{r.status === 'won' ? '🏆 원정 완주!' : '💀 원정 실패'}</Animated.Text>
          </Animated.View>
        )}
      </Card>

      {/* 획득 강화 */}
      {r.boons.length > 0 && (
        <Text style={s.boonList}>강화: {r.boons.map((id) => BOON_BY_ID[id]?.label).join(' · ')}</Text>
      )}
      {flash ? (
        <Animated.Text style={[s.flash, { opacity: flashAnim, transform: [{ scale: flashAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }]}>{flash}</Animated.Text>
      ) : null}

      {/* 액션 영역 */}
      {ended ? (
        <Btn label="보상 받기" onPress={() => {
          const res = endRun(state); fx('success');
          setFlash(`정산: 관문 ${res.cleared}개 · 젬 +${res.reward.gem} · 소환 +${res.reward.summon}`);
          bump();
        }} />
      ) : r.offer ? (
        <View style={s.offerBox}>
          <Text style={s.offerTitle}>강화 선택 (1개)</Text>
          <View style={s.offerRow}>
            {r.offer.map((id) => {
              const b = BOON_BY_ID[id];
              return (
                <TouchableOpacity key={id} style={s.boonCard} activeOpacity={0.85}
                  onPress={() => { pickBoon(state, id); fx('success'); bump(); }}>
                  <Text style={s.boonIcon}>{b.icon || '⚔️'}</Text>
                  <Text style={s.boonTxt}>{b.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        <Btn label={node && node.type === 'boss' ? '👑 보스 전투' : '⚔️ 전투'} onPress={() => {
          const res = fightNode(state);
          if (res.ok) {
            fx(res.win ? 'success' : 'fail');
            setFlash(res.win ? `승리! (여유 ×${res.margin.toFixed(1)})` : '패배… 원정이 끝났습니다.');
          }
          bump();
        }} />
      )}
      {!ended && <Text style={s.giveup} onPress={() => { endRun(state); fx('tap'); setFlash(null); bump(); }}>원정 포기(현재까지 보상 정산)</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 12, gap: 10 },
  panel: { padding: 18, gap: 12, alignItems: 'center' },
  h1: { color: T.text, fontSize: 24, fontWeight: '900' },
  desc: { color: T.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  floorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  floorLabel: { color: T.text, fontSize: 14, fontWeight: '700' },
  step: { width: 38, height: 38, borderRadius: 10, backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { color: T.text, fontSize: 22, fontWeight: '800' },
  floorVal: { color: T.accent, fontSize: 22, fontWeight: '900', minWidth: 34, textAlign: 'center' },
  partyLine: { color: T.muted, fontSize: 13 },
  warn: { color: T.danger, fontSize: 12 },

  nodeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 3 },
  node: { flex: 1, aspectRatio: 1, maxWidth: 34, borderRadius: 8, backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
  nodeDone: { opacity: 1, backgroundColor: 'rgba(80,180,120,0.25)' },
  nodeCur: { opacity: 1, borderWidth: 2, borderColor: T.accent },
  nodeIcon: { fontSize: 14 },
  nodeIconDone: { color: T.good, fontWeight: '900' },
  progressTxt: { color: T.muted, fontSize: 12, textAlign: 'center', fontWeight: '700' },

  hpWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hpLabel: { color: T.text, fontSize: 12, fontWeight: '800', width: 30 },
  hpBg: { flex: 1, height: 12, backgroundColor: T.surface, borderRadius: 6, overflow: 'hidden' },
  hpFill: { height: 12, borderRadius: 6 },
  hpVal: { color: T.text, fontSize: 12, fontWeight: '800', width: 40, textAlign: 'right' },

  stage: { flex: 1, minHeight: 260, overflow: 'hidden', padding: 0 },
  stageBg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  endOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  endBig: { color: '#fff', fontSize: 28, fontWeight: '900', textShadowColor: '#000', textShadowRadius: 8 },

  boonList: { color: T.muted, fontSize: 11, textAlign: 'center' },
  flash: { color: T.accent, fontSize: 14, fontWeight: '800', textAlign: 'center' },

  offerBox: { gap: 8 },
  offerTitle: { color: T.text, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  offerRow: { flexDirection: 'row', gap: 8 },
  boonCard: { flex: 1, backgroundColor: T.surface, borderRadius: 12, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: T.line },
  boonIcon: { fontSize: 26 },
  boonTxt: { color: T.text, fontSize: 12, fontWeight: '700', textAlign: 'center' },

  giveup: { color: T.muted, fontSize: 12, textAlign: 'center', textDecorationLine: 'underline', marginTop: 2 },
});
