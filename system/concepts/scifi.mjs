// ─────────────────────────────────────────────────────────────
// 컨셉 스킨: SF
// fantasy.mjs 와 "완전히 같은 구조". 이름만 다르다.
// → 같은 시스템이 전혀 다른 게임처럼 보이는 이유가 여기 있다.
// ─────────────────────────────────────────────────────────────

export const scifiConcept = {
  id: 'scifi',
  title: '오비탈 프로토콜',
  palette: { primary: '#1fb6c9', accent: '#ff6b3d' },

  archetypes: {
    VANGUARD: { name: '가디언 프레임', emoji: '🤖' },
    STRIKER: { name: '레이저 유닛', emoji: '🔫' },
    SUPPORT: { name: '지원 드론', emoji: '🛰️' },
  },

  resources: {
    currency: { name: '크레딧', emoji: '💳' },
    growth: { name: '코어', emoji: '🔋' },
    summon: { name: '설계도', emoji: '📡' },
  },

  terms: { unit: '기체', party: '편대', stage: '섹터', energy: '연료' },
};
