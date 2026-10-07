// Монетизация (задания 12, 16, 17, 23): реклама по желанию игрока с наградой и покупки за ⭐ — через подменяемого провайдера (Monet.use).
// С задания 23 тестовый провайдер включён по умолчанию (заглушки видны в обычной игре): «ролик» 3 с и «покупка» ✓/✕ — тест, без денег.
// Выключают — ?monet=0 (на этот запуск) и переключатель в тестовой панели (флаг garazh.monet = 0); провайдер «нет» — всё ok:false,
// кнопок и плашек нет. Тестовая панель в Настройках — 7 быстрых нажатий по номеру сборки (флаг garazh.monetPanel) или ?monet=1;
// &day=N — для лимитов считать, что идёт N-й день игры. Реальных сетей, ключей и адресов здесь нет. В Node (бот) модуль отдаёт LIMIT и NAME.
(function () {
  'use strict';
  // Лимиты: первые 3 дня ни одного ролика (день игры с 0: 4-й день — 3), между любыми двумя — 2 минуты, всего не больше
  // 8 в день и свой дневной лимит у каждого места (бак — 3, заряд Ателье — 2 — решение владельца; «×2» — 1, задание 22Б)
  const LIMIT = { gapMs: 2 * 60e3, perDay: 8, fromDay: 3,
    place: { fuel: 3, charge: 2, double: 1, chest: 1, gift: 1, reroll: 2, ship: 1, room: 1 } };
  const NAME = { fuel: 'полный бак', charge: '+1 заряд Ателье', double: 'монеты крупного заказа ×2', chest: 'второй сундук дня',
    gift: 'подарок дня ×2', reroll: 'замена заказа', ship: 'корабль сейчас', room: '+2 клетки' };
  const NONE = { products: [], rewarded: async () => ({ ok: false }), buy: async () => ({ ok: false }) };
  // товары (задание 17): названия на экране; цены и правила — CONFIG.shop и Core.canGrant / Core.grant
  const PRODUCTS = [['tanks5', '5 баков'], ['part1', 'Деталь Ателье 1'], ['part2', 'Деталь Ателье 2'], ['starter', 'Стартовый набор'],
    ['vip', 'Без роликов'], ['piggy', 'Копилка'], ['atelier3', 'Ещё заряд Ателье'], ['tankplus', 'Бак больше']].map(([id, title]) => ({ id, title }));
  const ls = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch {} },
  };
  let provider = NONE, game = null, busy = false, testDay = null, panel = false;

  const Monet = {
    LIMIT, NAME, products: [],
    LIST: PRODUCTS,                                  // все товары — для витрины магазина (задание 22: открыт и без теста)
    _test: {},                                       // для автопроверки: { next: 'fail' } — следующий ролик не досмотрен
    use(p) { provider = p || NONE; Monet.products = provider === NONE ? [] : PRODUCTS; game?.setOn?.(provider !== NONE); },
    get on() { return provider !== NONE; },
    // заглушки: включить / выключить (флаг в localStorage — и в Telegram, где адрес не поменять; включены по умолчанию — флаг не хранится)
    setTest(on) { ls.set('garazh.monet', on ? null : '0'); Monet.use(on ? testProvider() : null); },
    // тестовая панель в Настройках (счётчики, «Подготовить», день игры)
    get panel() { return panel; },
    setPanel(on) { panel = !!on; ls.set('garazh.monetPanel', on ? '1' : null); },
    // связь с игрой: s() — сохранение (счётчики — s.monet), day() — день игры с 0, today() — дата, now(), log(text), save(),
    // reward(place, ctx) — выдать награду правилами игры (Core.reward), ответ — получилось ли; canGrant(id, day) / grant(id, day) —
    // товар (Core.canGrant / Core.grant); setOn(on) — тест монетизации вкл / выкл (копилка, запас баков в правилах)
    attach(g) { game = g; g.setOn?.(Monet.on); },
    vip: () => !!game?.s().shop?.vip,               // «Без роликов» куплен: награда сразу, без ролика
    // день для лимитов: в тесте можно подменить (?day=N, панель); игра, её сохранение и дни событий не меняются
    day: () => testDay ?? game.day(),
    setDay(d) { testDay = Math.max(0, d); ls.set('garazh.monetDay', String(testDay)); },
    dayKey: () => testDay !== null ? 'тест ' + testDay : game.today(),
    // счётчики сегодняшнего дня: всего, по местам, время последнего ролика (старый вид s.monet { day, n, at } тоже читается)
    counts() {
      const m = game.s().monet || {};
      return m.day === Monet.dayKey() ? { n: m.n || 0, by: m.by || {}, at: m.at || 0 } : { n: 0, by: {}, at: m.at || 0 };
    },
    // можно ли ролик сейчас (задание 23 — для вида кнопки): ok; why — off (заглушек нет), busy (идёт ролик), limit (дневной лимит),
    // early (первые 3 дня; day — с какого дня), gap (пауза; until — когда можно). С «Без роликов» — без паузы и первых 3 дней
    state(place) {
      if (provider === NONE || !game || !NAME[place]) return { ok: false, why: 'off' };
      if (busy) return { ok: false, why: 'busy' };
      const c = Monet.counts();
      if (c.n >= LIMIT.perDay || (c.by[place] || 0) >= LIMIT.place[place]) return { ok: false, why: 'limit' };
      if (Monet.vip()) return { ok: true };
      if (Monet.day() < LIMIT.fromDay) return { ok: false, why: 'early', day: LIMIT.fromDay + 1 };
      const wait = LIMIT.gapMs - (game.now() - c.at);
      return wait > 0 ? { ok: false, why: 'gap', until: game.now() + wait } : { ok: true };
    },
    canShow: place => Monet.state(place).ok,
    resetCounts() { delete game.s().monet; game.save(); game.log('тест: счётчики роликов сброшены'); },
    offered(place) { game?.log(`ролик предложен: ${NAME[place] || place}`); },
    async rewarded(place, ctx) {
      if (!Monet.canShow(place)) return { ok: false };
      busy = true;
      const vip = Monet.vip();
      game.log(vip ? `награда без ролика: ${NAME[place]}` : `ролик принят: ${NAME[place]}`);
      let r = { ok: false };
      try { r = vip ? { ok: true } : Monet._test.next === 'fail' ? (Monet._test.next = null, { ok: false }) : await provider.rewarded(place); } catch {}
      busy = false;
      if (!r?.ok) { game.log(`ролик не досмотрен: ${NAME[place]}`); return { ok: false }; }
      // условие места проверяют правила игры: пропало, пока шёл ролик, — награды нет и счётчик не растёт
      if (!game.reward(place, ctx)) { game.log(`ролик досмотрен, награды нет — условие пропало: ${NAME[place]}`); return { ok: false }; }
      const c = Monet.counts();
      game.s().monet = { day: Monet.dayKey(), n: c.n + 1, at: game.now(), by: { ...c.by, [place]: (c.by[place] || 0) + 1 } };
      game.save();
      if (!vip) game.log(`ролик досмотрен: ${NAME[place]}`);
      return { ok: true };
    },
    // покупка (задание 17): можно ли выдать → подтверждение провайдера (✓ / ✕) → ещё раз «можно ли» → выдача.
    // Выдать нельзя — покупка отменена, ничего не списано
    async buy(id) {
      const p = Monet.products.find(x => x.id === id);
      if (!p || !game || busy || !game.canGrant(id, Monet.day()).ok) return { ok: false };
      busy = true;
      game.log(`покупка начата: ${p.title}`);
      let r = { ok: false };
      try { r = Monet._test.next === 'fail' ? (Monet._test.next = null, { ok: false }) : await provider.buy({ ...p, price: game.price(id) }); } catch {}
      busy = false;
      if (!r?.ok) { game.log(`покупка отменена: ${p.title}`); return { ok: false }; }
      if (!game.canGrant(id, Monet.day()).ok) { game.log(`покупка отменена — выдать нельзя: ${p.title}`); return { ok: false }; }
      game.grant(id, Monet.day());
      game.log(`покупка оформлена: ${p.title}`);
      return { ok: true };
    },
  };

  // Тестовый провайдер: окна поверх игры (выше её окон), закрытие — по click, как у окон игры (задание 13).
  // «Ролик»: отсчёт 3 с, потом галочка; «✕» есть сразу — закрыл раньше времени, ролик не досмотрен
  function testProvider() {
    if (!document.getElementById('monetCss')) {
      const css = document.createElement('style');
      css.id = 'monetCss';
      css.textContent = '.monet{z-index:50}.monet .m-ad{align-items:center;justify-content:center;gap:14px;min-height:min(300px,calc(100vh - var(--tg-top,0px) - 80px))}' +
        '.monet .m-ad b{display:grid;place-items:center;width:112px;height:112px;border-radius:50%;background:var(--navy,#14161F);color:#fff;font-size:56px;line-height:1;' +
        'box-shadow:0 0 0 1.5px var(--neon,#38B6FF),0 0 14px rgba(56,182,255,.55)}.monet .m-ad b .ic{width:56px;height:56px}';
      document.head.appendChild(css);
    }
    const ic = d => `<svg class="ic" viewBox="0 0 24 24">${d}</svg>`, X = ic('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'), OK = ic('<path d="M5.5 12.5 9.7 16.7 18.5 7.5"/>');
    // ⭐ Stars Telegram — тот же значок, что ICON.tgstar в игре (сплошная звезда)
    const TG_STAR = ic('<path d="m12 3.6 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z" fill="currentColor"/>');
    // слой поверх окон игры: карточка по центру, как у окон игры (задание 21) — появление 0,96 → 1 за 180 мс
    const layer = html => {
      const el = document.createElement('div'); el.className = 'overlay monet as-card'; el.innerHTML = html; document.body.appendChild(el);
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) el.firstElementChild.animate?.([{ transform: 'scale(.96)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)' });
      return el;
    };
    return {
      rewarded: () => new Promise(done => {
        const el = layer(`<div class="sheet narrow card m-ad"><button class="xbtn" data-close aria-label="Закрыть">${X}</button><div class="sh-title">Реклама · тест</div><b>3</b><div class="sh-txt">без денег</div></div>`);
        const b = el.querySelector('b');
        let n = 3, watched = false;
        const t = setInterval(() => {
          if (--n > 0) { b.textContent = n; return; }
          clearInterval(t); watched = true; b.innerHTML = OK;
        }, 1000);
        el.addEventListener('click', e => { if (e.target.closest('[data-close]')) { clearInterval(t); el.remove(); done({ ok: watched }); } });
      }),
      buy: p => new Promise(done => {
        const el = layer(`<div class="sheet narrow card"><div class="sh-title">${p.title}</div><div class="sh-txt"><span class="price">${TG_STAR}${p.price}</span> · тест, без денег</div>` +
          `<div class="obtns"><button class="btn ok" data-yes aria-label="Купить">${OK}</button><button class="btn light" data-no aria-label="Отмена">${X}</button></div></div>`);
        el.addEventListener('click', e => {
          const yes = e.target.closest('[data-yes]');
          if (!yes && !e.target.closest('[data-no]')) return;
          el.remove(); done({ ok: !!yes });
        });
      }),
    };
  }

  if (typeof window !== 'undefined') {
    window.Monet = Monet;
    const q = new URLSearchParams(location.search);
    // заглушки — по умолчанию (задание 23); ?monet=0 — без них на этот запуск; ?monet=1 — с ними и с тестовой панелью
    if (q.get('monet') === '1' || q.get('monet') !== '0' && ls.get('garazh.monet') !== '0') Monet.use(testProvider());
    panel = q.get('monet') === '1' || ls.get('garazh.monetPanel') === '1';
    const d = q.get('day') ?? ls.get('garazh.monetDay');
    if (Monet.on && d !== null && d !== '' && !isNaN(+d)) testDay = Math.max(0, +d);
  }
  if (typeof module !== 'undefined') module.exports = Monet;
})();
