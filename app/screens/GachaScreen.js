import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { T, rarityMeta } from '../theme';
import { Card, Btn, fmt, Portrait } from '../components';
import { charImage } from '../charImages';
import { fx } from '../feedback';
import { reducedMotion } from '../motion';
import { summonOne, summonMulti, PULL_COST } from '../../system/core/gacha.mjs';
import { petSummon, PET_PULL_COST, PETS } from '../../system/core/pets.mjs';
import {
  summonGear, summonRune, summonCosmetic,
  GEAR_PULL_COST, RUNE_PULL_COST, COSTUME_PULL_COST,
} from '../../system/core/summon.mjs';
import { RUNE_SETS } from '../../system/core/runes.mjs';
import { identity } from '../../system/concepts/index.mjs';
import { recordMission } from '../../system/core/daily.mjs';
import { isUnlocked, unlockStage } from '../../system/core/unlocks.mjs';
import { LockedPanel } from '../components';
import {
  recordSummon, summonMasteryInfo, claimSummonLevel,
  SUMMON_LEVEL_MAX, SUMMON_LEVEL_THRESHOLDS,
} from '../../system/core/summonMastery.mjs';

const RANK = { N: 0, R: 1, SR: 2, SSR: 3, UR: 4 };
const SLOT_EMOJI = { weapon: '⚔️', armor: '🛡️', accessory: '💍' };

