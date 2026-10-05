// «Гараж» — правила игры без экрана. Этот же файл гоняет бот (bot.js) в Node.
(function () {
'use strict';

// ── Все числа баланса — здесь ──────────────────────────────────────────────
const CONFIG = {
  cols: 7, rows: 9,
  // Порты (клетка = ряд * 7 + столбец). Вместе с портом открываются 4 клетки вокруг него (у первого — 8).
  ports: [
    { line: 0, cell: 31 },                             // легковые — центр поля, открыт с начала
    { line: 1, cell: 12, level: 6 },                   // внедорожники — с 6-го уровня игрока
    { line: 3, cell: 50, level: 4, fuel: 2 },          // Мастерская (инструменты) — с 4-го уровня (2-й день); 2 топлива
    { line: 2, cell: 8, level: 12 },                   // купе — с 12-го уровня игрока
    { line: 5, cell: 54, level: 8, fuel: 2 },          // Ателье (детали отделки) — с 8-го уровня (3–4-й день); открывает редкость
  ],
  // Закрытые клетки: замок — за монеты (рядом с открытой), уровнем, салоном, кольцом порта; ящик-сюрприз — ключом
  boxes: [10, 21, 27, 35, 41, 53, 61],               // остальные закрытые клетки — замки
  cellCoins: [30, 1.16],                             // клетка за монеты: 30, дальше каждая следующая ×1,16

  fuelMax: 60,                        // бак (+10 за каждый «бак» в салоне)
  fuelRegenMs: 120000,                // +1 топливо за 2 минуты (компрессор — на четверть быстрее)
  fuelCoins: 30,                      // полный бак за монеты — только когда бак пуст
  // Улучшения порта: 5 ступеней. Ступень → шансы 2-го и 3-го уровня; со 2-й каждое 3-е касание — без топлива.
  // Второй ряд (6–8, после погрузчика в «Порту и складе»): +3% к 2-му уровню, 8-я — бак +10.
  // Дальше — «престиж порта» без конца: каждая ступень +2 к баку, цена ×1,3.
  tierPrices: [40, 120, 300, 500, 1500, 2600, 3600, 5000],
  tierLvl2: [0.15, 0.25, 0.32, 0.34, 0.34, 0.34, 0.37, 0.40, 0.40],
  tierLvl3: [0, 0.10, 0.22, 0.34, 0.46, 0.56, 0.56, 0.56, 0.56],
  tierFuel: [10, 2], tierGrowth: 1.3,
  partTierLvl2: [0.35, 0.45, 0.55, 0.60, 0.65, 0.70],
  trimTierLvl2: [0, 0.10, 0.20, 0.30, 0.35, 0.40],   // Ателье: 2-я деталь сразу — только после улучшений
  freeTapFrom: 2, freeTapEvery: 3,
  tierRarity: [0.005, 0.002, 0.005],  // за ступень (после Ателье): зелёная +0,5%, синяя +0,2%; фиолетовая +0,5% — с 4-й ступени
  epicFromTier: 4,
  tutorialSpawns: 6,                  // первые выезды — только 1-й уровень, обычные (обучение)
  crateChance: [0.03, 0.06],          // ящик вместо машины: обычно / с «инструментами» в салоне
  // Сломанная машина (после Мастерской): на 1–2 уровня выше; чинится только инструментом — его перетаскивают на машину
  broken: { chance: 0.03, up: [1, 2], max: 1 },
  brokenMerge: { from: 5, to: 7, chance: 0.35 },   // задание 7: слияние в 5–7-й уровень часто даёт сломанную (после Мастерской); 8-я и так стоит сертификата
  // Диспетчерская: деталь из Мастерской и Ателье на уровень выше — 10%
  toolUp: 0.1,
  // Ателье выдаёт детали по зарядам: до 2 нажатий, +1 заряд каждые 3 часа; копить начинает с открытия (детали отделки — редкость)
  atelier: { charges: 2, regenMs: 3600e3, coins: [40, 1.5] },        // заряд — 1 час (задание 10, было 3 ч)   // заряд за монеты: 40, каждый следующий за день ×1,5 (ночью сброс)
  bubbleChance: 0.05,                 // после слияния рядом всплывает копия в пузыре на 60 с
  bubbleMs: 60000,
  bubbleCoinsPerUnit: 2,              // цена: 2 монеты за каждую машину 1-го уровня в нём (свет мойки −30%)
  bubbleMaxLvl: 6,

  // Редкость: 0 обычная (белая), 1 необычная (зелёная), 2 редкая (синяя), 3 эпическая (фиолетовая), 4 легендарная (оранжевая).
  // До Ателье все машины белые. После — гараж изредка даёт зелёную, главный путь — детали Ателье на машину.
  rarityOdds: [0.96, 0.04, 0, 0, 0],
  rarityCoins: [1, 1.3, 1.7, 2.5, 4],                  // множитель монет в заказе и звёзд за слияние
  luckyChance: 0.05,                                   // удачное слияние: редкость на ступень выше

  // Звёзды — только за слияния, по уровню получившейся машины; уровень игрока — по всем заработанным
  mergeStars: [0, 0, 1, 2, 3, 5, 8, 12, 20],
  newModelStars: [0, 1, 2, 3, 5, 8, 12, 18, 30],       // первая машина модели (витрина салона — ×2)
  allRaritiesStars: 30,                                // модель во всех 5 редкостях (полная стопка в коллекции)
  stackPct: 0.01,                                      // и навсегда +1% монет за заказы за каждую полную стопку
  xpBase: 25, xpGrowth: 1.25,

  // Монеты — только за заказы. Стоимость предмета = 2^(уровень−1) машин 1-го уровня, деталь — вдвое
  partUnits: 2,
  slotPrices: [0, 25, 120, 300],      // 1-й слот заказа открыт; 2-й, 3-й, 4-й — за монеты
  // Уровни предметов у всех видов одни и те же: на 2–3 ниже лучшей машины линейки (не ниже 2-го).
  // Крупный отличается числом машин и множителем: ≈ 3–5× монет быстрого и ≈ 1,7× монет на единицу топлива.
  kinds: {                            // вид заказа: сколько предметов, монет за единицу стоимости
    quick:    { mult: 1.35 },           // задание 7: быстрый чуть дороже — крупный стал крупнее
    normal:   { mult: 1.6 },
    big:      { mult: 2.1, key: 0.35 },
    showcase: { mult: 3.5 },            // две машины одной модели нужной редкости
    event:    { mult: 0 },              // заказ события: вместо монет — жетоны
  },
  kindWeights: { quick: 2, normal: 5, big: 3 },
  // Заказы растут с уровнем игрока — ступени: до 4-го, с 4-го, с 7-го, с 11-го (задание 7: на поздних уровнях —
  // машины старших уровней и редкости, чтобы был смысл их растить). С 4-го по 6-й заказ на одну машину — не больше одного.
  orderGrowth: [4, 7, 11],
  // уровень предмета по ступеням: от «лучшая − a» до «лучшая − b» в линейке. С 4-го уровня игрока — не ниже «лучшая − 2»:
  // заказ растёт вместе с игроком, а не просит «двойки», когда уже есть пятые (правка владельца, задание 10)
  orderLvl: [[3, 2], [2, 2], [2, 2], [2, 2]],
  orderLead: [3, 1, 1, 6],            // с 4-й ступени крупный заказ (с этой долей) просит машину на 1 ниже лучшего уровня линейки, не выше 6-го
  orderMin: [2, 2, 3, 3],             // самый низкий уровень машины в заказе по ступеням: с 7-го уровня «двойки» уже не просят
  orderSize: {
    quick:  [[1, 1], [1, 2], [2, 2], [2, 2]],
    normal: [[1, 2], [2, 3], [2, 3], [2, 3]],
    big:    [[1, 2], [2, 3], [3, 5], [3, 5]],
  },
  orderDistinct: 3,                   // разных машин в заказе не больше трёх: одинаковые — одной карточкой «×N»
  orderRarity: { big: [.05, .05, .05, .1], normal: [0, 0, 0, 0] },    // заказ просит редкость («зелёная 4-го»); задание 10: было .15/.25
  orderPickRarity: 1,                 // машина, которую заказ взял с поля, просит свою редкость (задание 10: иначе редкую нечем сдать)
  orderRarityW: [{ 1: 3, 2: 1 }, { 1: 3, 2: 1 }, { 1: 3, 2: 1 }, { 1: 3, 2: 2 }],   // какую: зелёную, синюю, фиолетовую — по ступеням
  showcaseChance: 0.15,               // после подиума — заказ «на витрину»
  refreshMs: [1800000, 900000],       // бесплатная замена заказа раз в 30 минут (с креслами — раз в 15)
  refreshCoins: 5,                    // платная замена: 5 монет + уровень игрока
  streakGapMs: 120000, streakNeed: 3, streakMult: 1.5,   // серия: 3 заказа без паузы > 2 мин → ×1,5
  washBonus: 0.15,                    // пост мойки: заказы +15% монет
  lineBonus: 0.2,                     // полная линейка: легковые +20% монет, купе +20% звёзд
  keyFromMerge: 0.06,                 // ключ после слияния в 5-й уровень и выше (шланги мойки — ×1,5)
  keyCoins: 25,                       // ключ, которому больше нечего открывать, становится монетами

  // Награды за уровень: чётный — сундук (+1 машина — бывшие машины под чехлом), нечётный — канистра;
  // 2-й, 5-й, 8-й… — ещё и клетка (до 11-го — клетка с машиной внутри)
  levelFuel: 20, levelCellsFrom: 2, levelCellsEvery: 4,
  levelCar: { upTo: 11, lvls: { 1: 4, 2: 4, 3: 2 } },
  chestCars: 4, chestLvl: [1, 2],
  gift: { cars: 2, lvls: [2, 3], fuel: 15 },          // подарок дня (+машина за стены бокса, растения, контейнеры)
  // Задания дня: слияния, заказы и третье по очереди (ящик / крупный заказ / машина новой высоты).
  // За каждое — топливо, за все три — сундук дня.
  daily: { merges: [15, 5], orders: [3, 1], chests: 1, fuel: [10, 10, 15] },   // + «Почини машину» и «Подними редкость», когда открыто

  // «Порт и склад»: склад вне поля, корабль с ящиком, ремонт дешевле
  storePrices: [0, 300, 700, 1500],   // ячейки склада: первая — со стеллажами, остальные за монеты
  ship: { ms: [4 * 3600e3, 3 * 3600e3], coins: 120, cars: [3, 4], lvls: [2, 4], fuel: 10 },   // с маяком — раз в 3 ч
  // Бесконечные траты: престиж салона за звёзды (+1% монет за заказы за уровень)
  prestige: { stars: 600, growth: 1.12, pct: 0.01 },

  // Недельное событие: со 2-й недели, 7 дней. Свой гараж и линейка из 6 предметов, заказы дают жетоны.
  event: {
    fromWeek: 1, line: 4, cell: 52, themes: ['retro', 'trucks', 'racing'],
    orderChance: 0.5,                 // новый заказ — событийный, если такого ещё нет
    tokensPerUnit: 2,                 // жетонов за единицу стоимости предмета (2-й уровень — 4 жетона)
    track: [6, 14, 26, 40, 58, 80, 108, 144, 192, 256],          // жетонов всего до каждой ступени
    rewards: [['fuel', 15], ['crate', 3, 2, 3], ['coins', 60], ['fuel', 25], ['crate', 4, 2, 4],
      ['coins', 150], ['fuel', 40], ['crate', 4, 3, 5], ['coins', 300], ['trophy']],
    trophyPct: 0.03,                  // трофей последней ступени: +3% монет за заказы навсегда
  },

  // Автосалон: зоны по порядку, цены в звёздах и эффект каждого пункта
  salon: [
    { id: 'box', items: ['trash', 'walls', 'light', 'gate', 'sign'], prices: [8, 12, 16, 22, 28],
      fx: [{ cells: 2 }, { gift: 1 }, { fuel: 10 }, { cells: 2 }, { slot: 1 }] },
    { id: 'workshop', items: ['lift', 'bench', 'tires', 'compressor', 'tools'], prices: [30, 40, 50, 60, 70],
      fx: [{ tier: 0 }, { tier: 3 }, { tier: 1 }, { regen: 1 }, { crates: 1 }] },
    { id: 'wash', items: ['washpost', 'hoses', 'dryer', 'washlight', 'mats'], prices: [100, 120, 140, 160, 180],
      fx: [{ coins: 1 }, { keys: 1 }, { fuel: 10 }, { bubbles: 1 }, { cells: 2 }] },
    { id: 'showroom', items: ['window', 'podium', 'chairs', 'desk', 'plants', 'chandelier'], prices: [200, 240, 280, 320, 360, 400],
      fx: [{ newStars: 1 }, { showcase: 1 }, { refresh: 1 }, { tier: 2 }, { gift: 1 }, { fuel: 10 }] },
    { id: 'depot', items: ['shelves', 'forklift', 'crane', 'pier', 'containers', 'office', 'lighthouse'],
      prices: [400, 500, 600, 700, 800, 900, 1000],
      fx: [{ store: 1 }, { tier2: 1 }, { fuel: 10 }, { ship: 1 }, { gift: 1 }, { toolUp: 1 }, { shipFast: 1 }] },
  ],

  // Первые заказы — под обучение: [линейка, уровень]
  firstOrders: [[[0, 2]], [[0, 3]]],
};

// Машины: [марка, модель]. Индекс = уровень - 1. Линейка 3 — детали из мастерской.
const CARS = [
  [['Haneul', 'Pico'], ['Seora', 'Vela'], ['Rheinmark', 'Kante'], ['Haneul', 'Arin'],   // задание 7: Kante — 3-й, Arin — 4-й
   ['Arion', 'Solace'], ['Vierling', 'V6'], ['Nordhaus', 'Konsul'], ['Nordhaus', 'Konsul Lang']],
  [['Seora', 'Crest'], ['Haneul', 'Tarn'], ['Fjellvik', 'Vidde'], ['Vierling', 'Aurel'],
   ['Rheinmark', 'Tor'], ['Arion', 'Kammen'], ['Seiran', 'Mori'], ['Nordhaus', 'Gletscher']],
  [['Seora', 'Lumo'], ['Haneul', 'Duri'], ['Fjellvik', 'Brisk'], ['Rheinmark', 'Kurve'],
   ['Arion', 'Velour'], ['Vierling', 'Strom'], ['Seiran', 'Miraen'], ['Nordhaus', 'Nordlicht']],
];
const PARTS = 3, EV = 4, TRIM = 5;      // 3 — инструменты Мастерской, 4 — машины события, 5 — детали отделки Ателье
const PART_NAMES = ['Гаечный ключ', 'Набор ключей', 'Колесо', 'Двигатель', 'Сертификат коллекционера'];
const TRIM_NAMES = ['Полироль', 'Краска', 'Диски', 'Обвес', 'Эмблема мастера'];
// Линейки недельных событий: 6 машин каждая (линейка 4 на поле — та, что у текущего события)
const EVENT_CARS = {
  retro: [['Arion', 'Petit'], ['Seora', 'Dolce'], ['Haneul', 'Ondo'], ['Rheinmark', 'Kabrio 58'], ['Vierling', 'Strada'], ['Nordhaus', 'Grand Salon']],
  trucks: [['Fjellvik', 'Bud'], ['Haneul', 'Dalgo'], ['Seora', 'Kargo'], ['Rheinmark', 'Pritsche'], ['Arion', 'Konvoi'], ['Nordhaus', 'Hochlast']],
  racing: [['Seora', 'Sprint'], ['Haneul', 'Pista'], ['Fjellvik', 'Rally'], ['Vierling', 'Ring'], ['Arion', 'Apex'], ['Seiran', 'Kaze GT']],
};

const N = CONFIG.cols * CONFIG.rows;
const C = CONFIG;
const key = (line, lvl) => line + '-' + lvl;
const isPart = line => line === PARTS || line === TRIM;
const maxLvl = line => isPart(line) ? 5 : line === EV ? 6 : 8;
const units = (line, lvl) => 2 ** (lvl - 1) * (isPart(line) ? C.partUnits : 1);
const xpNeed = level => Math.round(C.xpBase * C.xpGrowth ** (level - 1));
const portOf = line => C.ports.find(p => p.line === line);
const zoneIdx = id => C.salon.findIndex(z => z.id === id);

// Детерминированный генератор (mulberry32): бот воспроизводим, сохранение тоже.
function rand(s) {
  let t = (s.rng = (s.rng + 0x6D2B79F5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function pickW(s, weights) {
  const e = Object.entries(weights).filter(([, w]) => w > 0);
  let r = rand(s) * e.reduce((a, [, w]) => a + w, 0);
  for (const [v, w] of e) if ((r -= w) < 0) return isNaN(+v) ? v : +v;
  const v = e[e.length - 1][0];
  return isNaN(+v) ? v : +v;
}
const randInt = (s, lo, hi) => lo + Math.floor(rand(s) * (hi - lo + 1));

// ── Эффекты салона: что уже построено ──────────────────────────────────────
const built = (s, zi, item) => !!s.salon[C.salon[zi].id]?.[item];
function fxSum(s, name) {
  let sum = 0;
  C.salon.forEach((z, zi) => z.items.forEach((it, k) => { if (z.fx[k][name] !== undefined && built(s, zi, it)) sum += z.fx[k][name] || 1; }));
  return sum;
}
const fxHas = (s, name) => fxSum(s, name) > 0;
// Бак: салон + 8-я ступень порта (+10) + престиж порта (+2 за ступень)
const tierFuel = t => t < 8 ? 0 : C.tierFuel[0] + C.tierFuel[1] * (t - 8);
const fuelMax = s => C.fuelMax + fxSum(s, 'fuel') + [0, 1, 2].reduce((a, l) => a + tierFuel(s.tiers[l]), 0);
const regenMs = s => C.fuelRegenMs * (fxHas(s, 'regen') ? 0.75 : 1) / s.speed;
const lineDone = (s, line) => CARS[line].every((_, i) => s.seen[key(line, i + 1)]);

// ── Поле: соседи, открытые и закрытые клетки ───────────────────────────────
const rc = i => [Math.floor(i / C.cols), i % C.cols];
function around(i, diag = true) {
  const [r, c] = rc(i), out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if ((!dr && !dc) || (!diag && dr && dc)) continue;
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < C.rows && cc >= 0 && cc < C.cols) out.push(rr * C.cols + cc);
  }
  return out;
}
const CLOSED = { lock: 1, box: 1, slot: 1 };
const closed = c => !!c && c.k in CLOSED;
const openCount = s => s.cells.filter(c => !closed(c) && c?.k !== 'port').length;
const dist2 = (a, b) => { const [r0, c0] = rc(a), [r1, c1] = rc(b); return (r0 - r1) ** 2 + (c0 - c1) ** 2; };
const isCar = c => c?.k === 'car' && !c.broken;
const isCert = c => isCar(c) && c.line === PARTS && c.lvl === 5;
// Какой инструмент чинит машину (1–2 ур. — ключ, 3–4 — набор, 5–6 — колесо, 7–8 — двигатель)
// и какая деталь Ателье поднимает редкость (белая → зелёная — 2-я деталь, … фиолетовая → оранжевая — 5-я)
const toolFor = lvl => Math.ceil(lvl / 2);
const trimFor = r => r + 2;
// что нужно машине: сломанной — свой инструмент Мастерской, целой — деталь Ателье на следующую редкость
const needItem = c => c.broken ? [PARTS, toolFor(c.lvl)] : (c.r || 0) < 4 ? [TRIM, trimFor(c.r || 0)] : null;
const itemFits = (c, it) => !!it && (c.broken ? it.line === PARTS && it.lvl === toolFor(c.lvl) : it.line === TRIM && it.lvl === trimFor(c.r || 0));

function nearestFree(s, from) {
  let best = -1, bestD = Infinity;
  s.cells.forEach((c, i) => { if (!c && dist2(i, from) < bestD) { bestD = dist2(i, from); best = i; } });
  return best;
}

// ── Звёзды, уровень, коллекция ──────────────────────────────────────────────
function addStars(s, n, at, ev) {
  if (n <= 0) return;
  s.stars += n; s.xp += n; s.starsTotal += n;
  ev.push({ t: 'stars', n, at });
  while (s.xp >= xpNeed(s.level)) {
    s.xp -= xpNeed(s.level);
    s.level++;
    ev.push(...levelReward(s));
  }
}

// Машина появилась на поле: коллекция, «новая высота», задание дня
function discover(s, line, lvl, r, at, ev) {
  s.top[line] = Math.max(s.top[line] || 0, lvl);
  if (line >= PARTS) return;
  goal(s, 'lvl', lvl, true);
  const k = key(line, lvl), prev = s.seen[k] || 0, bit = 1 << r;
  if (prev & bit) return;
  s.seen[k] = prev | bit;
  if (prev) ev.push({ t: 'newRar', line, lvl, r });   // новая редкость знакомой модели — карточка ложится на стопку
  else {
    ev.push({ t: 'newCar', line, lvl, r });
    addStars(s, C.newModelStars[lvl] * (fxHas(s, 'newStars') ? 2 : 1), at, ev);
    if (lineDone(s, line)) ev.push({ t: 'lineDone', line });
  }
  if (s.seen[k] === 31) { ev.push({ t: 'allRar', line, lvl }); addStars(s, C.allRaritiesStars, at, ev); }
}

function place(s, to, item, from, ev) {
  if (item[0] === 'key' && !s.cells.some(c => c?.k === 'box')) { s.coins += C.keyCoins; ev.push({ t: 'coinGift', at: from, n: C.keyCoins }); return; }
  if (item[0] === 'key') { s.cells[to] = { k: 'key' }; ev.push({ t: 'spawn', from, to }, { t: 'key', at: to }); return; }
  const [line, lvl, r = 0] = item;
  s.cells[to] = { k: 'car', line, lvl, r };
  ev.push({ t: 'spawn', from, to });
  discover(s, line, lvl, r, to, ev);
}

// Добыча ящика-сюрприза: машины, детали, топливо или монеты
function boxLoot(s) {
  const lines = carLines(s), items = [];
  for (let k = randInt(s, 2, 3); k > 0; k--) {        // +1 машина — из бывших машин под чехлом
    const line = lines[Math.floor(rand(s) * lines.length)];
    items.push([line, randInt(s, 2, Math.max(2, Math.min(5, s.top[line]))), rarOn(s) ? pickW(s, { 0: 75, 1: 20, 2: 5 }) : 0]);
  }
  if (portOpen(s, PARTS)) items.push([PARTS, randInt(s, 1, 3)]);
  items.push(rand(s) < 0.5 ? ['fuel', 20] : ['coins', 15 + 3 * s.level]);
  return items;
}

// Открыть закрытую клетку: замок исчезает, ящик раскрывается
function openCell(s, i, ev) {
  const c = s.cells[i];
  if (c?.k === 'lock') { s.cells[i] = null; ev.push({ t: 'open', at: i }); }
  if (c?.k === 'box') {
    s.cells[i] = { k: 'chest', kind: 'box', cars: boxLoot(s) }; s.n.boxes++; ev.push({ t: 'boxOpen', at: i });
    // последний ящик открыт — лишние ключи больше не нужны: каждый превращается в монеты
    if (!s.cells.some(x => x?.k === 'box')) s.cells.forEach((x, j) => { if (x?.k === 'key') { s.cells[j] = null; s.coins += C.keyCoins; ev.push({ t: 'coinGift', at: j, n: C.keyCoins }); } });
  }
}
const canOpen = (s, i) => ['lock', 'box'].includes(s.cells[i]?.k) && around(i, false).some(j => !closed(s.cells[j]));
// Открыть n ближайших к from замков (ящики — только ключом). Возвращает открытые клетки.
function openNearest(s, n, from, ev) {
  const out = [];
  for (let k = 0; k < n; k++) {
    let best = -1;
    s.cells.forEach((c, i) => { if (canOpen(s, i) && c.k !== 'box' && (best < 0 || dist2(i, from) < dist2(best, from))) best = i; });
    if (best < 0) break;
    openCell(s, best, ev);
    out.push(best);
  }
  return out;
}
// Клетка за монеты: замок рядом с открытой областью; каждая следующая дороже
const cellPrice = s => Math.round(C.cellCoins[0] * C.cellCoins[1] ** s.n.bought);
const buyableCells = s => s.cells.map((c, i) => c?.k === 'lock' && canOpen(s, i) ? i : -1).filter(i => i >= 0);
function buyCell(s, i) {
  if (s.cells[i]?.k !== 'lock' || !canOpen(s, i)) return [{ t: 'reject', at: i }];
  const price = cellPrice(s);
  if (s.coins < price) return [{ t: 'poor', at: i }];
  s.coins -= price; s.n.bought++;
  const ev = [{ t: 'cellBuy', at: i, price }];
  openCell(s, i, ev);
  return ev;
}
const portOpen = (s, line) => line === EV ? !!s.ev && s.ev.port >= 0 : s.cells[portOf(line).cell]?.k === 'port';
const rarOn = s => portOpen(s, TRIM);              // редкость открывает Ателье
function openPort(s, line, ev) {
  const p = portOf(line);
  if (portOpen(s, line)) return;
  const was = s.cells[p.cell];                     // старое сохранение: на месте гаража стоит машина — переставить
  s.cells[p.cell] = { k: 'port', line };
  if (was && !closed(was) && was.k !== 'port') { const at = nearestFree(s, p.cell); if (at >= 0) s.cells[at] = was; else s.coins += 25; }
  ev.push({ t: 'port', at: p.cell, line });
  around(p.cell, line === 0).forEach(i => openCell(s, i, ev));   // вокруг первого гаража — кольцо из 8 клеток, у остальных — 4 клетки
  if (line === TRIM) { ev.push({ t: 'rarityOn' }); s.atelier = { n: 0, at: s.fuelAt }; }   // Ателье — редкость; заряды копятся с нуля
}
const carLines = s => [0, 1, 2].filter(l => portOpen(s, l));

function newGame(now, seed) {
  const s = {
    v: 3, rng: seed | 0, cells: [],
    fuel: C.fuelMax, fuelAt: now, speed: 1,
    coins: 0, stars: 0, starsTotal: 0, xp: 0, level: 1,
    tiers: [0, 0, 0, 0, 0, 0], taps: [0, 0, 0, 0, 0, 0],
    slots: 1, orders: [null, null, null, null],
    salon: {}, seen: {}, top: [1, 0, 0, 0, 0, 0],
    n: { spawns: 0, merges: 0, mixed: 0, lucky: 0, orders: 0, orderSeq: 0, replaced: 0, keys: 0, boxes: 0, repairs: 0, bought: 0, rarUps: 0 },
    v: 7,
    streak: { n: 0, at: 0 }, refreshAt: 0,
    daily: null, giftDay: null, sound: false, style: 'A',
    store: [], storeN: 0, ship: null, ev: null, prestige: 0, trophies: {},
  };
  for (let i = 0; i < N; i++) s.cells.push({ k: 'lock' });
  C.boxes.forEach(i => { s.cells[i] = { k: 'box' }; });
  C.ports.forEach(p => { s.cells[p.cell] = { k: 'slot', line: p.line }; });
  openPort(s, 0, []);
  s.seen['0-1'] = 1;                  // первая машина известна сразу — без всплывашки посреди обучения
  s.orders[0] = makeOrder(s, 0, now);
  return s;
}

// Старое сохранение → нынешние правила: машина под чехлом становится обычной на той же клетке, новые поля — по умолчанию
function migrate(s) {
  s.cells.forEach((c, i) => {
    if (c?.k !== 'cover') return;
    s.cells[i] = { k: 'car', line: c.line, lvl: c.lvl, r: c.r || 0 };
    s.seen[key(c.line, c.lvl)] = (s.seen[key(c.line, c.lvl)] || 0) | (1 << (c.r || 0));
  });
  s.n.bought ??= 0; s.n.rarUps ??= 0;
  for (const a of [s.tiers, s.taps, s.top]) { a[4] ??= 0; a[5] ??= 0; }
  if (!s.bench && !s.v) {          // сохранение до задания 5: Мастерская — по уровню, а редкость у них уже была — Ателье сразу
    const ev = [];
    if (s.level >= portOf(PARTS).level || s.cells.some(c => c?.broken)) openPort(s, PARTS, ev);
    s.cells.forEach(c => { if (c?.broken) c.since ??= s.fuelAt; });
    if (s.level >= 3) openPort(s, TRIM, ev);
    else if (s.cells[portOf(TRIM).cell]?.k === 'lock') s.cells[portOf(TRIM).cell] = { k: 'slot', line: TRIM };
  }
  if (s.bench) {          // задание 7: Верстака больше нет — что лежало на нём, возвращается на поле (нет места — 25 монет)
    s.bench.forEach(w => [w.car, w.item].forEach(c => { if (!c) return; const at = nearestFree(s, C.ports[0].cell); if (at >= 0) s.cells[at] = c; else s.coins += 25; }));
    delete s.bench; delete s.benchN;
  }
  s.v = 7;
  s.store ??= []; s.storeN ??= 0; s.ship ??= null; s.ev ??= null; s.prestige ??= 0; s.trophies ??= {};
  if (s.daily && !s.daily.goals[0]?.t) s.daily = null;        // задания дня старого вида — пересоздать
  return s;
}

// ── Время: топливо и пузыри ────────────────────────────────────────────────
function tick(s, now) {
  const ev = [];
  s.cells.forEach((c, i) => { if (c?.k === 'bubble' && now >= c.until) { s.cells[i] = null; ev.push({ t: 'bubblePop', at: i }); } });
  if (now < s.fuelAt) s.fuelAt = now;            // часы на телефоне перевели назад
  if (s.fuel >= fuelMax(s)) { s.fuelAt = now; return ev; }
  const step = regenMs(s);
  const n = Math.floor((now - s.fuelAt) / step);
  if (n > 0) {
    s.fuel = Math.min(fuelMax(s), s.fuel + n);
    s.fuelAt = s.fuel >= fuelMax(s) ? now : s.fuelAt + n * step;
  }
  return ev;
}
const fuelWaitMs = (s, now) => Math.max(0, regenMs(s) - (now - s.fuelAt));
function setSpeed(s, now, speed) {
  tick(s, now);
  const done = (now - s.fuelAt) / regenMs(s);   // доля накопленного деления
  s.speed = speed;
  s.fuelAt = now - done * regenMs(s);
}
function buyFuel(s) {
  if (s.fuel >= 1 || s.coins < C.fuelCoins) return [{ t: 'reject' }];
  s.coins -= C.fuelCoins;
  s.fuel = fuelMax(s);
  return [{ t: 'fuelBuy' }];
}

// ── Причал: корабль с ящиком машин раз в 4 часа (с маяком — 3). Можно не ждать — за монеты ──
const shipMs = s => C.ship.ms[fxHas(s, 'shipFast') ? 1 : 0] / s.speed;
const shipPrice = (s, now) => s.ship ? Math.max(1, Math.ceil(C.ship.coins * Math.max(0, s.ship.at - now) / shipMs(s))) : 0;
function arrive(s, now, pay = false) {
  if (!s.ship || (!pay && now < s.ship.at)) return [];
  const at = nearestFree(s, C.ports[0].cell);
  if (at < 0) return pay ? [{ t: 'full', at: C.ports[0].cell }] : [];
  if (pay && now < s.ship.at) {
    const price = shipPrice(s, now);
    if (s.coins < price) return [{ t: 'poor' }];
    s.coins -= price;
  }
  const lines = carLines(s), items = [];
  for (let k = randInt(s, ...C.ship.cars); k > 0; k--) items.push([lines[Math.floor(rand(s) * lines.length)], randInt(s, ...C.ship.lvls), rollRarity(s, 2)]);
  items.push(['fuel', C.ship.fuel]);
  s.cells[at] = { k: 'chest', kind: 'ship', cars: items };
  s.ship.at = now + shipMs(s);
  return [{ t: 'ship', at }];
}

// ── Склад: до 4 машин вне поля ─────────────────────────────────────────────
function store(s, i) {
  const c = s.cells[i];
  if (!isCar(c) || s.store.length >= s.storeN) return [{ t: 'reject', at: i }];
  s.store.push(c); s.cells[i] = null;
  return [{ t: 'store', from: i }];
}
function unstore(s, k) {
  const c = s.store[k], at = c ? nearestFree(s, C.ports[0].cell) : -1;
  if (at < 0) return [{ t: 'full', at: C.ports[0].cell }];
  s.store.splice(k, 1); s.cells[at] = c;
  return [{ t: 'unstore', to: at }];
}
function buyStore(s) {
  const i = s.storeN;
  if (!i || i >= C.storePrices.length) return [{ t: 'reject' }];
  if (s.coins < C.storePrices[i]) return [{ t: 'poor' }];
  s.coins -= C.storePrices[i]; s.storeN++;
  return [{ t: 'storeSlot', i }];
}

// ── Порты: топливо, уровень и редкость машины, улучшения ─────────────────────
const portFuel = line => portOf(line)?.fuel || 1;
// Это касание — бесплатное? Со 2-й ступени каждое 3-е; у полной линейки внедорожников — каждое 2-е
function freeTap(s, line) {
  const every = line === 1 && lineDone(s, 1) ? 2 : s.tiers[line] >= C.freeTapFrom ? C.freeTapEvery : 0;
  return every > 0 && (s.taps[line] + 1) % every === 0;
}
const tapCost = (s, line) => freeTap(s, line) ? 0 : portFuel(line);
function rollRarity(s, tier) {
  if (!rarOn(s)) return 0;                        // до Ателье все машины белые
  tier = Math.min(tier, 5);                       // второй ряд и престиж порта редкость не поднимают
  const o = C.rarityOdds.slice();
  o[1] += C.tierRarity[0] * tier; o[2] += C.tierRarity[1] * tier; o[3] += C.tierRarity[2] * Math.max(0, tier - C.epicFromTier + 1);
  o[0] = 1 - o.slice(1).reduce((a, b) => a + b, 0);
  return pickW(s, Object.assign({}, o));
}
function spawnLvl(s, line) {
  const t = s.tiers[line];
  if (isPart(line)) return (rand(s) < (line === TRIM ? C.trimTierLvl2 : C.partTierLvl2)[Math.min(t, 5)] ? 2 : 1) + (fxHas(s, 'toolUp') && rand(s) < C.toolUp ? 1 : 0);
  const r = rand(s), l3 = C.tierLvl3[Math.min(t, C.tierLvl3.length - 1)], l2 = C.tierLvl2[Math.min(t, C.tierLvl2.length - 1)];
  return r < l3 ? 3 : r < l3 + l2 ? 2 : 1;
}

// Заряды Ателье: копятся по часам до 3
const atRegen = s => C.atelier.regenMs / s.speed;
function charges(s, now) {
  const a = s.atelier ||= { n: C.atelier.charges, at: now };
  if (a.n >= C.atelier.charges) { a.at = now; return a.n; }
  const k = Math.floor((now - a.at) / atRegen(s));
  if (k > 0) { a.n = Math.min(C.atelier.charges, a.n + k); a.at = a.n >= C.atelier.charges ? now : a.at + k * atRegen(s); }
  return a.n;
}
// Заряд сейчас — за монеты; цена растёт с каждой покупкой за день и сбрасывается ночью (day — номер или дата дня)
const chargePrice = (s, day) => Math.round(C.atelier.coins[0] * C.atelier.coins[1] ** (s.atelier?.buy?.day === day ? s.atelier.buy.n : 0));
function buyCharge(s, now, day) {
  if (!rarOn(s) || charges(s, now) >= C.atelier.charges) return [{ t: 'reject' }];
  const price = chargePrice(s, day);
  if (s.coins < price) return [{ t: 'poor' }];
  s.coins -= price;
  s.atelier.n++;
  if (s.atelier.n >= C.atelier.charges) s.atelier.at = now;
  s.atelier.buy = { day, n: s.atelier.buy?.day === day ? s.atelier.buy.n + 1 : 1 };
  return [{ t: 'chargeBuy', price, at: portOf(TRIM).cell }];
}
// Награда за ролик или покупку (задание 12; в игре — только с ?monet=1): одна функция на все места.
// fuel — полный бак, когда бак пуст; charge — +1 заряд Ателье, когда зарядов 0. Условие не выполнено — ничего не даёт
function reward(s, place, now) {
  if (place === 'fuel' && s.fuel < 1) s.fuel = fuelMax(s);
  else if (place === 'charge' && rarOn(s) && charges(s, now) === 0) s.atelier.n++;
  else return [{ t: 'reject' }];
  return [{ t: 'reward', place, at: place === 'charge' ? portOf(TRIM).cell : -1 }];
}
const chargeWaitMs = (s, now) => charges(s, now) >= C.atelier.charges ? 0 : Math.max(0, atRegen(s) - (now - s.atelier.at));
function tapPort(s, i, now) {
  const c = s.cells[i];
  if (c?.k !== 'port') return [];
  tick(s, now);
  const cost = tapCost(s, c.line);
  if (s.fuel < cost) return [{ t: 'noFuel', at: i }];
  if (c.line === TRIM && charges(s, now) < 1) return [{ t: 'noCharge', at: i }];
  const to = nearestFree(s, i);
  if (to < 0) return [{ t: 'full', at: i }];
  s.fuel -= cost; s.taps[c.line]++;
  if (c.line === TRIM) { if (s.atelier.n >= C.atelier.charges) s.atelier.at = now; s.atelier.n--; }
  const ev = cost ? [] : [{ t: 'freeTap', at: i }];
  const tutorial = s.n.spawns++ < C.tutorialSpawns;
  if (!tutorial && c.line !== EV && rand(s) < C.crateChance[fxHas(s, 'crates') ? 1 : 0]) {
    const items = [];
    for (let k = randInt(s, 2, 3); k > 0; k--) items.push([c.line, 1 + (rand(s) < 0.4 ? 1 : 0), isPart(c.line) ? 0 : rollRarity(s, s.tiers[c.line])]);
    s.cells[to] = { k: 'chest', kind: 'crate', cars: items };
    return [...ev, { t: 'spawn', from: i, to }, { t: 'crate', at: to }];
  }
  const lvl = tutorial ? 1 : spawnLvl(s, c.line);
  const r = tutorial || c.line >= PARTS ? 0 : rollRarity(s, s.tiers[c.line]);
  if (!tutorial && c.line < PARTS && portOpen(s, PARTS) && s.cells.filter(x => x?.broken).length < C.broken.max && rand(s) < C.broken.chance) {
    s.cells[to] = { k: 'car', line: c.line, lvl: Math.min(7, lvl + randInt(s, ...C.broken.up)), r, broken: true, since: now };
    ev.push({ t: 'spawn', from: i, to }, { t: 'broken', at: to });
    return ev;
  }
  place(s, to, [c.line, lvl, r], i, ev);
  return ev;
}

// Ступени: 1–5 — у всех; 6–8 и престиж без конца — у гаражей машин после погрузчика
const maxTier = (s, line) => line < PARTS && fxHas(s, 'tier2') ? Infinity : 5;
const tierPrice = t => t < C.tierPrices.length ? C.tierPrices[t] : Math.round(C.tierPrices[C.tierPrices.length - 1] * C.tierGrowth ** (t - C.tierPrices.length + 1));
// Что даёт ступень гаража — для карточки «было → станет»
function tierStats(s, line, t) {
  const tr = Math.min(t, 5), free = t >= C.freeTapFrom ? C.freeTapEvery : 0;
  if (isPart(line)) return { lvl2: (line === TRIM ? C.trimTierLvl2 : C.partTierLvl2)[tr], free };
  return { lvl2: C.tierLvl2[Math.min(t, C.tierLvl2.length - 1)], lvl3: C.tierLvl3[Math.min(t, C.tierLvl3.length - 1)], free,
    rar1: C.rarityOdds[1] + C.tierRarity[0] * tr, rar3: C.tierRarity[2] * Math.max(0, tr - C.epicFromTier + 1), fuel: tierFuel(t) };
}
function upgradePort(s, line) {
  const t = s.tiers[line];
  if (!portOpen(s, line) || line === EV || t >= maxTier(s, line)) return [{ t: 'reject' }];
  if (s.coins < tierPrice(t)) return [{ t: 'poor', line }];
  s.coins -= tierPrice(t);
  s.tiers[line]++;
  return [{ t: 'tier', line, tier: t + 1, at: portOf(line).cell }];
}

function tapChest(s, i) {
  const c = s.cells[i];
  if (c?.k !== 'chest') return [];
  const item = c.cars[0], ev = [];
  if (item[0] === 'fuel') { s.fuel += item[1]; ev.push({ t: 'fuelGift', at: i, n: item[1] }); }
  else if (item[0] === 'coins') { s.coins += item[1]; ev.push({ t: 'coinGift', at: i, n: item[1] }); }
  else {
    const to = nearestFree(s, i);
    if (to < 0) return [{ t: 'full', at: i }];
    place(s, to, item, i, ev);
  }
  c.cars.shift();
  if (!c.cars.length) { s.cells[i] = null; goal(s, 'chest'); }
  return ev;
}

function giveChest(s, line, kind, items, ev) {
  const at = nearestFree(s, portOf(line).cell);
  if (at < 0) { s.fuel = Math.max(s.fuel, fuelMax(s)); ev.push({ t: 'fuel' }); return; }
  s.cells[at] = { k: 'chest', kind, cars: items };
  ev.push({ t: 'chest', at });
}
function levelChest(s, line) {
  const [lo, hi] = C.chestLvl, cars = [];
  for (let k = 0; k < C.chestCars; k++) cars.push([line, randInt(s, lo, hi), line < PARTS ? rollRarity(s, 1) : 0]);
  return cars;
}

// Подарок раз в день (day — номер или дата дня). Нет места — подождёт до свободной клетки.
function dailyGift(s, day) {
  const ev = [];
  if (!s.daily || s.daily.day !== day) newDaily(s, day);
  if (s.giftDay === day) return ev;
  const at = nearestFree(s, C.ports[0].cell);
  if (at < 0) return ev;
  s.giftDay = day;
  const lines = carLines(s), [lo, hi] = C.gift.lvls, items = [];
  for (let k = C.gift.cars + fxSum(s, 'gift'); k > 0; k--) items.push([lines[Math.floor(rand(s) * lines.length)], randInt(s, lo, hi), rollRarity(s, 2)]);
  if (portOpen(s, PARTS)) items.push([PARTS, 2]);
  items.push(['fuel', C.gift.fuel]);
  s.cells[at] = { k: 'chest', kind: 'gift', cars: items };
  ev.push({ t: 'gift', at });
  return ev;
}

// ── Задания дня: «Слей N машин», «Выполни N заказов» и третье по очереди. За каждое — топливо, за все три — сундук ──
function newDaily(s, day) {
  const L = s.level, top = Math.max(...[0, 1, 2].map(l => s.top[l]));
  const third = [['chest', C.daily.chests], ['lvl', Math.max(3, Math.min(6, top))]];
  if (s.slots >= 2) third.push(['big', 1]);
  if (portOpen(s, PARTS)) third.push(['repair', 1]);
  if (rarOn(s)) third.push(['rarity', 1]);
  const [t3, n3] = third[Math.floor(rand(s) * third.length)];
  const mk = (t, need, k) => ({ t, need, have: 0, fuel: C.daily.fuel[k], got: false });
  s.daily = { day, claimed: false, goals: [
    mk('merge', C.daily.merges[0] + C.daily.merges[1] * Math.min(4, Math.floor(L / 4)), 0),
    mk('order', C.daily.orders[0] + C.daily.orders[1] * Math.min(3, Math.floor(L / 6)), 1),
    mk(t3, n3, 2),
  ] };
}
// Продвинуть задание дня: на n или, если reach, — «машина уровня n получена»
function goal(s, t, n = 1, reach = false) {
  s.daily?.goals.forEach(g => { if (g.t === t) g.have = reach ? (n >= g.need ? g.need : g.have) : g.have + n; });
}
const goalDone = g => g.have >= g.need;
const taskReady = s => s.daily ? s.daily.goals.findIndex(g => goalDone(g) && !g.got) : -1;
const dailyDone = s => !!s.daily && !s.daily.claimed && s.daily.goals.every(g => g.got);
function claimTask(s, k) {
  const g = s.daily?.goals[k];
  if (!g || g.got || !goalDone(g)) return [{ t: 'reject' }];
  g.got = true;
  s.fuel += g.fuel;
  return [{ t: 'taskClaim', k, n: g.fuel }];
}
function claimDaily(s) {
  if (!dailyDone(s)) return [{ t: 'reject' }];
  const at = nearestFree(s, C.ports[0].cell);
  if (at < 0) return [{ t: 'full', at: C.ports[0].cell }];
  s.daily.claimed = true;
  const lines = carLines(s), items = [];
  for (let k = 0; k < 2; k++) { const line = lines[Math.floor(rand(s) * lines.length)]; items.push([line, randInt(s, 2, Math.max(2, Math.min(5, s.top[line]))), rollRarity(s, 3)]); }
  if (portOpen(s, PARTS)) items.push([PARTS, randInt(s, 2, 3)]);
  items.push(['coins', 20 + 4 * s.level]);
  if (s.level >= 5 && s.cells.some(c => c?.k === 'box')) items.push(['key']);
  s.cells[at] = { k: 'chest', kind: 'daily', cars: items };
  return [{ t: 'claim', at }];
}

// ── Слияние ────────────────────────────────────────────────────────────────
// Сертификат коллекционера: где угодно на поле — пара 7 + 7 сливается, сертификат улетает в новую машину
const certAt = s => s.cells.findIndex(isCert);
const canKey = (s, i) => s.cells[i]?.k === 'box' && canOpen(s, i);

function move(s, from, to, now) {
  const a = s.cells[from], b = s.cells[to];
  if (from === to || (a?.k !== 'car' && a?.k !== 'key')) return [];
  if (a.k === 'key' && b?.k === 'box') {
    if (!canOpen(s, to)) return [{ t: 'reject', at: from }];
    s.cells[from] = null; s.n.keys++;
    const ev = [{ t: 'keyUse', from, at: to }];
    openCell(s, to, ev);
    return ev;
  }
  if (!b) { s.cells[to] = a; s.cells[from] = null; return [{ t: 'move', from, to }]; }
  if (b.k !== 'car' && b.k !== 'key') return [{ t: 'reject', at: from }];
  const fix = useItem(s, from, to);
  if (fix) return fix;
  if (!isCar(a) || !isCar(b) || a.line !== b.line || a.lvl !== b.lvl || a.lvl >= maxLvl(a.line)) {
    s.cells[from] = b; s.cells[to] = a;
    return [{ t: 'swap', from, to }];
  }
  // Две машины 7-го уровня сливаются в 8-й, только если на поле есть сертификат (в любом месте)
  let cert = -1;
  if (a.lvl === 7 && a.line < PARTS) {
    cert = certAt(s);
    if (cert < 0) return [{ t: 'needCert', at: to, from }];
  }
  const lvl = a.lvl + 1;
  let r = Math.min(a.r || 0, b.r || 0);
  const lucky = a.line < PARTS && rarOn(s) && r < 4 && rand(s) < C.luckyChance;
  if (lucky) { r++; s.n.lucky++; }
  if ((a.r || 0) !== (b.r || 0)) s.n.mixed++;
  s.cells[from] = null;
  s.cells[to] = { k: 'car', line: a.line, lvl, r: a.line >= PARTS ? 0 : r };
  // старшая машина после слияния часто сломана — чинится инструментом Мастерской; в коллекцию — когда починят
  const broke = a.line < PARTS && lvl >= C.brokenMerge.from && lvl <= C.brokenMerge.to && portOpen(s, PARTS) && rand(s) < C.brokenMerge.chance;
  if (broke) Object.assign(s.cells[to], { broken: true, since: now });
  s.n.merges++;
  goal(s, 'merge');
  const ev = [{ t: 'merge', from, to, line: a.line, lvl, r, lucky, same: (a.r || 0) === (b.r || 0) }];
  if (cert >= 0) { s.cells[cert] = null; ev.push({ t: 'cert', at: cert, to }); }
  const bonus = a.line === 2 && lineDone(s, 2) ? 1 + C.lineBonus : 1;
  addStars(s, Math.round(C.mergeStars[lvl] * C.rarityCoins[r] * bonus), to, ev);
  if (broke) ev.push({ t: 'broken', at: to }); else discover(s, a.line, lvl, r, to, ev);
  if (lvl >= 5 && rand(s) < C.keyFromMerge * (fxHas(s, 'keys') ? 1.5 : 1)) dropKey(s, to, ev);
  if (a.line < PARTS && lvl <= C.bubbleMaxLvl && rand(s) < C.bubbleChance) {
    const spot = around(to).find(i => !s.cells[i]);
    if (spot !== undefined) {
      s.cells[spot] = { k: 'bubble', line: a.line, lvl, r, until: now + C.bubbleMs,
        price: Math.ceil(units(a.line, lvl) * C.bubbleCoinsPerUnit * (fxHas(s, 'bubbles') ? 0.7 : 1)) };
      ev.push({ t: 'bubble', at: spot });
    }
  }
  return ev;
}

// Деталь на машину — как слияние: инструмент Мастерской чинит сломанную, деталь Ателье поднимает редкость на одну.
// Можно и наоборот — машину на деталь. Машина остаётся на клетке, куда тащили; деталь тратится. Не подходит — null
function useItem(s, from, to) {
  const a = s.cells[from], b = s.cells[to];
  if (a?.k !== 'car' || b?.k !== 'car') return null;                       // сломанная — тоже машина (isCar её не считает)
  const [car, it] = isPart(a.line) ? [b, a] : [a, b];
  if (car.line >= PARTS || !isPart(it.line) || !(car.broken || rarOn(s)) || !itemFits(car, it)) return null;
  s.cells[from] = null; s.cells[to] = car;
  const ev = [];
  if (car.broken) { delete car.broken; delete car.since; s.n.repairs++; goal(s, 'repair'); ev.push({ t: 'repair', from, to, line: car.line, lvl: car.lvl }); }
  else { car.r = (car.r || 0) + 1; s.n.rarUps++; goal(s, 'rarity'); ev.push({ t: 'rarUp', from, to, line: car.line, lvl: car.lvl, r: car.r }); }
  discover(s, car.line, car.lvl, car.r || 0, to, ev);
  return ev;
}

// Ключ выпадает, только когда им есть что открыть сейчас: ящиков рядом с открытыми клетками больше, чем ключей
function dropKey(s, near, ev) {
  const locks = s.cells.filter((c, i) => c?.k === 'box' && canOpen(s, i)).length;
  if (s.cells.filter(c => c?.k === 'key').length >= locks) return;
  const at = nearestFree(s, near);
  if (at < 0) return;
  s.cells[at] = { k: 'key' };
  ev.push({ t: 'key', at });
}

function buyBubble(s, i, now) {
  const c = s.cells[i];
  if (c?.k !== 'bubble') return [];
  if (now >= c.until) { s.cells[i] = null; return [{ t: 'bubblePop', at: i }]; }
  if (s.coins < c.price) return [{ t: 'reject', at: i }];
  s.coins -= c.price;
  s.cells[i] = { k: 'car', line: c.line, lvl: c.lvl, r: c.r };
  const ev = [{ t: 'bubbleBuy', at: i, price: c.price }];
  discover(s, c.line, c.lvl, c.r, i, ev);
  return ev;
}

// ── Заказы ─────────────────────────────────────────────────────────────────
// Предмет заказа: { line, lvl, r (нужная редкость или −1 — любая), n (сколько), got (уже отдано) }
const itemCap = (s, line) => line === PARTS ? 5 : portOpen(s, PARTS) ? 8 : 7;
function pickKind(s, slot) {
  const others = s.orders.filter((o, i) => o && i !== slot && i < s.slots).map(o => o.kind);
  if (fxHas(s, 'showcase') && rand(s) < C.showcaseChance) return 'showcase';
  if (s.slots >= 2 && !others.includes('big')) return 'big';
  return pickW(s, C.kindWeights);
}

const evActive = s => !!s.ev?.on;
function makeOrder(s, slot, now) {
  const seq = s.n.orderSeq++;
  const evOrder = !C.firstOrders[seq] && evActive(s) && s.ev.port >= 0 && rand(s) < C.event.orderChance &&
    !s.orders.some((o, i) => o && i !== slot && i < s.slots && o.kind === 'event');
  const kind = C.firstOrders[seq] ? 'quick' : evOrder ? 'event' : pickKind(s, slot);
  const lines = carLines(s), items = [];
  const add = (line, lvl, n = 1, r = -1) => {
    lvl = Math.max(1, Math.min(itemCap(s, line), lvl));
    const same = items.find(x => x.line === line && x.lvl === lvl && x.r === r);
    if (same) same.n += n; else items.push({ line, lvl, r, n, got: 0 });
  };
  const line = () => lines[Math.floor(rand(s) * lines.length)];
  if (C.firstOrders[seq]) C.firstOrders[seq].forEach(([l, v]) => add(l, v));
  else if (kind === 'event') {                      // всегда две машины события
    const lvl = randInt(s, 2, Math.max(2, Math.min(4, s.top[EV] + 1)));
    if (lvl <= 3) add(EV, lvl, 2); else { add(EV, lvl); add(EV, 2); }
  }
  else if (kind === 'showcase') { const l = line(); const v = Math.max(2, Math.min(5, s.top[l] - randInt(s, 2, 3))); if (rarOn(s)) { add(l, v, 1, 1); add(l, v); } else add(l, v, 2); }
  else {
    const stage = C.orderGrowth.filter(l => s.level >= l).length;
    let [lo, hi] = C.orderSize[kind][stage];
    const single = s.orders.some((o, i) => o && i !== slot && i < s.slots && o.items.reduce((a, it) => a + it.n, 0) === 1);
    if (stage === 1 && single) lo = Math.max(lo, 2);   // с 4-го по 6-й — не больше одного заказа на одну машину
    let count = randInt(s, lo, hi);
    if (kind === 'big' && count > 1 && portOpen(s, PARTS) && rand(s) < 0.5) { add(PARTS, randInt(s, 2, Math.max(2, Math.min(4, s.top[PARTS] + 1)))); count--; }
    if (kind === 'big' && stage >= C.orderLead[0] && count > 1 && rand(s) < C.orderLead[2]) { const l = line(); add(l, Math.max(2, Math.min(C.orderLead[3], s.top[l] - C.orderLead[1]))); count--; }   // главная машина — почти лучшая
    // обычный и крупный заказ наполовину берут то, что уже стоит на поле, — так он достижим и разгружает поле.
    // Крупный забирает и то, что дальше не сливается: машины 8-го уровня и лишние сертификаты.
    const top = c => c.lvl === maxLvl(c.line) && (c.line < PARTS || s.cells.filter(isCert).length > 1);
    const [da, db] = C.orderLvl[stage];
    const onField = s.cells.filter(c => isCar(c) && c.lvl >= (c.line < PARTS ? Math.max(C.orderMin[stage], s.top[c.line] - da) : 2) && (kind === 'big' && top(c) ||
      c.line < PARTS && c.lvl < s.top[c.line] - 1 && lines.includes(c.line)));   // «лучшая − 1» не трогаем: из неё растёт новый уровень
    while (count > 0) {
      if (items.length >= C.orderDistinct) { (items.find(x => x.r < 0 && x.line !== PARTS) || items[0]).n++; count--; continue; }
      const pick = kind !== 'quick' && onField.length && rand(s) < 0.5 ? onField[Math.floor(rand(s) * onField.length)] : null;
      const l = pick ? pick.line : line(), M = s.top[l], n = Math.min(count, rand(s) < 0.35 ? 2 : 1);   // n ≤ count — лимит машин держится
      const low = kind === 'quick' && stage >= 2 ? 1 : 0;   // быстрый с 7-го уровня — две машины невысокого уровня
      const lo = l < PARTS ? C.orderMin[stage] : 2;
      const lvl = pick ? pick.lvl : randInt(s, Math.max(lo, M - da - low), Math.max(lo, M - db - low));
      const rr = C.orderRarity[kind]?.[stage] || 0;   // у деталей редкости нет; поздние заказы просят и синюю, и фиолетовую
      const r = pick && pick.r > 0 && rand(s) < C.orderPickRarity ? pick.r : l < PARTS && rarOn(s) && rand(s) < rr ? pickW(s, C.orderRarityW[stage]) : -1;
      add(l, lvl, r >= 0 ? 1 : n, r);
      count -= r >= 0 ? 1 : n;
    }
  }
  items.sort((a, b) => a.line - b.line || a.lvl - b.lvl);
  return { id: seq, kind, items, face: Math.floor(rand(s) * 2 ** 31), born: now, acc: 0 };
}

// Сколько монет даст заказ (обычные машины; редкие — больше)
const itemCoins = (s, it, r = 0) => units(it.line, it.lvl) * C.rarityCoins[r] * (it.line === 0 && lineDone(s, 0) ? 1 + C.lineBonus : 1);
// Надбавка к монетам заказов: пост мойки, престиж салона, трофеи событий
const fullStacks = s => Object.values(s.seen).filter(m => m === 31).length;
const bonusPct = s => (fxHas(s, 'coins') ? C.washBonus : 0) + s.prestige * C.prestige.pct + Object.keys(s.trophies).length * C.event.trophyPct + fullStacks(s) * C.stackPct;
const orderMult = (s, o) => o.kind === 'event' ? 0 : C.kinds[o.kind].mult * (1 + bonusPct(s));
const orderValue = (s, o) => Math.round(o.items.reduce((a, it) => a + itemCoins(s, it, Math.max(0, it.r)) * it.n, 0) * orderMult(s, o));
const orderTokens = o => o.kind !== 'event' ? 0 : Math.round(o.items.reduce((a, it) => a + units(it.line, it.lvl) * it.n, 0) * C.event.tokensPerUnit);
// Подходит руками (перетащил на карточку): редкость не ниже нужной. Более редкую игра отдаёт только после подтверждения
const fits = (c, it) => isCar(c) && c.line === it.line && c.lvl === it.lvl && (c.r || 0) >= Math.max(0, it.r);
// Подходит сама (нажатие на заказ, «готов», подсветка, палец, бот): ровно та редкость, что просит заказ; без редкости — белая
const exact = (c, it) => fits(c, it) && (c.r || 0) === Math.max(0, it.r);

// Какие машины с поля закрывают остаток заказа: для каждого предмета — список клеток ровно нужной редкости
function match(s, o) {
  const used = new Set();
  const cells = o.items.map(it => {
    const need = it.n - it.got;
    const cand = s.cells.map((c, i) => exact(c, it) && !used.has(i) ? i : -1).filter(i => i >= 0).slice(0, need);
    cand.forEach(i => used.add(i));
    return cand;
  });
  return { cells, ready: o.items.every((it, k) => cells[k].length >= it.n - it.got), any: cells.some(c => c.length) };
}

// Отдать одну машину в заказ (перетащил на карточку). Машина редче, чем просит заказ, — только с ok (игрок подтвердил)
function giveOne(s, oi, cell, now, ok) {
  const o = s.orders[oi], c = s.cells[cell];
  if (!o || oi >= s.slots || !isCar(c)) return [{ t: 'reject', at: cell }];
  const cand = o.items.filter(it => it.got < it.n && fits(c, it)).sort((a, b) => b.r - a.r);
  if (!cand.length) return [{ t: 'reject', at: cell }];
  const it = cand[0], need = Math.max(0, it.r);
  if ((c.r || 0) > need && !ok) return [{ t: 'rare', order: oi, at: cell, r: c.r, need }];
  it.got++;
  o.acc += itemCoins(s, it, c.r || 0);
  s.cells[cell] = null;
  const ev = [{ t: 'give', order: oi, from: cell, line: c.line, lvl: c.lvl, r: c.r || 0, need }];
  if (o.items.every(x => x.got >= x.n)) ev.push(...completeOrder(s, oi, now));
  return ev;
}
// Коснулся карточки: отдать всё подходящее, что есть на поле
function deliver(s, oi, now) {
  const o = s.orders[oi];
  if (!o || oi >= s.slots) return [];
  const m = match(s, o);
  if (!m.any) return [{ t: 'notReady', order: oi }];
  const ev = [];
  m.cells.flat().forEach(i => { if (s.orders[oi] === o) ev.push(...giveOne(s, oi, i, now)); });
  return ev;
}

function completeOrder(s, oi, now) {
  const o = s.orders[oi];
  const streak = s.streak.n >= C.streakNeed && now - s.streak.at <= C.streakGapMs;
  const coins = o.kind === 'event' ? 0 : Math.max(1, Math.round(o.acc * orderMult(s, o) * (streak ? C.streakMult : 1)));
  s.streak = { n: now - s.streak.at <= C.streakGapMs ? s.streak.n + 1 : 1, at: now };
  s.coins += coins; s.n.orders++;
  goal(s, 'order');
  if (o.kind === 'big') goal(s, 'big');
  const ev = [{ t: 'orderDone', order: oi, coins, kind: o.kind, streak, id: o.id, born: o.born, tokens: orderTokens(o),
    pct: o.kind === 'event' ? 0 : Math.round(bonusPct(s) * 100), units: o.items.reduce((a, it) => a + units(it.line, it.lvl) * it.n, 0) }];
  if (o.kind === 'event') ev.push(...addTokens(s, orderTokens(o), now));
  s.orders[oi] = makeOrder(s, oi, now);
  if (C.kinds[o.kind].key && s.level >= 5 && rand(s) < C.kinds[o.kind].key) dropKey(s, C.ports[0].cell, ev);
  return ev;
}

// Замена заказа «↻»: раз в 30 минут бесплатно, иначе за монеты. Отданное вернётся ящиком.
const refreshPrice = (s, now) => now >= s.refreshAt ? 0 : C.refreshCoins + s.level;
function refreshOrder(s, oi, now) {
  const o = s.orders[oi];
  if (!o || oi >= s.slots) return [];
  const price = refreshPrice(s, now);
  if (s.coins < price) return [{ t: 'poor', order: oi }];
  s.coins -= price;
  if (!price) s.refreshAt = now + C.refreshMs[fxHas(s, 'refresh') ? 1 : 0];
  const back = o.items.flatMap(it => Array(it.got).fill([it.line, it.lvl, 0]));
  const ev = [{ t: 'refresh', order: oi, id: o.id, born: o.born, price }];
  if (back.length) {
    const at = nearestFree(s, C.ports[0].cell);
    if (at >= 0) { s.cells[at] = { k: 'chest', kind: 'crate', cars: back }; ev.push({ t: 'crate', at }); }
    else s.coins += Math.round(o.acc);
  }
  s.n.replaced++;
  s.orders[oi] = makeOrder(s, oi, now);
  return ev;
}

function buySlot(s, i, now) {
  if (i !== s.slots || i > 3) return [{ t: 'reject' }];
  if (s.coins < C.slotPrices[i]) return [{ t: 'poor', slot: i }];
  s.coins -= C.slotPrices[i];
  return openSlot(s, now);
}
function openSlot(s, now) {
  if (s.slots >= 4) return [];
  const i = s.slots++;
  s.orders[i] = makeOrder(s, i, now);
  return [{ t: 'slot', i }];
}

// Следующая понятная покупка за монеты: слот, ступень порта, клетка поля или ячейка склада (самая дешёвая)
function nextBuy(s) {
  const opts = [];
  if (s.slots < 4) opts.push({ t: 'slot', i: s.slots, price: C.slotPrices[s.slots] });
  [0, 1, 2, 3, 5].forEach(line => { if (portOpen(s, line) && s.tiers[line] < maxTier(s, line)) opts.push({ t: 'tier', line, price: tierPrice(s.tiers[line]) }); });
  const cells = buyableCells(s).sort((a, b) => dist2(a, C.ports[0].cell) - dist2(b, C.ports[0].cell));
  if (cells.length) opts.push({ t: 'cell', i: cells[0], price: cellPrice(s) });
  if (s.storeN && s.storeN < C.storePrices.length) opts.push({ t: 'store', price: C.storePrices[s.storeN] });
  return opts.sort((a, b) => a.price - b.price)[0] || null;
}

// ── Недельное событие: свой гараж на поле, заказы за жетоны, трек из 10 ступеней ──
const evTheme = w => C.event.themes[(w - C.event.fromWeek) % C.event.themes.length];
// dayIdx — номер дня игры с нуля. Неделя сменилась — старое событие кончается, новое начинается.
function eventTick(s, dayIdx, now) {
  const ev = [], w = Math.floor(dayIdx / 7);
  if (s.ev && s.ev.w !== w && s.ev.on) ev.push(...endEvent(s, now));
  if (w >= C.event.fromWeek && s.ev?.w !== w) {
    s.ev = { w, theme: evTheme(w), on: true, tokens: 0, step: 0, port: -1 };
    s.top[EV] = 0;
    ev.push({ t: 'evStart', theme: s.ev.theme });
  }
  if (evActive(s) && s.ev.port < 0) {           // гараж события — на свободную клетку у нижнего края
    const at = nearestFree(s, C.event.cell);
    if (at >= 0) { s.ev.port = at; s.cells[at] = { k: 'port', line: EV }; ev.push({ t: 'port', at, line: EV }); }
  }
  return ev;
}
function endEvent(s, now) {
  const ev = [{ t: 'evEnd', theme: s.ev.theme, step: s.ev.step }];
  s.ev.on = false; s.ev.port = -1;
  s.cells.forEach((c, i) => {
    if ((c?.k === 'port' || c?.k === 'car') && c.line === EV) s.cells[i] = null;
    if (c?.k === 'chest') { c.cars = c.cars.filter(it => it[0] !== EV); if (!c.cars.length) s.cells[i] = null; }
  });
  s.store = s.store.filter(c => c.line !== EV);
  s.orders.forEach((o, oi) => { if (o?.kind === 'event') s.orders[oi] = makeOrder(s, oi, now); });
  return ev;
}
function addTokens(s, n, now) {
  const ev = [];
  s.ev.tokens += n;
  while (s.ev.step < C.event.track.length && s.ev.tokens >= C.event.track[s.ev.step]) {
    const k = s.ev.step++, [t, a, lo, hi] = C.event.rewards[k];
    if (t === 'fuel') s.fuel += a;
    if (t === 'coins') s.coins += a;
    if (t === 'trophy') s.trophies[s.ev.theme] = 1;
    if (t === 'crate') {
      const lines = carLines(s), items = [];
      for (let j = 0; j < a; j++) items.push([lines[Math.floor(rand(s) * lines.length)], randInt(s, lo, hi), rollRarity(s, 3)]);
      const at = nearestFree(s, C.ports[0].cell);
      if (at >= 0) s.cells[at] = { k: 'chest', kind: 'event', cars: items };
      else s.coins += 10 * a;                        // некуда поставить — монетами
      if (at >= 0) ev.push({ t: 'chest', at });
    }
    ev.push({ t: 'evStep', k, reward: C.event.rewards[k] });
  }
  return ev;
}

// ── Престиж салона: бесконечная трата звёзд после всех зон ───────────────────
const prestigePrice = s => Math.round(C.prestige.stars * C.prestige.growth ** s.prestige);
const salonDone = s => C.salon.every((z, zi) => zoneDone(s, zi));
function buyPrestige(s) {
  if (!salonDone(s)) return [{ t: 'reject' }];
  const price = prestigePrice(s);
  if (s.stars < price) return [{ t: 'noStars' }];
  s.stars -= price; s.prestige++;
  return [{ t: 'prestige', n: s.prestige }];
}

function levelReward(s) {
  const L = s.level, ev = [{ t: 'levelUp', level: L }];
  const p = C.ports.find(q => q.level === L);
  if (p) {
    ev[0].reward = 'port';
    openPort(s, p.line, ev);
    const items = levelChest(s, p.line);
    if (p.line === TRIM) items.splice(0, items.length, [TRIM, 1], [TRIM, 1]);   // Ателье: две полироли — на первую зелёную
    if (p.line === PARTS) {            // Мастерская: в сундуке ключ, рядом — первая сломанная машина (обучение ремонту)
      items[0] = [PARTS, 1];
      const at = nearestFree(s, C.ports[0].cell);
      if (at >= 0) { s.cells[at] = { k: 'car', line: 0, lvl: 2, r: 0, broken: true, since: s.fuelAt }; ev.push({ t: 'broken', at }); }
    }
    giveChest(s, p.line, 'level', items, ev);
  } else if (L % 2 === 0) {
    ev[0].reward = 'chest';
    const lines = carLines(s), line = lines[Math.floor(rand(s) * lines.length)];
    giveChest(s, line, 'level', levelChest(s, line), ev);
  } else {
    ev[0].reward = 'fuel';
    s.fuel = Math.min(fuelMax(s), s.fuel + C.levelFuel);
    ev.push({ t: 'fuel' });
  }
  if (L >= C.levelCellsFrom && (L - C.levelCellsFrom) % C.levelCellsEvery === 0) {
    const [at] = openNearest(s, 1, C.ports[0].cell, ev);
    if (at !== undefined && L <= C.levelCar.upTo) {   // клетка — с машиной внутри
      const lvl = pickW(s, C.levelCar.lvls), r = rollRarity(s, 0);
      s.cells[at] = { k: 'car', line: 0, lvl, r };
      ev.push({ t: 'levelCar', at });
      discover(s, 0, lvl, r, at, ev);
    }
  }
  return ev;
}

// ── Автосалон: каждый пункт сразу даёт силу ─────────────────────────────────
const zoneDone = (s, zi) => C.salon[zi].items.length > 0 && C.salon[zi].items.every(it => built(s, zi, it));
const currentZone = s => C.salon.findIndex((z, zi) => z.items.length && !zoneDone(s, zi));
function buildable(s) {
  const zi = currentZone(s);
  if (zi < 0) return [];
  const z = C.salon[zi];
  return z.items.map((item, k) => ({ zone: zi, item, price: z.prices[k], fx: z.fx[k] }))
    .filter(x => !built(s, zi, x.item)).slice(0, 3);
}
const fxOf = (zi, item) => C.salon[zi].fx[C.salon[zi].items.indexOf(item)];

function build(s, zi, item, now) {
  if (zi !== currentZone(s)) return [];
  const z = C.salon[zi], k = z.items.indexOf(item);
  if (k < 0 || built(s, zi, item) || !buildable(s).some(x => x.item === item)) return [];
  if (s.stars < z.prices[k]) return [{ t: 'noStars', zone: zi, item }];
  s.stars -= z.prices[k];
  (s.salon[z.id] ||= {})[item] = 1;
  const fx = z.fx[k], ev = [{ t: 'build', zone: zi, item, fx }];
  if (fx.cells) openNearest(s, fx.cells, C.ports[0].cell, ev);
  if (fx.slot) ev.push(...openSlot(s, now));
  if (fx.tier !== undefined && s.tiers[fx.tier] < 5) { s.tiers[fx.tier]++; ev.push({ t: 'tier', line: fx.tier, tier: s.tiers[fx.tier], at: portOf(fx.tier).cell }); }
  if (fx.port !== undefined) openPort(s, fx.port, ev);
  if (fx.fuel) { s.fuel += fx.fuel; ev.push({ t: 'fuel' }); }
  if (fx.gift) {                                    // сразу — подарок, дальше — +1 машина каждый день
    const lines = carLines(s);
    giveChest(s, 0, 'gift', [[lines[Math.floor(rand(s) * lines.length)], 3, rollRarity(s, 3)], ['fuel', 10]], ev);
  }
  if (fx.keys) dropKey(s, C.ports[0].cell, ev);     // сразу — ключ, дальше — ключи чаще
  if (fx.store) s.storeN = Math.max(1, s.storeN);
  if (fx.ship) { s.ship = { at: now }; ev.push(...arrive(s, now)); }   // первый корабль — сразу
  if (zoneDone(s, zi)) ev.push({ t: 'zoneDone', zone: zi, id: z.id });
  return ev;
}

// ── Подсказка: следующее очевидное действие. Её же показывает палец и играет бот ──
// Пара для слияния: сначала одной редкости. Машину, которую заказ ждёт, не трогаем — разве что поле забито.
function dragHint(s, mode) {   // mode: 'same' — только одной редкости, 'mixed' — любые, 'force' — даже нужные заказам
  const need = {}, byKey = {};
  s.orders.forEach((o, oi) => { if (o && oi < s.slots) o.items.forEach(it => { const k = key(it.line, it.lvl); need[k] = (need[k] || 0) + it.n - it.got; }); });
  s.cells.filter(c => c?.broken).forEach(c => {   // инструмент для сломанной не сливать
    const nd = needItem(c); need[key(...nd)] = (need[key(...nd)] || 0) + 1;
  });
  s.cells.forEach((c, i) => { if (isCar(c) && c.lvl < maxLvl(c.line)) (byKey[key(c.line, c.lvl)] ||= []).push(i); });
  const keys = Object.keys(byKey).sort((a, b) => s.cells[byKey[a][0]].lvl - s.cells[byKey[b][0]].lvl);
  for (const k of keys) {
    const cells = byKey[k].sort((a, b) => s.cells[a].r - s.cells[b].r);
    if (cells.length < 2 || (mode !== 'force' && cells.length - (need[k] || 0) < 2)) continue;
    const { line, lvl } = s.cells[cells[0]];
    const pairs = [];
    for (let x = 0; x < cells.length; x++) for (let y = x + 1; y < cells.length; y++) {
      if (mode === 'same' && lvl < 7 && s.cells[cells[x]].r !== s.cells[cells[y]].r) continue;   // седьмые — ради восьмой и разного цвета
      pairs.push([cells[y], cells[x]]);
    }
    if (!pairs.length) continue;
    if (lvl === 7 && line < PARTS && certAt(s) < 0) continue;   // без сертификата пара седьмых ждёт
    return { t: 'drag', from: pairs[0][0], to: pairs[0][1] };
  }
  return null;
}

// Деталь на машину: сломанной — её инструмент; редкость — машине, которую заказ просит «от зелёной» и выше,
// иначе лучшей машине (старшая редкость, затем уровень; не ниже «лучшая − 1»): так её ведут до оранжевой
function itemHint(s) {
  const has = c => s.cells.findIndex(x => isCar(x) && itemFits(c, x));
  const to = i => ({ t: 'drag', from: has(s.cells[i]), to: i });
  const br = s.cells.findIndex(c => c?.broken && has(c) >= 0);
  if (br >= 0) return to(br);
  if (!rarOn(s)) return null;
  const want = s.cells.findIndex(c => isCar(c) && c.line < PARTS && !c.broken && has(c) >= 0 && s.orders.some((o, oi) => o && oi < s.slots &&
    o.items.some(it => it.got < it.n && it.r > (c.r || 0) && it.line === c.line && it.lvl === c.lvl)));
  if (want >= 0) return to(want);
  let best = -1;
  const score = c => (c.r || 0) * 10 + c.lvl;
  s.cells.forEach((c, i) => { if (isCar(c) && c.line < PARTS && !c.broken && (c.r || 0) < 4 && c.lvl >= s.top[c.line] - 1 && (best < 0 || score(c) > score(s.cells[best]))) best = i; });
  return best >= 0 && has(s.cells[best]) >= 0 ? to(best) : null;
}

function keyHint(s) {
  const k = s.cells.findIndex(c => c?.k === 'key');
  if (k < 0) return null;
  let best = -1;
  s.cells.forEach((c, i) => {
    if (!canKey(s, i)) return;
    if (best < 0 || (c.k === 'box' && s.cells[best].k !== 'box') || (c.k === s.cells[best].k && dist2(i, k) < dist2(best, k))) best = i;
  });
  return best >= 0 ? { t: 'drag', from: k, to: best } : null;
}

function nextHint(s, now) {
  const ready = s.orders.findIndex((o, oi) => o && oi < s.slots && match(s, o).ready);
  if (ready >= 0) return { t: 'order', i: ready };
  const same = dragHint(s, 'same');
  if (same) return same;
  const k = keyHint(s);
  if (k) return k;
  const ih = itemHint(s);
  if (ih) return ih;
  const b = buildable(s).filter(x => s.stars >= x.price).sort((x, y) => x.price - y.price)[0];
  if (b) return { t: 'build', zone: b.zone, item: b.item };
  if (!b && salonDone(s) && s.stars >= prestigePrice(s)) return { t: 'prestige' };
  const task = taskReady(s);
  if (task >= 0) return { t: 'task', k: task };
  if (dailyDone(s) && s.cells.some(c => !c)) return { t: 'daily' };
  const buy = nextBuy(s);
  if (buy && s.coins >= buy.price) return buy.t === 'tier' ? { t: 'tier', line: buy.line } : { t: buy.t, i: buy.i };
  const bubble = s.cells.findIndex(c => c?.k === 'bubble' && now < c.until && s.coins >= c.price);
  if (bubble >= 0) return { t: 'bubble', i: bubble };
  const free = s.cells.filter(c => !c).length;
  // отдать в заказ подходящую машину: одинокую — сразу, любую — когда тесно
  for (let oi = 0; oi < s.slots; oi++) {
    const o = s.orders[oi], m = o && match(s, o);
    if (!m?.any) continue;
    const lone = m.cells.flat().find(i => !s.cells.some((c, j) => j !== i && isCar(c) && c.line === s.cells[i].line && c.lvl === s.cells[i].lvl && c.r === s.cells[i].r));
    if (lone !== undefined && o.kind !== 'quick' && s.cells[lone].lvl <= 5) return { t: 'give', i: oi, from: lone };
    if (free <= 3) return { t: 'give', i: oi, from: m.cells.flat()[0] };
  }
  const chest = s.cells.findIndex(c => c?.k === 'chest' && (free || typeof c.cars[0][0] === 'string'));
  if (chest >= 0) return { t: 'chest', i: chest };
  tick(s, now);
  if (free) {
    // порт той линейки, которой больше не хватает в заказах (мастерская — ещё и ради сертификата)
    const need = [0, 0, 0, 0, 0, 0];
    s.orders.forEach((o, oi) => { if (!o || oi >= s.slots) return; const m = match(s, o); o.items.forEach((it, j) => { need[it.line] += it.n - it.got - m.cells[j].length; }); });
    const sevens = s.cells.filter(c => isCar(c) && c.line < PARTS && c.lvl === 7).length;
    if (sevens >= 2 && !s.cells.some(isCert)) need[PARTS] += sevens;
    s.cells.forEach(c => { if (c?.broken) need[PARTS] += 2; });              // сломанной нужен инструмент
    if (rarOn(s)) need[TRIM] += 1;                                           // детали Ателье нужны всегда
    const ports = s.cells.map((c, i) => c?.k === 'port' && s.fuel >= tapCost(s, c.line) && (c.line !== TRIM || charges(s, now) > 0) ? i : -1).filter(i => i >= 0);
    if (ports.length) return { t: 'port', i: ports.sort((a, b) => need[s.cells[b].line] - need[s.cells[a].line])[0] };
  }
  const mixed = dragHint(s, 'mixed') || dragHint(s, 'force');
  if (mixed) return mixed;
  if (s.fuel < 1 && s.coins >= C.fuelCoins) return { t: 'fuel' };
  return null;
}

// «Стена»: некуда поставить, нечего слить, нечего отдать, не на что потратить
function stuck(s, now) {
  if (s.cells.some(c => !c)) return false;
  if (s.orders.some((o, oi) => o && oi < s.slots && match(s, o).any)) return false;
  if (dragHint(s, 'force') || keyHint(s)) return false;
  if (itemHint(s)) return false;
  return !s.cells.some(c => c?.k === 'bubble' && now < c.until && s.coins >= c.price);
}

const Core = {
  CONFIG, CARS, EVENT_CARS, PARTS, EV, TRIM, PART_NAMES, TRIM_NAMES, N, key, maxLvl, units, xpNeed, rand, around, isPart, rarOn,
  toolFor, trimFor, needItem, itemFits, itemHint,
  closed, openCount, portFuel, tapCost, freeTap, portOpen, carLines, zoneIdx, fuelMax, regenMs, lineDone, fxHas, fxSum, fxOf,
  newGame, migrate, tick, charges, chargeWaitMs, chargePrice, buyCharge, reward, fuelWaitMs, setSpeed, buyFuel, tapPort, upgradePort, maxTier, tierPrice, tierFuel, tapChest,
  dailyGift, claimDaily, dailyDone, goalDone, claimTask, taskReady,
  move, buyBubble, canOpen, canKey, buyCell, cellPrice, buyableCells, match, fits, exact, orderValue, orderTokens, bonusPct,
  giveOne, deliver, refreshOrder, refreshPrice, buySlot, nextBuy,
  store, unstore, buyStore, arrive, shipPrice, shipMs, eventTick, evActive, prestigePrice, salonDone, buyPrestige,
  built, zoneDone, currentZone, buildable, build, isCar, isCert, certAt, tierStats, nextHint, stuck,
};
if (typeof module !== 'undefined') module.exports = Core; else window.Core = Core;
})();
