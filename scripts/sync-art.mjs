// 게임 로스터를 읽어 "없는 캐릭터 초상"만 아트 스튜디오(axdata_09)로 생성·수집하는 다리
//
// 흐름:
//   1) system/concepts 의 roster(fantasy/scifi)를 순회
//   2) assets/char/<concept>/<id>.png 가 없으면 아트 스튜디오에 초상 생성 요청
//      (POST /api/generate) → 응답의 portrait 경로를 GET /files 로 회수해 저장
//   3) 디스크에 실제로 존재하는 PNG 기준으로 app/charImages.js 의 CHAR_IMAGES 맵 재생성
//
// 사용법:
//   ART_API=http://127.0.0.1:8000 node scripts/sync-art.mjs          # 없는 것만 생성
//   node scripts/sync-art.mjs --concept fantasy                      # 한 컨셉만
//   node scripts/sync-art.mjs --force                                # 있어도 다시 생성
//   node scripts/sync-art.mjs --limit 3                              # 앞에서 N개만(테스트)
//   node scripts/sync-art.mjs --map-only                             # 생성 없이 맵만 갱신
//
// 아트 스튜디오가 데모 모드(키 없음)면 플레이스홀더 PNG가 생성되므로, API 비용 없이
// "발주 → 생성 → 저장 → 앱 반영" 배관 전체를 먼저 검증할 수 있다.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONCEPTS } from '../system/concepts/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHAR_DIR = path.join(ROOT, 'assets', 'char');
const CHAR_IMAGES_JS = path.join(ROOT, 'app', 'charImages.js');

const API = process.env.ART_API || 'http://127.0.0.1:8000';

// ── 인자 파싱 ──────────────────────────────────────────────
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

// 아트 스튜디오 genre / 아트스타일을 컨셉에 맞춰 매핑(실 API 품질용, 데모엔 무해).
const GENRE = { fantasy: 'high fantasy', scifi: 'sci-fi cyberpunk', wuxia: 'wuxia martial arts' };
const STYLE = {
  fantasy: 'semi-realistic fantasy digital painting',
  scifi: 'semi-realistic sci-fi digital painting',
  wuxia: 'semi-realistic wuxia ink-and-color painting',
};

// 캐릭터 한 명 → 아트 스튜디오 생성 요청 바디.
function requestFor(conceptId, concept, ch) {
  const el = concept.elements?.[ch.element]?.name || ch.element || '';
  const arch = concept.archetypes?.[ch.archetype]?.name || ch.archetype || '';
  const keywords = [ch.name, ch.title, `${el} 속성`, arch, ch.rarity, ch.personality]
    .filter(Boolean)
    .join(', ');
  return {
    entity_type: 'character',
    genre: GENRE[conceptId] || conceptId,
    art_style: STYLE[conceptId] || 'digital painting',
    keywords,
    assets: ['portrait'],
    transparent: true,
    variant_count: 1,
    image_scale: 1.0,
    consistency: false,
    name: ch.name,
    role: arch,
  };
}

async function generatePortrait(conceptId, concept, ch) {
  const res = await fetch(`${API}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestFor(conceptId, concept, ch)),
  });
  if (!res.ok) {
    throw new Error(`generate 실패 ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const portrait = (data.assets || []).find((a) => a.kind === 'portrait');
  if (!portrait) throw new Error('응답에 portrait 에셋이 없습니다.');

  // 결과 파일 회수 → assets/char/<concept>/<id>.png 로 저장
  const fileRes = await fetch(`${API}/files/${portrait.path}`);
  if (!fileRes.ok) throw new Error(`파일 회수 실패 ${fileRes.status}: ${portrait.path}`);
  const buf = Buffer.from(await fileRes.arrayBuffer());
  const outDir = path.join(CHAR_DIR, conceptId);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${ch.id}.png`), buf);
  return { demo: !!portrait.demo, bytes: buf.length };
}

// 디스크에 존재하는 PNG 기준으로 charImages.js 의 CHAR_IMAGES 맵을 재생성.
function rebuildCharImages() {
  const lines = ["export const CHAR_IMAGES = {"];
  let count = 0;
  for (const [conceptId, concept] of Object.entries(CONCEPTS)) {
    const roster = concept.roster || [];
    const present = roster.filter((ch) =>
      fs.existsSync(path.join(CHAR_DIR, conceptId, `${ch.id}.png`))
    );
    if (!present.length) continue;
    lines.push(`  // ${conceptId}`);
    for (const ch of present) {
      lines.push(
        `  '${conceptId}:${ch.id}': require('../assets/char/${conceptId}/${ch.id}.png'),`
      );
      count++;
    }
  }
  lines.push("};");
  const block = lines.join('\n');

  const src = fs.readFileSync(CHAR_IMAGES_JS, 'utf8');
  const re = /export const CHAR_IMAGES = \{[\s\S]*?\n\};/;
  if (!re.test(src)) throw new Error('charImages.js 에서 CHAR_IMAGES 맵 블록을 찾지 못했습니다.');
  fs.writeFileSync(CHAR_IMAGES_JS, src.replace(re, block));
  return count;
}

async function main() {
  const entries = Object.entries(CONCEPTS).filter(
    ([id]) => !ONLY_CONCEPT || id === ONLY_CONCEPT
  );

  let created = 0;
  let skipped = 0;
  let failed = 0;
  let demoCount = 0;

  if (!MAP_ONLY) {
    for (const [conceptId, concept] of entries) {
      let done = 0;
      for (const ch of concept.roster || []) {
        if (LIMIT && done >= LIMIT) break;
        const target = path.join(CHAR_DIR, conceptId, `${ch.id}.png`);
        if (!FORCE && fs.existsSync(target)) {
          skipped++;
          continue;
        }
        done++;
        try {
          const r = await generatePortrait(conceptId, concept, ch);
          created++;
          if (r.demo) demoCount++;
          console.log(
            `  ✓ ${conceptId}:${ch.id.padEnd(9)} ${(r.bytes / 1024).toFixed(0)}KB${r.demo ? ' (demo)' : ''}`
          );
        } catch (e) {
          failed++;
          console.log(`  ✗ ${conceptId}:${ch.id} — ${e.message}`);
        }
      }
    }
    console.log(
      `\n생성 ${created} · 건너뜀 ${skipped} · 실패 ${failed}${demoCount ? ` · 데모 ${demoCount}` : ''}`
    );
  }

  const mapped = rebuildCharImages();
  console.log(`charImages.js 등록: ${mapped}종`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
