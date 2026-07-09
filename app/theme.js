// 판타지 컨셉 기반 앱 테마 (라이트 퍼플 + 골드 게임 UI) — 밝은 톤 개편.
export const T = {
  bg: '#241a40',
  bgGrad: ['#2f2158', '#241a40', '#1c1434'], // 화면 배경 그라데이션
  surface: '#3b2d66',
  surfaceGrad: ['#453573', '#372a5e'], // 카드 그라데이션
  surface2: '#4b3b7d',
  line: '#63519e',
  primary: '#a186ec',
  primaryGrad: ['#b298f5', '#8266d6'],
  accent: '#ffd257',
  accentGrad: ['#ffe27a', '#f0b52e'],
  text: '#f9f6ff',
  muted: '#c3b7e2',
  good: '#7fe3a0',
  danger: '#ff5f7e',
  shadow: '#000',
  // 자원 색
  currency: '#ffd257',
  growth: '#71dcec',
  summon: '#d4a5ff',
};

// 등급별 스타일 — 색·글로우·그라데이션. 초상/결과/도감 전역에서 공유.
export const RARITY_META = {
  N: { label: '노멀', color: '#9aa0b5', grad: ['#8891a8', '#5c6480'], glow: 'rgba(154,160,181,0.0)' },
  R: { label: '레어', color: '#5aa9e6', grad: ['#6cbcf5', '#3a7fc4'], glow: 'rgba(90,169,230,0.45)' },
  SR: { label: '에픽', color: '#c98bff', grad: ['#d9a0ff', '#9b5fe0'], glow: 'rgba(201,139,255,0.5)' },
  SSR: { label: '전설', color: '#f5c542', grad: ['#ffe27a', '#e8a91f'], glow: 'rgba(245,197,66,0.6)' },
  UR: { label: '신화', color: '#ff5e8a', grad: ['#ff9ec4', '#e0407a'], glow: 'rgba(255,94,138,0.7)' },
};
export function rarityMeta(r) {
  return RARITY_META[r] || RARITY_META.N;
}

export const RES_META = {
  currency: { color: T.currency },
  growth: { color: T.growth },
  summon: { color: T.summon },
};
