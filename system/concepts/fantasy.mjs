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
    gem: { name: '다이아', emoji: '💎' },
  },

  terms: { unit: '영웅', party: '원정대', stage: '층', energy: '기력' },

  // 속성 ID(Core) → 표시명/이모지
  elements: {
    FIRE: { name: '불', emoji: '🔥' },
    WATER: { name: '물', emoji: '💧' },
    WOOD: { name: '숲', emoji: '🌿' },
    LIGHT: { name: '빛', emoji: '✨' },
    DARK: { name: '어둠', emoji: '🌑' },
  },

  // 캐릭터 도감 — 정체성. Core는 여기 mechanical 필드(archetype/signature/rarity/element)만
  // 읽고 이름/성격 등 flavor는 표시에만 쓴다. 소환은 이 pool에서 개별 캐릭터를 뽑는다.
  roster: [
    { id: 'kael', name: '카엘', emoji: '🔥', title: '불꽃의 검사', personality: '불같은', element: 'FIRE', archetype: 'STRIKER', rarity: 'SSR', signature: 'SIG_FLAME_EDGE',
      lines: { greet: '가자, 전부 태워버리자!', bond: '너와 함께라면 뭐든 태울 수 있어.', levelup: '힘이 솟구친다!' } },
    { id: 'luna', name: '루나', emoji: '🌙', title: '달빛 성녀', personality: '차분한', element: 'LIGHT', archetype: 'SUPPORT', rarity: 'SSR', signature: 'SIG_MOON_BLESSING',
      lines: { greet: '…오늘도 평온하길.', bond: '곁에 있어줘서 고마워요.', levelup: '달빛이 깃들었어요.' } },
    { id: 'gwen', name: '그웬', emoji: '❄️', title: '서리 수호기사', personality: '과묵한', element: 'WATER', archetype: 'VANGUARD', rarity: 'SR', signature: 'SIG_FROST_GUARD',
      lines: { greet: '…왔군.', bond: '너는… 신뢰한다.', levelup: '더 단단해졌다.' } },
    { id: 'ciel', name: '시엘', emoji: '🌪️', title: '바람의 무희', personality: '장난기 많은', element: 'WOOD', archetype: 'STRIKER', rarity: 'SR', signature: 'SIG_WIND_DANCE',
      lines: { greet: '놀러 왔어~?', bond: '헤헤, 너 진짜 좋아!', levelup: '바람이 빨라졌어!' } },
    { id: 'bran', name: '브란', emoji: '🪨', title: '대지의 방패', personality: '든든한', element: 'WOOD', archetype: 'VANGUARD', rarity: 'R', signature: 'SIG_EARTH_AEGIS',
      lines: { greet: '뒤는 맡겨.', bond: '내가 널 지키겠다.', levelup: '든든하지?' } },
    { id: 'ael', name: '아엘', emoji: '🕊️', title: '빛의 예언자', personality: '신비로운', element: 'LIGHT', archetype: 'SUPPORT', rarity: 'R', signature: 'SIG_LIGHT_ORACLE',
      lines: { greet: '운명이 보여요…', bond: '우리 인연은 별에 새겨졌죠.', levelup: '예언의 힘이 강해져요.' } },
    { id: 'ara', name: '아라', emoji: '⚡', title: '폭풍검', personality: '거친', element: 'DARK', archetype: 'STRIKER', rarity: 'R', signature: 'SIG_STORM_BLADE',
      lines: { greet: '덤벼!', bond: '…너, 나쁘지 않군.', levelup: '더 세졌다!' } },
    { id: 'mir', name: '미르', emoji: '🗡️', title: '견습 검사', personality: '풋풋한', element: 'WOOD', archetype: 'STRIKER', rarity: 'N', signature: 'SIG_NOVICE',
      lines: { greet: '잘 부탁해요!', bond: '저를 제자로 삼아주세요!', levelup: '저 강해졌죠?!' } },
  ],
};
