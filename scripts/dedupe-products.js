#!/usr/bin/env node
/* Dedupe produtos.json by:
   - existing image_local file in public/produtos with size > 5KB and decodable
   - MD5 hash of image (drops file duplicates)
   - normalized name within same family (small edit distance)
*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'produtos.json');
const PUBLIC_DIR = path.join(ROOT, 'public');
const LOG_PATH = path.join(ROOT, 'produtos.dedupe.log');

const products = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
const log = [];
function note(msg) { log.push(msg); }

function md5(buf) { return crypto.createHash('md5').update(buf).digest('hex'); }
function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1]
      : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  }
  return dp[m][n];
}

// Step 1: validate image_local
const validated = [];
let droppedNoImage = 0, droppedSmall = 0, droppedBadDecode = 0;
const hashIndex = new Map(); // md5 -> first kept product

for (const p of products) {
  if (!p.image_local) { droppedNoImage++; note(`DROP no image_local: ${p.nome}`); continue; }
  const full = path.join(PUBLIC_DIR, p.image_local);
  if (!fs.existsSync(full)) { droppedNoImage++; note(`DROP missing file: ${p.image_local}`); continue; }
  const buf = fs.readFileSync(full);
  if (buf.length < 5 * 1024) { droppedSmall++; try { fs.unlinkSync(full); } catch {} note(`DROP small (${buf.length}b): ${p.image_local}`); continue; }
  // header check
  const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
  const isPng = buf[0] === 0x89 && buf[1] === 0x50;
  const isWebp = buf.slice(0, 4).toString() === 'RIFF';
  if (!isJpg && !isPng && !isWebp) { droppedBadDecode++; try { fs.unlinkSync(full); } catch {} note(`DROP bad header: ${p.image_local}`); continue; }
  const h = md5(buf);
  if (hashIndex.has(h)) {
    note(`DROP dup hash with ${hashIndex.get(h).nome}: ${p.nome}`);
    try { fs.unlinkSync(full); } catch {}
    continue;
  }
  hashIndex.set(h, p);
  p._hash = h;
  validated.push(p);
}

// Step 2: dedupe by similar name in same family
const byFamily = {};
for (const p of validated) (byFamily[p.linha] ||= []).push(p);
const kept = [];
let droppedSimilar = 0;
for (const fam of Object.keys(byFamily)) {
  const list = byFamily[fam];
  const localKept = [];
  for (const p of list) {
    const nn = norm(p.nome);
    const dup = localKept.find((k) => {
      const kn = norm(k.nome);
      if (kn === nn) return true;
      const d = lev(nn, kn);
      return d > 0 && d < 3 && Math.min(nn.length, kn.length) > 4;
    });
    if (dup) { droppedSimilar++; note(`DROP similar "${p.nome}" ~ "${dup.nome}" in ${fam}`); continue; }
    localKept.push(p);
  }
  kept.push(...localKept);
}

kept.forEach((p) => delete p._hash);
fs.writeFileSync(JSON_PATH, JSON.stringify(kept, null, 2));
fs.writeFileSync(LOG_PATH, [
  `=== DEDUPE LOG ${new Date().toISOString()} ===`,
  `Original: ${products.length}`,
  `Dropped no-image: ${droppedNoImage}`,
  `Dropped small: ${droppedSmall}`,
  `Dropped bad decode: ${droppedBadDecode}`,
  `Dropped dup hash: ${products.length - droppedNoImage - droppedSmall - droppedBadDecode - validated.length}`,
  `Dropped similar name: ${droppedSimilar}`,
  `Final: ${kept.length}`,
  '',
  ...log,
].join('\n'));

console.log(JSON.stringify({
  original: products.length,
  final: kept.length,
  droppedNoImage, droppedSmall, droppedBadDecode, droppedSimilar,
  droppedDupHash: products.length - droppedNoImage - droppedSmall - droppedBadDecode - validated.length,
}, null, 2));
