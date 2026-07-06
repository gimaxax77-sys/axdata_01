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

  // 도감 — fantasy와 "완전히 같은 mechanical 구조"(archetype/rarity/signature 동일),
  // 이름/외형/속성만 SF로. 같은 시스템·같은 캐릭터 슬롯, 다른 인물.
  roster: [
    { id: 'kael', name: '유닛-07', emoji: '🔥', title: '화염 프레임', personality: '공격적인', element: '열', archetype: 'STRIKER', rarity: 'SSR', signature: 'SIG_FLAME_EDGE' },
    { id: 'luna', name: '노바', emoji: '🌙', title: '지원 코어', personality: '침착한', element: '광자', archetype: 'SUPPORT', rarity: 'SSR', signature: 'SIG_MOON_BLESSING' },
    { id: 'gwen', name: '크라이오', emoji: '❄️', title: '냉각 가디언', personality: '과묵한', element: '냉각', archetype: 'VANGUARD', rarity: 'SR', signature: 'SIG_FROST_GUARD' },
    { id: 'ciel', name: '제트', emoji: '🌪️', title: '고속 유닛', personality: '경쾌한', element: '바람', archetype: 'STRIKER', rarity: 'SR', signature: 'SIG_WIND_DANCE' },
    { id: 'bran', name: '불워크', emoji: '🪨', title: '중장 프레임', personality: '견고한', element: '중력', archetype: 'VANGUARD', rarity: 'R', signature: 'SIG_EARTH_AEGIS' },
    { id: 'ael', name: '오라클', emoji: '🕊️', title: '예측 AI', personality: '분석적인', element: '광자', archetype: 'SUPPORT', rarity: 'R', signature: 'SIG_LIGHT_ORACLE' },
    { id: 'ara', name: '스톰', emoji: '⚡', title: '방전 유닛', personality: '난폭한', element: '전기', archetype: 'STRIKER', rarity: 'R', signature: 'SIG_STORM_BLADE' },
    { id: 'mir', name: '루키', emoji: '🗡️', title: '시제기', personality: '미숙한', element: '기본', archetype: 'STRIKER', rarity: 'N', signature: 'SIG_NOVICE' },
  ],
};
