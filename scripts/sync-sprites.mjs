// 게임 로스터를 읽어 전투 스프라이트(idle/attack 시트)를 아트 스튜디오(axdata_09)로
// 생성·수집하고 app/unitSprites.js 의 SHEETS 레지스트리를 갱신하는 다리
//
// 흐름:
//   1) roster 순회 → 캐릭터별 anim_idle / anim_attack 프레임 시퀀스 생성 요청
//      (아트 스튜디오가 is_anim 에셋을 가로 스트립 시트 + atlas.json 으로 자동 패킹)
//   2) 시트 PNG 를 assets/units/<concept>/<id>/<id>_<state>.png 로 저장
//      함께 나온 atlas.json 도 옆에 저장(프레임 폭 frameW 재생성용)
//   3) 디스크의 시트 기준으로 unitSprites.js 의 SHEETS 맵 재생성
//
// 사용법:
//   ART_API=http://127.0.0.1:8000 node scripts/sync-sprites.mjs --limit 3   # 대표 N종
//   node scripts/sync-sprites.mjs                                            # 없는 것 전부
//   node scripts/sync-sprites.mjs --force                                    # 있어도 재생성
//   node scripts/sync-sprites.mjs --map-only                                 # 생성 없이 맵만
//
// 게임의 idle/attack 에 정확히 대응한다(hit/death 전용 애니는 아트 스튜디오에 없음).
// 데모 모드면 플레이스홀더 프레임이 나오므로 비용 없이 배관을 검증할 수 있다.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONCEPTS } from '../system/concepts/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const UNIT_DIR = path.join(ROOT, 'assets', 'units');
const UNIT_SPRITES_JS = path.join(ROOT, 'app', 'unitSprites.js');
const API = process.env.ART_API || 'http://127.0.0.1:8000';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const FORCE = has('--force');
const MAP_ONLY = has('--map-only');
const ONLY_CONCEPT = val('--concept', null);
const LIMIT = Number(val('--limit', 0)) || 0;
const FRAMES = Number(val('--frames', 6)) || 6;

// 게임 상태 ← 아트 스튜디오 애니 에셋 키
const STATE_MAP = [
  ['idle', 'anim_idle'],
  ['attack', 'anim_attack'],
];
const GENRE = { fantasy: 'high fantasy', scifi: 'sci-fi cyberpunk' };

function requestFor(conceptId, concept, ch) {
  const el = concept.elements?.[ch.element]?.name || ch.element || '';
  const arch = concept.archetypes?.[ch.archetype]?.name || ch.archetype || '';
  return {
    entity_type: 'character',
    genre: GENRE[conceptId] || conceptId,
    keywords: [ch.name, ch.title, `${el} 속성`, arch, ch.personality].filter(Boolean).join(', '),
    assets: STATE_MAP.map(([, k]) => k),
    variant_count: FRAMES,
    transparent: true,
    consistency: true,
    name: ch.name,
    role: arch,
  };
}

async function fetchFile(relPath, dest) {
  const res = await fetch(`${API}/files/${relPath}`);
  if (!res.ok) throw new Error(`파일 회수 실패 ${res.status}: ${relPath}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function genSprites(conceptId, concept, ch) {
  const res = await fetch(`${API}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestFor(conceptId, concept, ch)),
  });
  if (!res.ok) throw new Error(`generate 실패 ${res.status}: ${await res.text()}`);
  const data = await res.json();

  const outDir = path.join(UNIT_DIR, conceptId, ch.id);
  fs.mkdirSync(outDir, { recursive: true });

  let saved = 0;
  let demo = false;
  for (const [state, animKey] of STATE_MAP) {
    const sheet = (data.assets || []).find((a) => a.kind === `${animKey}_sheet`);
    if (!sheet) continue; // 프레임 1개 등으로 시트 미생성 시 스킵
    await fetchFile(sheet.path, path.join(outDir, `${ch.id}_${state}.png`));
    // atlas.json 은 시트와 같은 폴더·같은 접두어(_sheet.png → _atlas.json)
    const atlasRel = sheet.path.replace(/_sheet\.png$/, '_atlas.json');
    try {
      await fetchFile(atlasRel, path.join(outDir, `${ch.id}_${state}.atlas.json`));
    } catch {
      /* atlas 없으면 frameW 기본값 사용 */
    }
    if (sheet.demo) demo = true;
    saved++;
  }
  return { saved, demo };
}

