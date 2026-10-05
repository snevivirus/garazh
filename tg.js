// Telegram Mini App (задание 11): игра открыта в Telegram — подстраиваемся под его окно.
// Обычный браузер: модуль ничего не делает и ничего не грузит. ?tg=1 — имитация Telegram для проверки (игрокам не видна;
// ?tg=1&tgv=7.0 — имитация старого Telegram без отключения свайпов).
(function () {
  'use strict';
  const q = new URLSearchParams(location.search), mock = q.get('tg') === '1';
  const hashPlat = /tgWebAppPlatform=([^&]+)/.exec(location.hash)?.[1] || '';
  const on = mock || /tgWebApp(Data|Platform)=/.test(location.hash) || !!window.Telegram?.WebApp?.initData;
  const wa = () => window.Telegram?.WebApp;
  const has = v => { try { return !!wa()?.isVersionAtLeast?.(v); } catch { return false; } };
  const listeners = [], CHUNK = 4000;
  let keepTop = null;                     // старый Telegram: держать страницу прокрученной на 1 px
  const changed = () => { listeners.forEach(fn => { try { fn(); } catch {} }); keepTop?.(); };

  const TG = window.TG = {
    on, mock, loaded: false, cloud: { ok: 0, fail: 0, restored: false },
    platform: () => wa()?.platform || hashPlat,
    version: () => wa()?.version || '',
    // видимая высота окна: в Telegram — последняя устойчивая (не меняется во время анимации «шторки»)
    height: () => Math.round((on && wa()?.viewportStableHeight) || window.visualViewport?.height || innerHeight),
    // отступы сверху и снизу: системные (вырез, полоска жестов) + кнопки Telegram поверх игры (полноэкранный режим)
    insets() {
      const w = wa(), sa = w?.safeAreaInset || {}, ca = w?.contentSafeAreaInset || {};
      let top = (sa.top || 0) + (ca.top || 0);
      const bottom = (sa.bottom || 0) + (ca.bottom || 0);
      // отступы не пришли: Telegram ещё не загрузился, старая версия (до 8.0) или полноэкранный режим с нулями —
      // запас, чтобы верх шапки был не выше 56 px (iPhone) / 48 px (Android) вместе с 8 px отступа игры
      const real = this.loaded && has('8.0') && !(w.isFullscreen && !top);
      const fallback = !real && !top;
      if (fallback) top = /ios|macos/.test(this.platform()) ? 48 : 40;
      return { top, bottom, fallback, sa: [sa.top || 0, sa.bottom || 0], ca: [ca.top || 0, ca.bottom || 0], full: !!w?.isFullscreen };
    },
    onChange(fn) { listeners.push(fn); },
    // вибрация: light / medium — касание, success / error — итог
    haptic(kind) {
      const h = on && has('6.1') && wa()?.HapticFeedback;
      if (!h) return false;
      try { if (kind === 'success' || kind === 'error' || kind === 'warning') h.notificationOccurred(kind); else h.impactOccurred(kind); return true; } catch { return false; }
    },
    // облачная копия сохранения: куски по 4000 символов (s0…sN) и ключ sv — версия, число кусков, время записи.
    // Пишется не чаще раза в 10 с и сразу при сворачивании
    cloudSave(json, v) { if (!this.cloudOn()) return; pend = [json, v]; if (Date.now() - lastWrite >= 10e3) flush(); else { clearTimeout(timer); timer = setTimeout(flush, 10e3 - (Date.now() - lastWrite)); } },
    cloudFlush: () => flush(),
    cloudOn: () => on && has('6.9') && !!wa()?.CloudStorage,
    // прочитать облачную копию: cb(строка сохранения, время записи) или cb(null)
    cloudLoad(cb) {
      const cs = this.cloudOn() && wa().CloudStorage;
      if (!cs) return setTimeout(() => cb(null), 0);
      try {
        cs.getItem('sv', (err, sv) => {
          let meta = null;
          try { meta = !err && sv ? JSON.parse(sv) : null; } catch {}
          if (!meta?.n) return cb(null);
          cs.getItems(Array.from({ length: meta.n }, (_, k) => 's' + k), (err2, items) => {
            if (err2 || !items) return cb(null);
            const str = Array.from({ length: meta.n }, (_, k) => items['s' + k] || '').join('');
            cb(str, meta.at || 0);
          });
        });
      } catch { cb(null); }
    },
  };
  let pend = null, lastWrite = 0, timer = 0;
  function flush() {
    clearTimeout(timer);
    if (!pend || !TG.cloudOn()) return;
    const [json, v] = pend, cs = wa().CloudStorage, n = Math.ceil(json.length / CHUNK) || 1;
    pend = null; lastWrite = Date.now();
    const done = err => { if (err) TG.cloud.fail++; else TG.cloud.ok++; };
    try {
      for (let k = 0; k < n; k++) cs.setItem('s' + k, json.slice(k * CHUNK, (k + 1) * CHUNK));
      cs.setItem('sv', JSON.stringify({ v, n, at: lastWrite }), done);     // ключ версии — последним
    } catch { TG.cloud.fail++; }
  }
  if (!on) return;

  document.documentElement.classList.add('tg');
  if (mock) installMock(); else {
    // настоящий Telegram: скрипт Telegram — только здесь, не в обычном браузере
    const sc = document.createElement('script');
    sc.src = 'https://telegram.org/js/telegram-web-app.js';
    sc.onload = start; sc.onerror = () => changed();
    document.head.appendChild(sc);
  }
  if (mock) start();

  function start() {
    const w = wa();
    if (!w) return changed();
    TG.loaded = true;
    try {
      // свайп вниз по полю не должен сворачивать окно: отключаем как можно раньше, до ready()
      if (has('7.7')) w.disableVerticalSwipes();
      else {
        // старый Telegram: отключить свайпы нельзя — страница прокручивается на 1 px и возвращается, чтобы свайп вниз
        // прокручивал её, а не сворачивал окно
        document.documentElement.classList.add('tg-old');
        const b = document.body;
        keepTop = () => { if (b.scrollTop < 1) b.scrollTop = 1; };     // и после каждого пересчёта раскладки
        b.addEventListener('scroll', keepTop, { passive: true });
      }
      w.ready();
      w.expand();
      if (has('6.1')) { w.setHeaderColor('#F2F2F0'); w.setBackgroundColor('#F2F2F0'); }
      ['viewportChanged', 'safeAreaChanged', 'contentSafeAreaChanged', 'fullscreenChanged'].forEach(ev => w.onEvent(ev, changed));
    } catch {}
    // высота окна в Telegram меняется уже после запуска (анимация «шторки», expand) — пересчитать и позже
    [0, 100, 400, 1000].forEach(ms => setTimeout(changed, ms));
  }
  window.visualViewport?.addEventListener('resize', changed);

  // Имитация Telegram.WebApp для проверки без Telegram: облако — в localStorage (ключи tgcloud:…), вибрация — в консоль,
  // отступы 47 / 34. WebApp._set({ height, top, bottom, ctop, full }) меняет окно после загрузки и шлёт события Telegram
  function installMock() {
    const ver = q.get('tgv') || '8.0', ev = {}, calls = [];
    const fire = (name, arg) => (ev[name] || []).forEach(fn => fn.call(w, arg));
    let fixedH = 0;
    const store = {
      setItem: (k, v, cb) => setTimeout(() => { try { localStorage.setItem('tgcloud:' + k, v); cb?.(null, true); } catch (e) { cb?.(e); } }),
      getItem: (k, cb) => setTimeout(() => { try { cb(null, localStorage.getItem('tgcloud:' + k) ?? ''); } catch (e) { cb(e); } }),
      getItems: (ks, cb) => setTimeout(() => { try { cb(null, Object.fromEntries(ks.map(k => [k, localStorage.getItem('tgcloud:' + k) ?? '']))); } catch (e) { cb(e); } }),
      removeItems: (ks, cb) => setTimeout(() => { ks.forEach(k => localStorage.removeItem('tgcloud:' + k)); cb?.(null, true); }),
    };
    const w = {
      initData: '', platform: 'ios', version: ver, calls, isExpanded: false, isFullscreen: false, isVerticalSwipesEnabled: true,
      safeAreaInset: { top: 47, bottom: 34, left: 0, right: 0 }, contentSafeAreaInset: { top: 0, bottom: 0, left: 0, right: 0 },
      get viewportHeight() { return fixedH || innerHeight; }, get viewportStableHeight() { return fixedH || innerHeight; },
      isVersionAtLeast: v => { const a = ver.split('.').map(Number), b = String(v).split('.').map(Number); return (a[0] - b[0] || (a[1] || 0) - (b[1] || 0)) >= 0; },
      ready() { calls.push('ready'); }, expand() { calls.push('expand'); this.isExpanded = true; },
      disableVerticalSwipes() { calls.push('disableVerticalSwipes'); this.isVerticalSwipesEnabled = false; },
      setHeaderColor(c) { calls.push('header ' + c); }, setBackgroundColor(c) { calls.push('bg ' + c); },
      enableClosingConfirmation() { calls.push('closingConfirmation'); },
      openTelegramLink(url) { calls.push('openTelegramLink ' + url); console.log('[имитация Telegram] ссылка:', url); },
      onEvent(name, fn) { (ev[name] ||= []).push(fn); }, offEvent(name, fn) { ev[name] = (ev[name] || []).filter(f => f !== fn); },
      HapticFeedback: {
        impactOccurred(s) { calls.push('haptic ' + s); console.log('[имитация Telegram] вибрация:', s); },
        notificationOccurred(s) { calls.push('haptic ' + s); console.log('[имитация Telegram] вибрация:', s); },
      },
      CloudStorage: store,
      _set(o) {
        if (o.height !== undefined) fixedH = o.height;
        if (o.top !== undefined) this.safeAreaInset = { ...this.safeAreaInset, top: o.top };
        if (o.bottom !== undefined) this.safeAreaInset = { ...this.safeAreaInset, bottom: o.bottom };
        if (o.ctop !== undefined) this.contentSafeAreaInset = { ...this.contentSafeAreaInset, top: o.ctop };
        if (o.full !== undefined) { this.isFullscreen = o.full; fire('fullscreenChanged'); }
        fire('safeAreaChanged'); fire('contentSafeAreaChanged'); fire('viewportChanged', { isStateStable: true });
      },
    };
    addEventListener('resize', () => fire('viewportChanged', { isStateStable: true }));
    window.Telegram = { WebApp: w };
  }
})();
