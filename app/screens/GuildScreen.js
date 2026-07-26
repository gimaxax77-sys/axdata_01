// 길드 탭 — 호드워식 길드 목록 화면. 기준 docs/HORDWAR_SPEC.md "길드".
//   골격 = 검색바 · 길드 목록 패널 · 하단 [길드 창설][일괄 신청].
//   ⚠️ 플레이어 카드(초상+닉+레벨+경험치바)는 **그리지 않는다.** App.js 글로벌 상단바에
//      이미 같은 정보가 있어 화면에 두 번 나왔다(2026-07-26 Gim 지적). 호드워는 탭마다
//      상단바가 없어 각 화면이 직접 그렸지만, 엘드리아는 상단바가 항상 떠 있다.
//   ⚠️ guild 모듈이 파킹 상태지만 **잠금으로 막지 않고 준비 중 패널로 들어가게** 둔다
//      (Gim 지시: 테스트·레이아웃 작업을 위해 개방, 출시 전에 정식으로 잠근다).
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { fx } from '../feedback';
import ComingSoon from './ComingSoon';

const PAGES = {
  rank: { icon: '🏅', title: '길드 랭킹', plan: ['길드 전투력 순위', '주간 기여도 랭킹'] },
  search: { icon: '🔍', title: '길드 검색', plan: ['길드 ID/이름으로 찾기', '가입 조건 필터'] },
  create: { icon: '🏗️', title: '길드 창설', plan: ['길드명·문장 설정', '창설 비용', '가입 조건 지정'] },
  apply: { icon: '📨', title: '일괄 신청', plan: ['조건이 맞는 길드에 한 번에 신청', '신청 현황 확인'] },
};

export default function GuildScreen() {
  const [page, setPage] = useState(null);
  const open = (k) => { fx('tap'); setPage(k); };

  if (page) return <ComingSoon {...PAGES[page]} onBack={() => setPage(null)}
    note="길드 모듈이 아직 붙어 있지 않습니다. 자리와 동선만 잡아 둔 상태예요." />;

  return (
    <View style={g.wrap}>
      {/* 검색바 */}
      <TouchableOpacity style={g.search} activeOpacity={0.85} onPress={() => open('search')}
        accessibilityRole="button" accessibilityLabel="길드 ID/이름 찾기">
        <Text style={g.searchPh}>길드 ID/이름 찾기</Text>
        <Text style={g.searchIc}>🔍</Text>
      </TouchableOpacity>

      {/* 길드 목록 패널 */}
      <View style={g.panel}>
        <View style={g.panelHead}>
          <View style={{ width: 44 }} />
          <Text style={g.panelTitle}>길드 목록</Text>
          <TouchableOpacity style={g.rank} activeOpacity={0.85} onPress={() => open('rank')}
            accessibilityRole="button" accessibilityLabel="길드 랭킹">
            <Text style={g.rankIc}>🏅</Text><Text style={g.rankTx}>랭킹</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={g.flex} contentContainerStyle={{ paddingBottom: 8 }}>
          <View style={g.empty}>
            <Text style={g.emptyIc}>🔒🏛️</Text>
            <Text style={g.emptyTx}>길드는 준비 중입니다</Text>
            <Text style={g.emptySub}>
              들어올 내용 — 길드 문장 · 이름 · 레벨 · 길드장 · 전투력 · 인원 수 · 신청 버튼{'\n'}
              가입 조건이 걸린 길드는 버튼 대신 조건이 표시됩니다.
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* 하단 고정 2버튼 — 호드워: 길드 창설(어두움) · 일괄 신청(금색) */}
      <View style={g.actions}>
        <TouchableOpacity style={g.actDark} activeOpacity={0.85} onPress={() => open('create')}
          accessibilityRole="button" accessibilityLabel="길드 창설">
          <Text style={g.actDarkTx}>길드 창설</Text>
        </TouchableOpacity>
        <TouchableOpacity style={g.actGold} activeOpacity={0.85} onPress={() => open('apply')}
          accessibilityRole="button" accessibilityLabel="일괄 신청">
          <Text style={g.actGoldTx}>일괄 신청</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const g = StyleSheet.create({
  wrap: { flex: 1 },
  flex: { flex: 1 },

  search: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, marginTop: 10, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: T.line },
  searchPh: { color: T.muted, fontSize: 11, fontWeight: '700', flex: 1 },
  searchIc: { fontSize: 13 },

  panel: { flex: 1, margin: 10, borderRadius: 12, backgroundColor: T.surface, borderWidth: 1, borderColor: T.line, paddingBottom: 4 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingTop: 4 },
  panelTitle: { color: T.accent, fontSize: 12, fontWeight: '900', textAlign: 'center', paddingVertical: 6 },
  rank: { width: 44, alignItems: 'center' },
  rankIc: { fontSize: 17, opacity: 0.8 },
  rankTx: { color: T.muted, fontSize: 8, fontWeight: '900' },

  empty: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 26 },
  emptyIc: { fontSize: 32, opacity: 0.6 },
  emptyTx: { color: T.text, fontSize: 13, fontWeight: '900', marginTop: 8 },
  emptySub: { color: T.muted, fontSize: 10, lineHeight: 17, textAlign: 'center', marginTop: 8 },

  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 10, paddingBottom: 8 },
  actDark: { flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: T.surface2, borderWidth: 1, borderColor: T.line, alignItems: 'center' },
  actDarkTx: { color: T.muted, fontSize: 12, fontWeight: '800' },
  actGold: { flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: T.accent, alignItems: 'center' },
  actGoldTx: { color: '#1a1400', fontSize: 13, fontWeight: '900' },
});
