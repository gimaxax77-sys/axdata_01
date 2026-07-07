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
    // ── P1 신규: 속성×원형 공백 보강 ──
    { id: 'pyra', name: '파이로', emoji: '🛡️', title: '화염 방벽 프레임', personality: '견고한', element: 'FIRE', archetype: 'VANGUARD', rarity: 'SR', signature: 'SIG_EMBER_WALL',
      lines: { greet: '방열 장갑 전개.', bond: '보호 프로토콜 우선.', levelup: '장갑 출력 상승.' } },
    { id: 'frost', name: '글레이셔', emoji: '🧊', title: '빙결 어쌔신', personality: '냉철한', element: 'WATER', archetype: 'STRIKER', rarity: 'SR', signature: 'SIG_GLACIER_EDGE',
      lines: { greet: '…절단 예정.', bond: '너는 대상에서 제외.', levelup: '블레이드 예리화.' } },
    { id: 'marina', name: '티데', emoji: '🌊', title: '수복 드로이드', personality: '차분한', element: 'WATER', archetype: 'SUPPORT', rarity: 'SR', signature: 'SIG_TIDE_HYMN',
      lines: { greet: '손상 스캔 개시.', bond: '링크 안정도 최적.', levelup: '수복 효율 상승.' } },
    { id: 'signe', name: '클래리온', emoji: '📯', title: '전술 지휘 유닛', personality: '결연한', element: 'FIRE', archetype: 'SUPPORT', rarity: 'R', signature: 'SIG_WAR_CHANT',
      lines: { greet: '전술 링크 개방.', bond: '지휘 동기화 완료.', levelup: '지휘 대역 확장.' } },
    // ── P3 신화(UR) ──
    { id: 'aurel', name: '오리온', emoji: '🌟', title: '여명 프로토타입', personality: '숭고한', element: 'LIGHT', archetype: 'STRIKER', rarity: 'UR', signature: 'SIG_DAWNBREAKER',
      lines: { greet: '여명 시퀀스 개시.', bond: '수호 대상 최우선 등록.', levelup: '광자 출력 초월.' } },
    { id: 'nyx', name: '아뷔스', emoji: '🔮', title: '심연 예측 코어', personality: '초월적인', element: 'DARK', archetype: 'SUPPORT', rarity: 'UR', signature: 'SIG_ABYSS_ORACLE',
      lines: { greet: '심연 연산 접속.', bond: '네 궤적, 상시 추적.', levelup: '예측 심도 확장.' } },
  ],

  // 코스튬 — fantasy와 같은 구조(같은 캐릭터 id·해금·보너스), SF 외형.
  costumes: {
    kael: { id: 'kael_c1', name: '강화 프레임', emoji: '🦾', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    luna: { id: 'luna_c1', name: '정밀 코어', emoji: '🛰️', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    gwen: { id: 'gwen_c1', name: '냉각 장갑', emoji: '🛡️', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    ciel: { id: 'ciel_c1', name: '가속 부스터', emoji: '🚀', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    bran: { id: 'bran_c1', name: '중장 모듈', emoji: '🏗️', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    ael: { id: 'ael_c1', name: '예측 안테나', emoji: '📡', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    ara: { id: 'ara_c1', name: '방전 코일', emoji: '⚙️', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    mir: { id: 'mir_c1', name: '정비 슈트', emoji: '🔧', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    pyra: { id: 'pyra_c1', name: '방열 장갑', emoji: '🔥', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    frost: { id: 'frost_c1', name: '극저온 코팅', emoji: '❄️', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    marina: { id: 'marina_c1', name: '나노 수복막', emoji: '🌊', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    signe: { id: 'signe_c1', name: '지휘 안테나', emoji: '🎺', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    aurel: { id: 'aurel_c1', name: '광자 프레임', emoji: '🌟', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    nyx: { id: 'nyx_c1', name: '심연 코어', emoji: '🌌', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
  },

  // 스토리 캠페인 — 같은 진행/전투 로직, SF 서사로 교체.
  campaign: [
    { title: '궤도 이상', story: '스테이션 궤도에 정체불명의 신호. 첫 무인기가 도킹을 시도하고, 시제기들이 출격한다.' },
    { title: '폐기 구역', story: '버려진 구획의 시스템이 폭주한다. 오작동한 기계들이 침입자를 요격한다.' },
    { title: '냉각 관문', story: '동결된 격벽의 가디언이 통로를 봉쇄한다. 낡은 프로토콜을 고수하는 냉혹한 기체.' },
    { title: '방전 타워', story: '전력망이 타워를 휘감는다. 폭주한 에너지 코어가 접근자를 시험한다.' },
    { title: '광자와 암전', story: '중앙 코어의 빛이 요동친다. 이탈한 관리 AI가 암전 프로토콜로 구역을 장악했다.' },
    { title: '심층 게이트', story: '스테이션 심부의 봉인 게이트가 열린다. 이상 신호의 진원에서 무언가 깨어난다.' },
    { title: '지휘부의 그림자', story: '붕괴한 관제탑의 콘솔에 정체불명의 존재가 접속해 있다. 시스템을 삼키려는 자와의 대치.' },
    { title: '프로토콜의 끝', story: '이상의 핵심에서 종단 신호가 형상을 갖춘다. 모든 연결과 성장을 걸고 마지막 사출을.' },
    // ── 2부: 잔존 신호 ──
    { title: '잔존 신호', story: '소멸시킨 줄 알았던 이상 신호의 잔재가 재활성된다. 스테이션의 손상은 아직 복구되지 않았다.' },
    { title: '오염된 유닛', story: '바이러스에 감염된 옛 동료 기체가 요격해온다. 조준선을 겹치는 손이 무겁다.' },
    { title: '공허 코어', story: '게이트 너머 심연에서 온 마스터 코어가 강림한다. 그 연산이 궤도 전체를 잠식한다.' },
    { title: '여명 프로토콜', story: '이상의 근원과 마주한다. 모든 것을 건 최종 사출 — 스테이션에 여명이 켜진다.' },
  ],
};
