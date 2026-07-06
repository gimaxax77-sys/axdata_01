// 웹으로 export 한 뒤 JS 번들을 index.html에 인라인해
// 단일 자립형 HTML(docs/play.html)을 만든다 → 아티팩트/정적 호스팅용.
//   실행:  node scripts/build-play.mjs
// (사전에 `EXPO_OFFLINE=1 npx expo export --platform web` 로 dist 생성)
import fs from 'node:fs';
import path from 'node:path';

const jsDir = 'dist/_expo/static/js/web';
if (!fs.existsSync(jsDir)) {
  console.error('dist가 없습니다. 먼저: EXPO_OFFLINE=1 npx expo export --platform web');
  process.exit(1);
}
const jsFile = fs.readdirSync(jsDir).find((f) => f.endsWith('.js'));
let js = fs.readFileSync(path.join(jsDir, jsFile), 'utf8');
js = js.split('</script>').join('<\\/script>'); // 스크립트 조기 종료 방지

// 운영 컨셉 선택 — 인자로 concept 지정 시 해당 제품으로 빌드.
//   node scripts/build-play.mjs        → 판타지(docs/play.html)
//   node scripts/build-play.mjs scifi  → SF(docs/play-scifi.html)
const CONCEPT_META = {
  fantasy: { title: '엘드리아 연대기 · 방치형 RPG', out: 'docs/play.html', bg: '#1b1430' },
  scifi: { title: '오비탈 프로토콜 · 방치형 RPG', out: 'docs/play-scifi.html', bg: '#0d1420' },
};
const concept = process.argv[2] || 'fantasy';
const meta = CONCEPT_META[concept] || CONCEPT_META.fantasy;
// 번들 실행 전 운영 컨셉을 글로벌로 주입(판타지는 기본값이라 생략).
const inject = concept === 'fantasy' ? '' : `<script>globalThis.__ELDRIA_CONCEPT__=${JSON.stringify(concept)};</script>\n`;

const body = `<title>${meta.title}</title>
<style id="expo-reset">html,body{height:100%;margin:0}body{overflow:hidden;background:${meta.bg}}#root{display:flex;height:100vh;flex:1}</style>
<div id="root"></div>
${inject}<script>${js}</script>`;

fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync(meta.out, body);
console.log(`생성: ${meta.out} (${concept})`, (body.length / 1024).toFixed(0) + 'KB');
