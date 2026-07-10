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
    ROGUE: { name: '도적', emoji: '🗡️' },
    ARCHER: { name: '궁수', emoji: '🏹' },
    MAGE: { name: '법사', emoji: '🔮' },
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
    // ── P1 신규: 속성×원형 공백 보강 ──
    { id: 'pyra', name: '피라', emoji: '🛡️', title: '홍염의 방벽', personality: '굳건한', element: 'FIRE', archetype: 'VANGUARD', rarity: 'SR', signature: 'SIG_EMBER_WALL',
      lines: { greet: '내 뒤는 안전하다.', bond: '내 불꽃으로 널 지키마.', levelup: '방벽이 뜨거워진다!' } },
    { id: 'frost', name: '프로스트', emoji: '🧊', title: '빙하의 자객', personality: '냉정한', element: 'WATER', archetype: 'STRIKER', rarity: 'SR', signature: 'SIG_GLACIER_EDGE',
      lines: { greet: '…끝은 한순간이다.', bond: '너에겐 칼끝을 거두지.', levelup: '더 날카로워졌다.' } },
    { id: 'marina', name: '마리나', emoji: '🌊', title: '조수의 치유사', personality: '온화한', element: 'WATER', archetype: 'SUPPORT', rarity: 'SR', signature: 'SIG_TIDE_HYMN',
      lines: { greet: '다친 곳은 없나요?', bond: '당신 곁이 제 바다예요.', levelup: '조수가 차오릅니다.' } },
    { id: 'signe', name: '시그네', emoji: '📯', title: '전열의 고수병', personality: '용맹한', element: 'FIRE', archetype: 'SUPPORT', rarity: 'R', signature: 'SIG_WAR_CHANT',
      lines: { greet: '진격 준비!', bond: '너와 함께라면 두렵지 않아!', levelup: '함성이 우렁차진다!' } },
    // ── P3 신화(UR) ──
    { id: 'aurel', name: '아우렐', emoji: '🌟', title: '여명의 성검사', personality: '고결한', element: 'LIGHT', archetype: 'STRIKER', rarity: 'UR', signature: 'SIG_DAWNBREAKER',
      lines: { greet: '여명이 어둠을 가른다.', bond: '너의 곁에서 새벽을 지키겠다.', levelup: '빛이 검에 깃든다!' } },
    { id: 'nyx', name: '닉스', emoji: '🔮', title: '심연의 대예언자', personality: '초연한', element: 'DARK', archetype: 'SUPPORT', rarity: 'UR', signature: 'SIG_ABYSS_ORACLE',
      lines: { greet: '심연이 너를 응시한다.', bond: '네 운명, 내가 지켜보마.', levelup: '계시가 깊어진다.' } },
    // ── 신규 원형: 도적·궁수·법사 ──
    { id: 'kai', name: '카이', emoji: '🥷', title: '풋내기 도둑', personality: '재빠른', element: 'WOOD', archetype: 'ROGUE', rarity: 'N', signature: 'SIG_ROGUE_NOVICE',
      lines: { greet: '들키기 전에 가자!', bond: '너한테는 손 안 대.', levelup: '더 빨라졌어!' } },
    { id: 'vera', name: '베라', emoji: '🔪', title: '칠흑의 자객', personality: '냉혹한', element: 'DARK', archetype: 'ROGUE', rarity: 'SSR', signature: 'SIG_NIGHT_FANG',
      lines: { greet: '그림자 속에서 기다렸다.', bond: '…네게만 등을 보이지.', levelup: '더 날카로운 어둠이 된다.' } },
    { id: 'robin', name: '로빈', emoji: '🏹', title: '숲의 궁수', personality: '차분한', element: 'WOOD', archetype: 'ARCHER', rarity: 'R', signature: 'SIG_FOREST_ARROW',
      lines: { greet: '바람의 방향을 읽는다.', bond: '너와는 표적을 나눌 수 있어.', levelup: '조준이 더 정밀해졌다.' } },
    { id: 'sylas', name: '사일러스', emoji: '💫', title: '빛의 궁성', personality: '고요한', element: 'LIGHT', archetype: 'ARCHER', rarity: 'SSR', signature: 'SIG_LIGHT_ARROW',
      lines: { greet: '빛은 과녁을 놓치지 않는다.', bond: '네 곁에서 활시위를 당기지.', levelup: '화살에 빛이 서린다.' } },
    { id: 'elara', name: '엘라라', emoji: '🕯️', title: '화염 마도사', personality: '열정적인', element: 'FIRE', archetype: 'MAGE', rarity: 'R', signature: 'SIG_INFERNO_BOLT',
      lines: { greet: '불꽃이 내 손끝에서 춤춰요.', bond: '당신 곁이라 더 뜨거워져요.', levelup: '마력이 타오릅니다!' } },
    { id: 'oriel', name: '오리엘', emoji: '🌀', title: '혼돈의 대마도사', personality: '초연한', element: 'DARK', archetype: 'MAGE', rarity: 'UR', signature: 'SIG_CHAOS_NOVA',
      lines: { greet: '혼돈이 내 부름에 응한다.', bond: '너만은 이 소용돌이 밖에 두마.', levelup: '금제가 하나 풀렸다.' } },
    // ── 원형별 등급 공백 보강(N/R/SR/SSR/UR 전 등급 커버) ──
    { id: 'toren', name: '토렌', emoji: '🔰', title: '풋내기 방패병', personality: '어리숙한', element: 'WOOD', archetype: 'VANGUARD', rarity: 'N', signature: 'SIG_VANGUARD_NOVICE',
      lines: { greet: '바, 방패는 자신 있어요!', bond: '지켜드릴게요, 진짜로요!', levelup: '조금은 든든해졌죠?' } },
    { id: 'kordan', name: '코르단', emoji: '🌋', title: '화염 성벽', personality: '불굴의', element: 'FIRE', archetype: 'VANGUARD', rarity: 'SSR', signature: 'SIG_FLAME_BASTION',
      lines: { greet: '이 성벽은 무너지지 않는다.', bond: '내 불꽃 뒤에서 안심해라.', levelup: '용암이 더 뜨거워진다!' } },
    { id: 'ymir', name: '이미르', emoji: '🏔️', title: '빙하 거인', personality: '태고의', element: 'WATER', archetype: 'VANGUARD', rarity: 'UR', signature: 'SIG_GLACIAL_TITAN',
      lines: { greet: '태고의 얼음이 깨어난다.', bond: '너를 위해 산이 되어주마.', levelup: '빙하가 더 두꺼워진다.' } },
    { id: 'nella', name: '넬라', emoji: '🌸', title: '견습 사제', personality: '순수한', element: 'LIGHT', archetype: 'SUPPORT', rarity: 'N', signature: 'SIG_SUPPORT_NOVICE',
      lines: { greet: '기도가 닿기를…', bond: '당신을 위해 기도할게요.', levelup: '조금씩 힘이 늘어요.' } },
    { id: 'jax', name: '잭스', emoji: '🥋', title: '뒷골목 칼잡이', personality: '거친', element: 'FIRE', archetype: 'ROGUE', rarity: 'R', signature: 'SIG_ALLEY_BLADE',
      lines: { greet: '어이, 조용히 끝내자.', bond: '너랑은 등 맞대도 되겠어.', levelup: '칼끝이 더 매서워졌다.' } },
    { id: 'mira', name: '미라', emoji: '🌫️', title: '안개 자객', personality: '은밀한', element: 'WATER', archetype: 'ROGUE', rarity: 'SR', signature: 'SIG_MIST_STRIKE',
      lines: { greet: '안개가 짙어지는군.', bond: '너에겐 모습을 감추지 않아.', levelup: '더 자취를 감출 수 있다.' } },
    { id: 'raven', name: '레이븐', emoji: '🌑', title: '심연의 그림자', personality: '무자비한', element: 'DARK', archetype: 'ROGUE', rarity: 'UR', signature: 'SIG_ABYSS_SHADOW',
      lines: { greet: '그림자에 이름은 없다.', bond: '…너만은 벨 수 없군.', levelup: '어둠이 더 깊어졌다.' } },
    { id: 'finn', name: '핀', emoji: '🍂', title: '견습 사냥꾼', personality: '순박한', element: 'WOOD', archetype: 'ARCHER', rarity: 'N', signature: 'SIG_ARCHER_NOVICE',
      lines: { greet: '활 좀 다룰 줄 알아요!', bond: '같이 사냥 나가요!', levelup: '손이 안 떨려요, 이제!' } },
    { id: 'lyra', name: '리라', emoji: '🌜', title: '달빛 궁수', personality: '냉철한', element: 'LIGHT', archetype: 'ARCHER', rarity: 'SR', signature: 'SIG_MOONLIGHT_SHOT',
      lines: { greet: '달빛 아래선 빗나가지 않는다.', bond: '너에게만 활시위를 늦추지.', levelup: '조준이 더 매서워졌다.' } },
    { id: 'seren', name: '세렌', emoji: '🦅', title: '천공의 대궁수', personality: '고고한', element: 'FIRE', archetype: 'ARCHER', rarity: 'UR', signature: 'SIG_CELESTIAL_ARROW',
      lines: { greet: '하늘 끝까지 꿰뚫는다.', bond: '네 곁에서만 활을 내린다.', levelup: '화살이 태양처럼 타오른다.' } },
    { id: 'pip', name: '핍', emoji: '📗', title: '견습 마법사', personality: '호기심 많은', element: 'WOOD', archetype: 'MAGE', rarity: 'N', signature: 'SIG_MAGE_NOVICE',
      lines: { greet: '이 주문, 성공할까요?', bond: '같이 마법 연습해요!', levelup: '오, 이번엔 안 터졌어요!' } },
    { id: 'thalia', name: '탈리아', emoji: '🌬️', title: '빙결 마도사', personality: '차가운', element: 'WATER', archetype: 'MAGE', rarity: 'SR', signature: 'SIG_FROST_NOVA',
      lines: { greet: '…얼어붙을 준비는 됐나.', bond: '너에게만 온기를 남기지.', levelup: '한기가 더 짙어진다.' } },
    { id: 'nocturne', name: '녹턴', emoji: '🌘', title: '칠흑의 대현자', personality: '신비로운', element: 'DARK', archetype: 'MAGE', rarity: 'SSR', signature: 'SIG_VOID_SURGE',
      lines: { greet: '어둠의 지식이 속삭인다.', bond: '네게만 금서를 펼쳐 보이지.', levelup: '봉인된 지식이 흘러든다.' } },
  ],

  // 코스튬 — 캐릭터별 외형+소량 보너스. 친밀도 Lv로 해금.
  // (캐릭터 id로 키잉. 보너스는 장착 시 Core 모디파이어로 흘러간다.)
  costumes: {
    kael: { id: 'kael_c1', name: '홍염 예복', emoji: '👘', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    luna: { id: 'luna_c1', name: '달빛 드레스', emoji: '👗', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    gwen: { id: 'gwen_c1', name: '서리 갑주', emoji: '🥋', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    ciel: { id: 'ciel_c1', name: '바람 무복', emoji: '🎐', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    bran: { id: 'bran_c1', name: '대지 중갑', emoji: '⛰️', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    ael: { id: 'ael_c1', name: '예언자 로브', emoji: '🔮', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    ara: { id: 'ara_c1', name: '폭풍 망토', emoji: '🧥', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    mir: { id: 'mir_c1', name: '수련복', emoji: '🥋', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    pyra: { id: 'pyra_c1', name: '홍염 판금', emoji: '🔥', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    frost: { id: 'frost_c1', name: '빙결 예장', emoji: '❄️', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    marina: { id: 'marina_c1', name: '심해 예복', emoji: '🌊', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    signe: { id: 'signe_c1', name: '전열 군장', emoji: '🎺', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    aurel: { id: 'aurel_c1', name: '여명 성의', emoji: '🌟', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    nyx: { id: 'nyx_c1', name: '심연 법의', emoji: '🌌', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    kai: { id: 'kai_c1', name: '견습 은신복', emoji: '🥷', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    vera: { id: 'vera_c1', name: '칠흑 야행복', emoji: '🖤', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    robin: { id: 'robin_c1', name: '숲의 사냥복', emoji: '🍃', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    sylas: { id: 'sylas_c1', name: '광명 궁성의', emoji: '✨', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    elara: { id: 'elara_c1', name: '홍염 로브', emoji: '🔥', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    oriel: { id: 'oriel_c1', name: '혼돈 성단의', emoji: '🌌', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    toren: { id: 'toren_c1', name: '견습 방패병 갑주', emoji: '🔰', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    kordan: { id: 'kordan_c1', name: '용암 판금', emoji: '🌋', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    ymir: { id: 'ymir_c1', name: '태고 빙갑', emoji: '🏔️', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    nella: { id: 'nella_c1', name: '견습 사제복', emoji: '🌸', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    jax: { id: 'jax_c1', name: '뒷골목 야행복', emoji: '🥋', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    mira: { id: 'mira_c1', name: '안개 망토', emoji: '🌫️', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    raven: { id: 'raven_c1', name: '심연 그림자옷', emoji: '🌑', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    finn: { id: 'finn_c1', name: '견습 사냥복', emoji: '🍂', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    lyra: { id: 'lyra_c1', name: '달빛 궁성의', emoji: '🌜', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    seren: { id: 'seren_c1', name: '천공 궁성복', emoji: '🦅', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    pip: { id: 'pip_c1', name: '견습 마법사 로브', emoji: '📗', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    thalia: { id: 'thalia_c1', name: '빙결 마도복', emoji: '🌬️', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
    nocturne: { id: 'nocturne_c1', name: '칠흑 현자복', emoji: '🌘', unlock: 5, bonus: { atk: 0.06, hp: 0.06, def: 0.06, spd: 0.06 } },
  },

  // 스토리 캠페인 — 월드 서사(챕터별 보스 앞의 이야기). Core가 진행/전투를 담당.
  campaign: [
    { title: '균열의 조짐', story: '엘드리아의 하늘에 균열이 번진다. 첫 마수가 성문을 두드리고, 견습들이 검을 든다.' },
    { title: '잿빛 숲', story: '숲이 시들어간다. 나무마다 어둠이 스며 마수를 낳는다. 그 근원을 찾아 깊이 들어선다.' },
    { title: '서리 관문', story: '얼어붙은 관문의 수호자가 길을 막는다. 오래된 맹세를 지키는 냉혹한 거인이다.' },
    { title: '폭풍의 첨탑', story: '번개가 첨탑을 휘감는다. 폭풍을 다스리는 옛 마법사가 침입자를 시험한다.' },
    { title: '빛과 그림자', story: '신전의 빛이 흔들린다. 배신한 사제가 그림자와 계약해 성역을 더럽혔다.' },
    { title: '심연의 문', story: '대지 아래 잠든 문이 열린다. 균열의 진원, 심연에서 무언가가 올라온다.' },
    { title: '왕좌의 그림자', story: '무너진 왕성의 옥좌에 그림자 군주가 앉아 있다. 세계를 삼키려는 자와의 대치.' },
    { title: '연대기의 끝', story: '균열의 핵심에서 종말이 형상을 갖춘다. 모든 유대와 성장을 걸고 마지막 일격을.' },
    // ── 2부: 심연의 잔재 ──
    { title: '잔재의 부활', story: '끝낸 줄 알았던 균열의 잔재가 되살아난다. 세계의 상처는 아직 아물지 않았다.' },
    { title: '타락한 영웅', story: '어둠에 물든 옛 동료가 앞을 막는다. 검을 겨누는 손이 무겁다.' },
    { title: '공허의 여왕', story: '균열 너머 공허에서 온 지배자가 강림한다. 존재 자체가 세계를 갉아먹는다.' },
    { title: '새벽의 맹세', story: '심연의 근원과 마주선다. 모든 것을 건 마지막 맹세 — 엘드리아에 새벽이 온다.' },
  ],
};
