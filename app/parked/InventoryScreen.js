// 인벤토리 화면 — 미장착 장비(state.inventory) 목록·등급 필터·일괄 분해. 세븐 🎒 인벤토리 탭.
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { Card, Btn, fmt } from '../components';
import { GEAR_RARITY, GEAR_CATALOG, SLOT_META } from '../../system/core/gear.mjs';
import { SALVAGE_VALUE, salvageTargets, autoSalvage } from '../../system/core/gearsalvage.mjs';
import { fx } from '../feedback';

// 등급 색 — 로스터의 등급 표시와 같은 계열(테마 rarityMeta가 캐릭터용이라 장비는 여기서 지정).
const RARITY_COLOR = { N: '#9aa4b8', R: '#5aa9e6', SR: '#a678e0', SSR: '#f5c542', UR: '#ff7a59' };
const FILTERS = [{ id: 'ALL', label: '전체' }, ...Object.keys(GEAR_RARITY).map((id) => ({ id, label: GEAR_RARITY[id].label }))];

export default function InventoryScreen({ state, bump }) {
  const [filter, setFilter] = useState('ALL');
  const [msg, setMsg] = useState(null);
  const inv = state.inventory || [];
  const shown = filter === 'ALL' ? inv : inv.filter((it) => (it.rarity || 'N') === filter);

  // 일괄 분해 — 레어 이하 하급품만(강화·인챈트된 건 코어가 알아서 제외).
  const doSalvage = (maxRarity) => {
    const n = salvageTargets(state, maxRarity).length;
    if (!n) { setMsg('분해할 하급 장비가 없습니다.'); return; }
    const r = autoSalvage(state, maxRarity);
    fx('success');
    setMsg(`${r.removed}개 분해 · ${fmt(r.refund.currency || 0)} 환급`);
    bump();
  };

  return (
    <ScrollView style={st.wrap} contentContainerStyle={st.content}>
      <Card>
        <View style={st.head}>
          <Text style={st.title}>🎒 인벤토리</Text>
          <Text style={st.count}>{inv.length}개 보관</Text>
        </View>
        <View style={st.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f.id} onPress={() => { fx('tap'); setFilter(f.id); }} activeOpacity={0.8}
              style={[st.chip, filter === f.id && st.chipOn]}
              accessibilityRole="button" accessibilityState={{ selected: filter === f.id }}>
              <Text style={[st.chipTx, filter === f.id && st.chipTxOn]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={st.sect}>일괄 분해</Text>
        <Text style={st.hint}>강화·인챈트 안 한 하급 장비만 분해합니다. 환급은 {Object.entries(SALVAGE_VALUE).map(([k, v]) => `${GEAR_RARITY[k].label} ${v}`).join(' · ')}.</Text>
        <View style={st.row}>
          <Btn label="노멀 분해" small kind="ghost" onPress={() => doSalvage('N')} />
          <Btn label="레어까지 분해" small onPress={() => doSalvage('R')} />
        </View>
        {msg && <Text style={st.msg}>{msg}</Text>}
      </Card>

      <Card>
        <Text style={st.sect}>보관 중인 장비</Text>
        {shown.length === 0 ? (
          <Text style={st.empty}>비어 있습니다. 전투·소환으로 장비를 모아보세요.</Text>
        ) : shown.map((it) => {
          const bp = GEAR_CATALOG[it.blueprint];
          const rar = GEAR_RARITY[it.rarity] || GEAR_RARITY.N;
          const slot = SLOT_META[it.slot];
          return (
            <View key={it.uid} style={st.item}>
              <Text style={st.itemIc}>{slot?.emoji || '⚙️'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.itemNm} numberOfLines={1}>
                  {bp?.label || it.blueprint}
                  {it.level > 1 ? <Text style={st.itemLv}>  +{it.level - 1}</Text> : null}
                </Text>
                <Text style={st.itemSub}>{slot?.label || it.slot} · 부옵션 {(it.subs || []).length}</Text>
              </View>
              <Text style={[st.itemRar, { color: RARITY_COLOR[rar.id] }]}>{rar.label}</Text>
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1 },
  content: { padding: 12, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: T.accent, fontSize: 16, fontWeight: '900' },
  count: { color: T.muted, fontSize: 12, fontWeight: '700' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { borderRadius: 9, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: T.surface2, borderWidth: 1, borderColor: T.line },
  chipOn: { borderColor: T.accent, backgroundColor: T.surface },
  chipTx: { color: T.muted, fontSize: 11, fontWeight: '800' },
  chipTxOn: { color: T.accent },
  sect: { color: T.text, fontSize: 13, fontWeight: '900', marginBottom: 6 },
  hint: { color: T.muted, fontSize: 11, marginBottom: 8, lineHeight: 16 },
  row: { flexDirection: 'row', gap: 8 },
  msg: { color: T.good, fontSize: 12, fontWeight: '800', marginTop: 8 },
  empty: { color: T.muted, fontSize: 12, paddingVertical: 10, textAlign: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: T.line },
  itemIc: { fontSize: 20 },
  itemNm: { color: T.text, fontSize: 13, fontWeight: '800' },
  itemLv: { color: T.accent, fontSize: 12, fontWeight: '900' },
  itemSub: { color: T.muted, fontSize: 10, marginTop: 1 },
  itemRar: { fontSize: 11, fontWeight: '900' },
});
