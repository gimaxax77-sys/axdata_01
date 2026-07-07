import { Platform } from 'react-native';
import { productForPackage } from '../system/core/iap.mjs';

// ─────────────────────────────────────────────────────────────
// 결제 어댑터 — 실 스토어 결제와 게임 보상 지급을 잇는 자리(골격).
//   · 스토어 모듈 없음(웹/개발): mock → 호출측이 기존 모의 지급을 유지.
//   · 네이티브 스토어: 아래 TODO 지점에 결제 모듈을 연결하면 실 결제로 승격.
// 결제와 지급을 분리해, UI는 어댑터만 부르고 지급은 shop.purchase가 담당한다.
// ─────────────────────────────────────────────────────────────

let IAP = null;
try { IAP = require('expo-in-app-purchases'); } catch { IAP = null; }

export function isStoreAvailable() {
  return !!IAP && Platform.OS !== 'web';
}

// 패키지 결제 시도. 반환 { ok, mock?, reason? }.
//   mock:true 이면 실결제가 아니므로 호출측이 모의 지급을 이어간다.
export async function purchasePackage(pkgId) {
  const product = productForPackage(pkgId);
  if (!product) return { ok: false, reason: '알 수 없는 상품' };
  if (!isStoreAvailable()) return { ok: true, mock: true };

  // TODO(실결제 연동): expo-in-app-purchases 예시
  //   await IAP.connectAsync();
  //   const sku = Platform.OS === 'ios' ? product.ios : product.android;
  //   await IAP.getProductsAsync([sku]);
  //   const res = await IAP.purchaseItemAsync(sku);
  //   결제 성공(res.responseCode === IAP.IAPResponseCode.OK) 시 { ok:true } 반환,
  //   호출측에서 shop.purchase(state, pkgId)로 지급 + finishTransactionAsync.
  // 현재는 결제 모듈 미연동 골격이라 mock 처리.
  return { ok: true, mock: true };
}
