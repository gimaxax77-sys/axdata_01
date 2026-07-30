// 던전 목록 — 세븐식 카드 리스트. 재화별 전용 던전 + 무한의 탑.
//   근거(추정 포함): 세븐나이츠 키우기 커뮤니티 공략 — 골드 던전 · 영웅 경험치 던전 · 펫 경험치 던전
//   · 기사단 증표 던전 · 유물 던전 · 무한의 탑. 화면 구성(카드 배치·입장권 수치)은 실물 미확인 → 추정.
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { Card, fmt } from '../components';
import { fx } from '../feedback';

// 엘드리아 재화로 치환한 던전 목록. reward는 표시용(실제 보상 연결은 다음 단계).
const DUNGEONS = [
  { id: 'gold', icon: '🪙', name: '황금 던전', desc: '골드를 대량으로 얻습니다.', rw: 'currency' },
  { id: 'exp', icon: '📘', name: '경험의 시련', desc: '영웅 성장 재료를 얻습니다.', rw: 'growth' },
  { id: 'pet', icon: '🐾', name: '펫 수련장', desc: '펫 성장 재료를 얻습니다.', rw: 'growth' },
  { id: 'relic', icon: '🏺', name: '유물 발굴지', desc: '유물 강화 재료를 얻습니다.', rw: 'growth' },
  { id: 'token', icon: '🎖️', name: '기사단 시험장', desc: '특성 강화용 증표를 얻습니다.', rw: 'summon' },
];

export default function DungeonListScreen({ state, concept, onGo }) {
  const R = concept.resources;
  return (
    <ScrollView style={st.wrap} contentContainerStyle={st.content}>
      {/* 무한의 탑 — 세븐에서 별도 취급되는 상시 콘텐츠. 엘드리아는 원정(RunScreen)으로 연결. */}
      <TouchableOpacity activeOpacity={0.85} onPress={() => { fx('tap'); onGo?.('expedition'); }}
        accessibilityRole="button" accessibilityLabel="무한의 탑 입장">
        <Card style={st.tower}>
          <Text style={st.towerIc}>🗼</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.towerNm}>무한의 탑</Text>
            <Text style={st.towerSub}>층을 올라 영구 강화 재료를 모읍니다 · 최고 {state.peakStage}층</Text>
          </View>
          <Text style={st.go}>›</Text>
        </Card>
      </TouchableOpacity>

      <Text style={st.sect}>재화 던전</Text>
      {DUNGEONS.map((d) => (
        <Card key={d.id} style={st.row}>
          <Text style={st.rowIc}>{d.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.rowNm}>{d.name}</Text>
            <Text style={st.rowSub}>{d.desc}</Text>
          </View>
          <View style={st.rwBox}>
            <Text style={st.rwIc}>{R[d.rw].emoji}</Text>
            <Text style={st.rwTx}>보상</Text>
          </View>
          <Text style={st.soon}>준비 중</Text>
        </Card>
      ))}
      <Text style={st.note}>※ 재화 던전은 화면만 구성했습니다. 입장·보상 연결은 다음 단계입니다.</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1 },
  content: { padding: 12, gap: 8 },
  tower: { flexDirection: 'row', alignItems: 'center', gap: 10, borderColor: T.accent, borderWidth: 1 },
  towerIc: { fontSize: 30 },
  towerNm: { color: T.accent, fontSize: 15, fontWeight: '900' },
  towerSub: { color: T.muted, fontSize: 11, marginTop: 2 },
  go: { color: T.accent, fontSize: 22, fontWeight: '900' },
  sect: { color: T.text, fontSize: 13, fontWeight: '900', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIc: { fontSize: 24 },
  rowNm: { color: T.text, fontSize: 13, fontWeight: '800' },
  rowSub: { color: T.muted, fontSize: 10, marginTop: 2 },
  rwBox: { alignItems: 'center' },
  rwIc: { fontSize: 15 },
  rwTx: { color: T.muted, fontSize: 8, fontWeight: '700' },
  soon: { color: T.muted, fontSize: 9, fontWeight: '800', marginLeft: 6 },
  note: { color: T.muted, fontSize: 10, marginTop: 6, lineHeight: 15 },
});
