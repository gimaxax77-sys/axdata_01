// 영웅 상세 · 코스튬 탭 — 호드워 `코스튬` 패널. 기준: Gim 실기 캡처(2026-07-27).
//   골격 = 보너스 2줄(현재 영웅 / 전체 영웅, 각 2항목) · 좌우 화살표 사이 코스튬 카드 가로 목록
//          · 하단 [장착 중] 버튼 + 우측 [?].
//   엘드리아 대응 / 의도적 차이
//     · costumes 모듈이 파킹이라 **보유 코스튬이 없다**. `기본`만 장착 상태로 두고 나머지는 잠금 카드.
//       모듈을 켜면 costumesFor(state, unit)이 그대로 목록을 채운다(docs/PARKED.md).
//     · 호드워의 PVP 수치는 대응 시스템이 없어 엘드리아 항목(공격·피해)으로 바꿔 적었다.
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { Portrait } from '../components';
import { charImage } from '../charImages';
import { fx } from '../feedback';
import { identity } from '../../system/concepts/index.mjs';
import { costumesFor } from '../../system/core/costumes.mjs';
import { isOn } from '../../system/core/features.mjs';

export default function HeroCostumePanel({ state, concept, unit, onMsg }) {
  const id = identity(concept, unit);
  const parked = !isOn('costumes');
  // `기본`(원래 외형)을 맨 앞에 두고, 그 뒤로 이 영웅이 입을 수 있는 코스튬을 붙인다.
  const list = [
    { id: null, label: '기본', emoji: id.emoji, image: charImage(concept.id, unit.characterId), owned: true, equipped: !unit.skin },
    ...costumesFor(state, unit),
  ];
  const [sel, setSel] = useState(0);
  const cur = list[Math.min(sel, list.length - 1)];

  const tapCard = (i) => {
    fx('tap');
    setSel(i);
    if (parked && i > 0) onMsg?.('🔒 코스튬 모듈이 아직 붙어 있지 않습니다');
  };

  return (
    <View style={c.wrap}>
      {/* 보너스 2줄 — 좌 제목 / 우 2항목 */}
      <View style={c.bonus}>
        <Text style={c.bKey}>현재 영웅 보너스</Text>
        <Text style={c.bVal}>공격 <Text style={c.bNum}>+0%</Text></Text>
        <Text style={c.bVal}>피해 감소 <Text style={c.bNum}>+0%</Text></Text>
      </View>
      <View style={c.bonus}>
        <Text style={c.bKey}>전체 영웅 보너스</Text>
        <Text style={c.bVal}>공격 <Text style={c.bNum}>+0</Text></Text>
        <Text style={c.bVal}>피해 증가 <Text style={c.bNum}>+0%</Text></Text>
      </View>

      {/* 카드 가로 목록 — 좌우 화살표 사이 */}
      <View style={c.deck}>
        <Text style={c.arrow}>‹</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={c.deckIn}>
          {list.map((x, i) => {
            const on = i === sel;
            const lock = !x.owned;
            return (
              <TouchableOpacity key={x.id || 'base'} style={[c.card, on && c.cardOn, lock && c.cardLock]}
                activeOpacity={0.85} onPress={() => tapCard(i)}
                accessibilityRole="button" accessibilityLabel={`${x.label}${x.equipped ? ' (장착 중)' : lock ? ' (미보유)' : ''}`}>
                {x.equipped && <Text style={c.worn}>장착 중</Text>}
                <Portrait emoji={x.emoji || '👗'} image={x.image} rarity={x.rarity || 'N'} size={38} dim={lock} />
                <Text style={c.cardTx} numberOfLines={1}>{x.label}</Text>
                <Text style={c.cardSub} numberOfLines={1}>{id.name}</Text>
                {lock && <Text style={c.cardLockIc}>🔒</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={c.arrow}>›</Text>
      </View>

      {/* 하단 — 상태 버튼 + ? */}
      <View style={c.foot}>
        <View style={c.state}>
          <Text style={c.stateTx}>{cur.equipped ? '장착 중' : cur.owned ? '장착' : '미보유'}</Text>
        </View>
        <TouchableOpacity style={c.help} activeOpacity={0.85}
          onPress={() => { fx('tap'); onMsg?.('코스튬은 외형을 바꾸고 소량의 보너스를 줍니다'); }}
          accessibilityRole="button" accessibilityLabel="코스튬 도움말">
          <Text style={c.helpTx}>?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const c = StyleSheet.create({
  wrap: { padding: 10 },

  bonus: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  bKey: { width: 108, color: '#3b2a12', fontSize: 10, fontWeight: '900' },
  bVal: { flex: 1, color: '#5c4526', fontSize: 10, fontWeight: '800' },
  bNum: { color: '#2f6b30', fontWeight: '900' },

  deck: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 6 },
  arrow: { color: T.accent, fontSize: 22, fontWeight: '900', paddingHorizontal: 2 },
  deckIn: { gap: 7, paddingHorizontal: 2 },
  card: { width: 62, borderRadius: 7, borderWidth: 2, borderColor: '#7a8ea8', backgroundColor: '#5f7996', alignItems: 'center', paddingVertical: 5 },
  cardOn: { borderColor: T.accent, backgroundColor: '#b8862a' },
  cardLock: { opacity: 0.6 },
  cardLockIc: { position: 'absolute', right: 3, top: 3, fontSize: 10 },
  worn: { position: 'absolute', left: -1, top: -1, zIndex: 3, color: '#eaffe0', backgroundColor: 'rgba(40,120,50,0.95)', fontSize: 7, fontWeight: '900', paddingHorizontal: 3, borderRadius: 3, overflow: 'hidden' },
  cardTx: { color: '#fff6e0', fontSize: 9, fontWeight: '900', marginTop: 3 },
  cardSub: { color: '#e0e8f2', fontSize: 7, fontWeight: '700' },

  foot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  state: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#9b9b9b', borderWidth: 2, borderColor: '#7d7d7d', alignItems: 'center' },
  stateTx: { color: '#eee', fontSize: 12, fontWeight: '900' },
  help: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#8a6d47', borderWidth: 2, borderColor: '#6b543a', alignItems: 'center', justifyContent: 'center' },
  helpTx: { color: '#f0e0c0', fontSize: 15, fontWeight: '900' },
});
