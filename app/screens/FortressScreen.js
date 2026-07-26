// 요새 탭 — 호드워 요새 맵. 기준: Gim 실기 캡처(2026-07-27).
//   골격 = 좌·우 세로 아이콘 레일 · 중앙 건물 노드 맵 · 하단 시스템 채팅 줄.
//   ⚠️ 2026-07-27 구조 변경 — 요새 탭이 **전투 화면에서 맵으로** 바뀌었다(Gim 지시).
//      전투 화면은 모험 탭 아래(BattleScreen)로 내려갔다.
//   엘드리아 대응 / 의도적 차이
//     · 건물 8개 중 실제로 동작하는 건 **영웅 제단(소환)** 뿐이다. 나머지는 대응 모듈이
//       파킹이거나 없어서 준비 중 패널로 들어간다(docs/PARKED.md 자물쇠 정책 — 막지 않는다).
//     · 캡처의 과금·이벤트 아이콘 20여 개는 넣지 않았다. 대응 기능이 없는 껍데기가 되기 때문.
//       실제로 동작하는 것(우편·설정)과 파킹된 상점만 레일에 둔다.
//     · 아트는 이모지 + 라벨 알약으로 먼저 간다(Gim 결정). 나중에 이미지만 갈아끼운다.
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from '../theme';
import { fx } from '../feedback';
import { isOn } from '../../system/core/features.mjs';
import { unreadMailCount } from '../../system/core/mailbox.mjs';
import { canClaimAttendance, missionList } from '../../system/core/daily.mjs';
import ComingSoon from './ComingSoon';
import SummonScreen from './SummonScreen';

// 건물 노드 — align: 'l'(좌) · 'c'(중앙) · 'r'(우). 캡처의 흩어진 배치를 흉내낸다.
// go: 'summon' 만 실제 화면으로 간다. 나머지는 준비 중 패널.
const BUILDINGS = [
  { key: 'shop', emoji: '🎈', name: '고블린 상점', align: 'l', note: '상점(shop) — 파킹' },
  { key: 'keep', emoji: '🏯', name: '공명 요새', align: 'c', note: '대응 모듈 없음 — 신규 개발', dot: true },
  { key: 'pen', emoji: '🐗', name: '오크 우리', align: 'l', note: '대응 모듈 없음 — 신규 개발', lock: true },
  { key: 'war', emoji: '⚔️', name: '전쟁 로비', align: 'r', note: '아레나·무한의 탑 — 파킹' },
  { key: 'party', emoji: '🏘️', name: '파티 로비', align: 'l', note: '편성은 모험 탭 하단에서 합니다' },
  { key: 'forge', emoji: '🔥', name: '아티팩트 용광로', align: 'r', note: '유물·장비 강화 — 파킹', dot: true },
  { key: 'ascend', emoji: '⭐', name: '승급 로비', align: 'l', note: '초월은 영웅 상세 › 초월 탭에서 합니다', dot: true },
  { key: 'summon', emoji: '🗿', name: '영웅 제단', align: 'c', go: 'summon', tag: '10연속 가능', dot: true },
];

const ALIGN = { l: 'flex-start', c: 'center', r: 'flex-end' };

