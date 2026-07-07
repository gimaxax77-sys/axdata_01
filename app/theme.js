// 판타지 컨셉 기반 앱 테마 (딥 퍼플 + 골드 게임 UI)
export const T = {
  bg: '#160f28',
  bgGrad: ['#1d1440', '#160f28', '#0f0a1e'], // 화면 배경 그라데이션
  surface: '#2a1f47',
  surfaceGrad: ['#312453', '#241a40'], // 카드 그라데이션
  surface2: '#372a5e',
  line: '#493a72',
  primary: '#8b6fd6',
  primaryGrad: ['#9b7ce6', '#6f52c0'],
  accent: '#f5c542',
  accentGrad: ['#ffd95e', '#e8a91f'],
  text: '#f2ecff',
  muted: '#a99cc9',
  good: '#6bd08a',
  danger: '#e5657f',
  shadow: '#000',
  // 자원 색
  currency: '#f5c542',
  growth: '#5fd0e0',
  summon: '#c98bff',
};

// 등급별 스타일 — 색·글로우·그라데이션. 초상/결과/도감 전역에서 공유.
export const RARITY_META = {
  N: { label: '노멀', color: '#9aa0b5', grad: ['#8891a8', '#5c6480'], glow: 'rgba(154,160,181,0.0)' },
  R: { label: '레어', color: '#5aa9e6', grad: ['#6cbcf5', '#3a7fc4'], glow: 'rgba(90,169,230,0.45)' },
  SR: { label: '에픽', color: '#c98bff', grad: ['#d9a0ff', '#9b5fe0'], glow: 'rgba(201,139,255,0.5)' },
  SSR: { label: '전설', color: '#f5c542', grad: ['#ffe27a', '#e8a91f'], glow: 'rgba(245,197,66,0.6)' },
};
export function rarityMeta(r) {
  return RARITY_META[r] || RARITY_META.N;
}

export const RES_META = {
  currency: { color: T.currency },
  growth: { color: T.growth },
  summon: { color: T.summon },
};
