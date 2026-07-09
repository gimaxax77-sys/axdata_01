// ─────────────────────────────────────────────────────────────
// 진형 — 파티 "배치"에 전략을 부여한다.
// 각 편성 유닛을 전열(front)·중열(mid)·후열(back) 중 하나에 둔다.
//   · 전열 : 방어벽. 방어·체력↑ 대신 공격↓ (탱킹 자세). 정원 2.
//   · 중열 : 균형. 모든 스탯 소폭↑ (범용 자세). 정원 3.
//   · 후열 : 보호받는 딜러. 공격↑ 대신 방어·체력↓ (유리대포). 정원 2.
//   · 중열·후열은 전열이 최소 1명 있어야 보호받음 — 전열이 없으면 공격 보너스 소멸.
// 시너지와 마찬가지로 resolve()가 프로필 단계에서 적용한다.
//
// 하위호환: 아무도 중열/후열로 지정하지 않으면(=기본 전원 전열) 진형은
// "휴면" 상태로 어떤 보정도 걸지 않는다. 하나라도 배치하는 순간 발동.
// ─────────────────────────────────────────────────────────────

export const FORMATION_ROLES = ['front', 'mid', 'back'];
export const ROLE_LABEL = { front: '전열', mid: '중열', back: '후열' };
// 정원 — 전열2 · 중열3 · 후열2 = 총 7명 편성 구조.
export const ROLE_CAP = { front: 2, mid: 3, back: 2 };

// 진형 보정 계수 (전열/중열/후열 각각의 스탯 배수).
export const FORMATION_MODS = {
  front: { def: 1.25, hp: 1.15, dps: 0.85 },
  mid: { def: 1.05, hp: 1.05, dps: 1.05 },
  midExposed: { def: 1.05, hp: 1.05, dps: 1.0 }, // 전열 없이 노출된 중열
  back: { dps: 1.30, def: 0.80, hp: 0.90 },
  backExposed: { dps: 1.0, def: 0.80, hp: 0.90 }, // 전열 없이 노출된 후열
};

// formation 맵에서 uid의 역할을 읽는다 — 미지정은 전열.
function roleOf(formation, uid) {
  const r = formation && formation[uid];
  return FORMATION_ROLES.includes(r) ? r : 'front';
}

// uid의 진형 역할 — 미지정은 전열.
export function unitRole(state, uid) {
  return roleOf(state.formation, uid);
}

// 파티 내 역할별 인원수(정원 검사용).
function roleCounts(state) {
  const counts = { front: 0, mid: 0, back: 0 };
  for (const uid of state.party || []) counts[unitRole(state, uid)]++;
  return counts;
}

// 진형 배치: 편성된 유닛만 지정 가능. 대상 역할의 정원을 넘으면 거부.
export function setFormation(state, uid, role) {
  if (!FORMATION_ROLES.includes(role)) return { ok: false, reason: '잘못된 진형' };
  if (!state.party.includes(uid)) return { ok: false, reason: '편성되지 않은 유닛' };
  const cur = unitRole(state, uid);
  if (cur !== role) {
    const counts = roleCounts(state);
    if (counts[role] >= ROLE_CAP[role]) {
      return { ok: false, reason: `${ROLE_LABEL[role]} 정원(${ROLE_CAP[role]}) 초과` };
    }
  }
  state.formation = state.formation || {};
  if (role === 'front') delete state.formation[uid];
  else state.formation[uid] = role;
  return { ok: true, role };
}

// 전열→중열→후열→전열 순환. 정원이 찬 역할은 건너뛴다.
export function toggleFormation(state, uid) {
  const cur = unitRole(state, uid);
  const idx = FORMATION_ROLES.indexOf(cur);
  for (let step = 1; step <= FORMATION_ROLES.length; step++) {
    const next = FORMATION_ROLES[(idx + step) % FORMATION_ROLES.length];
    const r = setFormation(state, uid, next);
    if (r.ok) return r;
  }
  return { ok: false, reason: '배치할 자리가 없습니다' };
}

// 편성이 바뀌어 파티에 없는 uid가 남았으면 정리.
export function pruneFormation(state) {
  if (!state.formation) return;
  for (const uid of Object.keys(state.formation)) {
    if (!state.party.includes(uid)) delete state.formation[uid];
  }
}

// 진형 활성 여부 — 중열/후열이 1명 이상일 때만 발동.
export function formationActive(formation, party) {
  if (!formation) return false;
  return party.some((u) => roleOf(formation, u.uid) !== 'front');
}

// 전투 판정용 — 역할별 스탯 보정 계수를 반환(전열 유무에 따라 노출 여부 반영).
export function formationModsFor(formation, uid, hasFront) {
  const role = roleOf(formation, uid);
  if (role === 'front') return FORMATION_MODS.front;
  if (role === 'mid') return hasFront ? FORMATION_MODS.mid : FORMATION_MODS.midExposed;
  return hasFront ? FORMATION_MODS.back : FORMATION_MODS.backExposed;
}

// party 중 전열이 1명이라도 있는지(보호 여부 판정 공용).
export function hasFrontLine(formation, party) {
  return party.some((u) => roleOf(formation, u.uid) === 'front');
}

// 진형 요약(UI 브리핑용): 전열/중열/후열 인원과 노출 경고.
export function formationSummary(state) {
  const front = [], mid = [], back = [];
  for (const uid of state.party || []) {
    const role = unitRole(state, uid);
    (role === 'back' ? back : role === 'mid' ? mid : front).push(uid);
  }
  const active = mid.length > 0 || back.length > 0;
  const exposed = active && front.length === 0;
  return { front, mid, back, cap: ROLE_CAP, active, exposed };
}
