import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { T } from '../theme';
import { Card, Btn, fmt } from '../components';
import { summonOne, summonMulti, RARITY, PULL_COST } from '../../system/core/gacha.mjs';
import { identity } from '../../system/concepts/index.mjs';
import { recordMission } from '../../system/core/daily.mjs';
import { isUnlocked, unlockStage } from '../../system/core/unlocks.mjs';
import { LockedPanel } from '../components';

const RARITY_COLOR = { N: '#9aa0b5', R: '#5aa9e6', SR: '#c98bff', SSR: '#f5c542' };

export default function GachaScreen({ state, bump, concept }) {
  const [results, setResults] = useState([]);

  const pool = concept.roster;
  const pull = (n) => {
    let res;
    if (n === 1) {
      const r = summonOne(state, Math.random, pool);
      res = r.ok ? [r] : [];
    } else {
      const r = summonMulti(state, n, Math.random, pool);
      res = r.ok ? r.results : [];
    }
    if (res.length) { recordMission(state, 'summon', res.length); setResults(res.slice(-20)); }
    bump();
  };

  const canOne = state.wallet.summon >= PULL_COST.summon;
  const canTen = state.wallet.summon >= PULL_COST.summon * 10;
  const canHundred = state.wallet.summon >= PULL_COST.summon * 100;

  if (!isUnlocked(state, 'gacha')) {
    return <LockedPanel concept={concept} title="소환" stage={unlockStage('gacha')} desc="스테이지를 진행하면 영웅 소환이 열립니다." />;
  }

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Card style={s.banner}>
        <Text style={s.bannerEmoji}>{concept.resources.summon.emoji}</Text>
        <Text style={s.bannerTitle}>{concept.terms.unit} 소환</Text>
        <Text style={s.bannerSub}>확률: N 50 · R 33 · SR 14 · SSR 3 (%)</Text>
        <Text style={s.pity}>천장까지 {90 - state.gacha.pity}회 · 보유 {concept.resources.summon.emoji} {fmt(state.wallet.summon)}</Text>
      </Card>

      <View style={s.btns}>
        <View style={{ flex: 1 }}>
          <Btn label={`단차 (${PULL_COST.summon})`} disabled={!canOne} onPress={() => pull(1)} />
        </View>
        <View style={{ flex: 1 }}>
          <Btn label={`10연차 (${PULL_COST.summon * 10})`} kind="gold" disabled={!canTen} onPress={() => pull(10)} />
        </View>
        <View style={{ flex: 1 }}>
          <Btn label={`100연차 (${fmt(PULL_COST.summon * 100)})`} kind="gold" disabled={!canHundred} onPress={() => pull(100)} />
        </View>
      </View>
      <Text style={s.floor}>10연차 이상은 최소 1개 SR 이상 보장 · 100연차는 결과 요약 표시</Text>

      {results.length > 0 && (
        <Card style={{ marginTop: 14 }}>
          <Text style={s.sec}>소환 결과 <Text style={s.floor}>({results.length}건{results.length >= 20 ? ' · 최근 20' : ''})</Text></Text>
          <View style={s.grid}>
            {results.map((r, i) => {
              const id = identity(concept, r.unit);
              return (
                <View key={i} style={[s.cell, { borderColor: RARITY_COLOR[r.rarity] }]}>
                  <Text style={[s.cellRarity, { color: RARITY_COLOR[r.rarity] }]}>{RARITY[r.rarity].label}</Text>
                  <Text style={s.cellEmoji}>{id.emoji}</Text>
                  <Text style={s.cellName} numberOfLines={1}>{id.name}</Text>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      <Text style={s.hint}>소환권은 출석·미션·환생 보상으로 모입니다. 뽑은 {concept.terms.unit}은 캐릭터 탭에서 육성하세요.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14 },
  banner: { alignItems: 'center', backgroundColor: T.surface2 },
  bannerEmoji: { fontSize: 48 },
  bannerTitle: { color: T.text, fontWeight: '900', fontSize: 22, marginTop: 4 },
  bannerSub: { color: T.muted, fontSize: 12, marginTop: 6 },
  pity: { color: T.accent, fontSize: 13, fontWeight: '700', marginTop: 8 },
  btns: { flexDirection: 'row', gap: 10, marginTop: 14 },
  floor: { color: T.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },
  sec: { color: T.text, fontWeight: '800', fontSize: 15, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  cell: { width: 90, backgroundColor: T.surface2, borderRadius: 12, borderWidth: 2, padding: 8, alignItems: 'center' },
  cellRarity: { fontSize: 11, fontWeight: '900' },
  cellEmoji: { fontSize: 30, marginVertical: 2 },
  cellName: { color: T.text, fontSize: 12, fontWeight: '700' },
  hint: { color: T.muted, fontSize: 12, marginTop: 16, lineHeight: 18, textAlign: 'center' },
});
