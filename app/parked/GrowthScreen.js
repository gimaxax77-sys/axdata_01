// 성장 화면 — 세븐 📈 성장 탭. 기존 GrowthPanel(펫·유물·엠블럼·정령)을 독립 탭으로 올린 래퍼.
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import GrowthPanel from './GrowthPanel';

// GrowthPanel은 원래 로스터의 ScrollView 안에 얹히던 조각이라 스크롤이 없다 — 독립 탭에선 여기서 씌운다.
export default function GrowthScreen({ state, bump, concept }) {
  return (
    <ScrollView style={st.wrap} contentContainerStyle={st.content}>
      <GrowthPanel state={state} bump={bump} concept={concept} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1 },
  content: { padding: 12, paddingBottom: 24 },
});
