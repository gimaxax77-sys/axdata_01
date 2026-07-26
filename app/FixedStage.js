// 기준 해상도 고정 출력 — 기기 해상도와 무관하게 같은 화면을 통째로 확대/축소해 보여준다(세븐식).
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

// 기준 해상도(논리 px). 기존 UI가 이 폭 기준으로 작성돼 있어 그대로 맞췄다. 비율 2.164:1.
export const DESIGN_W = 390;
export const DESIGN_H = 844;

export default function FixedStage({ children }) {
  const { width, height } = useWindowDimensions();
  // 가로·세로 중 더 빡빡한 쪽에 맞춰 균일 축소 — 남는 쪽은 레터박스(바깥 배경색).
  // ponytail: 폰(축소, scale<=1)만 검증. 태블릿처럼 확대되는 기기에서 터치 히트영역이
  // 레이아웃 박스(390x844)에 갇힐 수 있음 — 태블릿 지원 시 무대 박스를 화면크기로 바꿀 것.
  const scale = Math.min(width / DESIGN_W, height / DESIGN_H) || 1;
  return (
    <View style={st.fit}>
      <View style={[st.stage, { transform: [{ scale }] }]}>{children}</View>
    </View>
  );
}

const st = StyleSheet.create({
  fit: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  stage: { width: DESIGN_W, height: DESIGN_H, overflow: 'hidden' },
});
