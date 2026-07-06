// ─────────────────────────────────────────────────────────────
// 컨셉 스킨: 판타지
// 시스템의 추상 ID를 "표시 이름/테마"로만 매핑한다.
// 숫자/규칙은 하나도 건드리지 않는다.
// ─────────────────────────────────────────────────────────────

export const fantasyConcept = {
  id: 'fantasy',
  title: '엘드리아 연대기',
  palette: { primary: '#6b4fbb', accent: '#f5c542' },

  // 원형 ID → 컨셉상의 이름/이모지
  archetypes: {
    VANGUARD: { name: '수호기사', emoji: '🛡️' },
    STRIKER: { name: '검투사', emoji: '⚔️' },
    SUPPORT: { name: '성녀', emoji: '✨' },
  },

  // 자원 키 → 표시명
  resources: {
    currency: { name: '골드', emoji: '🪙' },
    growth: { name: '정수', emoji: '💠' },
    summon: { name: '소환석', emoji: '🔮' },
  },

  terms: { unit: '영웅', party: '원정대', stage: '층', energy: '기력' },

  // 캐릭터 도감 — 정체성. Core는 여기 mechanical 필드(archetype/signature/rarity)만 읽고
  // 이름/성격/속성 등 flavor는 표시에만 쓴다. 소환은 이 pool에서 개별 캐릭터를 뽑는다.
  roster: [
    { id: 'kael', name: '카엘', emoji: '🔥', title: '불꽃의 검사', personality: '불같은', element: '불', archetype: 'STRIKER', rarity: 'SSR', signature: 'SIG_FLAME_EDGE' },
    { id: 'luna', name: '루나', emoji: '🌙', title: '달빛 성녀', personality: '차분한', element: '빛', archetype: 'SUPPORT', rarity: 'SSR', signature: 'SIG_MOON_BLESSING' },
    { id: 'gwen', name: '그웬', emoji: '❄️', title: '서리 수호기사', personality: '과묵한', element: '물', archetype: 'VANGUARD', rarity: 'SR', signature: 'SIG_FROST_GUARD' },
    { id: 'ciel', name: '시엘', emoji: '🌪️', title: '바람의 무희', personality: '장난기 많은', element: '숲', archetype: 'STRIKER', rarity: 'SR', signature: 'SIG_WIND_DANCE' },
    { id: 'bran', name: '브란', emoji: '🪨', title: '대지의 방패', personality: '든든한', element: '숲', archetype: 'VANGUARD', rarity: 'R', signature: 'SIG_EARTH_AEGIS' },
    { id: 'ael', name: '아엘', emoji: '🕊️', title: '빛의 예언자', personality: '신비로운', element: '빛', archetype: 'SUPPORT', rarity: 'R', signature: 'SIG_LIGHT_ORACLE' },
    { id: 'ara', name: '아라', emoji: '⚡', title: '폭풍검', personality: '거친', element: '어둠', archetype: 'STRIKER', rarity: 'R', signature: 'SIG_STORM_BLADE' },
    { id: 'mir', name: '미르', emoji: '🗡️', title: '견습 검사', personality: '풋풋한', element: '숲', archetype: 'STRIKER', rarity: 'N', signature: 'SIG_NOVICE' },
  ],
};
