// 길드 탭 — 호드워식 길드 목록 화면. 기준 docs/HORDWAR_SPEC.md "길드".
//   골격 = 상단 배경+플레이어 카드+랭킹 · 검색바 · 길드 목록 패널 · 하단 [길드 창설][일괄 신청].
//   ⚠️ 지금은 **골격만**이다(Gim 결정). guild 모듈이 파킹 상태라 목록·신청은 잠금.
//      되살릴 때는 docs/PARKED.md 절차대로 `features.guild = true` + app/parked/ArenaGuildScreen.js 참고.
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { fmt } from '../components';
import { fx } from '../feedback';
import { playerLevel, playerTitle } from '../../system/core/player.mjs';
import { getPartyUnits } from '../../system/core/gameState.mjs';
import { resolve } from '../../system/core/resolution.mjs';
import { playStage } from '../../system/core/difficulty.mjs';
import { accountMods } from '../../system/core/balance.mjs';

export default function GuildScreen({ state, onLocked }) {
  const lvl = playerLevel(state);
  const expPct = Math.round(((Math.sqrt(Math.max(1, state.peakStage || 1)) * 2) % 1) * 100);
  const power = resolve(getPartyUnits(state), playStage(state).challenge, accountMods(state), state.formation).score || 0;
  const lock = (what) => { fx('error'); onLocked?.(`🔒 ${what} — 길드는 준비 중입니다`); };

  return (
    <View style={g.wrap}>
      {/* 상단 배경 + 플레이어 카드 + 랭킹 (호드워: 길드 마을 일러스트 자리) */}
      <View style={g.hero}>
        <View style={g.pcard}>
          <View style={g.face}><Text style={g.faceTx}>🧝</Text><View style={g.faceLv}><Text style={g.faceLvTx}>{lvl}</Text></View></View>
          <View style={g.pcol}>
            <Text style={g.pname} numberOfLines={1}>{playerTitle(lvl)}</Text>
            <View style={g.exp}><View style={[g.expFill, { width: `${expPct}%` }]} /></View>
            <Text style={g.ppow}>⚜ {fmt(power)}</Text>
          </View>
        </View>
        <TouchableOpacity style={g.rank} activeOpacity={0.85} onPress={() => lock('랭킹')}
          accessibilityRole="button" accessibilityLabel="길드 랭킹 잠김">
          <Text style={g.rankIc}>🏅</Text><Text style={g.rankTx}>랭킹</Text>
        </TouchableOpacity>
      </View>

      {/* 검색바 */}
      <TouchableOpacity style={g.search} activeOpacity={0.85} onPress={() => lock('길드 검색')}
        accessibilityRole="button" accessibilityLabel="길드 ID/이름 찾기 잠김">
        <Text style={g.searchPh}>길드 ID/이름 찾기</Text>
        <Text style={g.searchIc}>🔍</Text>
      </TouchableOpacity>

      {/* 길드 목록 패널 */}
      <View style={g.panel}>
        <Text style={g.panelTitle}>길드 목록</Text>
        <ScrollView style={g.flex} contentContainerStyle={{ paddingBottom: 8 }}>
          <View style={g.empty}>
            <Text style={g.emptyIc}>🏛️</Text>
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
        <TouchableOpacity style={g.actDark} activeOpacity={0.85} onPress={() => lock('길드 창설')}
          accessibilityRole="button" accessibilityLabel="길드 창설 잠김">
          <Text style={g.actDarkTx}>길드 창설</Text>
        </TouchableOpacity>
        <TouchableOpacity style={g.actGold} activeOpacity={0.85} onPress={() => lock('일괄 신청')}
          accessibilityRole="button" accessibilityLabel="일괄 신청 잠김">
          <Text style={g.actGoldTx}>일괄 신청</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const g = StyleSheet.create({
  wrap: { flex: 1 },
  flex: { flex: 1 },

  hero: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 10, paddingTop: 10, paddingBottom: 12, backgroundColor: '#20321f' },
  pcard: { flexDirection: 'row', gap: 7, flex: 1 },
  face: { width: 40, height: 40, borderRadius: 8, borderWidth: 2, borderColor: T.good, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  faceTx: { fontSize: 20 },
  faceLv: { position: 'absolute', right: -4, bottom: -4, minWidth: 17, borderRadius: 9, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: T.good, alignItems: 'center' },
  faceLvTx: { color: '#fff', fontSize: 8, fontWeight: '900' },
  pcol: { flex: 1, justifyContent: 'center' },
  pname: { color: '#fff', fontSize: 12, fontWeight: '900' },
  exp: { height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.5)', overflow: 'hidden', marginTop: 3 },
  expFill: { height: 5, borderRadius: 3, backgroundColor: T.accent },
  ppow: { color: T.accent, fontSize: 11, fontWeight: '900', marginTop: 3 },
  rank: { alignItems: 'center', paddingHorizontal: 6 },
  rankIc: { fontSize: 22, opacity: 0.7 },
  rankTx: { color: '#cbd6c4', fontSize: 8, fontWeight: '800' },

  search: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, marginTop: -8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: T.line },
  searchPh: { color: T.muted, fontSize: 11, fontWeight: '700', flex: 1 },
  searchIc: { fontSize: 13 },

  panel: { flex: 1, margin: 10, borderRadius: 12, backgroundColor: T.surface, borderWidth: 1, borderColor: T.line, paddingBottom: 4 },
  panelTitle: { color: T.accent, fontSize: 12, fontWeight: '900', textAlign: 'center', paddingVertical: 8 },
  empty: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 26 },
  emptyIc: { fontSize: 38, opacity: 0.55 },
  emptyTx: { color: T.text, fontSize: 13, fontWeight: '900', marginTop: 8 },
  emptySub: { color: T.muted, fontSize: 10, lineHeight: 17, textAlign: 'center', marginTop: 8 },

  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 10, paddingBottom: 8 },
  actDark: { flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: T.surface2, borderWidth: 1, borderColor: T.line, alignItems: 'center' },
  actDarkTx: { color: T.muted, fontSize: 12, fontWeight: '800' },
  actGold: { flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: T.accent, alignItems: 'center' },
  actGoldTx: { color: '#1a1400', fontSize: 13, fontWeight: '900' },
});
