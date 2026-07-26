// 필드 탭 — 호드워식 세로 스크롤 월드맵. 기준 docs/HORDWAR_SPEC.md "필드 = 세로 스크롤 월드맵".
//   노드를 좌·우·중앙 지그재그로 흩어 배치하고, 각 노드는 [아이콘/🔒] 이름 › 라벨 알약을 단다.
//   ⚠️ 지금은 **골격만**이다(Gim 결정). 노드가 가리키는 모듈이 전부 파킹 상태라 전부 잠금 표시.
//      되살릴 때는 docs/PARKED.md 절차대로 플래그를 켜고 아래 NODES의 `go`에 탭 키를 넣으면 된다.
//   아트는 이모지 + 라벨 알약으로 먼저 간다(Gim 결정). 나중에 이미지만 갈아끼울 수 있게 emoji 자리를 분리해 뒀다.
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { fx } from '../feedback';

// 지그재그 배치 — align: 'l'(좌) · 'c'(중앙) · 'r'(우). 호드워 지도의 흩어진 느낌을 만든다.
// note = 이 자리에 들어올 엘드리아 모듈(다음 세션이 매핑을 다시 추론하지 않도록 남긴다).
const NODES = [
  { key: 'dragon', emoji: '🐲', name: '용의 시련', align: 'l', note: '대응 모듈 없음 — 신규 개발' },
  { key: 'calamity', emoji: '❄️', name: '재앙의 땅', align: 'r', note: '대응 모듈 없음 — 신규 개발' },
  { key: 'tower', emoji: '🗼', name: '수호자의 탑', align: 'c', note: '무한의 탑(tower) — 파킹', tag: '도전 가능' },
  { key: 'expedition', emoji: '🌀', name: '불타는 원정', align: 'l', note: '원정 로그라이트(expedition) — 파킹' },
  { key: 'arena', emoji: '🏟️', name: '투기장', align: 'r', note: '아레나(arena) — 파킹' },
  { key: 'deep', emoji: '🕳️', name: '심층 던전', align: 'c', note: '장비·룬 던전 — 파킹' },
  { key: 'bounty', emoji: '📜', name: '현상 게시판', align: 'l', note: '대응 모듈 없음 — 신규 개발' },
  { key: 'resource', emoji: '💎', name: '자원 던전', align: 'r', note: '골드·정수 던전(daily.mjs) — 화면만 없음' },
  { key: 'rift', emoji: '🔮', name: '시공의 문', align: 'c', note: '대응 모듈 없음 — 신규 개발', tag: '신규 기능' },
];

const ALIGN = { l: 'flex-start', c: 'center', r: 'flex-end' };

export default function FieldScreen({ onLocked }) {
  return (
    <View style={f.wrap}>
      {/* 양피지 톤 지도 배경 — 아트가 생기면 이 View를 이미지로 교체한다. */}
      <View style={f.parchment} pointerEvents="none" />
      <ScrollView style={f.flex} contentContainerStyle={f.scroll}>
        {NODES.map((n) => (
          <View key={n.key} style={[f.slot, { alignItems: ALIGN[n.align] }]}>
            {n.tag ? <Text style={f.tag}>{n.tag}</Text> : null}
            <TouchableOpacity activeOpacity={0.85} style={f.node}
              onPress={() => { fx('error'); onLocked?.(`🔒 ${n.name} — 준비 중입니다`); }}
              accessibilityRole="button" accessibilityLabel={`${n.name} 잠김 — ${n.note}`}>
              <Text style={f.nodeArt}>{n.emoji}</Text>
              <View style={f.pill}>
                <Text style={f.pillLock}>🔒</Text>
                <Text style={f.pillName} numberOfLines={1}>{n.name}</Text>
                <Text style={f.pillGo}>›</Text>
              </View>
              <Text style={f.note} numberOfLines={1}>{n.note}</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}

const f = StyleSheet.create({
  wrap: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 14, paddingTop: 10 },
  // 호드워는 갈색 양피지 지도. 아트 없이 톤만 맞춘다.
  parchment: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#2a2418' },

  slot: { marginBottom: 16 },
  // 노드 위 말풍선(도전 가능 · 신규 기능).
  tag: { color: '#1a2b12', backgroundColor: '#b7e08a', fontSize: 9, fontWeight: '900', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, marginBottom: 3, overflow: 'hidden' },
  node: { alignItems: 'center', maxWidth: 170 },
  nodeArt: { fontSize: 46, opacity: 0.5 },
  // 라벨 알약 — [🔒] 이름 › (오른쪽 화살표 꼬리)
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -4, paddingLeft: 7, paddingRight: 9, paddingVertical: 4, borderRadius: 13, backgroundColor: '#4a3a26', borderWidth: 1, borderColor: '#6b543a' },
  pillLock: { fontSize: 11 },
  pillName: { color: '#d8c9ad', fontSize: 11, fontWeight: '800' },
  pillGo: { color: '#a08c68', fontSize: 13, fontWeight: '900' },
  note: { color: '#7d6f57', fontSize: 8, fontWeight: '700', marginTop: 3 },
});