export default function FortressScreen({ state, bump, concept, onGo, onOpenSettings }) {
  const [open, setOpen] = useState(null); // 들어간 건물 key

  const claimN = (canClaimAttendance(state) ? 1 : 0)
    + missionList(state).filter((m) => m.done && !m.claimed).length
    + unreadMailCount(state);

  if (open === 'summon') {
    return <SummonScreen state={state} bump={bump} concept={concept} onClose={() => setOpen(null)} />;
  }
  if (open) {
    const b = BUILDINGS.find((x) => x.key === open);
    return <ComingSoon icon={b.emoji} title={b.name} plan={[b.note]} onBack={() => setOpen(null)}
      note="이 건물로 들어오는 콘텐츠가 아직 붙어 있지 않습니다. 자리와 동선만 잡아 둔 상태예요." />;
  }

  return (
    <View style={f.wrap}>
      {/* 노을 진 사막 톤 배경 — 아트가 생기면 이 그라디언트를 이미지로 교체한다. */}
      <LinearGradient colors={['#e8a878', '#d98d63', '#c97a52', '#a8613f']} style={f.bg} pointerEvents="none" />

      {/* 좌측 레일 — 실제로 동작하는 것만 둔다 */}
      <View style={f.railL}>
        <TouchableOpacity style={f.rail} activeOpacity={0.85} onPress={() => { fx('tap'); onGo?.('perk'); }}
          accessibilityRole="button" accessibilityLabel="혜택(출석·보상)">
          <Text style={f.railIc}>🎁</Text><Text style={f.railTx}>혜택</Text>
          {claimN > 0 && <View style={f.dot} />}
        </TouchableOpacity>
        <TouchableOpacity style={f.rail} activeOpacity={0.85} onPress={() => { fx('tap'); setOpen('shop'); }}
          accessibilityRole="button" accessibilityLabel="상점 (준비 중)">
          <Text style={f.railIc}>💰</Text><Text style={f.railTx}>상점</Text>
          <Text style={f.railLock}>🔒</Text>
        </TouchableOpacity>
      </View>

      {/* 우측 레일 */}
      <View style={f.railR}>
        <TouchableOpacity style={f.rail} activeOpacity={0.85} onPress={() => { fx('tap'); onGo?.('field'); }}
          accessibilityRole="button" accessibilityLabel="필드(월드맵)">
          <Text style={f.railIc}>🌄</Text><Text style={f.railTx}>필드</Text>
        </TouchableOpacity>
        <TouchableOpacity style={f.rail} activeOpacity={0.85} onPress={() => { fx('tap'); onOpenSettings?.(); }}
          accessibilityRole="button" accessibilityLabel="설정">
          <Text style={f.railIc}>⚙️</Text><Text style={f.railTx}>설정</Text>
        </TouchableOpacity>
      </View>

      {/* 건물 노드 맵 */}
      <ScrollView style={f.flex} contentContainerStyle={f.scroll}>
        {BUILDINGS.map((b) => (
          <View key={b.key} style={[f.slot, { alignItems: ALIGN[b.align] }]}>
            {b.tag ? <Text style={f.tag}>{b.tag}</Text> : null}
            <TouchableOpacity activeOpacity={0.85} style={f.node}
              onPress={() => { fx('tap'); setOpen(b.key); }}
              accessibilityRole="button" accessibilityLabel={`${b.name}${b.go ? '' : ' (준비 중)'}`}>
              <Text style={f.nodeArt}>{b.emoji}</Text>
              <View style={[f.pill, b.go && f.pillOn]}>
                {b.lock ? <Text style={f.pillLock}>🔒</Text> : null}
                <Text style={f.pillName} numberOfLines={1}>{b.name}</Text>
              </View>
              {b.dot && <View style={f.nodeDot} />}
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 8 }} />
      </ScrollView>

      {/* 하단 시스템 줄 — 캡처의 채팅 줄 자리. 지금 할 일을 안내한다. */}
      <TouchableOpacity style={f.sys} activeOpacity={0.85} onPress={() => { fx('tap'); onGo?.('adventure'); }}
        accessibilityRole="button" accessibilityLabel="모험으로 이동">
        <Text style={f.sysIc}>💬</Text>
        <Text style={f.sysTx} numberOfLines={1}>
          {isOn('gacha') && (state.wallet.summon || 0) >= 100
            ? '영웅 제단에서 10연속 모집이 가능합니다'
            : `${state.stage}층 진행 중 · 모험에서 전투를 시작하세요`}
        </Text>
        <Text style={f.sysGo}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const f = StyleSheet.create({
  wrap: { flex: 1 },
  flex: { flex: 1 },
  bg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  scroll: { paddingVertical: 10, paddingHorizontal: 62, gap: 4 },

  // 좌·우 세로 레일
  railL: { position: 'absolute', left: 4, top: 8, gap: 6, zIndex: 5 },
  railR: { position: 'absolute', right: 4, top: 8, gap: 6, zIndex: 5 },
  rail: { width: 50, alignItems: 'center', backgroundColor: 'rgba(60,35,20,0.6)', borderWidth: 1, borderColor: '#8a6d47', borderRadius: 9, paddingVertical: 4 },
  railIc: { fontSize: 17 },
  railTx: { color: '#f0e0c0', fontSize: 8, fontWeight: '900' },
  railLock: { position: 'absolute', top: 1, right: 3, fontSize: 8 },
  dot: { position: 'absolute', top: -2, right: -2, width: 9, height: 9, borderRadius: 5, backgroundColor: T.danger },

  // 건물 노드
  slot: { width: '100%' },
  node: { alignItems: 'center', maxWidth: 150 },
  nodeArt: { fontSize: 42 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(35,22,12,0.85)', borderWidth: 1, borderColor: '#c8ab74', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3, marginTop: -4 },
  pillOn: { borderColor: T.accent, borderWidth: 2, backgroundColor: 'rgba(70,45,10,0.9)' },
  pillLock: { fontSize: 9 },
  pillName: { color: '#f5e6c8', fontSize: 11, fontWeight: '900' },
  nodeDot: { position: 'absolute', top: 2, right: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: T.danger, borderWidth: 1, borderColor: '#fff' },
  tag: { alignSelf: 'center', color: '#1d4d1d', backgroundColor: '#b7e39a', fontSize: 9, fontWeight: '900', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 1, overflow: 'hidden', marginBottom: 1 },

  // 하단 시스템 줄
  sys: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(25,15,8,0.8)', paddingHorizontal: 10, paddingVertical: 6 },
  sysIc: { fontSize: 13 },
  sysTx: { flex: 1, color: '#f0dcb4', fontSize: 10, fontWeight: '800' },
  sysGo: { color: T.accent, fontSize: 14, fontWeight: '900' },
});
