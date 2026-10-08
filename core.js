// «Гараж» — правила игры без экрана. Этот же файл гоняет бот (bot.js) в Node.
(function () {
'use strict';

// ── Все числа баланса — здесь ──────────────────────────────────────────────
const CONFIG = {
  cols: 7, rows: 9,
  // задание 31: поле растёт кольцами вокруг основного гаража — покупать (и открывать Салоном, ящиком, наградой) можно только клетки
  // текущего кольца, ближайшего к гаражу, где ещё остались замки; на экране — прямоугольник открытых клеток и текущего кольца
  rings: true,                        // false — как до задания 31 (всё поле на экране, клетки — любые рядом с открытыми; для бота «до»)
  cellMax: 72,                        // потолок плитки на маленьком поле (5 × 5, 7 × 7), CSS-пиксели
  // Порты (клетка = ряд * 7 + столбец). Задание 15: один основной гараж в центре выдаёт все виды машин по мере открытия;
  // Мастерская — слева от него, Ателье — справа (поменять местами — переставить cell). Первый гараж открывает кольцо из 8
  // клеток, Мастерская и Ателье — по 2 (sideCells), новый вид гаража — 4 клетки возле него (portCells).
  ports: [
    { line: 0, cell: 31, kinds: [{ line: 0 }, { line: 1, level: 6 }, { line: 2, level: 12 }] },   // легковые, с 6-го уровня внедорожники, с 12-го купе
    { line: 3, cell: 30, level: 4, fuel: 2 },          // Мастерская (инструменты) — с 4-го уровня (2-й день); 2 топлива
    { line: 5, cell: 32, level: 8, fuel: 2 },          // Ателье (детали отделки) — с 8-го уровня (3–4-й день); открывает редкость
  ],
  portCells: 4,                       // клеток возле основного гаража при открытии нового вида машин
  sideCells: 2,                       // клеток при открытии Мастерской и Ателье: соседние, не хватает — ближайшие (бот: поле — как раньше)
  startOpen: [17, 45],                // на старте ещё 2 клетки (над и под гаражом): Мастерская и Ателье заняли 2 клетки кольца
  // какой вид выдаст нажатие основного гаража: веса по числу открытых видов (1, 2, 3 вида) в порядке kinds. Задание 15:
  // в задании 65/35 и 50/30/20; по боту — как делил нажатия прежний игрок между тремя гаражами (60/40, 38/35/27)
  garageMix: [[100], [60, 40], [38, 35, 27]],
  garageNeed: 5,                      // вид, которого не хватает открытым заказам (и нет на поле), выпадает в 5 раз чаще
  // Закрытые клетки: замок — за монеты (рядом с открытой), уровнем, салоном, кольцом порта; ящик-сюрприз — ключом
  boxes: [10, 21, 27, 35, 41, 53, 61],               // остальные закрытые клетки — замки
  cellCoins: [30, 1.16],                             // клетка за монеты: 30, дальше каждая следующая ×1,16

  fuelMax: 60,                        // бак (+10 за каждый «бак» в салоне)
  fuelRegenMs: 120000,                // +1 топливо за 2 минуты (компрессор — на четверть быстрее)
  fuelBelow: 10,                      // задание 16: ролик за полный бак — когда топлива меньше
  // Улучшения порта: 5 ступеней. Ступень → шансы 2-го и 3-го уровня; со 2-й каждое 3-е касание — без топлива.
  // Второй ряд (6–8, после погрузчика в «Порту и складе»): +3% к 2-му уровню, 8-я — бак +5.
  // Дальше — «престиж порта» без конца: каждая ступень +2 к баку, цена ×1,3.
  tierPrices: [40, 120, 300, 500, 1500, 2600, 3600, 5000],
  // основной гараж (задание 15): одна лестница на все виды — дороже, чем у каждого из прежних трёх, дешевле трёх вместе
  tierPricesMain: [40, 300, 750, 1250, 2000, 2300, 2800, 3500],
  mainTierPerKind: true,              // подсказка «следующая покупка» сравнивает ступень основного гаража по цене на один вид
  tierLvl2: [0.15, 0.25, 0.32, 0.34, 0.34, 0.34, 0.37, 0.40, 0.40],
  tierLvl3: [0, 0.10, 0.22, 0.34, 0.46, 0.56, 0.56, 0.56, 0.56],
  tierFuel: [5, 2], tierGrowth: 1.3,    // задание 15: 8-я ступень — бак +5 (было +10 у каждого из трёх гаражей)
  partTierLvl2: [0.35, 0.45, 0.55, 0.60, 0.65, 0.70],
  trimTierLvl2: [0, 0.10, 0.20, 0.30, 0.35, 0.40],   // Ателье: 2-я деталь сразу — только после улучшений
  freeTapFrom: 2, freeTapEvery: 3,
  suvFreeEvery: 2,                    // пока линейка внедорожников собрана целиком — каждое 2-е касание основного гаража бесплатно
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
  atelier: { charges: 2, regenMs: 3600e3 },        // заряд — 1 час (задание 10, было 3 ч); за монеты — нет (задание 23: только ролик)
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
  slotPrices: [0, 25, 120],           // 1-й слот заказа открыт; 2-й и 3-й — за монеты (задание 22: заказов три, 4-го слота нет)
  slot4Refund: 300,                   // задание 22: старое сохранение с открытым 4-м слотом — его цена возвращается
  orderCoinMult: 0.96,                // общий множитель монет за заказы (задание 22: 1,06 — три заказа вместо четырёх; задание 22В: 0,96 — средние машины
                                      // сдаются чаще, без поправки заработок +11%); подобрано ботом, допуск ±5% к сборке 16
  // Уровни предметов у всех видов одни и те же: на 2–3 ниже лучшей машины линейки (не ниже 2-го).
  // Крупный отличается числом машин и множителем: ≈ 3–5× монет быстрого и ≈ 1,7× монет на единицу топлива.
  kinds: {                            // вид заказа: сколько предметов, монет за единицу стоимости
    quick:    { mult: 1.35 },           // задание 7: быстрый чуть дороже — крупный стал крупнее
    normal:   { mult: 1.6 },
    big:      { mult: 2.1, key: 0.35 },
    showcase: { mult: 3.5 },            // две машины одной модели нужной редкости
    event:    { mult: 0 },              // заказ события: вместо монет — жетоны
    hunt:     { mult: 2.1 },            // задание 17: охота за карточкой — стоимость награды (выдаётся не монетами)
    vip:      { mult: 2.5 },            // задание 33: VIP-заказ на машину 8-го уровня — крупнее, чем у крупного (vip.mult)
  },
  kindWeights: { quick: 2, normal: 5, big: 3 },
  // Заказы растут с уровнем игрока — ступени: до 4-го, с 4-го, с 7-го, с 11-го (задание 7: на поздних уровнях —
  // машины старших уровней и редкости, чтобы был смысл их растить). С 4-го по 6-й заказ на одну машину — не больше одного.
  orderGrowth: [4, 7, 11, 15],          // задание 17: пятая ступень — с 15-го уровня
  // уровень предмета по ступеням: от «лучшая − a» до «лучшая − b» в линейке. С 4-го уровня игрока — не ниже «лучшая − 2»:
  // заказ растёт вместе с игроком, а не просит «двойки», когда уже есть пятые (правка владельца, задание 10)
  orderLvl: [[3, 2], [2, 2], [2, 2], [2, 2], [2, 2]],
  orderLead: [3, 1, 1, 6],            // с 4-й ступени крупный заказ (с этой долей) просит машину на 1 ниже лучшего уровня линейки, не выше 6-го
  orderMin: [2, 2, 3, 3, 3],             // самый низкий уровень машины в заказе по ступеням: с 7-го уровня «двойки» уже не просят
  orderSize: {
    quick:  [[1, 1], [1, 2], [2, 2], [2, 2], [2, 2]],
    normal: [[1, 2], [2, 3], [2, 3], [2, 3], [2, 3]],
    big:    [[1, 2], [2, 3], [3, 5], [3, 5], [3, 5]],
  },
  orderDistinct: 3,                   // разных машин в заказе не больше трёх: одинаковые — одной карточкой «×N»
  // задание 22В: микс уровней — с этой ступени (0 — до 4-го уровня, 2 — с 7-го) в обычном (от 2 машин) и крупном (от 3) не меньше
  // половины машин — средние: от orderMin до «лучшая − mid» (если это ниже orderMin — до «лучшая − 2»); остальные — как раньше.
  // С поля машину берут с вероятностью field[0] + field[1] × (сколько подходящих на поле), не выше field[2]. Крупный с plainBig —
  // без редкости и с поля берёт только белые
  orderMix: { from: 2, mid: 3, field: [0.5, 0.05, 0.85], plainBig: 3 },
  orderRarity: { big: [.05, .05, .05, 0, 0], normal: [0, 0, 0, 0, .3] },   // задание 22В: крупный с 4-й ступени (11-го уровня) — без редкости (было .1/.2), обычный на 5-й — .3 (было .08)    // заказ просит редкость («зелёная 4-го»); задание 10: было .15/.25
  orderPickRarity: 1,                 // машина, которую заказ взял с поля, просит свою редкость (задание 10: иначе редкую нечем сдать)
  orderRarityW: [{ 1: 3, 2: 1 }, { 1: 3, 2: 1 }, { 1: 3, 2: 1 }, { 1: 3, 2: 2 }, { 1: 3, 2: 2, 3: 1 }],   // 5-я — только из найденных   // какую: зелёную, синюю, фиолетовую — по ступеням
  showcaseChance: 0.15,               // после подиума — заказ «на витрину»
  refreshMs: [1800000, 900000],       // бесплатная замена заказа раз в 30 минут (с креслами — раз в 15)
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
  ship: { ms: [4 * 3600e3, 3 * 3600e3], cars: [3, 4], lvls: [2, 4], fuel: 10 },   // с маяком — раз в 3 ч; «сейчас» — только за ролик (задание 23)
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
      fx: [{ tier: 0 }, { tier: 3 }, { tier: 3 }, { regen: 1 }, { crates: 1 }] },   // задание 15: шины — Мастерская (были — гараж внедорожников)
    { id: 'wash', items: ['washpost', 'hoses', 'dryer', 'washlight', 'mats'], prices: [100, 120, 140, 160, 180],
      fx: [{ coins: 1 }, { keys: 1 }, { fuel: 10 }, { bubbles: 1 }, { cells: 2 }] },
    { id: 'showroom', items: ['window', 'podium', 'chairs', 'desk', 'plants', 'chandelier'], prices: [200, 240, 280, 320, 360, 400],
      fx: [{ newStars: 1 }, { showcase: 1 }, { refresh: 1 }, { tier: 3 }, { gift: 1 }, { fuel: 10 }] },   // стол — Мастерская (был — гараж купе)
    { id: 'depot', items: ['shelves', 'forklift', 'crane', 'pier', 'containers', 'office', 'lighthouse'],
      prices: [400, 500, 600, 700, 800, 900, 1000],
      fx: [{ store: 1 }, { tier2: 1 }, { fuel: 10 }, { ship: 1 }, { gift: 1 }, { toolUp: 1 }, { shipFast: 1 }] },
  ],

  // Поздняя игра (задание 17): с 15-го уровня — охота за карточками, награды «не только монеты», этапы коллекции
  late: {
    fromLevel: 15, maxHunt: 1, huntChance: 0.15, huntMs: 24 * 3600e3, huntGapMs: 12 * 3600e3,   // охота живёт сутки; после выполненной — пауза 12 ч
    hunt: { stars: [3, 1], charge: 1 },   // охота: сверх награды — 3 звезды + 1 за уровень машины и заряд Ателье (задание 18; при максимуме — звёзды)
    huntFromRar: 4,                   // охота — только после первой карточки этой редкости (оранжевой; задание 18: не забирает фиолетовые до неё)
    // вид награды и вес; монетная цена штуки (сколько монет «стоит» одна штука; остаток стоимости — звёздами)
    rewards: { coins: 3, stars: 3, charge: 2, tank: 2, key: 1, chest: 1, swap: 1 },
    unit: { charge: 40, tank: 30, key: 25, swap: 15, chest: 60 },
    keyMax: 2, swapsMax: 3, tankStars: 10, starsPerCoins: 7, altBig: 0.1, taskValue: 60,
    chest: { cars: [3, 4], lvls: [2, 4] },
    orderLvl: [2, 2], leadCap: 6,     // 5-я ступень по линиям с машиной ≥ 6-го (подобрано ботом: «лучшая − 1» и 7-й уровень — заказы висят)
    // этапы коллекции: число карточек и награда (редкие машины и детали — нельзя). Шаг после 55 — 6–8 карточек: по боту этап раз в 3–5 дней
    // после 15-го уровня (с шагом 15 — раз в 6–11 дней)
    // задание 33: 55 и 70 — готовая синяя машина 4–5-го уровня, 82 и 100 — фиолетовая (car: редкость; вместо звёзд, монет, баков той же цены)
    milestones: [[40, { tank: 1, stars: 10 }], [55, { charge: 1, car: 2 }], [62, { stars: 20 }], [70, { coins: 150, car: 2 }],
      [76, { charge: 1, stars: 20 }], [82, { stars: 20, car: 3 }], [87, { coins: 200, stars: 20 }], [100, { trophy: 1, car: 3 }], [120, { stars: 200 }]],
  },
  // Магазин-заглушка (задание 17): цены в ⭐ (Stars), только в тесте монетизации
  shop: {
    reserveMax: 15, fromDay: 3,
    items: {
      tanks5:   { price: 25, tanks: 5 },
      part1:    { price: 10, perDay: 1, lvl: 1 },     // задание 17: в задании 3 в день — по боту 1 (иначе оранжевая слишком рано)
      part2:    { price: 20, perDay: 1, lvl: 2 },
      starter:  { price: 50, tanks: 3, parts: 2 },
      vip:      { price: 150, dailyTank: 1 },
      piggy:    { price: 30, pct: 0.1, max: 500, min: 100 },
      atelier3: { price: 60, charges: 3 },
      tankplus: { price: 40, fuel: 20 },
    },
  },

  // ── Задание 33: поздние машины 8-го уровня ──
  // Предел окраски: оранжевую деталью Ателье — только машине не выше этого уровня; выше — только слиянием (уже оранжевые — остаются)
  trimOrangeMax: 4,
  // «Эксклюзивы»: три места (легковые, внедорожники, купе), машина 8-го уровня своей линейки приносит монеты в час:
  // base × rar[редкость]; «мешок» копит не больше capH часов; ставить — бесплатно, снять без замены нельзя
  hall: { base: 0.55, rar: [1, 1.5, 2.2, 3.2, 5], capH: 8 },   // base по боту: три оранжевые при сборе раз в день — 3 × 5 × 8 × 0,55 = 66 монет (+9,5% к 694), смесь белых–синих — ≈ +3%
  // VIP-заказ: есть машина 8-го уровня на поле (не деталь, не в «Эксклюзивах»); просит одну такую машину линейки, где она есть,
  // редкостью из тех, что есть на поле, не выше синей (веса rw), с шансом midChance — ещё одну 5–6-го уровня той же линейки;
  // один на все слоты, живёт сутки; после показанного (выполнен, заменён, ушёл) — пауза gapMs; шанс — при новом заказе (по боту: 0,5 — промежуток
  // 13 ч, 0,25 — 19,5 ч, 0,2 — в пределах 20–28 ч, 0,15 — 30,5 ч; пауза почти не влияет: VIP сам забирает 8-ю с поля).
  // Награда — монеты по kinds.vip.mult; с шансом carChance часть монет (carShare) — готовая редкая машина (зелёная или синяя)
  vip: { chance: 0.2, gapMs: 14 * 3600e3, liveMs: 24 * 3600e3, midChance: 0.5, rw: { 0: 3, 1: 2, 2: 1 }, carChance: 0.2, carShare: 0.4 },
  // Редкие машины в наградах: сундук уровня с fromLevel-го уровня с шансом chest — один слот готовой редкой машиной lvls
  // (не выше «лучшая − 2»), редкость по весам rw (фиолетовая — с purpleFrom-го уровня); оранжевая не выдаётся никогда
  rareCar: { chest: 0.25, fromLevel: 8, lvls: [3, 5], rw: { 1: 5, 2: 3, 3: 1 }, purpleFrom: 15, mileLvls: [4, 5] },

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
// Куда смотрит машина (задание 27): line — куда смотрит линейка в игре (купе — вправо, чтобы отличались); src — куда смотрит снимок
// владельца в Машины/ (по умолчанию влево; здесь — модели, снятые передом вправо). Сборщик отражает картинку, когда они расходятся
const CAR_FACE = { line: ['left', 'left', 'right'], src: { 'arion-velour': 'right', 'vierling-strom': 'right' } };
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
const KINDS = CONFIG.ports[0].kinds;
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
const fuelMax = s => C.fuelMax + fxSum(s, 'fuel') + tierFuel(s.tiers[0]) + (s.shop?.plus ? C.shop.items.tankplus.fuel : 0);      // задание 15: одна лестница основного гаража
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
// задание 33: оранжевую (деталь 5-го уровня на фиолетовую) — только машине не выше trimOrangeMax
const orangeLocked = c => (c.r || 0) === 3 && c.lvl > C.trimOrangeMax;
const needItem = c => c.broken ? [PARTS, toolFor(c.lvl)] : (c.r || 0) < 4 && !orangeLocked(c) ? [TRIM, trimFor(c.r || 0)] : null;
const itemFits = (c, it) => !!it && (c.broken ? it.line === PARTS && it.lvl === toolFor(c.lvl) : it.line === TRIM && it.lvl === trimFor(c.r || 0) && !orangeLocked(c));

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
  goal(s, 'card');                                   // задание дня «получи новую карточку» (задание 17)
  milestone(s, at, ev);
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
// Кольца (задание 31): номер кольца — расстояние «по квадрату» от основного гаража (гараж — 0); текущее — ближайшее кольцо с замками
const RING = Array.from({ length: N }, (_, i) => { const [r, c] = rc(i), [r0, c0] = rc(C.ports[0].cell); return Math.max(Math.abs(r - r0), Math.abs(c - c0)); });
const ring = i => RING[i];
const curRing = s => s.cells.reduce((m, c, i) => c?.k === 'lock' && RING[i] < m ? RING[i] : m, Infinity);
// Что видно на экране: прямоугольник открытых клеток и клеток текущего кольца (нет замков или правило выключено — всё поле)
function viewRect(s) {
  const k = C.rings ? curRing(s) : Infinity;
  if (k === Infinity) return { r0: 0, c0: 0, rows: C.rows, cols: C.cols, ring: k };
  let r0 = C.rows, r1 = -1, c0 = C.cols, c1 = -1;
  s.cells.forEach((c, i) => { if (closed(c) && RING[i] !== k) return; const [r, cc] = rc(i); r0 = Math.min(r0, r); r1 = Math.max(r1, r); c0 = Math.min(c0, cc); c1 = Math.max(c1, cc); });
  return { r0, c0, rows: r1 - r0 + 1, cols: c1 - c0 + 1, ring: k };
}
const inView = (v, i) => { const [r, c] = rc(i); return r >= v.r0 && r < v.r0 + v.rows && c >= v.c0 && c < v.c0 + v.cols; };
const canOpen = (s, i) => ['lock', 'box'].includes(s.cells[i]?.k) && around(i, false).some(j => !closed(s.cells[j])) && (!C.rings || RING[i] <= curRing(s));
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
const portOpen = (s, line) => line === EV ? !!s.ev && s.ev.port >= 0 : !!portOf(line) && s.cells[portOf(line).cell]?.k === 'port';
const rarOn = s => portOpen(s, TRIM);              // редкость открывает Ателье
function openPort(s, line, ev) {
  const p = portOf(line);
  if (portOpen(s, line)) return;
  const was = s.cells[p.cell];                     // старое сохранение: на месте гаража стоит машина — переставить
  s.cells[p.cell] = { k: 'port', line };
  if (was && !closed(was) && was.k !== 'port') { const at = nearestFree(s, p.cell); if (at >= 0) s.cells[at] = was; else s.coins += 25; }
  ev.push({ t: 'port', at: p.cell, line });
  // вокруг первого гаража — кольцо из 8 клеток; Мастерская и Ателье — sideCells: соседние, а если их меньше — ближайшие
  const n0 = ev.length;
  around(p.cell, line === 0).forEach(i => openCell(s, i, ev));
  if (line !== 0) openNearest(s, C.sideCells - ev.slice(n0).filter(e => e.t === 'open' || e.t === 'boxOpen').length, p.cell, ev);
  if (line === TRIM) { ev.push({ t: 'rarityOn' }); s.atelier = { n: 0, at: s.fuelAt }; }   // Ателье — редкость; заряды копятся с нуля
}
// Виды машин, которые выдаёт основной гараж (открываются уровнем игрока)
const carLines = s => KINDS.filter(k => s.level >= (k.level || 0)).map(k => k.line);
// Вид машины для нажатия основного гаража: только что открытый — один раз сразу, дальше — по весам garageMix
function pickLine(s) {
  const lines = carLines(s);
  if (lines.includes(s.kindNew)) { const l = s.kindNew; delete s.kindNew; return l; }
  if (lines.length < 2) return lines[0];
  // вид, которого не хватает открытым заказам (и нет на поле), выпадает в garageNeed раз чаще
  const short = new Set();
  s.orders.forEach((o, oi) => { if (!o || oi >= s.slots) return; const m = match(s, o); o.items.forEach((it, j) => { if (it.n - it.got > m.cells[j].length) short.add(it.line); }); });
  const w = C.garageMix[lines.length - 1];
  return pickW(s, Object.fromEntries(lines.map((l, k) => [l, w[k] * (short.has(l) ? C.garageNeed : 1)])));
}

function newGame(now, seed) {
  const s = {
    v: 3, rng: seed | 0, cells: [],
    fuel: C.fuelMax, fuelAt: now, speed: 1,
    coins: 0, stars: 0, starsTotal: 0, xp: 0, level: 1,
    tiers: [0, 0, 0, 0, 0, 0], taps: [0, 0, 0, 0, 0, 0],
    slots: 1, orders: [null, null, null],
    salon: {}, seen: {}, top: [1, 0, 0, 0, 0, 0],
    n: { spawns: 0, merges: 0, mixed: 0, lucky: 0, orders: 0, orderSeq: 0, replaced: 0, keys: 0, boxes: 0, repairs: 0, bought: 0, rarUps: 0 },
    v: 8,
    streak: { n: 0, at: 0 }, refreshAt: 0,
    daily: null, giftDay: null, sound: false, style: 'A',
    store: [], storeN: 0, ship: null, ev: null, prestige: 0, trophies: {},
    hall: [null, null, null], hallAt: 0,                    // задание 33: «Эксклюзивы» (линейка → машина 8-го уровня) и время последнего сбора
  };
  for (let i = 0; i < N; i++) s.cells.push({ k: 'lock' });
  C.boxes.forEach(i => { s.cells[i] = { k: 'box' }; });
  C.ports.forEach(p => { s.cells[p.cell] = { k: 'slot', line: p.line }; });
  openPort(s, 0, []);
  C.startOpen.forEach(i => openCell(s, i, []));
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
  if ((s.v || 0) < 8) {    // задание 15: один основной гараж; Мастерская и Ателье — рядом с ним (30 и 32)
    s.tiers[0] = Math.max(s.tiers[0], s.tiers[1], s.tiers[2]);
    s.taps[0] += s.taps[1] + s.taps[2];
    const OLD = { 1: 12, 2: 8, [PARTS]: 50, [TRIM]: 54 };
    const wasOpen = l => [OLD[l], portOf(l).cell].some(i => s.cells[i]?.k === 'port' && s.cells[i].line === l);
    const opened = { [PARTS]: wasOpen(PARTS), [TRIM]: wasOpen(TRIM) };
    for (const l of [1, 2, PARTS, TRIM]) {        // старые гаражи: открытый — пустая клетка, будущий — закрытая
      const c = s.cells[OLD[l]];
      if ((c?.k === 'port' || c?.k === 'slot') && c.line === l) s.cells[OLD[l]] = c.k === 'port' ? null : { k: 'lock' };
    }
    [PARTS, TRIM].forEach((l, k) => {
      const to = portOf(l).cell, was = s.cells[to], open = opened[l];
      s.cells[to] = { k: open ? 'port' : 'slot', line: l };
      // что стояло на новом месте гаража — на ближайшую свободную клетку (нет места — 25 монет)
      if (was && !closed(was)) { const at = nearestFree(s, to); if (at >= 0) s.cells[at] = was; else s.coins += 25; }
      if (!open && s.cells[C.startOpen[k]]?.k === 'lock') s.cells[C.startOpen[k]] = null;   // место будущего гаража — взамен клетка рядом
    });
  }
  s.v = 8;
  // задание 22: заказов три. Открытый 4-й слот убирается, его цена возвращается (игра пишет в журнал по s.slot4Refund);
  // заказ из 4-го слота пропадает без награды и без штрафа
  const nSlots = C.slotPrices.length;
  if (s.slots > nSlots) { s.coins += C.slot4Refund; s.slot4Refund = C.slot4Refund; s.slots = nSlots; }
  if (s.orders.length > nSlots) s.orders = s.orders.slice(0, nSlots);
  // задание 17: этапы коллекции, пройденные до обновления, отмечаются без наград задним числом
  s.miles ??= C.late.milestones.filter(([n]) => cardCount(s) >= n).length;
  s.store ??= []; s.storeN ??= 0; s.ship ??= null; s.ev ??= null; s.prestige ??= 0; s.trophies ??= {};
  if (s.daily && !s.daily.goals[0]?.t) s.daily = null;        // задания дня старого вида — пересоздать
  s.hall ??= [null, null, null]; s.hallAt ??= 0;             // задание 33: «Эксклюзивы» — пусто, без наград задним числом
  return s;
}

// ── Время: топливо и пузыри ────────────────────────────────────────────────
function tick(s, now) {
  const ev = [];
  s.orders.forEach((o, oi) => {                     // охотничий заказ живёт 24 часа, потом молча заменяется
    if (o?.kind === 'hunt' && now >= o.until) { s.orders[oi] = makeOrder(s, oi, now); ev.push({ t: 'huntGone', order: oi }); }
    if (o?.kind === 'vip' && now >= o.until) { s.vipAfter = now + C.vip.gapMs; s.n.vipGone = (s.n.vipGone || 0) + 1; s.orders[oi] = makeOrder(s, oi, now); ev.push({ t: 'vipGone', order: oi }); }
  });
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

// ── Причал: корабль с ящиком машин раз в 4 часа (с маяком — 3). Можно не ждать — за ролик (задание 23: не за монеты) ──
const shipMs = s => C.ship.ms[fxHas(s, 'shipFast') ? 1 : 0] / s.speed;
function arrive(s, now, early = false) {          // early — корабль сейчас (награда за ролик)
  if (!s.ship || (!early && now < s.ship.at)) return [];
  const at = nearestFree(s, C.ports[0].cell);
  if (at < 0) return early ? [{ t: 'full', at: C.ports[0].cell }] : [];
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
// Это касание — бесплатное? Со 2-й ступени каждое 3-е; пока линейка внедорожников собрана целиком — у основного гаража каждое 2-е
function freeTap(s, line) {
  const every = line === 0 && lineDone(s, 1) ? C.suvFreeEvery : s.tiers[line] >= C.freeTapFrom ? C.freeTapEvery : 0;
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
const maxCharges = s => s.shop?.at3 ? C.shop.items.atelier3.charges : C.atelier.charges;   // задание 17: товар «Ещё заряд Ателье»
function charges(s, now) {
  const a = s.atelier ||= { n: maxCharges(s), at: now };
  if (a.n >= maxCharges(s)) { a.at = now; return a.n; }
  const k = Math.floor((now - a.at) / atRegen(s));
  if (k > 0) { a.n = Math.min(maxCharges(s), a.n + k); a.at = a.n >= maxCharges(s) ? now : a.at + k * atRegen(s); }
  return a.n;
}
// Награда за ролик (задания 12, 16; в игре — только в тесте монетизации): одна функция на все места.
// Условие места не выполнено — reject, игра не меняется. ctx — что нужно месту: { order } для замены заказа
function reward(s, place, now, ctx = {}) {
  const ev = [{ t: 'reward', place, at: -1 }], no = [{ t: 'reject' }];
  // второй такой же сундук рядом с первым
  const twin = i => { const at = nearestFree(s, i); s.cells[at] = { ...s.cells[i], cars: s.cells[i].cars.map(it => it.slice()) }; ev.push({ t: 'chest', at }); };
  const free = () => s.cells.filter(c => !c).length;
  if (place === 'fuel') {                        // бак почти пуст — полный
    if (s.fuel >= C.fuelBelow) return no;
    s.fuel = fuelMax(s);
  } else if (place === 'charge') {               // зарядов Ателье 0 — +1
    if (!rarOn(s) || charges(s, now) > 0) return no;
    s.atelier.n++; ev[0].at = portOf(TRIM).cell;
  } else if (place === 'double') {               // монеты последнего крупного заказа ещё раз
    if (!(s.lastBig?.coins > 0)) return no;
    s.coins += s.lastBig.coins; ev[0].coins = s.lastBig.coins; s.lastBig = null;
  } else if (place === 'chest') {                // сундук дня готов — забрать и второй такой же
    if (!dailyDone(s) || free() < 2) return no;
    const e = claimDaily(s);
    ev.push(...e); twin(e[0].at);
  } else if (place === 'gift') {                 // подарок дня на поле — второй такой же
    const i = s.cells.findIndex(c => c?.k === 'chest' && c.kind === 'gift' && !c.x2);
    if (i < 0 || !free()) return no;
    s.cells[i].x2 = 1; twin(i);
  } else if (place === 'reroll') {               // бесплатная замена потрачена — заменить сейчас
    const oi = ctx.order;
    if (!s.orders[oi] || oi >= s.slots || refreshFree(s, now)) return no;
    ev.push(...refreshOrder(s, oi, now, true));
  } else if (place === 'ship') {                 // корабль в пути — приходит сейчас
    if (!s.ship || now >= s.ship.at || nearestFree(s, C.ports[0].cell) < 0) return no;
    ev.push(...arrive(s, now, true));
  } else if (place === 'room') {                 // поле полное — 2 ближайшие закрытые клетки
    if (free() || !openNearest(s, 2, C.ports[0].cell, ev).length) return no;
  } else return no;
  return ev;
}
const chargeWaitMs = (s, now) => charges(s, now) >= maxCharges(s) ? 0 : Math.max(0, atRegen(s) - (now - s.atelier.at));
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
  if (c.line === TRIM) { if (s.atelier.n >= maxCharges(s)) s.atelier.at = now; s.atelier.n--; }
  const ev = cost ? [] : [{ t: 'freeTap', at: i }];
  const tutorial = s.n.spawns++ < C.tutorialSpawns;
  const kind = c.line === 0 ? (tutorial ? 0 : pickLine(s)) : c.line;      // основной гараж: какой вид машины выехал
  if (!tutorial && c.line !== EV && rand(s) < C.crateChance[fxHas(s, 'crates') ? 1 : 0]) {
    const items = [];
    for (let k = randInt(s, 2, 3); k > 0; k--) items.push([kind, 1 + (rand(s) < 0.4 ? 1 : 0), isPart(c.line) ? 0 : rollRarity(s, s.tiers[c.line])]);
    s.cells[to] = { k: 'chest', kind: 'crate', cars: items };
    return [...ev, { t: 'spawn', from: i, to }, { t: 'crate', at: to }];
  }
  const lvl = tutorial ? 1 : spawnLvl(s, c.line);
  const r = tutorial || c.line >= PARTS ? 0 : rollRarity(s, s.tiers[c.line]);
  if (!tutorial && c.line < PARTS && portOpen(s, PARTS) && s.cells.filter(x => x?.broken).length < C.broken.max && rand(s) < C.broken.chance) {
    s.cells[to] = { k: 'car', line: kind, lvl: Math.min(7, lvl + randInt(s, ...C.broken.up)), r, broken: true, since: now };
    ev.push({ t: 'spawn', from: i, to }, { t: 'broken', at: to });
    return ev;
  }
  place(s, to, [kind, lvl, r], i, ev);
  return ev;
}

// Ступени: 1–5 — у всех; 6–8 и престиж без конца — у гаражей машин после погрузчика
const maxTier = (s, line) => line < PARTS && fxHas(s, 'tier2') ? Infinity : 5;
const tierPrice = (t, line) => { const P = line === 0 ? C.tierPricesMain : C.tierPrices; return t < P.length ? P[t] : Math.round(P[P.length - 1] * C.tierGrowth ** (t - P.length + 1)); };
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
  if (s.coins < tierPrice(t, line)) return [{ t: 'poor', line }];
  s.coins -= tierPrice(t, line);
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
  const at = nearestFree(s, (portOf(line) || C.ports[0]).cell);
  if (at < 0) { s.fuel = Math.max(s.fuel, fuelMax(s)); ev.push({ t: 'fuel' }); return; }
  s.cells[at] = { k: 'chest', kind, cars: items };
  ev.push({ t: 'chest', at });
}
function levelChest(s, line) {
  const [lo, hi] = C.chestLvl, cars = [];
  for (let k = 0; k < C.chestCars; k++) cars.push([line, randInt(s, lo, hi), line < PARTS ? rollRarity(s, 1) : 0]);
  // задание 33: с fromLevel-го уровня (при Ателье) один слот — готовая редкая машина
  if (C.rareCar.chest > 0 && line < PARTS && rarOn(s) && s.level >= C.rareCar.fromLevel && rand(s) < C.rareCar.chest) {
    cars[0] = rareCar(s, line, C.rareCar.lvls, rareW(s)); s.n.rareChest = (s.n.rareChest || 0) + 1;
  }
  return cars;
}

// Подарок раз в день (day — номер или дата дня). Нет места — подождёт до свободной клетки.
function dailyGift(s, day) {
  const ev = [];
  if (!s.daily || s.daily.day !== day) newDaily(s, day);
  // «Без роликов» (магазин, задание 17): каждый новый день — бак в запас
  if (s.shop?.vip && s.shop.vipDay !== day) { s.shop.vipDay = day; s.reserve = Math.min(C.shop.reserveMax, (s.reserve || 0) + C.shop.items.vip.dailyTank); }
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
  if (lateOn(s) && cardCount(s) < CARS.length * 8 * 5) third.push(['card', 1]);   // задание 17: «получи новую карточку»
  const [t3, n3] = third[Math.floor(rand(s) * third.length)];
  const mk = (t, need, k) => ({ t, need, have: 0, fuel: C.daily.fuel[k], got: false });
  s.daily = { day, claimed: false, goals: [
    mk('merge', C.daily.merges[0] + C.daily.merges[1] * Math.min(4, Math.floor(L / 4)), 0),
    mk('order', C.daily.orders[0] + C.daily.orders[1] * Math.min(3, Math.floor(L / 6)), 1),
    mk(t3, n3, 2),
  ] };
  if (lateOn(s)) s.daily.goals[2].alt = pickAlt(s, ['coins', 'swap']);   // после 15-го — не только топливо
}
// Продвинуть задание дня: на n или, если reach, — «машина уровня n получена»
function goal(s, t, n = 1, reach = false) {
  s.daily?.goals.forEach(g => { if (g.t === t) g.have = reach ? (n >= g.need ? g.need : g.have) : g.have + n; });
}
const goalDone = g => g.have >= g.need;
const taskReady = s => s.daily ? s.daily.goals.findIndex(g => goalDone(g) && !g.got) : -1;
const dailyDone = s => !!s.daily && !s.daily.claimed && s.daily.goals.every(g => g.got);
function claimTask(s, k, now = Date.now()) {
  const g = s.daily?.goals[k];
  if (!g || g.got || !goalDone(g)) return [{ t: 'reject' }];
  g.got = true;
  if (g.alt) { const ev = [{ t: 'taskClaim', k, n: 0, alt: g.alt }]; giveAlt(s, g.alt, C.late.taskValue, C.ports[0].cell, ev, now); return ev; }
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
  // задание 33: деталь на оранжевую — машине выше trimOrangeMax нельзя: отказ (встряска), а не обмен местами
  { const [car, it] = isPart(a.line) ? [b, a] : [a, b];
    if (car?.k === 'car' && !car.broken && car.line < PARTS && it.line === TRIM && it.lvl === trimFor(3) && orangeLocked(car) && rarOn(s)) return [{ t: 'reject', at: from, why: 'orange', car: to }]; }
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
  let kind = C.firstOrders[seq] ? 'quick' : evOrder ? 'event' : pickKind(s, slot);
  // VIP-заказ (задание 33): есть машина 8-го уровня на поле, пауза прошла, других VIP нет
  if (!C.firstOrders[seq] && !evOrder && C.vip.chance > 0 && now >= (s.vipAfter || 0) && vipLines(s).length &&
    !s.orders.some((o, i) => o && i !== slot && i < s.slots && o.kind === 'vip') && rand(s) < C.vip.chance) {
    const v = vipOrder(s, seq, now);
    if (v) return v;
  }
  // охотничий заказ (задание 17): с 15-го уровня при Ателье, один на все слоты, просит карточку, которой ещё нет
  if (!C.firstOrders[seq] && !evOrder && lateOn(s) && hasRar(s, C.late.huntFromRar) && now >= (s.huntAfter || 0) &&
    !s.orders.some((o, i) => o && i !== slot && i < s.slots && o.kind === 'hunt') && rand(s) < C.late.huntChance) {
    const h = huntOrder(s, seq, now);
    if (h) return h;
  }
  const lines = carLines(s), items = [];
  const add = (line, lvl, n = 1, r = -1) => {
    lvl = Math.max(1, Math.min(itemCap(s, line), lvl));
    const same = items.find(x => x.line === line && x.lvl === lvl && x.r === r);
    if (same) { same.n += n; return same; }
    items.push({ line, lvl, r, n, got: 0 });
    return items[items.length - 1];
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
    const late = stage >= 4;              // 5-я ступень (с 15-го уровня): линии с машиной ≥ 6-го уровня — выше уровни (задание 17)
    const X = C.orderMix, mix = stage >= X.from && (kind === 'normal' || kind === 'big');
    const lead = kind === 'big' && stage >= C.orderLead[0] && count > 1 && rand(s) < C.orderLead[2];
    if (lead) { const l = line(); add(l, Math.max(2, Math.min(late && s.top[l] >= 6 ? C.late.leadCap : C.orderLead[3], s.top[l] - C.orderLead[1]))); count--; }   // главная машина — почти лучшая
    // микс уровней (задание 22В): сколько машин заказа должны быть средними
    const cars = count + (lead ? 1 : 0);
    let midLeft = mix && cars >= (kind === 'big' ? 3 : 2) ? Math.ceil(cars / 2) : 0;
    const mids = new Set();
    const midRange = l => { const lo = C.orderMin[stage], M = s.top[l]; return [lo, Math.max(lo, M - X.mid >= lo ? M - X.mid : M - 2)]; };
    // обычный и крупный заказ наполовину берут то, что уже стоит на поле, — так он достижим и разгружает поле.
    // Крупный забирает и то, что дальше не сливается: машины 8-го уровня и лишние сертификаты.
    const top = c => c.lvl === maxLvl(c.line) && (c.line < PARTS || s.cells.filter(isCert).length > 1);
    const [da, db] = C.orderLvl[stage];
    const plain = c => !(kind === 'big' && stage >= X.plainBig && c.r > 0);   // крупный с 4-й ступени — только белые с поля
    const onField = s.cells.filter(c => isCar(c) && plain(c) && c.lvl >= (c.line < PARTS ? Math.max(C.orderMin[stage], s.top[c.line] - da) : 2) && (kind === 'big' && top(c) ||
      c.line < PARTS && c.lvl < s.top[c.line] - 1 && lines.includes(c.line)));   // «лучшая − 1» не трогаем: из неё растёт новый уровень
    const midField = midLeft ? s.cells.filter(c => isCar(c) && plain(c) && c.line < PARTS && lines.includes(c.line) &&
      c.lvl >= midRange(c.line)[0] && c.lvl <= midRange(c.line)[1]) : [];
    const pFrom = pool => mix ? Math.min(X.field[2], X.field[0] + X.field[1] * pool.length) : 0.5;   // чем больше подходящих на поле, тем чаще
    while (count > 0) {
      if (items.length >= C.orderDistinct) {
        const it = midLeft > 0 && items.find(x => mids.has(x) && x.r < 0) || items.find(x => x.r < 0 && x.line !== PARTS) || items[0];
        it.n++; count--; if (mids.has(it)) midLeft--;
        continue;
      }
      const mid = midLeft > 0, pool = mid ? midField : onField;
      const pick = kind !== 'quick' && pool.length && rand(s) < pFrom(pool) ? pool[Math.floor(rand(s) * pool.length)] : null;
      const l = pick ? pick.line : line(), M = s.top[l], n = Math.min(count, mid ? midLeft : count, rand(s) < 0.35 ? 2 : 1);   // n ≤ count — лимит машин держится
      const low = kind === 'quick' && stage >= 2 ? 1 : 0;   // быстрый с 7-го уровня — две машины невысокого уровня
      const lo = l < PARTS ? C.orderMin[stage] : 2;
      const [a, b] = late && l < PARTS && M >= 6 && kind !== 'quick' ? C.late.orderLvl : [da, db];
      const lvl = pick ? pick.lvl : mid ? randInt(s, ...midRange(l)) : randInt(s, Math.max(lo, M - a - low), Math.max(lo, M - b - low));
      const rr = C.orderRarity[kind]?.[stage] || 0;   // у деталей редкости нет; поздние заказы просят и синюю, и фиолетовую
      // 5-я ступень — только редкость, которую игрок уже находил
      const found = Object.values(s.seen).reduce((x, m) => Math.max(x, 31 - Math.clz32(m)), 0);
      const rw = late ? Object.fromEntries(Object.entries(C.orderRarityW[stage]).filter(([k]) => +k <= found)) : C.orderRarityW[stage];
      const r = pick && pick.r > 0 && rand(s) < C.orderPickRarity ? pick.r : l < PARTS && rarOn(s) && Object.keys(rw).length && rand(s) < rr ? pickW(s, rw) : -1;
      const it = add(l, lvl, r >= 0 ? 1 : n, r);
      count -= r >= 0 ? 1 : n;
      if (mid) { mids.add(it); midLeft -= r >= 0 ? 1 : n; }
    }
  }
  items.sort((a, b) => a.line - b.line || a.lvl - b.lvl);
  const o = { id: seq, kind, items, face: Math.floor(rand(s) * 2 ** 31), born: now, acc: 0 };
  if (kind === 'big' && lateOn(s) && rand(s) < C.late.altBig) o.reward = pickAlt(s, ['coins']);   // крупный: иногда не монеты (той же стоимости)
  return o;
}

// ── VIP-заказ (задание 33) ──
// Линейки, где на поле есть машина 8-го уровня не выше синей (их и просит VIP: фиолетовые и оранжевые — жалко)
const vipLines = s => [0, 1, 2].filter(l => s.cells.some(c => isCar(c) && c.line === l && c.lvl === 8 && (c.r || 0) <= 2));
function vipOrder(s, id, now) {
  const lines = vipLines(s);
  if (!lines.length) return null;
  const line = lines[Math.floor(rand(s) * lines.length)];
  const rs = [...new Set(s.cells.filter(c => isCar(c) && c.line === line && c.lvl === 8 && (c.r || 0) <= 2).map(c => c.r || 0))];
  const r = +pickW(s, Object.fromEntries(rs.map(x => [x, C.vip.rw[x]])));           // редкость — из тех, что есть: заказ всегда выполним
  const items = [{ line, lvl: 8, r: r > 0 ? r : -1, n: 1, got: 0 }];
  if (rand(s) < C.vip.midChance) items.unshift({ line, lvl: randInt(s, 5, 6), r: -1, n: 1, got: 0 });
  s.n.vipShown = (s.n.vipShown || 0) + 1;
  const o = { id, kind: 'vip', items, face: Math.floor(rand(s) * 2 ** 31), born: now, acc: 0, until: now + C.vip.liveMs };
  if (lateOn(s) && rand(s) < C.late.altBig) o.reward = pickAlt(s, ['coins']);   // «не только монеты» — как у крупного
  return o;
}
// Готовая редкая машина линейки line (задание 33): уровень lvls, но не выше «лучшая − 2»; редкость по весам (не выше фиолетовой)
function rareCar(s, line, [lo, hi], rw) {
  const lvl = randInt(s, lo, Math.max(lo, Math.min(hi, s.top[line] - 2)));
  return [line, lvl, +pickW(s, rw)];
}
const rareW = s => Object.fromEntries(Object.entries(C.rareCar.rw).filter(([r]) => +r < 3 || s.level >= C.rareCar.purpleFrom));

// ── «Эксклюзивы» (задание 33): три места, машина 8-го уровня своей линейки, доход в час, мешок до capH часов ──
const hallRate = c => c ? C.hall.base * C.hall.rar[c.r || 0] : 0;          // монет в час
const hallBag = (s, now) => (s.hall || []).reduce((a, c) => a + (c ? hallRate(c) * Math.min(C.hall.capH, Math.max(0, now - Math.max(s.hallAt || 0, c.since || 0)) / 3600e3) : 0), 0);
// машину с клетки i — можно ли поставить и что будет: { ok, why: 'notCar' | 'noRoom', swap: прежняя машина, confirm: нужно ли подтверждение }
function hallCheck(s, i) {
  const c = s.cells[i];
  if (!isCar(c) || c.line >= PARTS || c.lvl !== 8) return { ok: false, why: 'notCar' };
  const old = (s.hall || [])[c.line];
  if (old && nearestFree(s, i) < 0) return { ok: false, why: 'noRoom', swap: old };          // прежней машине некуда вернуться
  return { ok: true, swap: old || null, confirm: !!old || (c.r || 0) >= 2 };
}
function hallCollect(s, now) {
  const n = Math.floor(hallBag(s, now));
  if (n <= 0) return [];
  s.coins += n; s.hallAt = now;
  (s.hall || []).forEach(c => { if (c) c.since = now; });
  s.n.hallCoins = (s.n.hallCoins || 0) + n;
  return [{ t: 'hallCollect', n }];
}
function hallPlace(s, i, now) {
  const chk = hallCheck(s, i);
  if (!chk.ok) return [chk.why === 'noRoom' ? { t: 'full', at: i, why: 'hall' } : { t: 'reject', at: i }];
  const c = s.cells[i], ev = hallCollect(s, now);                 // мешок — сначала собрать
  s.hall ||= [null, null, null];
  const old = s.hall[c.line];
  if (old) { const to = nearestFree(s, i); s.cells[to] = { k: 'car', line: old.line, lvl: 8, r: old.r }; ev.push({ t: 'hallBack', at: to, line: old.line, r: old.r }); }
  s.cells[i] = null;
  s.hall[c.line] = { line: c.line, lvl: 8, r: c.r || 0, since: now };
  s.n.hallPut = (s.n.hallPut || 0) + 1;
  ev.push({ t: 'hallPut', at: i, line: c.line, r: c.r || 0, swap: !!old });
  return ev;
}

// ── Поздняя игра (задание 17): охота за карточками, награды «не только монеты», этапы коллекции ──
let monetOn = false;                                // тест монетизации включён: в игре — Monet.on, в боте — режим покупок
const setMonetOn = v => { monetOn = !!v; };
const popc = m => { let n = 0; for (; m; m >>= 1) n += m & 1; return n; };
const cardCount = s => Object.values(s.seen).reduce((a, m) => a + popc(m), 0);      // карточки коллекции (из 120)
const lateOn = s => s.level >= C.late.fromLevel && rarOn(s);
const hasRar = (s, r) => Object.values(s.seen).some(m => m & (1 << r));   // была ли карточка этой редкости
// Карточки, которые может попросить охота: модель открытого вида не выше «лучшая − 1» и 6-го уровня, редкость — не выше
// найденной + 1 (оранжевую — только после фиолетовой) и на ступень выше той, что у этой модели уже есть (стопка достраивается
// по одной ступени — так охоту можно выполнить за сутки); сначала — модели, где в стопке уже ≥ 2 редкостей
function huntTargets(s) {
  const rmax = Math.min(4, Object.values(s.seen).reduce((a, m) => Math.max(a, 31 - Math.clz32(m)), 0) + 1), out = [];
  carLines(s).forEach(line => {
    for (let lvl = 1; lvl <= Math.min(6, s.top[line] - 1); lvl++) {
      const m = s.seen[key(line, lvl)] || 0;
      // предпочтение (больше — лучше): машина этой модели на ступень ниже уже на поле (+20), ступень дешевле (деталь Ателье
      // 2-го уровня дешевле 3-го, 3-й — 4-го: −5 за ступень), стопка ближе к полной (+3 за каждую редкость в ней)
      const near = r => r > 0 && s.cells.some(c => isCar(c) && c.line === line && c.lvl === lvl && (c.r || 0) === r - 1);
      for (let r = 0; r <= rmax; r++) if (!(m & (1 << r)) && (r === 0 || m & (1 << (r - 1))))
        out.push({ line, lvl, r, pref: (near(r) ? 20 : 0) - 5 * r + 3 * popc(m) });
    }
  });
  const last = s.hunt?.last, rep = s.hunt?.rep || 0;    // одна и та же карточка — не больше одного повтора подряд
  return out.filter(t => !(rep >= 1 && `${t.line}-${t.lvl}-${t.r}` === last));
}
// Охотничий заказ на лучшую по предпочтению карточку; null — просить нечего
function huntOrder(s, id, now) {
  const all = huntTargets(s), best = Math.max(...all.map(t => t.pref)), pool = all.filter(t => t.pref === best);
  if (!pool.length) return null;
  const t = pool[Math.floor(rand(s) * pool.length)], card = `${t.line}-${t.lvl}-${t.r}`;
  s.hunt = { last: card, rep: s.hunt?.last === card ? (s.hunt.rep || 0) + 1 : 0 };
  return { id, kind: 'hunt', items: [{ line: t.line, lvl: t.lvl, r: t.r, n: 1, got: 0 }], face: Math.floor(rand(s) * 2 ** 31), born: now, acc: 0,
    until: now + C.late.huntMs, reward: pickAlt(s, ['coins', 'charge']) };   // заряд охота даёт и так (задание 18)
}
// для тестовой панели: охота в слот (без уровня, шанса и паузы) и следующий этап коллекции (как будто карточек хватает)
function testHunt(s, slot, now) { const h = huntOrder(s, s.n.orderSeq++, now); if (h) s.orders[slot] = h; return h ? [{ t: 'hunt', order: slot }] : [{ t: 'reject' }]; }
function testMilestone(s) { const M = C.late.milestones[s.miles || 0], ev = []; if (M) milestone(s, C.ports[0].cell, ev, M[0]); return ev.length ? ev : [{ t: 'reject' }]; }
// Вид награды: по весам late.rewards; запас баков и замены — только когда есть магазин (тест монетизации), заряд — с Ателье
function pickAlt(s, exclude) {
  const w = Object.fromEntries(Object.entries(C.late.rewards).filter(([k]) => !exclude.includes(k) &&
    !(['tank', 'swap'].includes(k) && !monetOn) && !(k === 'charge' && !rarOn(s))));
  return pickW(s, w);
}
// Выдать награду вида type стоимостью value монет: штуки по монетной цене (не больше места), остаток — звёздами
function giveAlt(s, type, value, at, ev, now) {
  const L = C.late, toStars = v => { const n = Math.max(1, Math.round(v / L.starsPerCoins)); addStars(s, n, at, ev); return n; };
  if (type === 'coins') { s.coins += value; ev.push({ t: 'alt', kind: 'coins', n: value, at }); return; }
  if (type === 'stars') { ev.push({ t: 'alt', kind: 'stars', n: toStars(value), at }); return; }
  const room = { charge: rarOn(s) ? maxCharges(s) - charges(s, now) : 0, tank: monetOn ? C.shop.reserveMax - (s.reserve || 0) : 0,
    key: L.keyMax, swap: monetOn ? L.swapsMax - (s.swaps || 0) : 0, chest: 1 }[type];
  const n = Math.min(room, Math.max(1, Math.floor(value / L.unit[type])));
  if (n <= 0) return giveAlt(s, 'stars', value, at, ev, now);     // полно — звёздами
  if (type === 'charge') { s.atelier.n += n; if (s.atelier.n >= maxCharges(s)) s.atelier.at = now; }
  if (type === 'tank') s.reserve = (s.reserve || 0) + n;
  if (type === 'swap') s.swaps = (s.swaps || 0) + n;
  if (type === 'key') for (let k = 0; k < n; k++) dropKey(s, C.ports[0].cell, ev);
  if (type === 'chest') {
    const c = nearestFree(s, C.ports[0].cell);
    if (c < 0) return giveAlt(s, 'stars', value, at, ev, now);
    const lines = carLines(s), cars = [];
    for (let k = randInt(s, ...L.chest.cars); k > 0; k--) cars.push([lines[Math.floor(rand(s) * lines.length)], randInt(s, ...L.chest.lvls), 0]);
    s.cells[c] = { k: 'chest', kind: 'crate', cars }; ev.push({ t: 'chest', at: c });
  }
  ev.push({ t: 'alt', kind: type, n, at });
  const rest = value - n * L.unit[type];
  if (rest >= L.starsPerCoins) toStars(rest);
}
// Этап коллекции: при N карточках — награда (окно в игре); каждый — ровно один раз
function milestone(s, at, ev, n = cardCount(s)) {
  const M = C.late.milestones;
  while ((s.miles || 0) < M.length && n >= M[s.miles || 0][0]) {
    const [need, rw] = M[s.miles || 0];
    s.miles = (s.miles || 0) + 1;
    const got = {};
    if (rw.coins) { s.coins += rw.coins; got.coins = rw.coins; }
    if (rw.tank) { if (monetOn) { s.reserve = Math.min(C.shop.reserveMax, (s.reserve || 0) + rw.tank); got.tank = rw.tank; } else got.stars = (got.stars || 0) + rw.tank * C.late.tankStars; }
    if (rw.charge && rarOn(s)) { s.atelier.n = Math.min(maxCharges(s), s.atelier.n + rw.charge); got.charge = rw.charge; }
    if (rw.trophy) { s.trophies.collection = 1; got.trophy = 1; }
    if (rw.car && C.rareCar.mile !== false) {          // задание 33: готовая редкая машина (в сундуке на поле); без Ателье — звёзды
      if (rarOn(s)) {
        const lines = carLines(s), line = lines[Math.floor(rand(s) * lines.length)], car = rareCar(s, line, C.rareCar.mileLvls, { [rw.car]: 1 });
        giveChest(s, line, 'crate', [car], ev); got.car = car; s.n.rareMile = (s.n.rareMile || 0) + 1;
      } else got.stars = (got.stars || 0) + 20 * rw.car;
    }
    const st = (rw.stars || 0) + (got.stars || 0);
    ev.push({ t: 'milestone', n: need, got: { ...got, ...(st ? { stars: st } : {}) } });
    if (st) addStars(s, st, at, ev);
  }
}

// Сколько монет даст заказ (обычные машины; редкие — больше)
const itemCoins = (s, it, r = 0) => units(it.line, it.lvl) * C.rarityCoins[r] * (it.line === 0 && lineDone(s, 0) ? 1 + C.lineBonus : 1);
// Надбавка к монетам заказов: пост мойки, престиж салона, трофеи событий
const fullStacks = s => Object.values(s.seen).filter(m => m === 31).length;
const bonusPct = s => (fxHas(s, 'coins') ? C.washBonus : 0) + s.prestige * C.prestige.pct + Object.keys(s.trophies).length * C.event.trophyPct + fullStacks(s) * C.stackPct;
const orderMult = (s, o) => o.kind === 'event' ? 0 : C.kinds[o.kind].mult * C.orderCoinMult * (1 + bonusPct(s));
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
  const value = o.kind === 'event' ? 0 : Math.max(1, Math.round(o.acc * orderMult(s, o) * (streak ? C.streakMult : 1)));
  const coins = o.reward ? 0 : value;               // задание 17: охота и часть крупных — награда другого вида той же стоимости
  s.streak = { n: now - s.streak.at <= C.streakGapMs ? s.streak.n + 1 : 1, at: now };
  s.coins += coins; s.n.orders++;
  if (o.kind === 'big') s.lastBig = coins > 0 ? { coins } : null;   // монеты крупного заказа — для ролика «×2» (задание 16)
  if (monetOn && coins > 0) {                       // копилка (тест монетизации): +10% сверх, до потолка
    const P = C.shop.items.piggy; (s.shop ||= {}).piggy = Math.min(P.max, (s.shop.piggy || 0) + Math.round(coins * P.pct));
  }
  goal(s, 'order');
  if (o.kind === 'big') goal(s, 'big');
  const ev = [{ t: 'orderDone', order: oi, coins, kind: o.kind, streak, id: o.id, born: o.born, tokens: orderTokens(o), alt: o.reward || null, value,
    pct: o.kind === 'event' ? 0 : Math.round(bonusPct(s) * 100), units: o.items.reduce((a, it) => a + units(it.line, it.lvl) * it.n, 0) }];
  if (o.kind === 'event') ev.push(...addTokens(s, orderTokens(o), now));
  if (o.reward) giveAlt(s, o.reward, value, C.ports[0].cell, ev, now);
  if (o.kind === 'hunt') {                          // охота: заряд Ателье и звёзды сверх награды; следующая — не раньше чем через huntGapMs
    const [a, b] = C.late.hunt.stars, n0 = ev.length;
    giveAlt(s, 'charge', C.late.hunt.charge * C.late.unit.charge, C.ports[0].cell, ev, now);   // заряды полны — звёзды по late.unit
    const got = ev.slice(n0).find(e => e.t === 'alt');
    ev.push({ t: 'huntPrize', charge: got.kind === 'charge' ? got.n : 0, stars: got.kind === 'stars' ? got.n : 0, bonus: a + b * o.items[0].lvl });
    addStars(s, a + b * o.items[0].lvl, C.ports[0].cell, ev);
    s.n.hunts = (s.n.hunts || 0) + 1; s.huntAfter = now + C.late.huntGapMs;
  }
  if (o.kind === 'vip') {                           // задание 33: VIP — пауза; иногда часть монет — готовая редкая машина
    s.vipAfter = now + C.vip.gapMs; s.n.vipDone = (s.n.vipDone || 0) + 1;
    if (!o.reward && rand(s) < C.vip.carChance) {
      const back = Math.round(coins * C.vip.carShare), line = o.items[o.items.length - 1].line;
      s.coins -= back; ev[0].coins -= back;
      giveChest(s, line, 'crate', [rareCar(s, line, [4, 5], { 1: 3, 2: 1 })], ev);
      ev.push({ t: 'vipCar', line });
    }
  }
  s.orders[oi] = makeOrder(s, oi, now);
  if (C.kinds[o.kind].key && s.level >= 5 && rand(s) < C.kinds[o.kind].key) dropKey(s, C.ports[0].cell, ev);
  return ev;
}

// Замена заказа «↻»: раз в 30 минут бесплатно, иначе — запас замен или ролик (ad; задание 23: не за монеты). Отданное вернётся ящиком.
const refreshFree = (s, now) => now >= s.refreshAt;
function refreshOrder(s, oi, now, ad = false) {
  const o = s.orders[oi];
  if (!o || oi >= s.slots) return [];
  const free = refreshFree(s, now), swap = !free && !ad && s.swaps > 0;   // запас бесплатных замен (награда поздней игры, задание 17)
  if (!free && !ad && !swap) return [{ t: 'wait', order: oi }];
  if (swap) s.swaps--;
  if (free) s.refreshAt = now + C.refreshMs[fxHas(s, 'refresh') ? 1 : 0];
  if (o.kind === 'vip') { s.vipAfter = now + C.vip.gapMs; s.n.vipSwap = (s.n.vipSwap || 0) + 1; }   // задание 33: заменённый VIP — тоже пауза
  const back = o.items.flatMap(it => Array(it.got).fill([it.line, it.lvl, 0]));
  const ev = [{ t: 'refresh', order: oi, id: o.id, born: o.born }];
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
  if (i !== s.slots || i >= C.slotPrices.length) return [{ t: 'reject' }];
  if (s.coins < C.slotPrices[i]) return [{ t: 'poor', slot: i }];
  s.coins -= C.slotPrices[i];
  return openSlot(s, now);
}
function openSlot(s, now) {
  if (s.slots >= C.slotPrices.length) return [];
  const i = s.slots++;
  s.orders[i] = makeOrder(s, i, now);
  return [{ t: 'slot', i }];
}

// Следующая понятная покупка за монеты: слот, ступень порта, клетка поля или ячейка склада (самая дешёвая)
function nextBuy(s) {
  const opts = [];
  if (s.slots < C.slotPrices.length) opts.push({ t: 'slot', i: s.slots, price: C.slotPrices[s.slots] });
  C.ports.forEach(({ line }) => { if (portOpen(s, line) && s.tiers[line] < maxTier(s, line)) opts.push({ t: 'tier', line, price: tierPrice(s.tiers[line], line) }); });
  const cells = buyableCells(s).sort((a, b) => dist2(a, C.ports[0].cell) - dist2(b, C.ports[0].cell));
  if (cells.length) opts.push({ t: 'cell', i: cells[0], price: cellPrice(s) });
  if (s.storeN && s.storeN < C.storePrices.length) opts.push({ t: 'store', price: C.storePrices[s.storeN] });
  // ступень основного гаража работает на все открытые виды — сравнивается по цене на один вид (задание 15)
  const per = o => o.t === 'tier' && o.line === 0 && C.mainTierPerKind ? o.price / carLines(s).length : o.price;
  return opts.sort((a, b) => per(a) - per(b))[0] || null;
}

// ── Магазин-заглушка (задание 17): товары за ⭐ — только в тесте монетизации. canGrant — можно ли выдать сейчас
// (условие, лимит, место), grant — выдать (ещё раз проверив). day — день игры с 0 (по умолчанию от s.day0) ──
const dayOf = (s, now) => s.day0 ? Math.round((new Date(new Date(now).toDateString()) - new Date(s.day0.replace(/-/g, '/'))) / 864e5) : 0;
const ONCE = { starter: 'starter', vip: 'vip', atelier3: 'at3', tankplus: 'plus' };
function canGrant(s, id, now, day = dayOf(s, now)) {
  const P = C.shop.items[id], sh = s.shop || {}, today = sh.day === day ? sh.today || {} : {};
  const no = why => ({ ok: false, why }), free = s.cells.filter(c => !c).length, res = s.reserve || 0;
  if (!P) return no('нет');
  if (ONCE[id] && sh[ONCE[id]]) return no('куплено');
  if (['tanks5', 'starter', 'vip', 'piggy', 'tankplus'].includes(id) && day < C.shop.fromDay) return no('день');
  if (['part1', 'part2', 'starter', 'atelier3'].includes(id) && !rarOn(s)) return no('Ателье');
  if (P.tanks && res + P.tanks > C.shop.reserveMax) return no('запас');
  if (P.perDay !== undefined && (today[id] || 0) >= P.perDay) return no('лимит');
  if ((P.lvl && !free) || (id === 'starter' && free < P.parts)) return no('место');
  if (id === 'piggy' && (sh.piggy || 0) < P.min) return no('мало');
  return { ok: true };
}
function grant(s, id, now, day = dayOf(s, now)) {
  if (!canGrant(s, id, now, day).ok) return [{ t: 'reject' }];
  const P = C.shop.items[id], sh = s.shop ||= {}, ev = [{ t: 'grant', id }], at = portOf(TRIM).cell;
  if (sh.day !== day) { sh.day = day; sh.today = {}; }
  sh.today[id] = (sh.today[id] || 0) + 1;
  (sh.got ||= {})[id] = (sh.got[id] || 0) + 1;
  if (ONCE[id]) sh[ONCE[id]] = 1;
  const part = lvl => place(s, nearestFree(s, at), [TRIM, lvl, 0], at, ev);
  if (P.tanks) s.reserve = (s.reserve || 0) + P.tanks;
  if (P.lvl) part(P.lvl);
  if (id === 'starter') { for (let k = 0; k < P.parts; k++) part(1); charges(s, now); s.atelier.n = maxCharges(s); s.atelier.at = now; }
  if (id === 'vip') sh.vipDay = day;                // бак в запас — с завтрашнего дня
  if (id === 'piggy') { ev.push({ t: 'coinGift', at: C.ports[0].cell, n: sh.piggy }); s.coins += sh.piggy; sh.piggy = 0; }
  if (id === 'atelier3') charges(s, now);
  return ev;
}
// Бак из запаса: полный бак в любой момент, запас −1
function useReserve(s) {
  if (!(s.reserve > 0) || s.fuel >= fuelMax(s)) return [{ t: 'reject' }];
  s.reserve--; s.fuel = fuelMax(s);
  return [{ t: 'reserve' }];
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
  const p = C.ports.find(q => q.level === L), kind = KINDS.find(k => k.level === L);
  if (kind) {                          // новый вид в основном гараже: первое нажатие выдаст его; 4 клетки рядом с гаражом
    ev[0].reward = 'kind';
    s.kindNew = kind.line;
    ev.push({ t: 'kind', line: kind.line, at: C.ports[0].cell });
    openNearest(s, C.portCells, C.ports[0].cell, ev);
    giveChest(s, kind.line, 'level', levelChest(s, kind.line), ev);
  } else if (p) {
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
  // деталь Ателье, которой заказ с редкостью (и охота) ждёт улучшения машины на поле, — тоже не сливать (задание 17)
  s.orders.forEach((o, oi) => { if (o && oi < s.slots) o.items.forEach(it => {
    if (it.r < 1 || it.got >= it.n || it.line >= PARTS) return;
    const c = s.cells.find(x => isCar(x) && x.line === it.line && x.lvl === it.lvl && (x.r || 0) === it.r - 1);
    if (c) { const k = key(TRIM, trimFor(c.r || 0)); need[k] = (need[k] || 0) + 1; }
  }); });
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
    // заказ с редкостью (охота), а машина на ступень ниже уже стоит — нужна деталь Ателье (задание 17)
    s.orders.forEach((o, oi) => { if (o && oi < s.slots) o.items.forEach(it => {
      if (it.r >= 1 && it.got < it.n && s.cells.some(c => isCar(c) && c.line === it.line && c.lvl === it.lvl && (c.r || 0) === it.r - 1)) need[TRIM] += 2;
    }); });
    const ports = s.cells.map((c, i) => c?.k === 'port' && s.fuel >= tapCost(s, c.line) && (c.line !== TRIM || charges(s, now) > 0) ? i : -1).filter(i => i >= 0);
    const pneed = l => l === 0 ? Math.max(need[0], need[1], need[2]) : need[l];   // основной гараж — самый нужный из видов машин
    if (ports.length) return { t: 'port', i: ports.sort((a, b) => pneed(s.cells[b].line) - pneed(s.cells[a].line))[0] };
  }
  const mixed = dragHint(s, 'mixed') || dragHint(s, 'force');
  if (mixed) return mixed;
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
  CONFIG, CARS, CAR_FACE, EVENT_CARS, PARTS, EV, TRIM, PART_NAMES, TRIM_NAMES, N, key, maxLvl, units, xpNeed, rand, around, isPart, rarOn,
  toolFor, trimFor, needItem, itemFits, itemHint,
  closed, openCount, portFuel, tapCost, freeTap, portOpen, portOf, carLines, pickLine, zoneIdx, fuelMax, regenMs, lineDone, fxHas, fxSum, fxOf,
  setMonetOn, cardCount, huntTargets, testHunt, testMilestone, lateOn, hasRar, pickAlt, giveAlt, canGrant, grant, useReserve, maxCharges, dayOf,
  newGame, migrate, tick, charges, chargeWaitMs, reward, fuelWaitMs, setSpeed, tapPort, upgradePort, maxTier, tierPrice, tierFuel, tapChest,
  dailyGift, claimDaily, dailyDone, goalDone, claimTask, taskReady,
  move, buyBubble, canOpen, canKey, buyCell, cellPrice, buyableCells, ring, curRing, viewRect, inView, match, fits, exact, orderValue, orderTokens, bonusPct,
  giveOne, deliver, refreshOrder, refreshFree, buySlot, nextBuy,
  store, unstore, buyStore, arrive, shipMs, eventTick, evActive, prestigePrice, salonDone, buyPrestige,
  built, zoneDone, currentZone, buildable, build, isCar, isCert, certAt, tierStats, nextHint, dragHint, stuck,
  orangeLocked, vipLines, vipOrder, hallRate, hallBag, hallCheck, hallCollect, hallPlace, levelChest,
};
if (typeof module !== 'undefined') module.exports = Core; else window.Core = Core;
})();
