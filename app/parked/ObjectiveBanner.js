// [파킹] 다음 목표 배너 — Onboarding.js에서 떼어낸 미배선 컴포넌트. docs/PARKED.md 참고.
//   어디서도 렌더되지 않았고, 내부 목적지(roster/gacha/content)가 지금 없는 옛 탭 이름이라
//   되살릴 때는 tutorial.mjs의 tab 값과 App.js TABS 키를 먼저 맞춰야 한다.
import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { T } from '../theme';
import { nextObjective } from '../../system/core/tutorial.mjs';

function hasBatchim(w){const c=w.charCodeAt(w.length-1);if(c<0xAC00||c>0xD7A3)return false;return (c-0xAC00)%28!==0;}
const eul = (w) => w + (hasBatchim(w) ? '을' : '를');

// 다음 목표 배너 — state에서 유도. 탭하면 해당 탭으로 이동.
export function ObjectiveBanner({ state, concept, onGo }) {
  const obj = nextObjective(state);
  if (!obj) return null;
  const U = concept.terms.unit, S = concept.terms.stage;
  const TEXT = {
    level: `🎯 ${eul(U)} 레벨업하세요 — ${S} ${obj.target} 도달 시 소환 해금`,
    summon: `🎯 소환 탭에서 ${eul(U)} 뽑아 파티를 모으세요`,
    party: `🎯 영웅 탭 > 편성에서 파티를 짜세요 (전투력 합산)`,
    prestige: `✨ 환생으로 영구 배수를 얻고 더 깊이 도전하세요 (방치 탭)`,
    formation: `⚔️ 진형(전열/후열)으로 전략을 세우세요 — 영웅 탭 > 편성`,
    arena: `🏆 아레나에 도전하세요 — 콘텐츠 탭 > 경쟁 (약자 보호 매칭)`,
  };
  // 탭 재편(7→5)으로 사라진 목적지 리매핑 — arena/meta는 흡수된 탭으로 이동.
  const goTab = { arena: 'content', meta: 'roster' }[obj.tab] || obj.tab;
  return (
    <TouchableOpacity style={c.banner} activeOpacity={0.8} onPress={() => onGo(goTab)}>
      <Text style={c.bannerText} numberOfLines={2}>{TEXT[obj.id]}</Text>
      <Text style={c.bannerGo}>›</Text>
    </TouchableOpacity>
  );
}


const c = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 14, marginTop: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, backgroundColor: T.surface2, borderWidth: 1, borderColor: T.accent },
  bannerText: { color: T.text, fontSize: 12, fontWeight: '800', flex: 1 },
  bannerGo: { color: T.accent, fontSize: 16, fontWeight: '900' },
});
