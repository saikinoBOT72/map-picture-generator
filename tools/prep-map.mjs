// 都道府県の形のデータを作り、index.html の MAP_DATA の部分に書き込むスクリプト
//
// 元データ: スマートニュース メディア研究所「japan-topography」の都道府県ファイル（簡素化1％）
//   https://raw.githubusercontent.com/smartnews-smri/japan-topography/b403e71eb97f1fdf32f63d16bd485129f703855e/data/municipality/geojson/s0010/prefectures.json
//   （国土交通省 国土数値情報「行政区域データ」を加工したもの）
//
// 使い方: node tools/prep-map.mjs <prefectures.json のパス>
//
// やること
//  1. 経緯度をランベルト正角円錐図法で km に変換（どの県も同じ縮尺で並べられるように）
//  2. 小さすぎる島を省く
//  3. 県ごとに「本体」と「離れた島」を分ける（離れた島はアプリで入れる/入れないを選べる）
//  4. 座標を 0.1km 単位の整数にして、差分を英数字の文字列に詰める

import { readFileSync, writeFileSync } from 'node:fs';

const src = process.argv[2];
if (!src) { console.error('usage: node tools/prep-map.mjs prefectures.json'); process.exit(1); }
const gj = JSON.parse(readFileSync(src, 'utf8'));

// ---- 投影（球面のランベルト正角円錐図法。標準緯線 33°・44°、中心 137°E / 37°N）
const R = 6371, rad = Math.PI / 180;
const p1 = 33 * rad, p2 = 44 * rad, p0 = 37 * rad, l0 = 137 * rad;
const t = p => Math.tan(Math.PI / 4 + p / 2);
const n = Math.log(Math.cos(p1) / Math.cos(p2)) / Math.log(t(p2) / t(p1));
const F = Math.cos(p1) * Math.pow(t(p1), n) / n;
const rho0 = R * F / Math.pow(t(p0), n);
function project([lon, lat]) {
  const rho = R * F / Math.pow(t(lat * rad), n);
  const th = n * (lon * rad - l0);
  return [rho * Math.sin(th), -(rho0 - rho * Math.cos(th))]; // y は下向き（画面と同じ）
}

const UNIT = 0.1;          // 座標の単位（km）
const MIN_AREA = 0.15;     // これより小さい島は省く（km²）
const NEAR = 20;           // 本体からこの距離（km）以内の島は本体に含める
const BIG = 300, BIG_NEAR = 80; // 大きな島（km²）はこの距離まで本体に含める（佐渡・種子島・屋久島など）

const ringArea = r => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return a / 2; };
const bboxOf = pts => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; } return [x0, y0, x1, y1]; };
function minDist(a, b) {
  // 外周どうしの頂点の最短距離（近いかどうかの判定なので頂点同士で十分）
  const ba = a.bbox, bb = b.bbox;
  const gx = Math.max(0, ba[0] - bb[2], bb[0] - ba[2]), gy = Math.max(0, ba[1] - bb[3], bb[1] - ba[3]);
  const g = Math.hypot(gx, gy);
  if (g > BIG_NEAR) return g;
  let m = Infinity;
  for (const p of a.rings[0]) for (const q of b.rings[0]) { const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2; if (d < m) m = d; }
  return Math.sqrt(m);
}

// ---- 文字列に詰める（ゼロを中心に折り返した整数を 5bit ずつ、base64url の文字で）
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function encNum(v) {
  let z = v < 0 ? (-v * 2 - 1) : v * 2, s = '';
  while (z >= 32) { s += ALPHA[32 | (z & 31)]; z = Math.floor(z / 32); }
  return s + ALPHA[z];
}
function encRing(r) {
  let px = 0, py = 0, s = '';
  const q = [];
  for (const [x, y] of r) {
    const ix = Math.round(x / UNIT), iy = Math.round(y / UNIT);
    if (q.length && q[q.length - 1][0] === ix && q[q.length - 1][1] === iy) continue;
    q.push([ix, iy]);
  }
  if (q.length > 1 && q[0][0] === q[q.length - 1][0] && q[0][1] === q[q.length - 1][1]) q.pop();
  for (const [ix, iy] of q) { s += encNum(ix - px) + encNum(iy - py); px = ix; py = iy; }
  return { s, n: q.length };
}

const NAMES = ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'];

const out = [];
let totalPts = 0;
for (const f of gj.features) {
  const name = f.properties.N03_001;
  const code = NAMES.indexOf(name) + 1;
  if (!code) throw new Error('unknown ' + name);
  const g = f.geometry;
  const polys = (g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates]).map(p => {
    const rings = p.map(r => r.map(project));
    // 外周は時計回り（画面座標）にそろえる。穴は逆回り
    rings.forEach((r, i) => { const a = ringArea(r); if ((i === 0) !== (a > 0)) r.reverse(); });
    return { rings, area: Math.abs(ringArea(rings[0])), bbox: bboxOf(rings[0]), lonlat: p[0] };
  }).filter(p => p.area >= MIN_AREA).sort((a, b) => b.area - a.area);

  // 北方領土（北海道で、中心が東経145.45°より東の島）は「離れた島」としてまとめる
  const isNorth = p => code === 1 && (p.lonlat.reduce((a, c) => a + c[0], 0) / p.lonlat.length) > 145.45;
  const main = [polys[0]];
  let grew = true;
  while (grew) {
    grew = false;
    for (const p of polys) {
      if (main.includes(p) || isNorth(p)) continue;
      const lim = p.area >= BIG ? BIG_NEAR : NEAR;
      if (main.some(m => minDist(p, m) <= lim)) { main.push(p); grew = true; }
    }
  }
  const enc = polys.map(p => {
    const rings = p.rings.map(encRing).filter(r => r.n >= 3);
    totalPts += rings.reduce((a, r) => a + r.n, 0);
    return { r: rings.map(r => r.s), far: main.includes(p) ? 0 : 1 };
  }).filter(p => p.r.length);
  out[code - 1] = { name, p: enc.map(p => (p.far ? '*' : '') + p.r.join(' ')) };
  const far = polys.filter(p => !main.includes(p));
  console.error(`${String(code).padStart(2)} ${name} 島${polys.length} 本体${main.length} 離島${far.length}${far.length ? '（' + far.slice(0, 3).map(p => p.area.toFixed(0) + 'km²').join(' ') + '…）' : ''}`);
}

// 1県 = 文字列1つ。島は「|」、島の中の穴は「 」、離れた島は先頭に「*」
const data = out.map(o => o.p.join('|'));
const js = `const MAP_DATA = ${JSON.stringify(data)};`;
console.error(`頂点 ${totalPts}、${(js.length / 1024).toFixed(0)} KB`);

const html = new URL('../index.html', import.meta.url);
const s = readFileSync(html, 'utf8');
const a = s.indexOf('/*MAP_DATA*/'), b = s.indexOf('/*/MAP_DATA*/');
if (a < 0 || b < 0) { writeFileSync(new URL('./map-data.js', import.meta.url), js + '\n'); console.error('index.html に目印がないので tools/map-data.js に書き出しました'); }
else { writeFileSync(html, s.slice(0, a + 12) + '\n' + js + '\n' + s.slice(b)); console.error('index.html に書き込みました'); }
