// 기능 플래그 — 선택 모듈 on/off (단순 코어 + 옵션 모듈 구조)
// 최소 코어(캐릭터·전투·파티·캠페인·성장)는 항상 켜짐(여기 없음).
// 각 선택 모듈은 진입점에서 isOn('key') 로 확인해 off면 스킵한다.
//
// ▶ 모듈 추가법: (1) MODULE_META 에 {key:{label,group,desc}} 추가
//                (2) FEATURES 에 key: true 한 줄 추가
//                (3) 해당 모듈 코드 진입점에 isOn('key') 가드
//                컨트롤 판넬(control-panel.bat)이 자동으로 인식한다.

// 모듈 메타 — 컨트롤 판넬 표시용(그룹별 구분). 순수 정보, 로직 없음.
export const MODULE_META = {
  elements:  { label: '속성 상성',   group: '전투',      desc: '속성 유불리·속성 시너지' },
  rarity:    { label: '등급(N~UR)',  group: '전투',      desc: '캐릭터/장비/펫 품질 등급·전투력 배수' },
  gacha:     { label: '가챠 소환',   group: '수집·소환', desc: '캐릭터/장비 뽑기(천장 포함)' },
  summon:    { label: '소환 숙련',   group: '수집·소환', desc: '소환 누적 보상' },
  sigweapon: { label: '시그니처 무기', group: '수집·소환', desc: '캐릭터 전용 무기' },
  gear:      { label: '장비',        group: '장비·강화', desc: '장비 착용·강화·분해' },
  runes:     { label: '룬',          group: '장비·강화', desc: '룬 세팅' },
  relics:    { label: '유물',        group: '장비·강화', desc: '유물 강화' },
  emblems:   { label: '엠블럼(문장)', group: '장비·강화', desc: '계정 공유 버프' },
  pets:      { label: '펫',          group: '동료',      desc: '펫 보유·장착' },
  guardians: { label: '가디언(정령)', group: '동료',      desc: '가디언 보유·장착' },
  costumes:  { label: '코스튬',      group: '외형',      desc: '캐릭터 외형·소량 보너스' },
  arena:     { label: '아레나',      group: '콘텐츠',    desc: '경쟁 전투' },
  guild:     { label: '길드',        group: '콘텐츠',    desc: '길드 시스템' },
  tower:     { label: '무한의 탑',   group: '콘텐츠',    desc: '층 등반 콘텐츠' },
  expedition:{ label: '원정(로그라이트)', group: '콘텐츠', desc: '좌→우 진격 런·강화 3택·소모전' },
  season:    { label: '시즌',        group: '콘텐츠',    desc: '시즌 패스·보상' },
  events:    { label: '이벤트',      group: '콘텐츠',    desc: '한정 이벤트' },
  intimacy:  { label: '친밀도',      group: '관계',      desc: '캐릭터 호감도' },
  shop:      { label: '상점',        group: '상점',      desc: '상점·교환' },
};

// 플래그 값 — 컨트롤 판넬이 이 블록의 true/false 만 토글한다(한 줄=한 모듈).
//
// ⚠️ 2026-07-25 호드워 인터페이스 전환(Gim 지시) — 선택 모듈 18종을 **전부 파킹**했다.
//    코어(캐릭터·전투·파티·캠페인·성장) 위에 호드워 UI를 백지에서 올리고,
//    필요한 모듈만 하나씩 다시 물린다. 되살리는 법은 `docs/PARKED.md`.
//    elements·rarity 2종만 켜둔다 — 호드워 UI **자체의 구성요소**이기 때문이다
//    (편성 화면의 속성 아이콘·속성 필터 바 / 등급 원형 뱃지 S+·S·A).
export const FEATURES = {
  elements: true,  // 유지 — 호드워 속성 필터·속성 아이콘
  rarity: true,    // 유지 — 호드워 등급 원형 뱃지
  gacha: true,     // 되살림 2026-07-26 — 호드워 「영웅 제단」(모집). app/screens/SummonScreen.js
  summon: false,
  sigweapon: false,
  gear: false,
  runes: false,
  relics: false,
  emblems: false,
  pets: false,
  guardians: false,
  costumes: false,
  arena: false,
  guild: false,
  tower: false,
  expedition: false,
  season: false,
  events: false,
  intimacy: false,
  shop: false,
};

// 선택 모듈이 켜져 있는지. 코어(플래그 없는 키)는 항상 true.
export function isOn(key) {
  return FEATURES[key] !== false;
}

// 단순 코어 프리셋 — 최소 코어 외 선택 모듈을 전부 끈 값 묶음.
export function simplePreset() {
  const f = {};
  for (const k of Object.keys(FEATURES)) f[k] = false;
  return f;
}
