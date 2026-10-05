// Монетизация (задание 12): заготовка, выключена. Реклама по желанию игрока с наградой и покупки — через подменяемого
// провайдера (Monet.use). По умолчанию провайдер «нет»: всё отвечает ok:false, кнопок в игре нет.
// ?monet=1 — тестовый провайдер: «ролик» 3 с и «покупка» ✓/✕, чтобы пощупать поток. Реальных сетей, ключей и адресов здесь нет.
(function () {
  'use strict';
  // ролик не чаще раза в 3 минуты, не больше 5 в день, первые 3 дня — ни одного (день игры с 0: 4-й день — 3)
  const LIMIT = { gapMs: 3 * 60e3, perDay: 5, fromDay: 3 };
  const NAME = { fuel: 'полный бак', charge: '+1 заряд Ателье' };
  const NONE = { products: [], rewarded: async () => ({ ok: false }), buy: async () => ({ ok: false }) };
  let provider = NONE, game = null, busy = false;
  const name = p => NAME[p] || p;

  const Monet = window.Monet = {
    LIMIT, products: [],
    use(p) { provider = p || NONE; Monet.products = provider.products || []; },
    get on() { return provider !== NONE; },
    // связь с игрой: s() — сохранение (счётчики роликов — s.monet), day() — день игры с 0, today() — дата, now(), log(text),
    // reward(place) — выдать награду правилами игры (Core.reward), ответ — получилось ли
    attach(g) { game = g; },
    canShow(place) {
      if (provider === NONE || !game || busy || !NAME[place]) return false;
      const m = game.s().monet || {}, today = game.today();
      return game.day() >= LIMIT.fromDay && !(m.day === today && m.n >= LIMIT.perDay) && game.now() - (m.at || 0) >= LIMIT.gapMs;
    },
    offered(place) { game?.log(`ролик предложен: ${name(place)}`); },
    async rewarded(place) {
      if (!Monet.canShow(place)) return { ok: false };
      busy = true;
      game.log(`ролик принят: ${name(place)}`);
      let r = { ok: false };
      try { r = await provider.rewarded(place); } catch {}
      busy = false;
      if (!r?.ok) { game.log(`ролик не досмотрен: ${name(place)}`); return { ok: false }; }
      const s = game.s(), today = game.today();
      s.monet = { day: today, n: (s.monet?.day === today ? s.monet.n : 0) + 1, at: game.now() };
      game.log(`ролик досмотрен: ${name(place)}`);
      return { ok: game.reward(place) };
    },
    async buy(id) {
      const p = Monet.products.find(x => x.id === id);
      if (!p || !game || busy) return { ok: false };
      busy = true;
      game.log(`покупка начата: ${p.title}`);
      let r = { ok: false };
      try { r = await provider.buy(p); } catch {}
      busy = false;
      game.log(r?.ok ? `покупка оформлена: ${p.title}` : `покупка отменена: ${p.title}`);
      return { ok: !!r?.ok && game.reward(p.reward) };
    },
  };

  // Тестовый провайдер: окна поверх игры (выше её окон), закрытие — по click, как у окон игры (задание 13)
  function testProvider() {
    const css = document.createElement('style');
    css.textContent = '.monet{z-index:50}.monet .m-ad{position:relative;width:min(300px,calc(100vw - 48px));aspect-ratio:9/14;border-radius:22px;' +
      'background:#202329;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}' +
      '.monet .m-ad b{font-size:64px;line-height:1}.monet .m-ad b .ic{width:64px;height:64px}.monet .m-ad small{opacity:.7}';
    document.head.appendChild(css);
    const ic = d => `<svg class="ic" viewBox="0 0 24 24">${d}</svg>`, X = ic('<path d="M6 6l12 12M18 6 6 18"/>'), OK = ic('<path d="m6 12.5 4 4 8-9"/>');
    const layer = html => { const el = document.createElement('div'); el.className = 'overlay monet'; el.innerHTML = html; document.body.appendChild(el); return el; };
    return {
      products: [{ id: 'test-fuel', title: 'Полный бак', price: '1 ⭐', reward: 'fuel' }],
      rewarded: () => new Promise(done => {
        const el = layer('<div class="m-ad"><small>Реклама · тест</small><b>3</b></div>'), b = el.querySelector('b');
        let n = 3;
        const t = setInterval(() => {
          if (--n > 0) { b.textContent = n; return; }
          clearInterval(t);
          b.innerHTML = OK;
          el.firstChild.insertAdjacentHTML('beforeend', `<button class="xbtn" data-close aria-label="Закрыть">${X}</button>`);
        }, 1000);
        el.addEventListener('click', e => { if (e.target.closest('[data-close]')) { el.remove(); done({ ok: true }); } });
      }),
      buy: p => new Promise(done => {
        const el = layer(`<div class="sheet narrow"><div class="sh-title">${p.title}</div><div class="sh-txt">${p.price} · тест, без денег</div>` +
          `<div class="obtns"><button class="btn ok" data-yes aria-label="Купить">${OK}</button><button class="btn light" data-no aria-label="Отмена">${X}</button></div></div>`);
        el.addEventListener('click', e => {
          const yes = e.target.closest('[data-yes]');
          if (!yes && !e.target.closest('[data-no]')) return;
          el.remove(); done({ ok: !!yes });
        });
      }),
    };
  }
  if (new URLSearchParams(location.search).get('monet') === '1') Monet.use(testProvider());
})();
