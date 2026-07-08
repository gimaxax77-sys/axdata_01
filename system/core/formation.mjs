// ─────────────────────────────────────────────────────────────
// 진형 — 파티 "배치"에 전략을 부여한다.
// 각 편성 유닛을 전열(front)·후열(back) 중 하나에 둔다.
//   · 전열 : 방어벽. 방어·체력↑ 대신 공격↓ (탱킹 자세)
//   · 후열 : 보호받는 딜러. 공격↑ 대신 방어·체력↓ (유리대포)
//   · 후열은 전열이 최소 1명 있어야 보호받음 — 전원 후열이면 공격 보너스 소멸.
// 시너지와 마찬가지로 resolve()가 프로필 단계에서 적용한다.
//
// 하위호환: 아무도 후열로 지정하지 않으면(=기본 전원 전열) 진형은 "휴면"
// 상태로 어떤 보정도 걸지 않는다. 후열을 하나라도 배치하는 순간 발동.
// ─────────────────────────────────────────────────────────────

export const FORMATION_ROLES = ['front', 'back'];

// 진형 보정 계수 (전열/후열 각각의 스탯 배수).
export const FORMATION_MODS = {
  front: { def: 1.25, hp: 1.15, dps: 0.85 },
  back: { dps: 1.30, def: 0.80, hp: 0.90 },
  backExposed: { dps: 1.0, def: 0.80, hp: 0.90 }, // 전열 없이 노출된 후열
};

// uid의 진형 역할 — 미지정은 전열.
export function unitRole(state, uid) {
  return state.formation && state.formation[uid] === 'back' ? 'back' : 'front';
}

// 진형 배치: 편성된 유닛만 전열↔후열 지정 가능.
export function setFormation(state, uid, role) {
  if (!FORMATION_ROLES.includes(role)) return { ok: false, reason: '잘못된 진형' };
  if (!state.party.includes(uid)) return { ok: false, reason: '편성되지 않은 유닛' };
  state.formation = state.formation || {};
  if (role === 'front') delete state.formation[uid];
  else state.formation[uid] = role;
  return { ok: true, role };
}

// 전열↔후열 토글.
export function toggleFormation(state, uid) {
  return setFormation(state, uid, unitRole(state, uid) === 'back' ? 'front' : 'back');
}

// 편성이 바뀌어 파티에 없는 uid가 남았으면 정리.
export function pruneFormation(state) {
  if (!state.formation) return;
  for (const uid of Object.keys(state.formation)) {
    if (!state.party.includes(uid)) delete state.formation[uid];
  }
}

// 진형 활성 여부 — 후열이 1명 이상일 때만 발동.
export function formationActive(formation, party) {
  if (!formation) return false;
  return party.some((u) => formation[u.uid] === 'back');
}

// 진형 요약(UI 브리핑용): 전열/후열 인원과 노출 경고.
export function formationSummary(state) {
  const front = [], back = [];
  for (const uid of state.party || []) {
    (unitRole(state, uid) === 'back' ? back : front).push(uid);
  }
  const active = back.length > 0;
  const exposed = active && front.length === 0;
  return { front, back, active, exposed };
}