// 소환 결과 한 칸 — 등장 시 페이드+스케일 (등급 높을수록 늦게=강조).
const RevealCell = React.memo(function RevealCell({ index, rarity, emoji, image, name }) {
  const rm = rarityMeta(rarity);
  const a = useRef(new Animated.Value(reducedMotion() ? 1 : 0)).current;
  useEffect(() => {
    if (reducedMotion()) { a.setValue(1); return; }
    a.setValue(0);
    Animated.timing(a, { toValue: 1, duration: 340, delay: Math.min(index, 12) * 70, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: a, transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
      <View style={[s.cell, { borderColor: rm.color }]}>
        <Text style={[s.cellRarity, { color: rm.color }]}>{rm.label}</Text>
        <Portrait emoji={emoji} image={image} rarity={rarity} size={52} badge />
        <Text style={s.cellName} numberOfLines={1}>{name}</Text>
      </View>
    </Animated.View>
  );
});

export default function GachaScreen({ state, bump, concept }) {
  const [results, setResults] = useState([]);
  const [resultsKey, setResultsKey] = useState(0);
  const [banner, setBanner] = useState('hero');
  const [msg, setMsg] = useState(null);

  const pool = concept.roster;
  const gemE = concept.resources.gem.emoji;
  const sumE = concept.resources.summon.emoji;

  // 배너 정의: 소환 재화·비용·매핑을 한 곳에.
  const BANNERS = {
    hero: {
      label: '영웅', tab: `${sumE} 영웅`, curr: 'summon', cost: PULL_COST.summon, multi: true,
      sub: '확률: N 50 · R 33 · SR 14 · SSR 2.5 · UR 0.5 (%)',
      note: '10연차 이상 최소 1개 SR 이상 보장',
    },
    pet: {
      label: '펫', tab: '🐾 펫', curr: 'gem', cost: PET_PULL_COST.gem, multi: true,
      sub: '펫 획득(중복은 레벨업) · 최대 3마리 장착', note: '펫은 캐릭터·유물처럼 계정 성장 축',
    },
    gear: {
      label: '장비', tab: '⚔️ 장비', curr: 'gem', cost: GEAR_PULL_COST.gem, multi: true,
      sub: '랜덤 장비 → 인벤토리 · 진행도↑ 상위 등급↑', note: '캐릭터 탭에서 장착·강화',
    },
    rune: {
      label: '룬', tab: '🔷 룬', curr: 'gem', cost: RUNE_PULL_COST.gem, multi: true,
      sub: '랜덤 룬 → 룬 가방 · 진행도↑ 상위 등급↑', note: '3슬롯 장착 · 세트 보너스',
    },
    cosmetic: {
      label: '코스튬', tab: '🎀 코스튬', curr: 'gem', cost: COSTUME_PULL_COST.gem, multi: false,
      sub: '미보유 외형(프레임·칭호) 무작위 · 능력치 무관', note: '전부 보유 시 다이아 일부 환급',
    },
  };
  const b = BANNERS[banner];
  const bal = state.wallet[b.curr] || 0;

  // 단일 소환 실행 → { cell, spent }. spent=재화 소모 여부(숙련도 카운트용).
  function pullOnce() {
    if (banner === 'pet') {
      const r = petSummon(state); if (!r.ok) return { cell: null, spent: false };
      const p = PETS[r.pet];
      return { cell: { rarity: r.rarity, emoji: p.emoji, name: `${p.label} Lv.${r.level}` }, spent: true };
    }
    if (banner === 'gear') {
      const r = summonGear(state); if (!r.ok) return { cell: null, spent: false };
      return { cell: { rarity: r.rarity, emoji: SLOT_EMOJI[r.item.slot] || '⚔️', name: r.label }, spent: true };
    }
    if (banner === 'rune') {
      const r = summonRune(state); if (!r.ok) return { cell: null, spent: false };
      const set = RUNE_SETS[r.rune.set];
      return { cell: { rarity: r.rarity, emoji: set?.emoji || '🔷', name: set?.label || r.rune.set }, spent: true };
    }
    if (banner === 'cosmetic') {
      const r = summonCosmetic(state); if (!r.ok) return { cell: null, spent: false };
      if (r.duplicate) { setMsg(`모든 외형 보유 · ${gemE}${r.refund.gem} 환급`); return { cell: null, spent: true }; }
      return { cell: { rarity: 'SSR', emoji: r.item.emoji, name: r.item.label }, spent: true };
    }
    return { cell: null, spent: false }; // hero handled separately
  }

  const pull = (n) => {
    setMsg(null);
    let cells = [];
    let executed = 0;
    if (banner === 'hero') {
      if (n === 1) { const r = summonOne(state, Math.random, pool); if (r.ok) cells = [r]; }
      else { const r = summonMulti(state, n, Math.random, pool); if (r.ok) cells = r.results; }
      cells = cells.map((r) => ({ rarity: r.rarity, emoji: identity(concept, r.unit).emoji, name: identity(concept, r.unit).name, image: charImage(concept.id, r.unit.characterId) }));
      executed = cells.length;
      if (cells.length) recordMission(state, 'summon', cells.length);
    } else {
      for (let i = 0; i < n; i++) { const { cell, spent } = pullOnce(); if (!spent) break; executed++; if (cell) cells.push(cell); }
    }
    if (executed) recordSummon(state, banner, executed); // 소환 숙련도 누적
    if (cells.length) {
      setResults(cells.slice(-20)); setResultsKey((k) => k + 1);
      fx('summon');
      const best = cells.reduce((m, c) => Math.max(m, RANK[c.rarity] ?? 0), 0);
      setTimeout(() => fx(best >= 3 ? 'ssr' : best >= 2 ? 'sr' : 'success'), 480);
    }
    bump();
  };

  const canN = (n) => bal >= b.cost * n;
  const maxN = Math.min(300, Math.floor(bal / b.cost));

  // 소환 숙련도(소환 레벨) 현황·청구.
  const info = summonMasteryInfo(state, banner);
  const rewardParts = (rw) => {
    const parts = [`${sumE}${fmt(rw.summon)}`, `${gemE}${fmt(rw.gem)}`]; // 기본: 소환권+다이아
    if (rw.type === 'stat') parts.push(`전투력 +${Math.round(rw.power * 100)}%`);
    else { parts.push(`${concept.resources.currency.emoji}${fmt(rw.currency)}`); parts.push(`${concept.resources.growth.emoji}${fmt(rw.growth)}`); }
    return parts;
  };
  const doClaim = () => {
    const r = claimSummonLevel(state, banner);
    if (r.ok) { fx('success'); setMsg([`Lv.${r.level} 보상`, ...rewardParts(r.reward)].join(' · ')); }
    else { fx('error'); }
    bump();
  };
  // 진행 바: 현재 레벨→다음 레벨 문턱 사이 비율.
  const curLv = info.level;
  const prevThr = curLv > 0 ? SUMMON_LEVEL_THRESHOLDS[curLv - 1] : 0;
  const nextThr = curLv < SUMMON_LEVEL_MAX ? SUMMON_LEVEL_THRESHOLDS[curLv] : null;
  const barPct = nextThr ? Math.min(100, ((info.count - prevThr) / (nextThr - prevThr)) * 100) : 100;
  const nr = info.nextReward;
  const nrText = !nr ? '최대 레벨 달성' : rewardParts(nr).join(' ');

  if (!isUnlocked(state, 'gacha')) {
    return <LockedPanel concept={concept} title="소환" stage={unlockStage('gacha')} desc="스테이지를 진행하면 소환이 열립니다." />;
  }

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.wrap}>
      {/* 배너 선택 */}
      <View style={s.tabs}>
        {Object.entries(BANNERS).map(([key, def]) => (
          <TouchableOpacity key={key} activeOpacity={0.8}
            onPress={() => { setBanner(key); setResults([]); setMsg(null); }}
            style={[s.tab, banner === key && s.tabOn]}>
            <Text style={[s.tabText, banner === key && s.tabTextOn]}>{def.tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Card style={s.banner}>
        <Text style={s.bannerTitle}>{b.label} 소환</Text>
        <Text style={s.bannerSub}>{b.sub}</Text>
        <Text style={s.pity}>
          {banner === 'hero' ? `천장까지 ${90 - state.gacha.pity}회 · ` : ''}보유 {b.curr === 'gem' ? gemE : sumE} {fmt(bal)}
        </Text>
      </Card>

      {/* 소환 레벨(숙련도) */}
      <Card style={{ marginTop: 12 }}>
        <View style={s.mHead}>
          <Text style={s.mTitle}>소환 레벨 <Text style={s.mLv}>Lv.{info.claimed}/{SUMMON_LEVEL_MAX}</Text></Text>
          <Btn small kind={info.claimable ? 'gold' : 'ghost'} disabled={!info.claimable}
            label={info.claimable ? `Lv.${info.claimed + 1} 보상 받기` : info.maxed ? 'MAX' : '진행 중'}
            onPress={doClaim} />
        </View>
        <View style={s.mBar}><View style={[s.mBarFill, { width: `${barPct}%` }]} /></View>
        <Text style={s.mSub}>
          {nextThr ? `누적 ${info.count}/${nextThr}회` : `누적 ${info.count}회 · 최대`}
          {'  ·  '}다음: {nrText}
        </Text>
        <Text style={s.mNote}>기본 소환권+다이아 · 홀수 레벨 능력치 / 짝수 레벨 재화 추가</Text>
      </Card>

      <View style={s.btns}>
        <View style={{ flex: 1 }}>
          <Btn label={`단차 (${b.cost})`} disabled={!canN(1)} sfx={false} onPress={() => pull(1)} />
        </View>
        {b.multi && (<>
          <View style={{ flex: 1 }}>
            <Btn label={`10연 (${b.cost * 10})`} kind="gold" disabled={!canN(10)} sfx={false} onPress={() => pull(10)} />
          </View>
          <View style={{ flex: 1 }}>
            <Btn label={maxN > 0 ? `Max (${maxN})` : 'Max'} kind="gold" disabled={maxN < 1} sfx={false} onPress={() => pull(maxN)} />
          </View>
        </>)}
      </View>
      <Text style={s.floor}>{b.note}</Text>
      {msg ? <Text style={s.msg}>{msg}</Text> : null}

      {results.length > 0 && (
        <Card style={{ marginTop: 14 }}>
          <Text style={s.sec}>소환 결과 <Text style={s.floor}>({results.length}건{results.length >= 20 ? ' · 최근 20' : ''})</Text></Text>
          <View style={s.grid}>
            {results.map((c, i) => (
              <RevealCell key={`${resultsKey}-${i}`} index={i} rarity={c.rarity} emoji={c.emoji} image={c.image} name={c.name} />
            ))}
          </View>
        </Card>
      )}

      <Text style={s.hint}>소환권은 출석·미션·환생, 다이아는 상점·보상으로 모입니다.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { padding: 14 },
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  tab: { flexGrow: 1, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 10, backgroundColor: T.surface2, borderWidth: 1, borderColor: 'transparent', alignItems: 'center' },
  tabOn: { borderColor: T.accent, backgroundColor: T.surface },
  tabText: { color: T.muted, fontSize: 12, fontWeight: '700' },
  tabTextOn: { color: T.text },
  banner: { alignItems: 'center', backgroundColor: T.surface2 },
  bannerTitle: { color: T.text, fontWeight: '900', fontSize: 22, marginTop: 4 },
  bannerSub: { color: T.muted, fontSize: 12, marginTop: 6, textAlign: 'center' },
  pity: { color: T.accent, fontSize: 13, fontWeight: '700', marginTop: 8 },
  btns: { flexDirection: 'row', gap: 10, marginTop: 14 },
  floor: { color: T.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },
  msg: { color: T.accent, fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  mHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  mTitle: { color: T.text, fontWeight: '800', fontSize: 14 },
  mLv: { color: T.accent, fontSize: 13, fontWeight: '900' },
  mBar: { height: 8, backgroundColor: T.surface2, borderRadius: 4, overflow: 'hidden' },
  mBarFill: { height: 8, backgroundColor: T.good, borderRadius: 4 },
  mSub: { color: T.muted, fontSize: 11, marginTop: 6 },
  mNote: { color: T.muted, fontSize: 10, marginTop: 4 },
  sec: { color: T.text, fontWeight: '800', fontSize: 15, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  cell: { width: 90, backgroundColor: T.surface2, borderRadius: 12, borderWidth: 2, padding: 8, alignItems: 'center' },
  cellRarity: { fontSize: 11, fontWeight: '900' },
  cellName: { color: T.text, fontSize: 12, fontWeight: '700' },
  hint: { color: T.muted, fontSize: 12, marginTop: 16, lineHeight: 18, textAlign: 'center' },
});
