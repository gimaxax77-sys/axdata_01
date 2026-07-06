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
    gem: { name: '퀀텀', emoji: '💎' },
  },

  terms: { unit: '기체', party: '편대', stage: '섹터', energy: '연료' },

  // 속성 ID(Core) → SF 표시명. fantasy와 "같은 ID, 다른 이름".
  elements: {
    FIRE: { name: '열', emoji: '🔥' },
    WATER: { name: '냉각', emoji: '❄️' },
    WOOD: { name: '바람', emoji: '🌪️' },
    LIGHT: { name: '광자', emoji: '✨' },
    DARK: { name: '중력', emoji: '🌀' },
  },

  // 도감 — fantasy와 "완전히 같은 mechanical 구조"(archetype/rarity/signature/element 동일),
  // 이름/외형만 SF로. 같은 시스템·같은 캐릭터 슬롯, 다른 인물.
  roster: [
    { id: 'kael', name: '유닛-07', emoji: '🔥', title: '화염 프레임', personality: '공격적인', element: 'FIRE', archetype: 'STRIKER', rarity: 'SSR', signature: 'SIG_FLAME_EDGE',
      lines: { greet: '타겟 확인. 발열 개시.', bond: '동기화율 최대치 도달.', levelup: '출력 상승.' } },
    { id: 'luna', name: '노바', emoji: '🌙', title: '지원 코어', personality: '침착한', element: 'LIGHT', archetype: 'SUPPORT', rarity: 'SSR', signature: 'SIG_MOON_BLESSING',
      lines: { greet: '전 시스템 정상.', bond: '링크가 안정적입니다.', levelup: '코어 강화됨.' } },
    { id: 'gwen', name: '크라이오', emoji: '❄️', title: '냉각 가디언', personality: '과묵한', element: 'WATER', archetype: 'VANGUARD', rarity: 'SR', signature: 'SIG_FROST_GUARD',
      lines: { greet: '…대기 중.', bond: '신뢰도 상승.', levelup: '장갑 강화.' } },
    { id: 'ciel', name: '제트', emoji: '🌪️', title: '고속 유닛', personality: '경쾌한', element: 'WOOD', archetype: 'STRIKER', rarity: 'SR', signature: 'SIG_WIND_DANCE',
      lines: { greet: '부스터 예열 완료~', bond: '너랑 비행하면 최고!', levelup: '속도 초과 달성!' } },
    { id: 'bran', name: '불워크', emoji: '🪨', title: '중장 프레임', personality: '견고한', element: 'WOOD', archetype: 'VANGUARD', rarity: 'R', signature: 'SIG_EARTH_AEGIS',
      lines: { greet: '방어선 구축.', bond: '보호 대상으로 등록됨.', levelup: '장갑 증설 완료.' } },
    { id: 'ael', name: '오라클', emoji: '🕊️', title: '예측 AI', personality: '분석적인', element: 'LIGHT', archetype: 'SUPPORT', rarity: 'R', signature: 'SIG_LIGHT_ORACLE',
      lines: { greet: '확률 계산 중…', bond: '예측 정확도 상승.', levelup: '연산 능력 강화.' } },
    { id: 'ara', name: '스톰', emoji: '⚡', title: '방전 유닛', personality: '난폭한', element: 'DARK', archetype: 'STRIKER', rarity: 'R', signature: 'SIG_STORM_BLADE',
      lines: { greet: '방전 준비.', bond: '…쓸만하군.', levelup: '전압 상승!' } },
    { id: 'mir', name: '루키', emoji: '🗡️', title: '시제기', personality: '미숙한', element: 'WOOD', archetype: 'STRIKER', rarity: 'N', signature: 'SIG_NOVICE',
      lines: { greet: '시운전 시작합니다!', bond: '정식 배치 부탁해요!', levelup: '성능 향상 확인!' } },
  ],
};
