// 필드 탭 — 호드워식 월드맵. 기준 docs/HORDWAR_SPEC.md "필드 = 세로 스크롤 월드맵".
//   ※ 엘드리아는 노드가 9개뿐이라 **스크롤 없이 한 화면**에 담는다(Gim 지시 2026-07-27).
//   노드를 좌·우·중앙 지그재그로 흩어 배치하고, 각 노드는 [아이콘/🔒] 이름 › 라벨 알약을 단다.
//   ⚠️ 노드가 가리키는 모듈이 전부 파킹 상태지만, **잠금으로 막지 않고 준비 중 패널로 들어가게** 둔다
//      (Gim 지시 2026-07-26: 테스트·레이아웃 작업을 위해 개방. 🔒 표시는 유지, 출시 전에 정식으로 잠근다).
//      되살릴 때는 docs/PARKED.md 절차대로 플래그를 켜고 노드에서 실제 화면으로 보내면 된다.
//   아트는 이모지 + 라벨 알약으로 먼저 간다(Gim 결정). 나중에 이미지만 갈아끼울 수 있게 emoji 자리를 분리해 뒀다.
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { fx } from '../feedback';
import ComingSoon from './ComingSoon';

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

export default function FieldScreen() {
  const [open, setOpen] = useState(null); // 진입한 노드 key

  if (open) {
    const n = NODES.find((x) => x.key === open);
    return <ComingSoon icon={n.emoji} title={n.name} plan={[n.note]} onBack={() => setOpen(null)}
      note="이 노드로 들어오는 콘텐츠가 아직 붙어 있지 않습니다. 자리와 동선만 잡아 둔 상태예요." />;
  }

  return (
    <View style={f.wrap}>
      {/* 양피지 톤 지도 배경 — 아트가 생기면 이 View를 이미지로 교체한다. */}
      <View style={f.parchment} pointerEvents="none" />
      {/* 스크롤 없이 9개를 한 화면에 담는다(Gim 지시 2026-07-27).
          고정 간격을 손으로 맞추면 기기 높이가 바뀔 때마다 다시 어긋나므로,
          남는 세로를 space-between으로 **균등 분배**한다. 지그재그 배치는 그대로. */}
      <View style={f.map}>
        {NODES.map((n) => (
          <View key={n.key} style={{ alignItems: ALIGN[n.align] }}>
            {n.tag ? <Text style={f.tag}>{n.tag}</Text> : null}
            <TouchableOpacity activeOpacity={0.85} style={f.node}
              onPress={() => { fx('tap'); setOpen(n.key); }}
              accessibilityRole="button" accessibilityLabel={`${n.name} — ${n.note}`}>
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
      </View>
    </View>
  );
}

const f = StyleSheet.create({
  wrap: { flex: 1 },
  // 호드워는 갈색 양피지 지도. 아트 없이 톤만 맞춘다.
  parchment: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#2a2418' },

  // 9개 노드를 좁은 간격으로 묶어 세로 가운데 정렬한다(Gim 지시 2026-07-27 "간격 좀 더 줄여줘").
  //   space-between은 남는 세로를 **노드 사이에** 전부 뿌려 간격이 벌어졌다.
  //   center + 작은 gap 으로 바꿔 남는 여백이 위아래로 가게 했다. 스크롤은 여전히 없다.
  map: { flex: 1, justifyContent: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 4 },

  // 노드 위 말풍선(도전 가능 · 신규 기능).
  tag: { color: '#1a2b12', backgroundColor: '#b7e08a', fontSize: 8, fontWeight: '900', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, marginBottom: 1, overflow: 'hidden' },
  node: { alignItems: 'center', maxWidth: 170 },
  // 아트·알약·주석을 함께 줄여 9개가 들어갈 여유를 만든다(Gim 지시 2026-07-27).
  nodeArt: { fontSize: 30, opacity: 0.5, lineHeight: 34 },
  // 라벨 알약 — [🔒] 이름 › (오른쪽 화살표 꼬리)
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -2, paddingLeft: 7, paddingRight: 9, paddingVertical: 2, borderRadius: 12, backgroundColor: '#4a3a26', borderWidth: 1, borderColor: '#6b543a' },
  pillLock: { fontSize: 10 },
  pillName: { color: '#d8c9ad', fontSize: 11, fontWeight: '800' },
  pillGo: { color: '#a08c68', fontSize: 12, fontWeight: '900' },
  note: { color: '#7d6f57', fontSize: 7, fontWeight: '700', marginTop: 1 },
});