// idle atlas 에서 프레임 간격(frameW)을 읽는다.
//   게임 규약(spriteAnim.mjs): "프레임 i 의 x오프셋 = -i*frameW" (균일 간격 가정).
//   아트 스튜디오 시트는 프레임 사이 패딩이 있으므로, 셀 크기(cell.w)가 아니라
//   atlas 의 실제 프레임 간격(frames[1].x - frames[0].x)을 frameW 로 써야 어긋나지 않는다.
function frameSize(conceptId, id) {
  const atlas = path.join(UNIT_DIR, conceptId, id, `${id}_idle.atlas.json`);
  try {
    const j = JSON.parse(fs.readFileSync(atlas, 'utf8'));
    const f = j.frames || [];
    const cellW = j.meta?.cell?.w || 128;
    const cellH = j.meta?.cell?.h || 128;
    const stride = f.length > 1 ? f[1].frame.x - f[0].frame.x : cellW;
    return { w: stride || cellW, h: cellH };
  } catch {
    return { w: 128, h: 128 };
  }
}

function rebuildUnitSprites() {
  const lines = ['const SHEETS = {'];
  let count = 0;
  for (const [conceptId, concept] of Object.entries(CONCEPTS)) {
    for (const ch of concept.roster || []) {
      const dir = path.join(UNIT_DIR, conceptId, ch.id);
      const idle = path.join(dir, `${ch.id}_idle.png`);
      if (!fs.existsSync(idle)) continue;
      const { w, h } = frameSize(conceptId, ch.id);
      lines.push(`  '${conceptId}:${ch.id}': {`);
      lines.push(`    frameW: ${w}, frameH: ${h},`);
      for (const [state] of STATE_MAP) {
        const p = path.join(dir, `${ch.id}_${state}.png`);
        if (fs.existsSync(p)) {
          lines.push(`    ${state}: require('../assets/units/${conceptId}/${ch.id}/${ch.id}_${state}.png'),`);
        }
      }
      lines.push('  },');
      count++;
    }
  }
  lines.push('};');
  const block = lines.join('\n');

  const src = fs.readFileSync(UNIT_SPRITES_JS, 'utf8');
  const re = /const SHEETS = \{[\s\S]*?\};/;
  if (!re.test(src)) throw new Error('unitSprites.js 에서 SHEETS 맵 블록을 찾지 못했습니다.');
  fs.writeFileSync(UNIT_SPRITES_JS, src.replace(re, block));
  return count;
}

async function main() {
  const entries = Object.entries(CONCEPTS).filter(([id]) => !ONLY_CONCEPT || id === ONLY_CONCEPT);
  let created = 0,
    skipped = 0,
    failed = 0,
    demoCount = 0;

  if (!MAP_ONLY) {
    for (const [conceptId, concept] of entries) {
      let done = 0;
      for (const ch of concept.roster || []) {
        if (LIMIT && done >= LIMIT) break;
        const idle = path.join(UNIT_DIR, conceptId, ch.id, `${ch.id}_idle.png`);
        if (!FORCE && fs.existsSync(idle)) {
          skipped++;
          continue;
        }
        done++;
        try {
          const r = await genSprites(conceptId, concept, ch);
          created++;
          if (r.demo) demoCount++;
          console.log(`  ✓ ${conceptId}:${ch.id.padEnd(9)} ${r.saved}상태${r.demo ? ' (demo)' : ''}`);
        } catch (e) {
          failed++;
          console.log(`  ✗ ${conceptId}:${ch.id} — ${e.message}`);
        }
      }
    }
    console.log(`\n생성 ${created} · 건너뜀 ${skipped} · 실패 ${failed}${demoCount ? ` · 데모 ${demoCount}` : ''}`);
  }

  const mapped = rebuildUnitSprites();
  console.log(`unitSprites.js 등록: ${mapped}종`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
