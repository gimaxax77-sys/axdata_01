// 세븐나이츠 키우기 톤 — 딥 네이비 + 금색 + 밝은 파랑(보라 완전 제거).
export const T = {
  bg: '#111a2b',
  bgGrad: ['#1a2742', '#111a2b', '#0c131f'], // 화면 배경 그라데이션
  surface: '#1d2c49',
  surfaceGrad: ['#26395f', '#1b2942'], // 카드 그라데이션
  surface2: '#2a3d62',
  line: '#3e568c',
  primary: '#3f9bff',
  primaryGrad: ['#5bb2ff', '#2f7fe0'],
  accent: '#ffc93c',
  accentGrad: ['#ffdd72', '#f0a81c'],
  text: '#f2f7ff',
  muted: '#9fb4d6',
  good: '#4fd98a',
  danger: '#ff5d6c',
  shadow: '#000',
  // 자원 색
  currency: '#ffc93c',
  growth: '#3fd0e6',
  summon: '#5aa8ff',
};

// 여백 스케일 — 화면마다 제각각이던 padding/margin 매직넘버를 한 곳에서
// 조정하기 위한 공용 토큰.
export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 };

// 등급별 스타일 — 색·글로우·그라데이션. 초상/결과/도감 전역에서 공유.
//   에픽(SR)은 보라 대신 청록으로(보라 톤 제거 방침).
export const RARITY_META = {
  N: { label: '노멀', color: '#9aa6bf', grad: ['#8894ad', '#5c6784'], glow: 'rgba(154,166,191,0.0)' },
  R: { label: '레어', color: '#5aa9e6', grad: ['#6cbcf5', '#3a7fc4'], glow: 'rgba(90,169,230,0.45)' },
  SR: { label: '에픽', color: '#2fd6c4', grad: ['#5fe8d8', '#1fb0a2'], glow: 'rgba(47,214,196,0.5)' },
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
