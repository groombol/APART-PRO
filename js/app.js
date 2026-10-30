/* ==========================================================================
   APART PRO — общая логика: шапка, меню, футер, каталог, страница объекта,
   галерея-лайтбокс, окно бронирования, cookie-плашка.
   Данные — в js/data.js.
   ========================================================================== */
(function () {
  'use strict';

  const S = window.SITE;
  const APTS = window.APARTMENTS;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pending = (v, label = 'уточняется') => (v ? esc(v) : `<span class="pending">${label}</span>`);
  const brandHtml = () => '<span class="brand-inline"><span class="brand-inline__apart">APART</span> <span class="brand-inline__pro">PRO</span></span>';

  /* ---------- Typographer helper ---------- */
  const typograph = (str) => {
    if (!str) return '';
    let s = String(str);
    s = s.replace(/ +—/g, '&nbsp;—').replace(/ — /g, '&nbsp;— ');
    s = s.replace(/(\d+)\s+(\d+)\s*₽/g, '$1&nbsp;$2&nbsp;₽');
    s = s.replace(/(\d+)\s*₽/g, '$1&nbsp;₽');
    s = s.replace(/(\d+)\s*м²/g, '$1&nbsp;м²');
    s = s.replace(/(\d+)\s*(дней|дня|день|месяц|месяца|месяцев|гость|гостя|гостей|эт\.|чел\.)/g, '$1&nbsp;$2');
    s = s.replace(/(\d+)\s+(из|в|на|с|по|до|от)\b/g, '$1&nbsp;$2');
    s = s.replace(/\b(ул\.|г\.|ст\.|ЖК|№)\s+/g, '$1&nbsp;');
    s = s.replace(/([✓✔•])\s+/g, '$1&nbsp;');
    const prep = /(^|[\s(«"\'—–]|&nbsp;)(в|с|к|у|о|и|а|на|по|от|до|из|за|со|во|ко|об|не|но|ли|бы|же|ни|под|над|при|без|для|про)\s+/gi;
    s = s.replace(prep, '$1$2&nbsp;').replace(prep, '$1$2&nbsp;').replace(prep, '$1$2&nbsp;');
    return s;
  };

  /* ---------- DOM Typographer Walker ---------- */
  function applyDomTypography(root = document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName.toLowerCase();
          if (['script', 'style', 'textarea', 'input', 'select', 'code', 'pre'].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    let node;
    const prep = /(^|[\s(«"\'—–\u00A0])(в|с|к|у|о|и|а|на|по|от|до|из|за|со|во|ко|об|не|но|ли|бы|же|ни|под|над|при|без|для|про)\s+/gi;
    while ((node = walker.nextNode())) {
      let val = node.nodeValue;
      if (!val || val.length < 2) continue;
      val = val.replace(/ +— /g, '\u00A0— ');
      val = val.replace(/(\d+)\s+(\d+)\s*₽/g, '$1\u00A0$2\u00A0₽');
      val = val.replace(/(\d+)\s*₽/g, '$1\u00A0₽');
      val = val.replace(/(\d+)\s*м²/g, '$1\u00A0м²');
      val = val.replace(/(\d+)\s*(дней|дня|день|месяц|месяца|месяцев|гость|гостя|гостей|эт\.|чел\.)/g, '$1\u00A0$2');
      val = val.replace(/(\d+)\s+(из|в|на|с|по|до|от)\b/g, '$1\u00A0$2');
      val = val.replace(/\b(ул\.|г\.|ст\.|ЖК|№)\s+/g, '$1\u00A0');
      val = val.replace(/([✓✔•])\s+/g, '$1\u00A0');
      val = val.replace(prep, '$1$2\u00A0').replace(prep, '$1$2\u00A0').replace(prep, '$1$2\u00A0');
      if (val !== node.nodeValue) {
        node.nodeValue = val;
      }
    }
  }

  /* ---------- Icons ---------- */
  const I = {
    // Официальный логотип MAX из папки Логотипы
    max: '<svg viewBox="0 0 17 17" fill="currentColor" width="18" height="18"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.68263 16.9515C7.01429 16.9515 6.23899 16.7069 4.89135 15.7284C4.03891 16.8292 1.33955 17.6894 1.22182 16.2176C1.22182 15.1128 0.978265 14.1793 0.702237 13.16C0.37345 11.9044 0 10.506 0 8.47983C0 3.64061 3.95367 0 8.63799 0C13.3264 0 17 3.82 17 8.52466C17.0157 13.1566 13.2945 16.9268 8.68263 16.9515ZM8.75165 4.18283C6.47038 4.06461 4.69243 5.6505 4.2987 8.13737C3.97396 10.1962 4.55037 12.7034 5.04153 12.8339C5.27696 12.891 5.86961 12.4099 6.23899 12.0389C6.8498 12.4627 7.56108 12.7172 8.30108 12.7768C10.6649 12.891 12.6846 11.0836 12.8433 8.71222C12.9357 6.33575 11.1157 4.32292 8.75165 4.18692V4.18283Z"/></svg>',
    // Официальный логотип Telegram из папки Логотипы
    tg: '<svg viewBox="0 0 700 584" fill="currentColor" width="18" height="18"><path d="M640.322 5.14984C640.322 5.14984 705.077 -20.1002 699.68 41.2213C697.882 66.4717 681.693 154.847 669.102 250.437L625.932 533.598C625.932 533.598 622.335 575.08 589.957 582.295C557.578 589.508 509.013 557.045 500.018 549.83C492.823 544.42 365.113 463.258 320.143 423.58C307.552 412.758 293.162 391.115 321.942 365.865L510.812 185.508C532.397 163.865 553.982 113.365 464.043 174.687L212.218 346.027C212.218 346.027 183.438 364.062 129.477 347.83L12.557 311.758C12.557 311.758 -30.6132 284.705 43.1358 257.65C223.012 172.882 444.258 86.31 640.322 5.14984Z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>'
  };
  window.ICONS = I;

  const tel = `tel:${S.manager.phone}`;
  const tgUrl = (text) => `https://t.me/${S.manager.telegram}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  const maxUrl = () => S.manager.max || `tel:${S.manager.phone}`;
  const isHome = document.body.dataset.page === 'home';
  const base = isHome ? '' : 'index.html';

  /* ---------- Header + mobile menu ---------- */
  function renderHeader() {
    const host = $('[data-header]');
    if (!host) return;
    const nav = [
      ['Квартиры', `${base}#catalog`],
      ['Сервис', `${base}#about`],
      ['Вопросы', `${base}#faq`]
    ];
    const links = nav.map(([t, h]) => `<a href="${h}">${t}</a>`).join('');
    host.outerHTML = `
      <header class="header ${document.body.classList.contains('has-hero') ? '' : 'header--solid'}" id="header">
        <div class="wrap header__inner">
          <a class="logo" href="index.html" aria-label="${S.brand} — на главную">
            <img src="img/logos/logo-header.png" alt="APART PRO" class="logo__img" width="140" height="42">
          </a>
          <nav class="nav" aria-label="Основное меню">${links}</nav>
          <div class="header__actions">
            <a class="icon-btn" href="${tgUrl()}" target="_blank" rel="noopener" aria-label="Написать в Telegram" id="header-tg" title="Telegram">${I.tg}</a>
            <a class="icon-btn" href="${maxUrl()}" ${S.manager.max ? 'target="_blank" rel="noopener"' : ''} aria-label="Написать в MAX" id="header-max" title="MAX">${I.max}</a>
            <button class="btn btn--primary btn--sm" data-book id="header-book">Забронировать</button>
            <button class="burger" aria-label="Открыть меню" aria-expanded="false" id="burger"><span></span></button>
          </div>
        </div>
      </header>
      <div class="mobile-menu" id="mobile-menu">
        <nav aria-label="Мобильное меню">${links}</nav>
        <div class="mobile-menu__contacts">
          <button class="btn btn--primary btn--block" data-book id="menu-book">Забронировать</button>
          <div class="mobile-menu__messengers">
            <a class="btn btn--ghost" href="${tgUrl()}" target="_blank" rel="noopener">${I.tg} Telegram</a>
            <a class="btn btn--ghost" href="${maxUrl()}" ${S.manager.max ? 'target="_blank" rel="noopener"' : ''}>${I.max} MAX</a>
          </div>
          <a class="btn btn--ghost btn--block" href="${tel}">${I.phone} Позвонить: ${S.manager.phonePretty}</a>
        </div>
      </div>`;

    const header = $('#header');
    const burger = $('#burger');
    const setMenu = (open) => {
      document.documentElement.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', () => setMenu(!document.documentElement.classList.contains('menu-open')));
    $$('#mobile-menu a, #mobile-menu button').forEach((a) => a.addEventListener('click', () => setMenu(false)));

    if (document.body.classList.contains('has-hero')) {
      const hero = $('.hero');
      const onScroll = () => header.classList.toggle('is-solid', window.scrollY > (hero ? hero.offsetHeight - 120 : 40));
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

  /* ---------- Footer ---------- */
  function renderFooter() {
    const host = $('[data-footer]');
    if (!host) return;
    const L = S.legal;
    const daily = APTS.filter((a) => a.type === 'daily').map((a) => `<li><a href="${a.url}">${esc(a.title)}</a></li>`).join('');
    const long = APTS.filter((a) => a.type === 'long').map((a) => `<li><a href="${a.url}">${esc(a.title)}</a></li>`).join('');
    host.outerHTML = `
      <footer class="footer" id="contacts-footer">
        <div class="wrap">
          <div class="footer__grid">
            <div>
              <a class="logo logo--footer" href="index.html" aria-label="${S.brand}">
                <img src="img/logos/logo-header-white.png" alt="APART PRO" class="logo__img" width="140" height="42">
              </a>
              <p>Квартиры в Волгограде посуточно и на длительный срок. Сервис, как в отеле, — в отдельной квартире.</p>
            </div>
            <div><h4>Посуточно</h4><ul>${daily}</ul></div>
            <div><h4>От месяца</h4><ul>${long}</ul></div>
            <div>
              <h4>Персональный менеджер</h4>
              <p style="margin-bottom:.6rem;color:rgba(251,250,247,.9)">Всегда на связи для гостей</p>
              <p style="margin-bottom:.4rem"><a href="${tel}" style="font-size:var(--fs-md);font-weight:600">${S.manager.phonePretty}</a></p>
              <p style="margin-bottom:1rem"><a href="mailto:${L.email}" style="font-size:var(--fs-sm);color:rgba(251,250,247,.85);text-decoration:underline">${esc(L.email)}</a></p>
              <div class="footer__messengers">
                <a class="btn btn--light btn--sm" href="${tgUrl()}" target="_blank" rel="noopener" aria-label="Telegram">${I.tg} Telegram</a>
                <a class="btn btn--light btn--sm" href="${maxUrl()}" ${S.manager.max ? 'target="_blank" rel="noopener"' : ''} aria-label="MAX">${I.max} MAX</a>
              </div>
            </div>
          </div>
          <div class="footer__legal">
            <p>${pending(L.name, 'Наименование исполнителя — уточняется')} · ИНН ${pending(L.inn)}${L.kpp ? ` · КПП ${esc(L.kpp)}` : ''} · ОГРН ${pending(L.ogrn)}${L.address ? ` · ${esc(L.address)}` : ''} · <a href="mailto:${L.email}" style="color:inherit;text-decoration:underline">${esc(L.email)}</a></p>
            <p>Информация на сайте носит справочный характер и не является публичной офертой (ст. 437 ГК РФ). Стоимость и наличие свободных дат подтверждает персональный менеджер.</p>
            <p><a href="privacy.html">Политика обработки персональных данных</a> · <a href="consent.html">Согласие на обработку персональных данных</a> · <a href="rules.html">Правила проживания и бронирования</a></p>
            <p>© ${new Date().getFullYear()} ${brandHtml()} (${esc(S.brandRu)})</p>
          </div>
        </div>
      </footer>`;
  }

  /* ---------- Catalog (home) ---------- */
  function priceHtml(a) {
    return a.price ? `<span class="card__price">от <b>${esc(a.price)} ₽</b> / ${a.priceUnit}</span>` : `<span class="card__price">цена по запросу</span>`;
  }
  function img(id, n, alt, sizes = '(min-width: 1080px) 33vw, (min-width: 720px) 50vw, 100vw', eager = false) {
    const p = `img/${id}/${String(n).padStart(2, '0')}`;
    return `<img src="${p}-800.webp" srcset="${p}-800.webp 800w, ${p}-1600.webp 1600w" sizes="${sizes}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  }

  function renderCatalog() {
    const host = $('[data-catalog]');
    if (!host) return;
    const count = (t) => APTS.filter((a) => !t || a.type === t).length;
    $('[data-filters]').innerHTML = [
      ['all', 'Все', count()], ['daily', 'Посуточно', count('daily')], ['long', 'От месяца', count('long')]
    ].map(([k, t, c], i) => `<button class="chip ${i === 0 ? 'is-active' : ''}" data-filter="${k}" id="filter-${k}">${t}<sup>${c}</sup></button>`).join('');

    host.innerHTML = APTS.map((a) => `
      <article class="card reveal" data-type="${a.type}" id="card-${a.id}">
        <a class="card__media" href="${a.url}" aria-label="${esc(a.title)}">
          ${a.cover ? img(a.id, a.cover, `Квартира ${a.title}`) : `<div class="card__placeholder"><span>Фотосессия скоро</span><span>А пока — расскажем всё в Telegram</span></div>`}
          <span class="card__badge ${a.type === 'long' ? 'card__badge--long' : ''}">${a.typeLabel}</span>
        </a>
        <div class="card__body">
          <div class="card__title"><h3>${esc(a.title)}</h3>${priceHtml(a)}</div>
          <p class="card__meta">${esc(a.rooms)} · ${esc(a.area)} · ${esc(a.floor)} эт.</p>
          <ul class="tags">${a.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
          <a class="card__link" href="${a.url}">Подробнее${a.photos > 1 ? ` и ${a.photos} фото` : ''} ${I.arrow}</a>
        </div>
      </article>`).join('');

    $$('[data-filter]').forEach((b) => b.addEventListener('click', () => {
      $$('[data-filter]').forEach((x) => x.classList.toggle('is-active', x === b));
      $$('.card', host).forEach((c) => { c.hidden = b.dataset.filter !== 'all' && c.dataset.type !== b.dataset.filter; });
    }));
  }

  /* ---------- Reviews ---------- */
  function renderReviews() {
    const host = $('[data-reviews]');
    if (!host || !window.REVIEWS || !window.REVIEWS.length) return;
    host.innerHTML = window.REVIEWS.map((rev) => `
      <article class="review reveal">
        <div class="review__meta" style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:1rem">
          <div>
            <b style="font-size:var(--fs-md);color:var(--c-ink)">${esc(rev.author)}</b>
            <div style="font-size:var(--fs-xs);color:var(--c-ink-3);margin-top:2px">${esc(rev.date)} · <span style="color:var(--c-accent);font-weight:600">✓ ${esc(rev.status)}</span></div>
          </div>
          <div style="color:#E59835;font-size:1.15rem;letter-spacing:2px" aria-label="Оценка 5 из 5">★★★★★</div>
        </div>
        <p style="color:var(--c-ink-2);font-size:var(--fs-sm);line-height:1.65;margin-bottom:1.2rem">«${esc(rev.text)}»</p>
        <footer style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:.75rem;padding-top:1rem;border-top:1px solid var(--c-line);font-size:var(--fs-xs);color:var(--c-ink-3)">
          <span>Квартира: <a href="${rev.aptUrl}" style="font-weight:600;color:var(--c-ink);border-bottom:1px solid var(--c-line)">${esc(rev.aptTitle)}</a></span>
          <a class="card__link" href="${rev.sourceUrl}" target="_blank" rel="noopener" style="font-size:var(--fs-xs)">Проверенный отзыв на ${esc(rev.source)} ${I.arrow}</a>
        </footer>
      </article>`).join('');
  }

  /* ---------- Apartment page ---------- */
  function renderApartment() {
    const main = $('[data-apartment]');
    if (!main) return;
    const a = APTS.find((x) => x.id === main.dataset.apartment);
    if (!a) return;
    const photoList = Array.from({ length: a.photos }, (_, i) => i + 1);
    const zoneByPhoto = Object.fromEntries(a.zones.map((z) => [z.photo, z.name]));
    const portrait = a.id === 'gamzatova-19';

    const gallery = a.photos ? `
      <div class="gallery ${portrait ? 'gallery--portrait' : ''}">
        ${photoList.slice(0, 5).map((n, i) => `<button class="gallery__item" data-lightbox="${n - 1}" aria-label="Открыть фото ${n}">${img(a.id, n, `${a.title} — фото ${n}`, i === 0 ? '(min-width: 720px) 60vw, 100vw' : '(min-width: 720px) 20vw, 50vw', i === 0)}</button>`).join('')}
        ${a.photos > 1 ? `<button class="btn btn--light btn--sm gallery__all" data-lightbox="0" id="gallery-all">${I.grid} Все ${a.photos} фото</button>` : ''}
      </div>` : `
      <div class="card__media" style="aspect-ratio:16/9"><div class="card__placeholder"><span>Фотосессия скоро</span><span>Фотограф уже готовит снимки этой квартиры</span></div></div>`;

    const specs = [['Тип', a.rooms], ['Площадь', a.area], ['Этаж', a.floor], ['Аренда', a.typeLabel]];
    const section = (title, body) => body ? `<section class="apt-block reveal"><h2>${title}</h2>${body}</section>` : '';
    const list = (items) => `<ul class="amenities">${items.map((x) => `<li>${I.check}<span>${esc(x)}</span></li>`).join('')}</ul>`;

    main.innerHTML = `
      <div class="wrap">
        <p class="crumbs"><a href="index.html">Главная</a> / <a href="index.html#catalog">Квартиры</a> / ${esc(a.title)}</p>
        <div class="apt-head">
          <span class="eyebrow">${a.typeLabel} · ${esc(a.district)}</span>
          <h1>${esc(a.title)}</h1>
          <p class="apt-head__tagline">${esc(a.tagline)}</p>
        </div>
        ${gallery}
        <div class="apt-layout">
          <div>
            <div class="specs">${specs.map(([k, v]) => `<div class="spec"><span>${k}</span><b>${pending(v)}</b></div>`).join('')}</div>
            <div class="apt-intro reveal">${a.intro.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
            ${section('Что внутри', a.zones.length ? `<div class="zones">${a.zones.map((z) => `
              <button class="zone" data-lightbox="${z.photo - 1}">${img(a.id, z.photo, z.name, '96px')}<div><h3>${esc(z.name)}</h3><p>${esc(z.text)}</p></div></button>`).join('')}</div>` : '')}
            ${section('Удобства', a.amenities.length ? list(a.amenities) : '')}
            ${section('Подготовили для вас', a.guestKit.length ? list(a.guestKit) : '')}
            ${section('Расположение', `<p>${esc(a.location.text)}</p>${a.location.distances.length ? `<ul class="distances">${a.location.distances.map(([k, v]) => `<li><span>${esc(k)}</span><b>${esc(v)}</b></li>`).join('')}</ul>` : ''}${a.location.nearby ? `<p><strong>Рядом:</strong> ${esc(a.location.nearby)}</p>` : ''}`)}
            ${section('Правила', `${list(a.rules)}<p style="margin-top:1.2rem"><a class="card__link" href="rules.html">Полные правила проживания и бронирования ${I.arrow}</a></p>`)}
          </div>
          <aside class="apt-aside">
            <div class="booking-card" id="booking-card">
              <div class="booking-card__price">${a.price ? `от ${esc(a.price)} ₽ <small>/ ${a.priceUnit}</small>` : `Цена по запросу`}</div>
              <ul>
                ${a.type === 'daily' ? `<li>Заезд с ${S.checkIn}, выезд до ${S.checkOut}</li><li>Бесконтактное заселение</li>` : '<li>Аренда от 1 месяца по договору</li>'}
                ${a.beds ? `<li>${esc(a.beds)}</li>` : ''}
                ${a.deposit ? `<li>Залог: ${esc(a.deposit)}</li>` : ''}
                ${a.commission ? `<li>Комиссия: ${esc(a.commission)}</li>` : ''}
              </ul>
              <button class="btn btn--primary btn--block" data-book="${a.id}" id="aside-book">${a.type === 'long' ? 'Оставить заявку' : 'Забронировать'}</button>
              <a class="btn btn--ghost btn--block" href="${tel}" id="aside-call">${I.phone} ${S.manager.phonePretty}</a>
              <p class="booking-card__note">Персональный менеджер подтвердит свободные даты и точную стоимость.</p>
            </div>
          </aside>
        </div>
      </div>
      <div class="sticky-cta" id="sticky-cta">
        <div class="sticky-cta__info"><b>${esc(a.title)}</b>${a.price ? `от ${esc(a.price)} ₽ / ${a.priceUnit}` : 'цена по запросу'}</div>
        <button class="btn btn--primary btn--sm" data-book="${a.id}">${a.type === 'long' ? 'Заявка' : 'Забронировать'}</button>
      </div>`;

    if (a.photos) initLightbox(photoList.map((n) => ({ src: `img/${a.id}/${String(n).padStart(2, '0')}-1600.webp`, caption: zoneByPhoto[n] || a.title })));

    const sticky = $('#sticky-cta');
    const card = $('#booking-card');
    const footer = $('footer') || $('#contacts-footer');
    if (sticky && card) {
      const updateSticky = () => {
        const cardRect = card.getBoundingClientRect();
        const footerRect = footer ? footer.getBoundingClientRect() : null;
        // Карточка бронирования вошла в экран или уже выше него (дошли до блока бронирования или находимся ниже в футере)
        const atOrPastCard = cardRect.top < (window.innerHeight - 40);
        // Футер вошел в область видимости
        const atFooter = footerRect ? footerRect.top < window.innerHeight : false;
        const show = window.scrollY > 400 && !atOrPastCard && !atFooter;
        sticky.classList.toggle('is-visible', show);
      };
      window.addEventListener('scroll', updateSticky, { passive: true });
      window.addEventListener('resize', updateSticky, { passive: true });
      updateSticky();
    }
  }

  /* ---------- Lightbox ---------- */
  function initLightbox(items) {
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Фотогалерея');
    box.innerHTML = `
      <div class="lightbox__bar"><span data-lb-count></span><button class="icon-btn" data-lb-close aria-label="Закрыть галерею">${I.close}</button></div>
      <div class="lightbox__stage">
        <div class="lightbox__track">${items.map((it, i) => `<div class="lightbox__slide"><img data-src="${it.src}" alt="${esc(it.caption)} — фото ${i + 1}"></div>`).join('')}</div>
        <button class="icon-btn lightbox__nav lightbox__nav--prev" data-lb-prev aria-label="Предыдущее фото">${I.left}</button>
        <button class="icon-btn lightbox__nav lightbox__nav--next" data-lb-next aria-label="Следующее фото">${I.right}</button>
      </div>
      <div class="lightbox__caption" data-lb-caption></div>`;
    document.body.appendChild(box);
    const track = $('.lightbox__track', box);
    const slides = $$('img', track);
    let idx = 0, lastFocus = null;

    const load = (i) => { const im = slides[i]; if (im && !im.src) im.src = im.dataset.src; };
    const go = (i) => {
      idx = (i + items.length) % items.length;
      [idx, idx + 1, idx - 1].forEach((k) => load((k + items.length) % items.length));
      track.style.transform = `translateX(${-idx * 100}%)`;
      $('[data-lb-count]', box).textContent = `${idx + 1} / ${items.length}`;
      $('[data-lb-caption]', box).textContent = items[idx].caption;
    };
    const open = (i) => { lastFocus = document.activeElement; track.style.transition = 'none'; go(i); requestAnimationFrame(() => { track.style.transition = ''; }); box.classList.add('is-open'); document.body.style.overflow = 'hidden'; $('[data-lb-close]', box).focus(); };
    const close = () => { box.classList.remove('is-open'); document.body.style.overflow = ''; lastFocus && lastFocus.focus(); };

    $$('[data-lightbox]').forEach((b) => b.addEventListener('click', () => open(+b.dataset.lightbox)));
    $('[data-lb-close]', box).addEventListener('click', close);
    $('[data-lb-prev]', box).addEventListener('click', () => go(idx - 1));
    $('[data-lb-next]', box).addEventListener('click', () => go(idx + 1));
    document.addEventListener('keydown', (e) => {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') go(idx - 1);
      if (e.key === 'ArrowRight') go(idx + 1);
    });
    // свайп
    let x0 = null, dx = 0;
    const stage = $('.lightbox__stage', box);
    stage.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; dx = 0; track.style.transition = 'none'; }, { passive: true });
    stage.addEventListener('touchmove', (e) => { if (x0 === null) return; dx = e.touches[0].clientX - x0; track.style.transform = `translateX(calc(${-idx * 100}% + ${dx}px))`; }, { passive: true });
    stage.addEventListener('touchend', () => { track.style.transition = ''; if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1)); else go(idx); x0 = null; });
  }

  /* ---------- Booking modal ---------- */
  /* ---------- Modal: Booking Form ---------- */
  /* ---------- Phone Input Mask: +7 (999) 158 99-00 ---------- */
  function initPhoneMask(input) {
    if (!input || input._hasMask) return;
    input._hasMask = true;

    const format = (raw) => {
      let digits = raw.replace(/\D/g, '');
      if (!digits) return '';
      // If starts with 7 or 8, strip it to format subscriber digits
      if (digits[0] === '7' || digits[0] === '8') {
        digits = digits.slice(1);
      }
      digits = digits.slice(0, 10);
      let res = '+7';
      if (digits.length > 0) {
        res += ' (' + digits.slice(0, 3);
      }
      if (digits.length >= 3) {
        res += ') ' + digits.slice(3, 6);
      }
      if (digits.length >= 6) {
        res += ' ' + digits.slice(6, 8);
      }
      if (digits.length >= 8) {
        res += '-' + digits.slice(8, 10);
      }
      return res;
    };

    input.addEventListener('input', () => {
      input.value = format(input.value);
    });

    input.addEventListener('focus', () => {
      if (!input.value.trim()) {
        input.value = '+7 (';
      }
    });

    input.addEventListener('blur', () => {
      if (input.value === '+7' || input.value === '+7 (' || input.value === '+7 ()') {
        input.value = '';
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value.length <= 4) {
        e.preventDefault();
        input.value = '';
      }
    });
  }

  /* ---------- Modal: Booking Form ---------- */
  function renderModal() {
    const today = new Date().toISOString().slice(0, 10);
    const m = document.createElement('div');
    m.className = 'modal';
    m.id = 'booking-modal';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.setAttribute('aria-labelledby', 'booking-title');

    const renderFormHtml = () => `
      <div class="modal__backdrop" data-close></div>
      <div class="modal__dialog">
        <button class="icon-btn modal__close" data-close aria-label="Закрыть">${I.close}</button>
        <h2 id="booking-title">Забронировать квартиру</h2>
        <p class="modal__lead">Заполните детали, и персональный менеджер свяжется с вами для подтверждения бронирования.</p>
        <form class="form" id="booking-form" novalidate>
          <div class="field"><label for="bf-apt">Квартира <span class="req">*</span></label>
            <select id="bf-apt" name="apt" required>
              <option value="" disabled selected>Обязательно</option>
              ${APTS.map((a) => `<option value="${a.id}">${esc(a.title)} · ${a.typeLabel.toLowerCase()}</option>`).join('')}
            </select></div>
          <div class="form__row">
            <div class="field"><label for="bf-in" data-label-in><span class="label-text">Заезд</span> <span class="req">*</span></label><input type="date" id="bf-in" name="in" min="${today}" placeholder="Обязательно" required></div>
            <div class="field" data-out-field><label for="bf-out"><span class="label-text">Выезд</span> <span class="req">*</span></label><input type="date" id="bf-out" name="out" min="${today}" placeholder="Обязательно" required></div>
          </div>
          <div class="form__row">
            <div class="field"><label for="bf-name">Ваше имя <span class="req">*</span></label><input type="text" id="bf-name" name="name" placeholder="Обязательно" required autocomplete="name"></div>
            <div class="field"><label for="bf-phone">Телефон для связи <span class="req">*</span></label><input type="tel" id="bf-phone" name="phone" placeholder="Обязательно" required autocomplete="tel"></div>
          </div>
          <div class="field"><label for="bf-social">Telegram / VK / контакт для связи <span class="field__opt">(необязательно)</span></label><input type="text" id="bf-social" name="social" placeholder="@username или ссылка на профиль"></div>
          <div class="field"><label for="bf-guests">Количество гостей <span class="req">*</span></label>
            <select id="bf-guests" name="guests" required><option value="1">1 гость</option><option value="2" selected>2 гостя</option><option value="3">3 гостя</option><option value="4">4 гостя</option></select></div>
          <div class="field"><label for="bf-comment">Пожелания или вопросы <span class="field__opt">(необязательно)</span></label><textarea id="bf-comment" name="comment" placeholder="Ранний заезд, командировочные документы, вопросы…"></textarea></div>
          <label class="consent"><input type="checkbox" id="bf-consent" name="consent" required>
            <span>Я даю <a href="consent.html" target="_blank">согласие на обработку персональных данных</a>.</span></label>
          <p class="form__note">Подробнее — в <a href="privacy.html" target="_blank">политике обработки персональных данных</a>. Условия бронирования — в <a href="rules.html" target="_blank">правилах проживания</a>.</p>
          <button class="btn btn--primary btn--block" type="submit" id="bf-submit" disabled>Отправить</button>
          <p class="form__note">Персональный менеджер на связи в Telegram и MAX. Если удобнее связаться голосом: <a href="${tel}">${S.manager.phonePretty}</a></p>
        </form>
      </div>`;

    m.innerHTML = renderFormHtml();
    document.body.appendChild(m);

    const setupFormEvents = () => {
      const form = $('#booking-form', m);
      if (!form) return;
      const aptSel = $('#bf-apt', form);
      const phoneInput = $('#bf-phone', form);
      const submitBtn = $('#bf-submit', form);
      initPhoneMask(phoneInput);

      const syncType = () => {
        const long = APTS.find((a) => a.id === aptSel.value)?.type === 'long';
        $('[data-out-field]', m).hidden = long;
        $('#bf-out', form).required = !long;
        const inLabelText = $('[data-label-in] .label-text', m);
        if (inLabelText) inLabelText.textContent = long ? 'Желаемая дата заезда' : 'Заезд';
        checkFormValid();
      };
      aptSel.addEventListener('change', syncType);
      $('#bf-in', form).addEventListener('change', (e) => {
        $('#bf-out', form).min = e.target.value;
        checkFormValid();
      });

      const checkFormValid = () => {
        const aptOk = !!aptSel.value;
        const nameOk = $('#bf-name', form).value.trim().length > 0;
        const digits = phoneInput.value.replace(/\D/g, '');
        const phoneOk = digits.length >= 11;
        const inOk = !!$('#bf-in', form).value;
        const long = APTS.find((a) => a.id === aptSel.value)?.type === 'long';
        const outOk = long || !!$('#bf-out', form).value;
        const guestsOk = !!$('#bf-guests', form)?.value;
        const consentOk = $('#bf-consent', form).checked;
        const allOk = aptOk && nameOk && phoneOk && inOk && outOk && consentOk;
        if (submitBtn) {
          submitBtn.disabled = !allOk;
        }

        // Динамическое исчезновение звёздочек обязательных полей при заполнении
        $('#bf-apt', form)?.closest('.field')?.classList.toggle('is-filled', aptOk);
        $('#bf-name', form)?.closest('.field')?.classList.toggle('is-filled', nameOk);
        $('#bf-phone', form)?.closest('.field')?.classList.toggle('is-filled', digits.length > 1);
        $('#bf-in', form)?.closest('.field')?.classList.toggle('is-filled', inOk);
        $('#bf-out', form)?.closest('.field')?.classList.toggle('is-filled', outOk);
        $('#bf-guests', form)?.closest('.field')?.classList.toggle('is-filled', guestsOk);
      };

      form.addEventListener('input', checkFormValid);
      form.addEventListener('change', checkFormValid);
      checkFormValid();

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        const phoneVal = phoneInput.value.trim();
        const digits = phoneVal.replace(/\D/g, '');
        if (digits.length < 11) {
          phoneInput.setCustomValidity('Пожалуйста, введите полный номер телефона: +7 (999) 158 99-00');
          phoneInput.reportValidity();
          setTimeout(() => phoneInput.setCustomValidity(''), 3000);
          return;
        }

        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';

        const a = APTS.find((x) => x.id === aptSel.value);
        const f = new FormData(form);
        const d = (v) => v ? new Date(v).toLocaleDateString('ru-RU') : '';
        const name = (f.get('name') || '').trim();
        const phone = phoneVal;
        const social = (f.get('social') || '').trim();
        const comment = (f.get('comment') || '').trim();
        const guests = f.get('guests');
        const inDate = d(f.get('in'));
        const outDate = d(f.get('out'));

        const textLines = [
          `🛎 Новая заявка на бронирование APART PRO!`,
          ``,
          `🏠 Квартира: ${a ? `${a.title} (${a.typeLabel.toLowerCase()})` : 'Не выбрана'}`,
          a && a.type === 'long' ? `📅 Желаемая дата заезда: ${inDate}` : `📅 Даты: ${inDate} — ${outDate}`,
          `👥 Гостей: ${guests}`,
          `👤 Имя: ${name}`,
          `📞 Телефон: ${phone}`,
          social ? `📱 Мессенджер / Контакт: ${social}` : '',
          comment ? `💬 Пожелания: ${comment}` : ''
        ].filter(Boolean);

        const messageText = textLines.join('\n');

        // Отправка ботом в Telegram
        if (S.telegramBot && S.telegramBot.token && S.telegramBot.chatId) {
          try {
            await fetch(`https://api.telegram.org/bot${S.telegramBot.token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: S.telegramBot.chatId,
                text: messageText
              })
            });
          } catch (err) {
            console.warn('Telegram bot notify error:', err);
          }
        }

        // Неблокирующее копирование
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(messageText).catch(() => {});
        }

        // Показываем экран подтверждения внутри модального окна (защита от спама)
        const dialog = $('.modal__dialog', m);
        dialog.innerHTML = `
          <button class="icon-btn modal__close" data-close aria-label="Закрыть">${I.close}</button>
          <div class="modal__success">
            <div class="modal__success-icon">✓</div>
            <h2>Заявка принята!</h2>
            <p>Персональный менеджер получил вашу заявку и свяжется с вами по номеру <b>${esc(phone)}</b> в ближайшее время.</p>
            <div style="margin-top:1.8rem; display:flex; flex-wrap:wrap; gap:.75rem; justify-content:center;">
              <button class="btn btn--primary" data-close id="modal-success-close">Понятно, спасибо</button>
              <a class="btn btn--ghost" href="${tgUrl(messageText)}" target="_blank" rel="noopener">Написать в Telegram</a>
            </div>
          </div>
        `;

        $$('[data-close]', dialog).forEach((b) => b.addEventListener('click', close));
        toast('Заявка успешно отправлена персональному менеджеру!');
      });
    };

    setupFormEvents();

    let lastFocus = null;
    const open = (id) => {
      lastFocus = document.activeElement;
      // Если ранее была показана плашка успеха, восстанавливаем форму
      if ($('.modal__success', m)) {
        m.innerHTML = renderFormHtml();
        setupFormEvents();
        $$('[data-close]', m).forEach((b) => b.addEventListener('click', close));
      }
      const aptSel = $('#bf-apt', m);
      if (aptSel) {
        aptSel.value = id || '';
      }
      const form = $('#booking-form', m);
      const long = APTS.find((a) => a.id === aptSel?.value)?.type === 'long';
      $('[data-out-field]', m).hidden = long;
      if ($('#bf-out', form)) $('#bf-out', form).required = !long;
      const inLabelText = $('[data-label-in] .label-text', m);
      if (inLabelText) inLabelText.textContent = long ? 'Желаемая дата заезда' : 'Заезд';
      form?.dispatchEvent(new Event('input'));

      m.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => aptSel && aptSel.focus(), 50);
    };

    const close = () => {
      m.classList.remove('is-open');
      document.body.style.overflow = '';
      lastFocus && lastFocus.focus();
    };

    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-book]');
      if (b) {
        e.preventDefault();
        open(b.dataset.book);
      }
    });

    $$('[data-close]', m).forEach((b) => b.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && m.classList.contains('is-open')) close();
    });
  }

  function bindContacts() {
    $$('[data-tel]').forEach((a) => {
      a.href = tel;
      if (!a.textContent.trim()) a.textContent = S.manager.phonePretty;
    });
    $$('[data-tg]').forEach((a) => {
      a.href = tgUrl();
      a.target = '_blank';
      a.rel = 'noopener';
    });
    $$('[data-max]').forEach((a) => {
      a.href = maxUrl();
      if (S.manager.max) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
    });
    $$('[data-legal]').forEach((el) => {
      el.innerHTML = pending(S.legal[el.dataset.legal], el.dataset.placeholder || 'уточняется');
    });
    // Инициализируем маску для всех телефонных полей на странице
    $$('input[type="tel"]').forEach(initPhoneMask);
  }

  /* ---------- Toast Notification ---------- */
  function toast(msg) {
    let t = $('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('is-visible'), 4500);
  }

  /* ---------- Cookie Notice ---------- */
  function renderCookie() {
    if (localStorage.getItem('cookie-ok')) return;
    const c = document.createElement('div');
    c.className = 'cookie';
    c.setAttribute('role', 'region');
    c.setAttribute('aria-label', 'Уведомление о cookie');
    c.innerHTML = `<span>Мы используем файлы cookie, чтобы сайт работал корректно. Подробнее — в <a href="privacy.html">политике обработки персональных данных</a>.</span><button class="btn btn--primary btn--sm" id="cookie-ok">Понятно</button>`;
    document.body.appendChild(c);
    requestAnimationFrame(() => setTimeout(() => c.classList.add('is-visible'), 600));
    $('#cookie-ok')?.addEventListener('click', () => {
      localStorage.setItem('cookie-ok', '1');
      c.classList.remove('is-visible');
      setTimeout(() => c.remove(), 600);
    });
  }

  /* ---------- Reveal on Scroll ---------- */
    /* ---------- Key Facts Scroll Animation: strictly on user scroll ---------- */
  function initKeyFactsScroll() {
    const card = $('#facts .key-facts__card');
    if (!card) return;
    card.classList.remove('is-in');
    const onScroll = () => {
      if (window.scrollY > 35) {
        card.classList.add('is-in');
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    if (window.scrollY > 35) {
      card.classList.add('is-in');
    }
  }

function initReveal() {
    const els = $$('.reveal:not(.key-facts__card)');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px 80px 0px' });

    els.forEach((e) => io.observe(e));
  }

  function renderFloatingWidgets() {
    const f = document.createElement('div');
    f.className = 'floating-widgets';
    f.innerHTML = `
      <!-- Desktop FAB (в правом нижнем углу: только иконки без цвета по наведению) -->
      <div class="fab-widget" id="fab-widget">
        <div class="fab-menu" id="fab-menu">
          <a class="fab-action fab-action--tg" href="${tgUrl()}" target="_blank" rel="noopener" aria-label="Telegram" title="Telegram">
            ${I.tg}
          </a>
          <a class="fab-action fab-action--max" href="${maxUrl()}" ${S.manager.max ? 'target="_blank" rel="noopener"' : ''} aria-label="MAX" title="MAX">
            ${I.max}
          </a>
        </div>
        <button class="fab-btn" id="fab-btn" aria-label="Связаться с персональным менеджером" aria-expanded="false">
          <span class="fab-btn__icon fab-btn__icon--chat">${I.chat}</span>
          <span class="fab-btn__icon fab-btn__icon--close">${I.close}</span>
        </button>
      </div>`;
    document.body.appendChild(f);

    const fab = $('#fab-widget');
    const fabBtn = $('#fab-btn');
    if (fab && fabBtn) {
      const toggleFab = (open) => {
        const isOpen = typeof open === 'boolean' ? open : !fab.classList.contains('is-open');
        fab.classList.toggle('is-open', isOpen);
        fabBtn.setAttribute('aria-expanded', isOpen);
      };
      fabBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFab(); });
      document.addEventListener('click', (e) => { if (!fab.contains(e.target)) toggleFab(false); });
    }
  }

  /* ---------- Preloader ---------- */
  function initPreloader() {
    let p = $('#preloader');
    if (!p) {
      p = document.createElement('div');
      p.id = 'preloader';
      p.className = 'preloader';
      p.setAttribute('aria-hidden', 'true');
      p.innerHTML = `
        <div class="preloader__brand">
          <img src="img/logos/logo-header.png" alt="APART PRO" class="preloader__img" width="240" height="72">
          <div class="preloader__sub">${S.brandRu} · ${S.city}</div>
        </div>
        <div class="preloader__bar"></div>`;
      document.body.prepend(p);
    }
    const dismiss = () => {
      if (!p || p.classList.contains('is-loaded')) return;
      p.classList.add('is-loaded');
      document.body.classList.add('is-ready');
      setTimeout(() => { if (p && p.parentNode) p.remove(); }, 650);
    };

    // Даём гостю 500мс увидеть логотип бренда и анимированную полосу, затем плавно растворяем
    if (document.readyState === 'complete') {
      setTimeout(dismiss, 500);
    } else {
      window.addEventListener('load', () => setTimeout(dismiss, 500));
      setTimeout(dismiss, 1200);
    }
  }

  /* ---------- Animated Minimalist Hero Canvas ---------- */
  function initHeroCanvas() {
    const canvas = $('#hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animId = null;
    let isVisible = true;
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      if (width === 0 || height === 0) return;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (prefersReducedMotion) render(0);
    };

    // Плавные архитектурные линии и контуры в цветах бренда
    const lines = [
      { color: 'rgba(173, 107, 60, 0.16)', width: 2, speed: 0.0006, phase: 0, amp: 48, freq: 0.0018, baseY: 0.42 },
      { color: 'rgba(35, 68, 44, 0.12)', width: 1.5, speed: 0.0004, phase: 2.4, amp: 36, freq: 0.0014, baseY: 0.58 },
      { color: 'rgba(35, 68, 44, 0.08)', width: 1.2, speed: 0.0005, phase: 1.2, amp: 28, freq: 0.0022, baseY: 0.35 },
      { color: 'rgba(173, 107, 60, 0.09)', width: 1.5, speed: 0.0003, phase: 4.1, amp: 40, freq: 0.0012, baseY: 0.68 }
    ];

    function render(time) {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        ctx.beginPath();
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width;
        ctx.lineCap = 'round';

        const step = 20;
        const base = height * line.baseY;
        const tOffset = time * line.speed + line.phase;

        ctx.moveTo(0, base + Math.sin(tOffset) * line.amp);
        for (let x = 0; x <= width + step; x += step) {
          const y = base +
            Math.sin(x * line.freq + tOffset) * line.amp +
            Math.cos(x * line.freq * 0.5 + tOffset * 0.7) * (line.amp * 0.35);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    let start = performance.now();
    function loop(now) {
      if (!isVisible) {
        animId = null;
        return;
      }
      render(now - start);
      animId = requestAnimationFrame(loop);
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && !animId && !prefersReducedMotion) {
            animId = requestAnimationFrame(loop);
          }
        });
      }, { threshold: 0.05 });
      io.observe(canvas);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();

    if (!prefersReducedMotion) {
      animId = requestAnimationFrame(loop);
    } else {
      render(0);
    }
  }

  /* ---------- Smart Background Asset & Page Prefetcher ---------- */
  function initPrefetcher() {
    const prefetched = new Set();
    const prefetchUrl = (url, asType = 'image') => {
      if (!url || prefetched.has(url)) return;
      prefetched.add(url);
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = asType;
      document.head.appendChild(link);
    };

    // Предзагрузка фото квартир в моменты простоя браузера
    const idlePreload = () => {
      APTS.forEach((apt) => {
        if (apt.photos > 0 && apt.slug) {
          prefetchUrl(`img/apartments/${apt.slug}/1.jpg`, 'image');
          prefetchUrl(`img/apartments/${apt.slug}/2.jpg`, 'image');
        }
      });
    };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(idlePreload, { timeout: 1800 });
    } else {
      setTimeout(idlePreload, 1200);
    }

    // Мгновенная предзагрузка страницы объекта при наведении мыши или начале касания
    const onIntent = (e) => {
      const link = e.target.closest('a[href$=".html"]');
      if (link && link.origin === window.location.origin) {
        prefetchUrl(link.getAttribute('href'), 'document');
      }
    };
    document.addEventListener('mouseover', onIntent, { passive: true });
    document.addEventListener('touchstart', onIntent, { passive: true });
  }

  initPreloader();
  initHeroCanvas();
  renderHeader();
  renderCatalog();
  renderReviews();
  renderApartment();
  renderFooter();
  renderModal();
  renderFloatingWidgets();
  bindContacts();
  renderCookie();
  initReveal();
  initKeyFactsScroll();
  initPrefetcher();
  applyDomTypography();
})();
