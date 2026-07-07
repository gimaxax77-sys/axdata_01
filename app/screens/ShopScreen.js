import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { T } from '../theme';
import { Card, Btn, fmt, MultiToggle, repeat } from '../components';
import { SHOP, purchase, adLeft, packageOwned } from '../../system/core/shop.mjs';
import { getStage } from '../../system/core/progression.mjs';

// grant 정의 → 표시용 문자열 (진행도 스케일 반영)
function grantText(state, concept, grant) {
  const st = getStage(state.peakStage).rewards;
  const parts = [];
  for (const [k, v] of Object.entries(grant)) {
    if (k === 'currencyStage') parts.push(`${concept.resources.currency.emoji}${fmt(st.currency * v)}`);
    else if (k === 'growthStage') parts.push(`${concept.resources.growth.emoji}${fmt(st.growth * v)}`);
    else parts.push(`${concept.resources[k]?.emoji || ''}${fmt(v)}`);
  }
  return parts.join('  ');
}

export default function ShopScreen({ state, bump, concept }) {
  const [mult, setMult] = useState(1);
  const buy = (id) => { purchase(state, id); bump(); };
  const buyN = (id) => { repeat(() => purchase(state, id), mult); bump(); };
  const gem = concept.resources.gem;

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.wrap}>
      {/* 광고 보상 */}
      <Card>
        <Text style={s.sec}>📺 광고 보상 <Text style={s.dim}>(무료 · 일일 제한)</Text></Text>
        {SHOP.ad.map((p) => {
          const left = adLeft(state, p.id);
          return (
            <View key={p.id} style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>{p.label}</Text>
                <Text style={s.reward}>{grantText(state, concept, p.grant)} · 오늘 {left}/{p.limit}</Text>
              </View>
              <Btn small label={left > 0 ? '시청' : '소진'} disabled={left <= 0} onPress={() => buy(p.id)} />
            </View>
          );
        })}
      </Card>

      {/* 다이아 상점 */}
      <Card style={{ marginTop: 12 }}>
        <View style={s.shopHead}>
          <Text style={s.sec}>{gem.emoji} {gem.name} 상점</Text>
          <MultiToggle value={mult} onChange={setMult} />
        </View>
        {SHOP.gem.map((p) => (
          <View key={p.id} style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>{p.label}</Text>
              <Text style={s.reward}>{grantText(state, concept, p.grant)}</Text>
            </View>
            <Btn small kind="gold" label={`×${mult} ${gem.emoji}${fmt(p.cost.gem * mult)}`} disabled={(state.wallet.gem || 0) < p.cost.gem}
              onPress={() => buyN(p.id)} />
          </View>
        ))}
      </Card>

      {/* 패키지 (모의 결제) */}
      <Card style={{ marginTop: 12, marginBottom: 24 }}>
        <Text style={s.sec}>🎁 패키지 <Text style={s.dim}>(결제 연동 골격 · 모의)</Text></Text>
        {SHOP.package.map((p) => {
          const owned = p.once && packageOwned(state, p.id);
          return (
            <View key={p.id} style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>
                  {p.label}
                  {p.tag ? <Text style={s.tag}>  {p.tag}</Text> : null}
                  {p.once ? <Text style={s.dim}>  1회</Text> : null}
                </Text>
                <Text style={s.reward}>{grantText(state, concept, p.grant)}</Text>
                {p.note ? <Text style={s.note}>{p.note}</Text> : null}
              </View>
              <Btn small kind={owned ? 'ghost' : 'primary'} disabled={owned} label={owned ? '구매완료' : p.krw}
                onPress={() => buy(p.id)} />
            </View>
          );
        })}
        <Text style={s.disc}>※ 실제 결제는 연동되지 않은 골격입니다. 버튼은 보상 흐름 시연용(모의 지급).</Text>
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { padding: 14 },
  sec: { color: T.text, fontWeight: '800', fontSize: 15, marginBottom: 4 },
  shopHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  dim: { color: T.muted, fontSize: 12, fontWeight: '400' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: T.line },
  label: { color: T.text, fontWeight: '700', fontSize: 14 },
  reward: { color: T.muted, fontSize: 12, marginTop: 3 },
  note: { color: T.accent, fontSize: 11, marginTop: 2 },
  tag: { color: T.accent, fontSize: 11, fontWeight: '800' },
  disc: { color: T.muted, fontSize: 11, marginTop: 12, lineHeight: 16 },
});
