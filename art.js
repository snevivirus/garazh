// «Гараж» — рисунки: машины в профиль, машины событий, детали, ящики, аватары клиентов. Всё — SVG-строки.
(function () {
'use strict';

// ── Машины. Каждая — свой кузов, цвет и детали ─────────────────────────────
// x0/x1 — зад/перед, wx — оси колёс, wr — радиус колеса, sill — низ кузова, belt — линия окон,
// roof — крыша, tail — верх задка, c/cr/ar/a — стойки, nose — верх носа, hatch — без багажника.
const ART = [[
  { x0: 24, x1: 96, wx: [37, 83], wr: 7.5, sill: 50, belt: 37, roof: 22, tail: 28, cr: 30, ar: 64, a: 79, nose: 39.5, hatch: 1, rr: 9, col: '#D63A2F', roofCol: '#1F2125', pil: [.5] },
  { x0: 16, x1: 104, wx: [31, 89], wr: 7.5, sill: 50, belt: 36.5, roof: 22.5, tail: 35, c: 31, cr: 41, ar: 68, a: 82, nose: 39.5, rr: 7, col: '#4A4F55' },
  { x0: 12, x1: 108, wx: [28, 92], wr: 8, sill: 50, belt: 36, roof: 21.5, tail: 25, hatch: 1, cr: 40, ar: 70, a: 86, nose: 40, rr: 8, col: '#9EA3A8' },
  { x0: 10, x1: 110, wx: [27, 92], wr: 8.5, sill: 49, belt: 37, roof: 24.5, tail: 35, c: 25, cr: 43, ar: 68, a: 86, nose: 41.5, rr: 8, col: '#6E1E2C' },
  { x0: 8, x1: 112, wx: [26, 93], wr: 8.5, sill: 49.5, belt: 35, roof: 21, tail: 29, hatch: 1, cr: 46, ar: 72, a: 88, nose: 38.5, rr: 8, col: '#ECEAE4', chrome: 1 },
  { x0: 8, x1: 112, wx: [26, 94], wr: 8.5, sill: 49.5, belt: 36, roof: 22.5, tail: 34, c: 19, cr: 47, ar: 70, a: 88, nose: 40, rr: 12, col: '#F2C21B', rim: '#4A5058', bar: 1, glass: '#1C2731' },
  { x0: 6, x1: 114, wx: [25, 95], wr: 9, sill: 49.5, belt: 34.5, roof: 20, tail: 33, c: 25, cr: 39, ar: 73, a: 89, nose: 37.5, rr: 7, col: '#141516', chrome: 1 },
  { x0: 2, x1: 118, wx: [21, 99], wr: 8.5, sill: 49.5, belt: 34.5, roof: 20, tail: 33, c: 20, cr: 33, ar: 80, a: 94, nose: 37.5, rr: 7, col: '#D8C7A2', chrome: 1, pil: [.37, .63] },
], [
  { x0: 20, x1: 100, wx: [34, 86], wr: 8, sill: 47, belt: 33, roof: 18, tail: 23, cr: 27, ar: 66, a: 81, nose: 35, hatch: 1, rr: 7, col: '#EEE6CF', clad: 1 },
  { x0: 16, x1: 104, wx: [31, 89], wr: 8.5, sill: 46.5, belt: 32.5, roof: 16.5, tail: 20, cr: 22, ar: 68, a: 83, nose: 34, hatch: 1, rr: 6, col: '#D4A2A0', rails: 1, clad: 1 },
  { x0: 16, x1: 104, wx: [31, 89], wr: 9.5, sill: 45, belt: 31, roof: 14, tail: 15, cr: 18, ar: 73, a: 79, nose: 30, hatch: 1, rr: 3, col: '#D8B62C', rails: 1, spare: 1, clad: 1 },
  { x0: 12, x1: 108, wx: [28, 92], wr: 9, sill: 46.5, belt: 32.5, roof: 17, tail: 21, cr: 21, ar: 68, a: 85, nose: 34.5, hatch: 1, rr: 8, col: '#CDB990', roofCol: '#2A2D31', bar: 1 },
  { x0: 10, x1: 110, wx: [27, 93], wr: 9.5, sill: 46.5, belt: 33, roof: 18.5, tail: 25, cr: 30, ar: 66, a: 85, nose: 35.5, hatch: 1, rr: 9, col: '#9B1B30', rim: '#3A3E44' },
  { x0: 8, x1: 112, wx: [26, 94], wr: 9.5, sill: 46, belt: 32, roof: 15.5, tail: 19, cr: 16, ar: 70, a: 87, nose: 33.5, hatch: 1, rr: 6, col: '#55595E', chrome: 1, rails: 1 },
  { x0: 6, x1: 114, wx: [24, 96], wr: 10, sill: 45.5, belt: 31, roof: 14.5, tail: 16, cr: 11, ar: 72, a: 86, nose: 31.5, hatch: 1, rr: 5, col: '#4E3227', rails: 1 },
  { x0: 4, x1: 116, wx: [23, 97], wr: 10, sill: 45.5, belt: 30.5, roof: 14, tail: 17, cr: 11, ar: 75, a: 91, nose: 31, hatch: 1, rr: 6, col: '#121314', chrome: 1, rails: 1 },
], [  // купе и спорт: две двери, крыша всё ниже
  { x0: 22, x1: 98, wx: [35, 85], wr: 7.5, sill: 50, belt: 37.5, roof: 25, tail: 33, c: 32, cr: 44, ar: 64, a: 78, nose: 40, rr: 10, col: '#F4DA1F', pil: [.64] },
  { x0: 18, x1: 102, wx: [32, 88], wr: 8, sill: 49.5, belt: 37, roof: 24, tail: 30, hatch: 1, cr: 30, ar: 64, a: 80, nose: 40.5, rr: 8, col: '#C8102E', pil: [.6], stripe: '#F4F2EC' },
  { x0: 14, x1: 106, wx: [30, 90], wr: 8.5, sill: 48, belt: 36, roof: 23, tail: 33, c: 28, cr: 40, ar: 66, a: 82, nose: 39, rr: 7, col: '#F2F1EE', pil: [.6], stripe: '#2A2C30', spoiler: 1 },
  { x0: 10, x1: 110, wx: [27, 93], wr: 9, sill: 49, belt: 37.5, roof: 26, tail: 35, c: 24, cr: 46, ar: 66, a: 86, nose: 42, rr: 10, col: '#3F4247', rim: '#3A3E44', pil: [] },
  { x0: 6, x1: 114, wx: [25, 95], wr: 9, sill: 49, belt: 36.5, roof: 25, tail: 34, c: 22, cr: 48, ar: 70, a: 90, nose: 40.5, rr: 12, col: '#3B271F', chrome: 1, pil: [.66] },
  { x0: 8, x1: 112, wx: [26, 94], wr: 9, sill: 49.5, belt: 37, roof: 26.5, tail: 35.5, c: 18, cr: 50, ar: 68, a: 88, nose: 42, rr: 14, col: '#1C1D1F', rim: '#4A5058', bar: 1, glass: '#1C2731', pil: [] },
  { x0: 6, x1: 114, wx: [26, 94], wr: 9.5, sill: 50, belt: 39, roof: 30, tail: 37, c: 16, cr: 44, ar: 62, a: 80, nose: 44, rr: 12, col: '#6A1424', rim: '#3A3E44', wing: 1, pil: [] },
  { x0: 4, x1: 116, wx: [25, 95], wr: 10, sill: 50, belt: 39.5, roof: 31, tail: 37.5, c: 14, cr: 46, ar: 64, a: 82, nose: 44.5, rr: 14, col: '#F6F5F2', roofCol: '#1F2226', rim: '#3A3E44', wing: 1, bar: 1, pil: [] },
]];

// Линейки недельных событий: 6 машин. Ретро — полностью, грузовички и гоночные — заготовки той же схемы.
const EVENT_ART = {
  retro: [
    { x0: 26, x1: 94, wx: [38, 82], wr: 7, sill: 50, belt: 38, roof: 22.5, tail: 37, c: 37, cr: 40, ar: 62, a: 77, nose: 42, rr: 15, col: '#EAD7AE', roofCol: '#B5453B', chrome: 1, pil: [] },
    { x0: 18, x1: 102, wx: [31, 89], wr: 7.5, sill: 50, belt: 38, roof: 22, tail: 36.5, c: 32, cr: 41, ar: 66, a: 81, nose: 41.5, rr: 14, col: '#C24A3A', chrome: 1, stripe: '#F2E6CF', pil: [.55] },
    { x0: 14, x1: 106, wx: [29, 91], wr: 8, sill: 50, belt: 37.5, roof: 22, tail: 35.5, c: 30, cr: 42, ar: 68, a: 84, nose: 40.5, rr: 13, col: '#D9A93F', roofCol: '#F4EEDF', chrome: 1, pil: [.5] },
    { x0: 10, x1: 110, wx: [27, 93], wr: 8, sill: 50, belt: 38.5, roof: 29, tail: 36.5, c: 26, cr: 46, ar: 66, a: 84, nose: 41, rr: 8, col: '#7B2E3A', roofCol: '#3A3D42', chrome: 1, pil: [] },
    { x0: 6, x1: 114, wx: [25, 95], wr: 8.5, sill: 50, belt: 38, roof: 24, tail: 35, c: 20, cr: 44, ar: 70, a: 88, nose: 41, rr: 10, col: '#F2EBDD', roofCol: '#2C2F33', chrome: 1, spoiler: 1, stripe: '#B5453B', pil: [.6] },
    { x0: 2, x1: 118, wx: [22, 98], wr: 8.5, sill: 50, belt: 37, roof: 21.5, tail: 34, c: 18, cr: 36, ar: 80, a: 95, nose: 39.5, rr: 9, col: '#1F2125', roofCol: '#C9973A', chrome: 1, pil: [.37, .63] },
  ],
  trucks: [
    { x0: 22, x1: 98, wx: [35, 85], wr: 8, sill: 47, belt: 33, roof: 18, tail: 20, cr: 22, ar: 64, a: 80, nose: 34, hatch: 1, rr: 4, col: '#D9A93F', clad: 1 },
    { x0: 16, x1: 104, wx: [30, 90], wr: 8.5, sill: 47, belt: 33, roof: 16.5, tail: 18, cr: 18, ar: 70, a: 84, nose: 34, hatch: 1, rr: 3, col: '#E9EBEE', clad: 1, rails: 1 },
    { x0: 12, x1: 108, wx: [28, 92], wr: 9, sill: 46, belt: 32, roof: 18, tail: 32, c: 60, cr: 63, ar: 77, a: 89, nose: 33, rr: 4, col: '#C2603A', clad: 1, pil: [] },
    { x0: 8, x1: 112, wx: [26, 94], wr: 9.5, sill: 46, belt: 31, roof: 15, tail: 16, cr: 16, ar: 74, a: 88, nose: 32, hatch: 1, rr: 3, col: '#3D5A79', clad: 1, pil: [.3, .7] },
    { x0: 6, x1: 114, wx: [24, 96], wr: 10, sill: 45, belt: 30, roof: 16, tail: 30, c: 66, cr: 69, ar: 84, a: 96, nose: 31, rr: 4, col: '#6E7F8D', clad: 1, spare: 1, pil: [] },
    { x0: 2, x1: 118, wx: [20, 100], wr: 10, sill: 45, belt: 29.5, roof: 13, tail: 14, cr: 14, ar: 80, a: 94, nose: 30, hatch: 1, rr: 3, col: '#2E3135', roofCol: '#C26A33', clad: 1, pil: [.25, .5, .75] },
  ],
  racing: [
    { x0: 20, x1: 100, wx: [33, 87], wr: 7.5, sill: 51, belt: 40, roof: 29, tail: 38, c: 30, cr: 46, ar: 64, a: 80, nose: 44, rr: 10, col: '#E8E2D0', stripe: '#C24A3A', pil: [] },
    { x0: 16, x1: 104, wx: [31, 89], wr: 8, sill: 51, belt: 40, roof: 30, tail: 38, c: 26, cr: 46, ar: 64, a: 82, nose: 44, rr: 11, col: '#C24A3A', stripe: '#F2E6CF', spoiler: 1, pil: [] },
    { x0: 12, x1: 108, wx: [28, 92], wr: 8.5, sill: 51, belt: 40.5, roof: 31, tail: 38, c: 22, cr: 48, ar: 64, a: 84, nose: 45, rr: 12, col: '#D9A93F', rim: '#3A3E44', wing: 1, pil: [] },
    { x0: 8, x1: 112, wx: [26, 94], wr: 9, sill: 51, belt: 41, roof: 32, tail: 38.5, c: 18, cr: 50, ar: 66, a: 88, nose: 46, rr: 13, col: '#2F4E7A', stripe: '#E9E4D6', wing: 1, rim: '#3A3E44', pil: [] },
    { x0: 4, x1: 116, wx: [24, 96], wr: 9.5, sill: 51, belt: 41.5, roof: 33, tail: 39, c: 14, cr: 52, ar: 66, a: 90, nose: 47, rr: 14, col: '#F2EBDD', roofCol: '#1F2226', stripe: '#C26A33', wing: 1, rim: '#3A3E44', pil: [] },
    { x0: 2, x1: 118, wx: [22, 98], wr: 10, sill: 51.5, belt: 42, roof: 34, tail: 39.5, c: 12, cr: 54, ar: 66, a: 92, nose: 48, rr: 15, col: '#1F2125', stripe: '#C9973A', wing: 1, bar: 1, rim: '#C9973A', pil: [] },
  ],
};
let theme = 'retro';

const f = n => +n.toFixed(1);
// Замкнутый контур со скруглёнными углами. Точка [x, y, r] или [x, y, 0, R, large] — дуга арки.
function rpath(pts) {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const [x, y, r = 0, arcR, large] = pts[i];
    if (arcR) { d += `A${f(arcR)} ${f(arcR)} 0 ${large} 0 ${f(x)} ${f(y)}`; continue; }
    const p = pts[(i + n - 1) % n], q = pts[(i + 1) % n];
    const l1 = Math.hypot(p[0] - x, p[1] - y), l2 = Math.hypot(q[0] - x, q[1] - y);
    const k = Math.min(r, l1 / 2, l2 / 2);
    const ax = x + (p[0] - x) / l1 * k, ay = y + (p[1] - y) / l1 * k;
    d += `${i ? 'L' : 'M'}${f(ax)} ${f(ay)}`;
    if (k) d += `Q${f(x)} ${f(y)} ${f(x + (q[0] - x) / l2 * k)} ${f(y + (q[1] - y) / l2 * k)}`;
  }
  return d + 'Z';
}

// Тело машины: { vb — viewBox, inner — содержимое }. Земля — y = 58, видимая высота — 52.
function carBody(a, line, mono) {
  const G = 58, cy = G - a.wr, Ra = a.wr + 1.6, len = a.x1 - a.x0, W = Math.max(96, len + 8);
  const arch = x => { const d = a.sill - cy, h = Math.sqrt(Ra * Ra - d * d); return [[x + h, a.sill], [x - h, a.sill, 0, Ra, d > 0 ? 1 : 0]]; };
  const gy = a.belt - 1.2, gx0 = a.hatch ? a.x0 + 4 : a.c + 3, gx1 = a.a - 3.6;
  const gt0 = [a.cr + 2.5, a.roof + 2.6], gt1 = [a.ar - 2, a.roof + 2.6];
  const rear = [[a.x0, a.sill, 3], [a.x0, a.tail, 4], ...(a.hatch ? [] : [[a.c, a.belt, 3]])];
  const front = [[a.a, a.belt, 3], [a.x1, a.nose, 5], [a.x1, a.sill, 3], ...arch(a.wx[1]), ...arch(a.wx[0])];
  const body = rpath([...rear, [a.cr, a.roof, a.rr], [a.ar, a.roof, a.rr * .8], ...front]);
  const col = mono ? '#D2D2CD' : a.col, dark = mono ? '#BDBDB8' : '#2A2C30', trim = mono ? '#BDBDB8' : '#24272B';
  const pil = (a.pil || (line === 1 ? [.36, .68] : [.52])).map(t => f(gx0 + t * (gx1 - gx0)));
  let o = a.wx.map(x => `<circle cx="${x}" cy="${f(cy)}" r="${f(Ra)}" fill="${dark}"/>`).join('');
  if (a.wing) o += `<path d="M${a.x0 + 5} ${a.tail}v-4.6M${a.x0 + 11} ${a.tail}v-4.6" stroke="${trim}" stroke-width="1.2"/><rect x="${a.x0}" y="${a.tail - 6.8}" width="15" height="2.4" rx="1" fill="${trim}"/>`;
  if (a.roofCol && !mono) {
    o += `<path d="${body}" fill="${a.roofCol}"/>`;
    o += `<path d="${rpath([...rear, [...gt0, 2], [...gt1, 2], ...front])}" fill="${col}"/>`;
  } else o += `<path d="${body}" fill="${col}"/>`;
  o += `<rect x="${a.x0 + 2}" y="${a.sill - (a.clad ? 4.5 : 3)}" width="${len - 4}" height="${a.clad ? 4.5 : 3}" fill="rgba(0,0,0,${a.clad && !mono ? .3 : .1})"/>`;
  o += `<path d="${rpath([[gx0, gy, 1.5], [...gt0, a.rr * .6], [...gt1, a.rr * .5], [gx1, gy, 1.5]])}" fill="${mono ? '#C3C3BE' : a.glass || '#34485A'}"/>`;
  o += pil.map(x => `<path d="M${x} ${a.roof + 1.5}V${f(gy + .6)}" stroke="${a.roofCol && !mono ? a.roofCol : col}" stroke-width="2.4"/>`).join('');
  if (a.rails) o += `<path d="M${a.cr + 3} ${a.roof - 1.5}H${a.ar - 5}M${a.cr + 6} ${a.roof - 1.5}v1.6M${a.ar - 8} ${a.roof - 1.5}v1.6" stroke="${mono ? '#BDBDB8' : '#2B2E33'}" stroke-width="1.3" fill="none"/>`;
  if (a.spare) o += `<circle cx="${a.x0 - 1}" cy="${f((a.belt + a.sill) / 2)}" r="6" fill="${dark}"/><circle cx="${a.x0 - 1}" cy="${f((a.belt + a.sill) / 2)}" r="2.8" fill="${mono ? '#CDCDC8' : '#62676E'}"/>`;
  if (!mono) {
    o += `<path d="M${f(gt1[0] - 3)} ${f(gt1[1] + 1.8)}L${f(gx1 - 4.5)} ${f(gy - 1.6)}" stroke="rgba(255,255,255,.3)" stroke-width="1.2" stroke-linecap="round"/>`;
    o += pil.map(x => `<path d="M${x} ${f(gy + 1.2)}V${a.sill - 3.6}" stroke="rgba(0,0,0,.2)" stroke-width=".6"/>`).join('');
    if (!pil.length) o += `<path d="M${f((gx0 + gx1) / 2 + 6)} ${f(gy + 1.2)}V${a.sill - 3.6}" stroke="rgba(0,0,0,.2)" stroke-width=".6"/>`;
    o += `<path d="M${a.x0 + 4} ${f(a.belt + 2.6)}H${a.x1 - 6}" stroke="rgba(255,255,255,.22)" stroke-width="1"/>`;
    if (a.stripe) o += `<path d="M${a.x0 + 5} ${f((a.belt + a.sill) / 2 + 1)}H${a.x1 - 7}" stroke="${a.stripe}" stroke-width="1.6"/>`;
    if (a.chrome) o += `<path d="M${f(gx0 - 1)} ${f(gy + 1.3)}H${f(gx1 + 1)}" stroke="#E6E9EC" stroke-width=".9"/>`;
    if (a.spoiler) o += `<path d="M${a.x0 + 1.5} ${a.tail}L${a.x0 + 2} ${a.tail - 1.8}H${a.x0 + 10}" fill="none" stroke="#24272B" stroke-width="1.5" stroke-linejoin="round"/>`;
    o += `<rect x="${f(a.x1 - 5.6)}" y="${f(a.nose + 1.1)}" width="5" height="2.6" rx="1.2" fill="#F7F3E6" stroke="rgba(0,0,0,.25)" stroke-width=".4"/>`;
    if (a.bar) o += `<path d="M${a.x1 - 15} ${f(a.nose + .4)}L${a.x1 - 1.5} ${f(a.nose + .9)}" stroke="#DDF4F6" stroke-width="1.2" stroke-linecap="round"/>`;
    o += `<rect x="${f(a.x0 - .3)}" y="${f(a.hatch ? a.belt - 5 : a.tail + 1.2)}" width="3" height="3.2" rx="1" fill="#B3423B"/>`;
    o += `<path d="${body}" fill="none" stroke="rgba(18,20,24,.35)" stroke-width=".7" stroke-linejoin="round"/>`;
  }
  o += a.wx.map(x => `<circle cx="${x}" cy="${f(cy)}" r="${a.wr}" fill="${mono ? '#B9B9B4' : '#202327'}"/><circle cx="${x}" cy="${f(cy)}" r="${f(a.wr * .58)}" fill="${mono ? '#CDCDC8' : a.rim || '#C9CDD2'}"/>` +
    (mono ? '' : `<circle cx="${x}" cy="${f(cy)}" r="${f(a.wr * .2)}" fill="${a.rim ? '#9AA0A7' : '#7C828A'}"/>`)).join('');
  return { vb: [f((a.x0 + a.x1) / 2 - W / 2), 10, W, 52], inner: o };
}

// ── Детали мастерской: ключ → набор ключей → колесо → двигатель → сертификат ──
const wrench = (x, y, rot, s = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" stroke="#4E555C" stroke-width="1" stroke-linejoin="round">` +
  '<rect x="-15" y="-4" width="29" height="8" rx="4" fill="#8E969E"/>' +
  '<path d="M17.4 -6A9 9 0 1 0 17.4 6L12.2 3V-3Z" fill="#7C848C"/>' +
  '<path fill-rule="evenodd" d="M-15 -7a7 7 0 1 1 0 14a7 7 0 1 1 0-14zM-15 -3.2a3.2 3.2 0 1 0 0 6.4a3.2 3.2 0 1 0 0-6.4z" fill="#7C848C"/>' +
  '<path d="M-10 -1.6H9" stroke="#C9CED3" stroke-width="1.6" stroke-linecap="round"/></g>';
const PART_ART = [
  `${wrench(32, 21, -24, 1.05)}`,
  '<rect x="13" y="19" width="38" height="17" rx="3" fill="#3D5A79"/><path d="M13 24h38" stroke="#2F4761" stroke-width="1.2"/>' +
    `${wrench(22, 14, -90, .62)}${wrench(32, 12, -90, .7)}${wrench(42, 14, -90, .62)}` +
    '<rect x="13" y="25" width="38" height="11" rx="3" fill="#466785"/><path d="M17 30.5h30" stroke="#5E7E9C" stroke-width=".9" stroke-dasharray="2 1.6"/>',
  '<circle cx="32" cy="21" r="16" fill="#202327"/><circle cx="32" cy="21" r="13.2" fill="#34373C"/><circle cx="32" cy="21" r="9.6" fill="#C9CDD2"/>' +
    [0, 72, 144, 216, 288].map(r => `<rect x="30.6" y="12.6" width="2.8" height="7" rx="1.2" fill="#8A9097" transform="rotate(${r} 32 21)"/>`).join('') +
    '<circle cx="32" cy="21" r="3" fill="#6E747B"/><path d="M20 12a15 15 0 0 1 9-5" stroke="rgba(255,255,255,.18)" stroke-width="2" fill="none" stroke-linecap="round"/>',
  '<rect x="16" y="15" width="34" height="19" rx="2.5" fill="#7B848C"/><rect x="18" y="8" width="30" height="8" rx="2" fill="#5C646B"/>' +
    '<path d="M22 10v4M27 10v4M32 10v4M37 10v4M42 10v4" stroke="#4A5157" stroke-width="1.4" stroke-linecap="round"/>' +
    '<circle cx="15" cy="27" r="6" fill="#3A3D42"/><circle cx="15" cy="27" r="2.4" fill="#9AA0A7"/><rect x="40" y="5" width="5" height="4" rx="1.2" fill="#B5453B"/>' +
    '<path d="M50 19h4v11h-4" fill="none" stroke="#9C7350" stroke-width="2.4" stroke-linejoin="round"/><rect x="20" y="20" width="26" height="2" rx="1" fill="#8E979F"/><rect x="20" y="26" width="26" height="2" rx="1" fill="#6E767E"/>',
  '<rect x="14" y="5" width="36" height="29" rx="2" fill="#F6F1E3" stroke="#D9CFB5" stroke-width=".8"/><rect x="17" y="8" width="30" height="23" rx="1" fill="none" stroke="#C9B98F" stroke-width=".8"/>' +
    '<path d="M22 13h20M22 17.5h20M22 22h12" stroke="#CFC6B0" stroke-width="1.6" stroke-linecap="round"/>' +
    '<path d="M40 31l-2.6 7 3-1.4 2 2.4 1-7zM46 31l2.6 7-3-1.4-2 2.4-1-7z" fill="#C26A33"/>' +
    '<circle cx="43" cy="29" r="6.2" fill="#C9973A"/><circle cx="43" cy="29" r="4.2" fill="#E4BE6A"/><circle cx="43" cy="29" r="2" fill="#C9973A"/>',
];

// ── Детали Ателье: полироль → краска → диски → обвес → эмблема мастера ──────────
const TRIM_ART = [
  '<rect x="25" y="12" width="14" height="24" rx="3" fill="#E9E4D6" stroke="#B9B2A0" stroke-width=".8"/><rect x="28" y="5" width="8" height="8" rx="1.5" fill="#3A3D42"/>' +
    '<rect x="25" y="20" width="14" height="9" fill="#C9973A"/><path d="M29 24.5h6" stroke="#FFF6DF" stroke-width="1.4" stroke-linecap="round"/>' +
    '<path d="M44 10l2 3 3 .6-2.2 2 .6 3-2.4-1.4-2.4 1.4.6-3-2.2-2 3-.6z" fill="#E4BE6A"/><path d="M27 14v18" stroke="rgba(255,255,255,.6)" stroke-width="1.4" stroke-linecap="round"/>',
  '<path d="M18 12h28v22a3 3 0 0 1-3 3H21a3 3 0 0 1-3-3z" fill="#8E969E"/><ellipse cx="32" cy="12" rx="14" ry="3.6" fill="#B5453B"/>' +
    '<ellipse cx="32" cy="12" rx="10" ry="2.2" fill="#D45A4C"/><path d="M18 20h28" stroke="#6E767E" stroke-width="1.2"/><rect x="18" y="23" width="28" height="9" fill="#C9CDD2"/>' +
    '<path d="M25 7Q32 1 39 7" fill="none" stroke="#3A3D42" stroke-width="1.6"/><path d="M40 12q2 6-1 9" stroke="#B5453B" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
  '<circle cx="32" cy="21" r="16" fill="#2B2E33"/><circle cx="32" cy="21" r="12.5" fill="#D9DDE2"/><circle cx="32" cy="21" r="10.5" fill="#AEB4BB"/>' +
    [0, 60, 120, 180, 240, 300].map(r => `<path d="M32 21L32 10.8" stroke="#E9ECEF" stroke-width="3.2" stroke-linecap="round" transform="rotate(${r} 32 21)"/>`).join('') +
    '<circle cx="32" cy="21" r="3.4" fill="#5C646B"/><path d="M21 13a14 14 0 0 1 7-4" stroke="rgba(255,255,255,.5)" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  '<path d="M8 28h48l-4 6H12z" fill="#2C2F33"/><path d="M14 28l4-10h28l4 10z" fill="#3A3D42"/><rect x="10" y="12" width="44" height="4" rx="2" fill="#1F2226"/>' +
    '<path d="M16 16v4M48 16v4" stroke="#1F2226" stroke-width="2.4"/><path d="M18 24h28" stroke="#C9973A" stroke-width="1.6"/><path d="M12 33h40" stroke="rgba(255,255,255,.18)" stroke-width="1"/>',
  '<path d="M26 28l-4 10 5-2 3 4 2-10zM38 28l4 10-5-2-3 4-2-10z" fill="#B5453B"/><circle cx="32" cy="18" r="13" fill="#C9973A"/><circle cx="32" cy="18" r="10" fill="#E4BE6A"/>' +
    '<path d="m32 10.5 2.3 4.7 5.1.7-3.7 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1-3.7-3.6 5.1-.7z" fill="#FFF6DF"/>',
];

// ── Предметы поля ───────────────────────────────────────────────────────────
const THING = {
  level: '<path d="M7 19h34v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" fill="#9C7350"/><path d="M7 19a6 9 0 0 1 6-9h22a6 9 0 0 1 6 9z" fill="#B48A5E"/>' +
    '<path d="M7 19h34" stroke="#7E5C3E" stroke-width="1.4"/><rect x="11" y="10" width="3.4" height="27" fill="#C9973A"/><rect x="33.6" y="10" width="3.4" height="27" fill="#C9973A"/>' +
    '<rect x="21" y="16" width="6" height="7" rx="1.2" fill="#E4BE6A"/><circle cx="24" cy="19.6" r="1.1" fill="#7E5C3E"/>',
  crate: '<rect x="6" y="9" width="36" height="28" rx="1.5" fill="#C49A6C"/><path d="M6 18.3h36M6 27.6h36" stroke="#A47C52" stroke-width="1.2"/>' +
    '<rect x="6" y="9" width="36" height="28" rx="1.5" fill="none" stroke="#8E6A45" stroke-width="2.6"/><path d="M8 35L40 11" stroke="#8E6A45" stroke-width="2.6"/>' +
    '<circle cx="9" cy="12" r=".9" fill="#5C4630"/><circle cx="39" cy="12" r=".9" fill="#5C4630"/><circle cx="9" cy="34" r=".9" fill="#5C4630"/><circle cx="39" cy="34" r=".9" fill="#5C4630"/>',
  key: '<g stroke="#8E6A22" stroke-width="1.2" stroke-linejoin="round"><path fill-rule="evenodd" d="M14 11a9 9 0 1 1 0 18a9 9 0 1 1 0-18zM14 16.2a3.8 3.8 0 1 0 0 7.6a3.8 3.8 0 1 0 0-7.6z" fill="#D9A93F"/>' +
    '<path d="M22.5 17.6H43v4.8h-3.4v5h-4v-5h-3v3.6h-3.8v-3.6h-6.3z" fill="#D9A93F"/></g><path d="M9 15a7 7 0 0 1 6-2.6" stroke="#F3D58C" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  box: '<rect x="5" y="9" width="38" height="28" rx="2" fill="#8E6A45"/><rect x="7.5" y="11.5" width="33" height="23" rx="1" fill="#B48A5E"/>' +
    '<path d="M7.5 19h33M7.5 27h33" stroke="#9C7350" stroke-width="1.2"/><rect x="5" y="20.5" width="38" height="4" fill="#5F646B"/>' +
    '<path d="M20.5 23v-4a3.5 3.5 0 0 1 7 0v4" fill="none" stroke="#3A3D42" stroke-width="2"/><rect x="18.5" y="22.5" width="11" height="9" rx="1.6" fill="#C9973A" stroke="#8E6A22" stroke-width="1"/>' +
    '<circle cx="24" cy="26.4" r="1.3" fill="#5C4630"/><path d="M24 27v2.2" stroke="#5C4630" stroke-width="1.2"/>',
  boxOpen: '<path d="M6 17h36v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" fill="#B48A5E"/><path d="M6 17h36" stroke="#8E6A45" stroke-width="2"/>' +
    '<path d="M5 17L9 6h30l4 11" fill="#C49A6C" stroke="#8E6A45" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="M14 15l2-6M24 14V8M34 15l-2-6" stroke="#F3D58C" stroke-width="1.8" stroke-linecap="round"/><path d="M6 26h36" stroke="#9C7350" stroke-width="1.2"/>',
  ship: '<path d="M6 19h36v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" fill="#3D5A79"/><path d="M6 19h36" stroke="#2F4761" stroke-width="1.4"/>' +
    '<path d="M6 19l3-8h30l3 8z" fill="#4E6E90"/><path d="M14 26h20M14 31h20" stroke="#6E8CAB" stroke-width="1.6"/>' +
    '<circle cx="24" cy="15" r="3.2" fill="none" stroke="#E4BE6A" stroke-width="1.6"/><path d="M24 18.2v4M21 21h6" stroke="#E4BE6A" stroke-width="1.6" stroke-linecap="round"/>',
  event: '<path d="M7 19h34v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" fill="#B9832A"/><path d="M7 19a6 9 0 0 1 6-9h22a6 9 0 0 1 6 9z" fill="#E9B949"/>' +
    '<path d="M7 19h34" stroke="#8E6A22" stroke-width="1.4"/><circle cx="24" cy="27" r="5.5" fill="#FFF6DF"/><path d="m24 23.6 1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z" fill="#B9832A"/>',
  daily: '<path d="M7 19h34v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" fill="#3D5A79"/><path d="M7 19a6 9 0 0 1 6-9h22a6 9 0 0 1 6 9z" fill="#4E6E90"/>' +
    '<path d="M7 19h34" stroke="#2F4761" stroke-width="1.4"/><path d="m24 21.5 1.7 3.4 3.8.6-2.7 2.6.6 3.7-3.4-1.8-3.4 1.8.6-3.7-2.7-2.6 3.8-.6z" fill="#E4BE6A"/>' +
    '<rect x="11" y="10" width="3" height="27" fill="#C9973A"/><rect x="34" y="10" width="3" height="27" fill="#C9973A"/>',
  gift: '<rect x="9" y="18" width="30" height="19" rx="1.5" fill="#EDE7DC"/><rect x="7" y="13" width="34" height="7" rx="1.5" fill="#E2DACC"/>' +
    '<rect x="21.5" y="13" width="5" height="24" fill="#C26A33"/><path d="M24 13c-3-6-10-6-9-1.6c.6 2.4 5 2.2 9 1.6zM24 13c3-6 10-6 9-1.6c-.6 2.4-5 2.2-9 1.6z" fill="#D07A44"/>' +
    '<path d="M9 20h30" stroke="rgba(0,0,0,.08)" stroke-width="1.2"/>',
};
const thingSVG = kind => `<svg class="thing" viewBox="0 0 48 40" aria-hidden="true">${THING[kind]}</svg>`;

// ── Сборка: машина или деталь как <svg>, с растровой подменой ───────────────
const PARTS = 3, TRIM = 5, cache = {};
// Машины владельца по редкостям (prototype/tools/cars-import.js): <марка-модель>-<1..5>.webp (256 px) и -640.webp, список — cars.js.
// Модели, которой ещё нет, — рисуем SVG (цвета — по таблице assets/cars/ПРОМТЫ.md).
let BASE = null;
const BASES = ['assets/cars/'];
const slugOf = (line, lvl) => window.Core?.CARS[line]?.[lvl - 1]?.join('-').toLowerCase().replace(/\s+/g, '-');
// Загрузка по мере надобности: картинки на поле и в заказах браузер грузит сам; остальные 256 px — в фоне по одной,
// крупные 640 px — когда понадобились. Пока нужная не скачана, показываем уже скачанную: маленькую или белую этой модели.
const LOADED = new Set(), PENDING = new Map(), QUEUE = [];
let refresh = () => {}, refreshT = 0;
// скачать картинку; обещание выполняется, когда она скачана (или не нашлась)
function fetchImg(url) {
  if (LOADED.has(url)) return Promise.resolve();
  if (PENDING.has(url)) return PENDING.get(url);
  const p = new Promise(done => {
    const im = new Image();
    im.onload = () => {
      LOADED.add(url); PENDING.delete(url); done();
      clearTimeout(refreshT);
      refreshT = setTimeout(() => { Object.keys(cache).forEach(x => delete cache[x]); refresh(); }, 300);
    };
    im.onerror = () => { PENDING.delete(url); done(); };
    im.src = url;
  });
  PENDING.set(url, p);
  return p;
}
function background() {
  if (!PENDING.size && QUEUE.length) fetchImg(QUEUE.shift());
  if (QUEUE.length || PENDING.size) setTimeout(background, 250);
}
function loadRasters(onLoad) {
  refresh = onLoad;
  const tryList = b => {
    if (b >= BASES.length) return;
    const sc = document.createElement('script');
    sc.src = BASES[b] + 'cars.js';
    sc.onload = () => {
      BASE = BASES[b];
      Object.keys(cache).forEach(x => delete cache[x]);
      onLoad();
      // в фоне — маленькие картинки всех машин (сначала белые), чтобы коллекция и новые машины открывались сразу
      const own = Object.entries(window.CAR_FILES || {});
      own.forEach(([sl, rs]) => rs.includes(1) && QUEUE.push(`${BASE}${sl}-1.webp`));
      own.forEach(([sl, rs]) => rs.forEach(n => n > 1 && QUEUE.push(`${BASE}${sl}-${n}.webp`)));
      const start = () => setTimeout(background, 1500);
      if (document.readyState === 'complete') start(); else addEventListener('load', start);
    };
    sc.onerror = () => { sc.remove(); tryList(b + 1); };
    document.head.appendChild(sc);
  };
  tryList(0);
}
// Какую картинку показать: своя редкости r; не скачана — уже скачанная замена; нет модели — старый седан; null — SVG
// своя картинка модели в этой редкости (нет картинки редкости — белая этой модели); нет модели — null
function exactUrl(line, lvl, r, big) {
  if (!BASE || line >= PARTS) return null;
  const sl = slugOf(line, lvl), rs = window.CAR_FILES?.[sl];
  if (!rs?.length) return null;
  const n = rs.includes(r + 1) ? r + 1 : rs.includes(1) ? 1 : rs[0];
  return `${BASE}${sl}-${n}${big ? '-640' : ''}.webp`;
}
function carUrl(line, lvl, r, big) {
  const exact = exactUrl(line, lvl, r, big);
  if (!exact) return null;
  if (LOADED.has(exact)) return exact;
  fetchImg(exact);
  // пока грузится: крупной — она же маленькая (не белая: на карточке редкости белая обманывает), мелкой — белая этой модели
  const sl = slugOf(line, lvl);
  for (const u of big ? [exactUrl(line, lvl, r, false)] : [`${BASE}${sl}-1.webp`]) if (LOADED.has(u)) return u;
  return '';   // ничего подходящего ещё не скачано — серый силуэт, пока грузится
}
// дождаться своей картинки (карточка новой редкости не показывается с чужой)
const preload = (line, lvl, r, big) => { const u = exactUrl(line, lvl, r, big); return u ? fetchImg(u) : Promise.resolve(); };
const EV = 4;
const artOf = (line, lvl) => line === EV ? EVENT_ART[theme][lvl - 1] : ART[line][lvl - 1];
function item(line, lvl, mono = false, r = 0, big = false) {
  const k = `${line}-${lvl}-${mono}-${r}-${big}${line === EV ? theme : ''}`;
  if (cache[k]) return cache[k];
  const url = carUrl(line, lvl, r || 0, big);
  // запоминаем только окончательную картинку: временную (пока грузится своя) рисуем заново
  const put = h => url === null || url === exactUrl(line, lvl, r || 0, big) ? (cache[k] = h) : h;
  if (url === '') mono = true;
  else if (url) return put(`<img class="car car-img v2${mono ? ' mono' : ''}" src="${url}" alt="" draggable="false">`);
  // деталь Ателье (задание 20): цвет редкости, которую она даёт (2-я — зелёная … 5-я — оранжевая; 1-я — серая), --tc для рамки
  if (line === TRIM) return put(`<svg class="car part${mono ? ' mono' : ` trim" style="--tc:var(--r${lvl - 1})`}" viewBox="0 0 64 40" aria-hidden="true">${TRIM_ART[lvl - 1]}</svg>`);
  if (line === PARTS) return put(`<svg class="car part" viewBox="0 0 64 40" aria-hidden="true">${PART_ART[lvl - 1]}</svg>`);
  const { vb, inner } = carBody(artOf(line, lvl), line, mono);
  return put(`<svg class="car" viewBox="${vb.join(' ')}" aria-hidden="true">${inner}</svg>`);
}
// Машина внутри другой SVG-сцены: колёса на groundY, по центру cx, шириной width
function nested(line, lvl, cx, groundY, width) {
  const { vb, inner } = carBody(artOf(line, lvl), line, false);
  const h = width * vb[3] / vb[2];
  return `<svg x="${f(cx - width / 2)}" y="${f(groundY - h * 48 / 52)}" width="${f(width)}" height="${f(h)}" viewBox="${vb.join(' ')}">${inner}</svg>`;
}

const certMini = `<svg viewBox="12 3 40 37" aria-hidden="true">${PART_ART[4]}</svg>`;

// Машина внутри SVG-сцены салона: растровая — через <image>, иначе SVG
function nestedAny(line, lvl, cx, groundY, width) {
  const url = exactUrl(line, lvl, 0, true);    // своя картинка сразу, сцена докачает её сама — без старой SVG на время загрузки
  if (!url) return nested(line, lvl, cx, groundY, width);
  // задание 24: картинка обрезана по машине — коробка 1,6 : 1 шириной 92% (как прежняя машина на холсте), машина вписана, колёса — на земле
  const bw = width * .92, h = bw / 1.6;
  return `<image href="${url}" x="${f(cx - bw / 2)}" y="${f(groundY - h)}" width="${f(bw)}" height="${f(h)}" preserveAspectRatio="xMidYMax meet"/>`;
}

window.Art = { item, preload, nested: nestedAny, thing: thingSVG, certMini, loadRasters,
  setTheme(v) { theme = EVENT_ART[v] ? v : 'retro'; } };
})();
