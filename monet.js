// Монетизация (задания 12, 16, 17): заглушки, выключены. Реклама по желанию игрока с наградой и покупки за ⭐ — через подменяемого провайдера
// (Monet.use). По умолчанию провайдер «нет»: всё отвечает ok:false, кнопок и плашек в игре нет.
// Тест монетизации — ?monet=1 или 7 быстрых нажатий по номеру сборки в Настройках (флаг garazh.monet): тестовый «ролик» 3 с
// и «покупка» ✓/✕, тестовая панель в Настройках. ?monet=1&day=N — для лимитов считать, что идёт N-й день игры.
// Реальных сетей, ключей и адресов здесь нет. В Node (бот) модуль отдаёт LIMIT и NAME.
(function () {
  'use strict';
  // Лимиты: первые 3 дня ни одного ролика (день игры с 0: 4-й день — 3), между любыми двумя — 2 минуты, всего не больше
  // 8 в день и свой дневной лимит у каждого места (бак — 3, заряд Ателье — 2 — решение владельца)
  const LIMIT = { gapMs: 2 * 60e3, perDay: 8, fromDay: 3,
    place: { fuel: 3, charge: 2, double: 2, chest: 1, gift: 1, reroll: 2, ship: 1, room: 1 } };
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
  let provider = NONE, game = null, busy = false, testDay = null;

  const Monet = {
    LIMIT, NAME, products: [],
    _test: {},                                       // для автопроверки: { next: 'fail' } — следующий ролик не досмотрен
    use(p) { provider = p || NONE; Monet.products = provider === NONE ? [] : PRODUCTS; game?.setOn?.(provider !== NONE); },
    get on() { return provider !== NONE; },
    // тест монетизации: включить / выключить (флаг в localStorage — и в Telegram, где адрес не поменять)
    setTest(on) { ls.set('garazh.monet', on ? '1' : null); Monet.use(on ? testProvider() : null); },
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
    canShow(place) {
      if (provider === NONE || !game || busy || !NAME[place]) return false;
      const c = Monet.counts();
      if (c.n >= LIMIT.perDay || (c.by[place] || 0) >= LIMIT.place[place]) return false;
      return Monet.vip() || Monet.day() >= LIMIT.fromDay && game.now() - c.at >= LIMIT.gapMs;   // с «Без роликов» — без паузы и первых 3 дней
    },
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
      css.textContent = '.monet{z-index:50}.monet .m-ad{position:relative;width:min(300px,calc(100vw - 48px));aspect-ratio:9/14;border-radius:22px;' +
        'background:#202329;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}' +
        '.monet .m-ad b{font-size:64px;line-height:1}.monet .m-ad b .ic{width:64px;height:64px}.monet .m-ad small{opacity:.7}';
      document.head.appendChild(css);
    }
    const ic = d => `<svg class="ic" viewBox="0 0 24 24">${d}</svg>`, X = ic('<path d="M6 6l12 12M18 6 6 18"/>'), OK = ic('<path d="m6 12.5 4 4 8-9"/>');
    const layer = html => { const el = document.createElement('div'); el.className = 'overlay monet'; el.innerHTML = html; document.body.appendChild(el); return el; };
    return {
      rewarded: () => new Promise(done => {
        const el = layer(`<div class="m-ad"><small>Реклама · тест</small><b>3</b><button class="xbtn" data-close aria-label="Закрыть">${X}</button></div>`);
        const b = el.querySelector('b');
        let n = 3, watched = false;
        const t = setInterval(() => {
          if (--n > 0) { b.textContent = n; return; }
          clearInterval(t); watched = true; b.innerHTML = OK;
        }, 1000);
        el.addEventListener('click', e => { if (e.target.closest('[data-close]')) { clearInterval(t); el.remove(); done({ ok: watched }); } });
      }),
      buy: p => new Promise(done => {
        const el = layer(`<div class="sheet narrow"><div class="sh-title">${p.title}</div><div class="sh-txt">⭐ ${p.price} · тест, без денег</div>` +
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
    if (q.get('monet') === '1' || ls.get('garazh.monet') === '1') Monet.use(testProvider());
    const d = q.get('day') ?? ls.get('garazh.monetDay');
    if (Monet.on && d !== null && d !== '' && !isNaN(+d)) testDay = Math.max(0, +d);
  }
  if (typeof module !== 'undefined') module.exports = Monet;
})();
