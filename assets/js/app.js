/* ==========================================================================
   Souls by Zamani — shared site logic
   Header, footer, cart, wishlist, currency, search and product cards.
   ========================================================================== */

(function () {
  const S = window.SITE;
  const CATS = window.CATEGORIES;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- storage (safe) ---------- */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("sbz_" + key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("sbz_" + key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
    }
  };

  /* ---------- products ---------- */
  const byId = id => window.PRODUCTS.find(p => p.id === id);
  const catOf = p => CATS[p.category] || {};
  const sizesOf = p => p.dept === "shoes" ? window.SIZES[p.gender] : ["One size"];
  const deptLabel = p => p.dept === "shoes" ? (p.gender === "men" ? "Men's Shoes" : "Women's Shoes") : p.dept === "bags" ? "Bags" : "Accessories";

  function describe(p) {
    const c = catOf(p);
    const base = {
      shoes: `Cut, lasted and stitched by hand in our Lagos workshop, the ${p.name} is our take on the classic ${c.label.toLowerCase().replace(/s$/, "")}. ${p.material} is shaped over a last built for all-day comfort, with a cushioned leather footbed that moulds to you with every wear.`,
      bags: `The ${p.name} is built panel by panel from ${p.material.toLowerCase()}, with hand-painted edges, reinforced stitching and solid brass hardware. Roomy enough for the everyday, and made to soften and deepen in colour over the years.`,
      accessories: `A small piece that finishes the look. The ${p.name} is cut from ${p.material.toLowerCase()} left over from our shoe and bag making, so nothing good goes to waste. Hand-finished edges, clean stitching.`
    };
    return base[p.dept];
  }

  /* ---------- currency ---------- */
  let currency = store.get("currency", "NGN");
  if (!S.currencies[currency]) currency = "NGN";
  function money(ngn) {
    const cur = S.currencies[currency];
    const v = ngn * cur.rate;
    const digits = currency === "NGN" ? 0 : 2;
    return cur.symbol + v.toLocaleString("en-NG", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  /* ---------- cart & wishlist ---------- */
  let cart = store.get("cart", []);
  let wish = store.get("wish", []);
  const lineKey = l => `${l.id}|${l.colour}|${l.size}`;

  const Cart = {
    items: () => cart.filter(l => byId(l.id)),
    count: () => Cart.items().reduce((n, l) => n + l.qty, 0),
    subtotal: () => Cart.items().reduce((n, l) => n + byId(l.id).price * l.qty, 0),
    add(id, colour, size, qty) {
      const line = { id, colour, size, qty: qty || 1 };
      const existing = cart.find(l => lineKey(l) === lineKey(line));
      if (existing) existing.qty = Math.min(10, existing.qty + line.qty);
      else cart.push(line);
      Cart.save();
      const p = byId(id);
      toast(`<strong>${esc(p.name)}</strong> added to your bag`, "View bag", () => openDrawer("cart"));
    },
    setQty(key, qty) {
      const l = cart.find(x => lineKey(x) === key);
      if (!l) return;
      if (qty <= 0) cart = cart.filter(x => x !== l);
      else l.qty = Math.min(10, qty);
      Cart.save();
    },
    remove(key) { cart = cart.filter(x => lineKey(x) !== key); Cart.save(); },
    clear() { cart = []; Cart.save(); },
    save() { store.set("cart", cart); updateBadges(); renderCartDrawer(); document.dispatchEvent(new CustomEvent("cart:change")); }
  };

  const Wish = {
    has: id => wish.includes(id),
    items: () => wish.map(byId).filter(Boolean),
    toggle(id) {
      if (wish.includes(id)) { wish = wish.filter(x => x !== id); toast("Removed from your wishlist"); }
      else { wish.push(id); toast("Saved to your wishlist", "View", () => location.href = "wishlist.html"); }
      store.set("wish", wish);
      updateBadges();
      $$(`[data-wish="${id}"]`).forEach(b => b.classList.toggle("is-on", Wish.has(id)));
      document.dispatchEvent(new CustomEvent("wish:change"));
    }
  };

  function freeShipLeft() { return Math.max(0, S.shipping.freeOver - Cart.subtotal()); }

  /* ---------- images ---------- */
  function media(p, colour, opts) {
    opts = opts || {};
    const idx = opts.index || 0;
    if (p.photos) {
      const c = p.photos[colour] ? colour : Object.keys(p.photos)[0];
      const view = opts.zoom ? 3 : idx + 1;
      return `<img src="assets/img/products/${p.photos[c]}/${c}-${view}.webp" alt="${esc(p.name)}, ${esc(window.COLOURS[c].name)}" loading="lazy">`;
    }
    if (p.images && p.images.length) {
      const src = p.images[Math.min(idx, p.images.length - 1)];
      return `<img src="${esc(src)}" alt="${esc(p.name)}" loading="lazy">`;
    }
    return window.ART.svg(p.art || catOf(p).art, colour || p.colours[0], { label: p.name, zoom: opts.zoom });
  }

  /* ---------- product card ---------- */
  function badgeHtml(p) {
    const out = [];
    if (p.compareAt) out.push(`<span class="badge badge--sale">Sale</span>`);
    if (p.badges.includes("new")) out.push(`<span class="badge">New</span>`);
    if (p.badges.includes("bestseller")) out.push(`<span class="badge badge--dark">Bestseller</span>`);
    if (p.badges.includes("handmade")) out.push(`<span class="badge badge--gold">Handmade</span>`);
    return out.slice(0, 2).join("");
  }

  function priceHtml(p) {
    return p.compareAt
      ? `<span class="price price--sale">${money(p.price)}</span> <s class="price-was">${money(p.compareAt)}</s>`
      : `<span class="price">${money(p.price)}</span>`;
  }

  function card(p) {
    const c = catOf(p);
    const sizes = sizesOf(p);
    const swatches = p.colours.map((k, i) =>
      `<button class="swatch${i === 0 ? " is-on" : ""}" style="--sw:${window.ART.colourHex(k)}" data-swatch="${k}" aria-label="${esc(window.COLOURS[k].name)}" title="${esc(window.COLOURS[k].name)}"></button>`).join("");
    return `
    <article class="card" data-id="${p.id}" data-colour="${p.colours[0]}">
      <div class="card__media">
        <a href="product.html?id=${p.id}" class="card__img" aria-label="${esc(p.name)}">${media(p)}</a>
        <div class="card__badges">${badgeHtml(p)}</div>
        <button class="card__wish${Wish.has(p.id) ? " is-on" : ""}" data-wish="${p.id}" aria-label="Save to wishlist">${ICON.heart}</button>
        <div class="card__quick">
          ${sizes.length > 1
            ? `<p>Quick add · EU size</p><div class="card__sizes">${sizes.map(s => `<button data-quick="${s}">${s}</button>`).join("")}</div>`
            : `<button class="btn btn--dark btn--block" data-quick="One size">Add to bag</button>`}
        </div>
      </div>
      <div class="card__body">
        <p class="card__cat">${esc(c.label)}</p>
        <h3 class="card__title"><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3>
        <p class="card__price">${priceHtml(p)}</p>
        <div class="card__swatches">${swatches}</div>
      </div>
    </article>`;
  }

  function bindCards(root) {
    root = root || document;
    $$(".card", root).forEach(el => {
      if (el.dataset.bound) return;
      el.dataset.bound = "1";
      const p = byId(el.dataset.id);
      el.addEventListener("click", e => {
        const sw = e.target.closest("[data-swatch]");
        if (sw) {
          e.preventDefault();
          el.dataset.colour = sw.dataset.swatch;
          $$(".swatch", el).forEach(s => s.classList.toggle("is-on", s === sw));
          if (p.photos || !p.images || !p.images.length) $(".card__img", el).innerHTML = media(p, sw.dataset.swatch);
          $(".card__img", el).href = `product.html?id=${p.id}&colour=${sw.dataset.swatch}`;
          return;
        }
        const q = e.target.closest("[data-quick]");
        if (q) { e.preventDefault(); Cart.add(p.id, el.dataset.colour, q.dataset.quick, 1); return; }
        const w = e.target.closest("[data-wish]");
        if (w) { e.preventDefault(); Wish.toggle(p.id); }
      });
    });
  }

  /* ---------- icons ---------- */
  const ICON = {
    search: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-9.3-9A5 5 0 0 1 12 5.5 5 5 0 0 1 21.3 11C19 15.6 12 20 12 20Z"/></svg>`,
    bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>`,
    menu: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18"/></svg>`,
    close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
    arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
    truck: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6h11v10H2zM13 10h4l4 4v2h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`,
    hand: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V5a1.5 1.5 0 0 1 3 0v5M10 10V3.5a1.5 1.5 0 0 1 3 0V10M13 10V4.5a1.5 1.5 0 0 1 3 0V11M16 11V7.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-2.7L3 13.5a1.6 1.6 0 0 1 2.5-2L7 13"/></svg>`,
    return: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>`,
    ruler: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/></svg>`,
    whatsapp: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 0 1-11.8 7L4 20l1-4.1A8 8 0 1 1 20 12Z"/><path d="M9 9c0 3 2.5 6 6 6l1-1.5-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2Z"/></svg>`,
    star: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>`
  };

  /* ---------- navigation data ---------- */
  function groupsFor(gender, dept) {
    const g = {};
    Object.entries(CATS).forEach(([key, c]) => {
      if (c.gender === gender && c.dept === dept) (g[c.group] = g[c.group] || []).push([key, c.label]);
    });
    return g;
  }
  const NAV = [
    { label: "Men", href: "shop.html?gender=men", groups: groupsFor("men", "shoes"), all: "Shop all men's shoes", feature: { title: "The Palm Edit", text: "Hand-stitched palm slippers, made for Friday and beyond.", href: "shop.html?cat=palm-slippers", art: ["palm", "burgundy"] } },
    { label: "Women", href: "shop.html?gender=women&dept=shoes", groups: groupsFor("women", "shoes"), all: "Shop all women's shoes", feature: { title: "Heels, reconsidered", text: "Cushioned, balanced heels you can actually dance in.", href: "shop.html?cat=pumps", art: ["pump", "red"] } },
    { label: "Bags", href: "shop.html?dept=bags", groups: groupsFor("women", "bags"), all: "Shop all bags", feature: { title: "The Zamani Tote", text: "Our signature. Vegetable-tanned and made to last decades.", href: "product.html?id=the-zamani-tote", art: ["tote", "cognac"] } },
    { label: "Accessories", href: "shop.html?dept=accessories", groups: groupsFor("women", "accessories"), all: "Shop all accessories", feature: { title: "Small leather goods", text: "Belts, wallets and charms, finished by hand.", href: "shop.html?dept=accessories", art: ["charm", "cognac"] } },
    { label: "Sale", href: "shop.html?filter=sale", cls: "nav__sale" },
    { label: "Bespoke", href: "bespoke.html" },
    { label: "Our Story", href: "about.html" }
  ];

  /* ---------- logo ---------- */
  const SOLE = "M30 3 C45 3 53 15 53 31 C53 43 48 51 45 58 C43 64 44 71 44 79 C44 90 38 97 30 97 C22 97 16 90 16 79 C16 71 17 64 15 58 C12 51 7 43 7 31 C7 15 15 3 30 3 Z";
  function logo(extra) {
    return `<span class="logo__emblem" aria-hidden="true"><svg viewBox="0 0 60 100">
        <path class="logo__sole" d="${SOLE}"/>
        <path class="logo__stitch" d="${SOLE}" transform="translate(4.2 7) scale(.86)"/>
        <path class="logo__stitch logo__heel" d="M19.5 71 C26 68.5 34 68.5 40.5 71"/>
        <text x="30" y="50" text-anchor="middle">S</text>
      </svg></span>
      <span class="logo__text"><span class="logo__mark">SOULS</span><span class="logo__sub">by Zamani</span></span>`;
  }

  /* ---------- header ---------- */
  function renderHeader() {
    const host = $("#site-header");
    if (!host) return;
    const currencyOpts = Object.entries(S.currencies).map(([k, v]) => `<option value="${k}"${k === currency ? " selected" : ""}>${v.label}</option>`).join("");
    host.innerHTML = `
      <div class="announce" role="region" aria-label="Announcements">
        <div class="announce__track">
          <span>Free delivery in Nigeria on orders over ${money(S.shipping.freeOver)}</span>
          <span>Handmade in Lagos, one pair at a time</span>
          <span>Bespoke &amp; made-to-measure orders now open</span>
          <span>Free returns and exchanges within 14 days</span>
        </div>
      </div>
      <header class="header">
        <div class="header__inner container">
          <button class="icon-btn header__burger" data-open="menu" aria-label="Open menu">${ICON.menu}</button>
          <nav class="nav" aria-label="Main">
            <ul class="nav__list">
              ${NAV.map((n, i) => `
                <li class="nav__item${n.groups ? " has-mega" : ""}">
                  <a href="${n.href}" class="nav__link ${n.cls || ""}">${n.label}</a>
                  ${n.groups ? `
                  <div class="mega">
                    <div class="mega__inner container">
                      <div class="mega__cols">
                        ${Object.entries(n.groups).map(([g, items]) => `
                          <div class="mega__col">
                            <h4>${g}</h4>
                            <ul>${items.map(([k, l]) => `<li><a href="shop.html?cat=${k}">${l}</a></li>`).join("")}</ul>
                          </div>`).join("")}
                        <div class="mega__col">
                          <h4>Discover</h4>
                          <ul>
                            <li><a href="${n.href}${n.href.includes("?") ? "&" : "?"}filter=new">New arrivals</a></li>
                            <li><a href="${n.href}${n.href.includes("?") ? "&" : "?"}filter=bestseller">Bestsellers</a></li>
                            <li><a href="${n.href}${n.href.includes("?") ? "&" : "?"}filter=handmade">Artisan specials</a></li>
                            <li><a href="${n.href}" class="mega__all">${n.all} ${ICON.arrow}</a></li>
                          </ul>
                        </div>
                      </div>
                      <a class="mega__feature" href="${n.feature.href}">
                        <div class="mega__art">${window.ART.svg(n.feature.art[0], n.feature.art[1])}</div>
                        <strong>${n.feature.title}</strong>
                        <span>${n.feature.text}</span>
                      </a>
                    </div>
                  </div>` : ""}
                </li>`).join("")}
            </ul>
          </nav>
          <a href="index.html" class="logo" aria-label="${esc(S.name)} home">${logo()}</a>
          <div class="header__tools">
            <label class="currency">
              <span class="sr-only">Currency</span>
              <select id="currency-select">${currencyOpts}</select>
            </label>
            <button class="icon-btn" data-open="search" aria-label="Search">${ICON.search}</button>
            <a class="icon-btn" href="wishlist.html" aria-label="Wishlist">${ICON.heart}<span class="count" data-count="wish"></span></a>
            <button class="icon-btn" data-open="cart" aria-label="Shopping bag">${ICON.bag}<span class="count" data-count="cart"></span></button>
          </div>
        </div>
      </header>

      <div class="overlay" data-close></div>

      <aside class="drawer drawer--left" id="drawer-menu" aria-label="Menu">
        <div class="drawer__head">
          <span class="logo logo--sm">${logo()}</span>
          <button class="icon-btn" data-close aria-label="Close">${ICON.close}</button>
        </div>
        <div class="drawer__body">
          ${NAV.map(n => n.groups ? `
            <details class="m-nav">
              <summary>${n.label}</summary>
              <a href="${n.href}" class="m-nav__all">${n.all}</a>
              ${Object.entries(n.groups).map(([g, items]) => `
                <p class="m-nav__group">${g}</p>
                ${items.map(([k, l]) => `<a href="shop.html?cat=${k}">${l}</a>`).join("")}`).join("")}
            </details>` : `<a class="m-nav__link ${n.cls || ""}" href="${n.href}">${n.label}</a>`).join("")}
          <a class="m-nav__link" href="wishlist.html">Wishlist</a>
          <a class="m-nav__link" href="help.html">Help &amp; FAQs</a>
          <a class="m-nav__link" href="contact.html">Contact</a>
          <label class="m-currency">Currency
            <select id="currency-select-m">${currencyOpts}</select>
          </label>
        </div>
      </aside>

      <aside class="drawer drawer--right" id="drawer-cart" aria-label="Shopping bag">
        <div class="drawer__head">
          <h3>Your bag <span data-count="cart-text"></span></h3>
          <button class="icon-btn" data-close aria-label="Close">${ICON.close}</button>
        </div>
        <div class="drawer__body" id="cart-drawer-body"></div>
        <div class="drawer__foot" id="cart-drawer-foot"></div>
      </aside>

      <div class="search" id="drawer-search" role="dialog" aria-label="Search">
        <div class="container">
          <form class="search__form" action="shop.html">
            ${ICON.search}
            <input type="search" name="q" id="search-input" placeholder="Search oxfords, palm slippers, totes…" autocomplete="off">
            <button type="button" class="icon-btn" data-close aria-label="Close search">${ICON.close}</button>
          </form>
          <div class="search__results" id="search-results"></div>
        </div>
      </div>
      <div class="toast" id="toast" role="status" aria-live="polite"></div>
    `;

    // Highlight the current section
    const params = new URLSearchParams(location.search);
    $$(".nav__link").forEach(a => {
      const u = new URL(a.href, location.href);
      if (u.pathname === location.pathname && [...u.searchParams].every(([k, v]) => params.get(k) === v) && location.pathname.endsWith("shop.html") === u.pathname.endsWith("shop.html")) {
        if (u.search || !location.pathname.endsWith("shop.html")) a.classList.add("is-active");
      }
    });

    $$("#currency-select, #currency-select-m").forEach(sel => sel.addEventListener("change", e => {
      store.set("currency", e.target.value);
      location.reload();
    }));

    document.addEventListener("click", e => {
      const o = e.target.closest("[data-open]");
      if (o) { e.preventDefault(); openDrawer(o.dataset.open); return; }
      if (e.target.closest("[data-close]")) closeDrawers();
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawers(); });

    // Sticky header shadow
    const hdr = $(".header");
    const onScroll = () => hdr.classList.toggle("is-scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    initSearch();
    renderCartDrawer();
    updateBadges();
  }

  function openDrawer(name) {
    closeDrawers(true);
    const el = $(`#drawer-${name}`);
    if (!el) return;
    el.classList.add("is-open");
    document.body.classList.add("is-locked");
    if (name !== "search") $(".overlay").classList.add("is-open");
    if (name === "search") setTimeout(() => $("#search-input").focus(), 50);
  }
  function closeDrawers(silent) {
    $$(".drawer.is-open, .search.is-open, .overlay.is-open").forEach(el => el.classList.remove("is-open"));
    if (!silent) document.body.classList.remove("is-locked");
  }

  /* ---------- search ---------- */
  function searchProducts(q) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return window.PRODUCTS.filter(p => {
      const hay = [p.name, catOf(p).label, catOf(p).group, p.gender === "men" ? "men mens man" : "women womens woman ladies", p.dept, p.material, ...p.colours].join(" ").toLowerCase();
      return terms.every(t => hay.includes(t) || hay.includes(t.replace(/s$/, "")));
    });
  }
  function initSearch() {
    const input = $("#search-input");
    const out = $("#search-results");
    const popular = ["Palm slippers", "Oxfords", "Chelsea boots", "Pumps", "Tote bags", "Loafers", "Sneakers", "Clutches"];
    const renderEmpty = () => {
      out.innerHTML = `<p class="search__label">Popular searches</p><div class="chips">${popular.map(t => `<a class="chip" href="shop.html?q=${encodeURIComponent(t)}">${t}</a>`).join("")}</div>`;
    };
    renderEmpty();
    input.addEventListener("input", () => {
      const q = input.value.trim();
      if (!q) return renderEmpty();
      const res = searchProducts(q);
      out.innerHTML = res.length
        ? `<p class="search__label">${res.length} result${res.length === 1 ? "" : "s"}</p>
           <div class="search__grid">${res.slice(0, 8).map(p => `
             <a class="search__item" href="product.html?id=${p.id}">
               <span class="search__thumb">${media(p)}</span>
               <span><strong>${esc(p.name)}</strong><small>${esc(catOf(p).label)} · ${money(p.price)}</small></span>
             </a>`).join("")}</div>
           ${res.length > 8 ? `<a class="btn btn--line" href="shop.html?q=${encodeURIComponent(q)}">See all ${res.length} results</a>` : ""}`
        : `<p class="search__label">No results for “${esc(q)}”. Try “boots”, “heels” or “bag”.</p>`;
    });
  }

  /* ---------- cart drawer ---------- */
  function lineHtml(l, compact) {
    const p = byId(l.id);
    const key = lineKey(l);
    return `
      <div class="line" data-key="${esc(key)}">
        <a class="line__img" href="product.html?id=${p.id}&colour=${l.colour}">${media(p, l.colour)}</a>
        <div class="line__info">
          <a href="product.html?id=${p.id}&colour=${l.colour}" class="line__name">${esc(p.name)}</a>
          <p class="line__meta">${esc(window.COLOURS[l.colour].name)}${l.size !== "One size" ? ` · EU ${esc(l.size)}` : ""}</p>
          <div class="line__row">
            <div class="qty">
              <button data-qty="-1" aria-label="Decrease quantity">−</button>
              <span>${l.qty}</span>
              <button data-qty="1" aria-label="Increase quantity">+</button>
            </div>
            <button class="line__remove" data-remove>Remove</button>
          </div>
        </div>
        <p class="line__price">${money(p.price * l.qty)}</p>
      </div>`;
  }

  function shipBar() {
    const left = freeShipLeft();
    const pct = Math.min(100, (Cart.subtotal() / S.shipping.freeOver) * 100);
    return `<div class="shipbar">
      <p>${left > 0 ? `You're <strong>${money(left)}</strong> away from free delivery in Nigeria` : `You've unlocked <strong>free delivery</strong> in Nigeria`}</p>
      <div class="shipbar__track"><span style="width:${pct}%"></span></div>
    </div>`;
  }

  function renderCartDrawer() {
    const body = $("#cart-drawer-body");
    const foot = $("#cart-drawer-foot");
    if (!body) return;
    const items = Cart.items();
    if (!items.length) {
      body.innerHTML = `<div class="empty">
        <div class="empty__icon">${ICON.bag}</div>
        <p>Your bag is empty.</p>
        <a href="shop.html?gender=men" class="btn btn--dark">Shop men</a>
        <a href="shop.html?gender=women" class="btn btn--line">Shop women</a>
      </div>`;
      foot.innerHTML = "";
      return;
    }
    body.innerHTML = shipBar() + items.map(l => lineHtml(l)).join("");
    foot.innerHTML = `
      <div class="sum-row"><span>Subtotal</span><strong>${money(Cart.subtotal())}</strong></div>
      <p class="muted small">Delivery and discounts are worked out at checkout.</p>
      <a href="checkout.html" class="btn btn--dark btn--block">Checkout</a>
      <a href="cart.html" class="btn btn--line btn--block">View bag</a>`;
    bindLines(body);
  }

  function bindLines(root) {
    $$(".line", root).forEach(el => {
      const key = el.dataset.key;
      el.addEventListener("click", e => {
        const q = e.target.closest("[data-qty]");
        if (q) {
          const l = cart.find(x => lineKey(x) === key);
          Cart.setQty(key, l.qty + Number(q.dataset.qty));
        }
        if (e.target.closest("[data-remove]")) Cart.remove(key);
      });
    });
  }

  function updateBadges() {
    const c = Cart.count(), w = wish.length;
    $$('[data-count="cart"]').forEach(el => { el.textContent = c; el.hidden = !c; });
    $$('[data-count="wish"]').forEach(el => { el.textContent = w; el.hidden = !w; });
    $$('[data-count="cart-text"]').forEach(el => { el.textContent = c ? `(${c})` : ""; });
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(html, actionLabel, action) {
    const t = $("#toast");
    if (!t) return;
    t.innerHTML = `<span>${html}</span>${actionLabel ? `<button>${actionLabel}</button>` : ""}`;
    if (actionLabel) $("button", t).onclick = () => { t.classList.remove("is-on"); action(); };
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-on"), 3800);
  }

  /* ---------- footer ---------- */
  function renderFooter() {
    const host = $("#site-footer");
    if (!host) return;
    host.innerHTML = `
      <section class="perks">
        <div class="container perks__grid">
          <div class="perk">${ICON.hand}<div><strong>Handmade in Lagos</strong><span>Every pair cut &amp; stitched by hand</span></div></div>
          <div class="perk">${ICON.truck}<div><strong>Nationwide &amp; worldwide</strong><span>Free in Nigeria over ${money(S.shipping.freeOver)}</span></div></div>
          <div class="perk">${ICON.return}<div><strong>14-day returns</strong><span>Easy exchanges on size</span></div></div>
          <div class="perk">${ICON.shield}<div><strong>12-month guarantee</strong><span>On stitching &amp; soles</span></div></div>
        </div>
      </section>
      <footer class="footer">
        <div class="container">
          <div class="footer__top">
            <div class="footer__brand">
              <a href="index.html" class="logo logo--light" aria-label="${esc(S.name)} home">${logo()}</a>
              <p>Handcrafted shoes for men and women, and bags &amp; leather accessories for women. Made slowly, by hand, to be worn for years.</p>
              <form class="newsletter" data-newsletter>
                <label for="nl-email">Join the Souls circle: first look at new drops, plus 10% off your first order.</label>
                <div class="newsletter__row">
                  <input id="nl-email" type="email" required placeholder="Your email address">
                  <button class="btn btn--gold" type="submit">Subscribe</button>
                </div>
              </form>
            </div>
            <div class="footer__col">
              <h4>Shop</h4>
              <a href="shop.html?gender=men">Men's shoes</a>
              <a href="shop.html?gender=women&dept=shoes">Women's shoes</a>
              <a href="shop.html?dept=bags">Bags</a>
              <a href="shop.html?dept=accessories">Accessories</a>
              <a href="shop.html?filter=new">New arrivals</a>
              <a href="shop.html?filter=sale">Sale</a>
            </div>
            <div class="footer__col">
              <h4>Help</h4>
              <a href="help.html#shipping">Delivery</a>
              <a href="help.html#returns">Returns &amp; exchanges</a>
              <a href="help.html#sizes">Size guide</a>
              <a href="help.html#care">Leather care</a>
              <a href="help.html#faq">FAQs</a>
              <a href="contact.html">Contact us</a>
            </div>
            <div class="footer__col">
              <h4>Souls</h4>
              <a href="about.html">Our story</a>
              <a href="bespoke.html">Bespoke &amp; custom</a>
              <a href="about.html#workshop">The workshop</a>
              <a href="contact.html">Wholesale</a>
            </div>
            <div class="footer__col">
              <h4>Visit</h4>
              <p>${esc(S.address)}<br>${esc(S.hours)}</p>
              <p><a href="mailto:${S.email}">${esc(S.email)}</a><br><a href="tel:${S.phone.replace(/\s/g, "")}">${esc(S.phone)}</a></p>
              <a class="wa-link" href="https://wa.me/${S.whatsapp}" target="_blank" rel="noopener">${ICON.whatsapp} Chat on WhatsApp</a>
            </div>
          </div>
          <div class="footer__bottom">
            <p>© ${new Date().getFullYear()} ${esc(S.name)}. All rights reserved.</p>
            <div class="social">
              <a href="${S.social.instagram}" target="_blank" rel="noopener">Instagram</a>
              <a href="${S.social.tiktok}" target="_blank" rel="noopener">TikTok</a>
              <a href="${S.social.facebook}" target="_blank" rel="noopener">Facebook</a>
              <a href="${S.social.x}" target="_blank" rel="noopener">X</a>
            </div>
            <p class="pay">We accept: Card · Bank transfer · USSD · Pay on delivery (Lagos)</p>
          </div>
        </div>
      </footer>
      <a class="wa-float" href="https://wa.me/${S.whatsapp}" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">${ICON.whatsapp}</a>`;

    $$("[data-newsletter]").forEach(f => f.addEventListener("submit", e => {
      e.preventDefault();
      const email = $("input", f).value;
      const list = store.get("newsletter", []);
      if (!list.includes(email)) list.push(email);
      store.set("newsletter", list);
      f.innerHTML = `<p class="newsletter__done">Welcome to the circle. Use code <strong>WELCOME10</strong> for 10% off your first order.</p>`;
    }));
  }

  /* ---------- scroll reveal ---------- */
  function initReveal() {
    const els = $$(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("is-in")); return; }
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -40px 0px" });
    els.forEach(e => io.observe(e));
  }

  /* ---------- size chart ---------- */
  const SIZE_CHART = {
    men: [["39", "6", "7", "24.6"], ["40", "6.5", "7.5", "25.0"], ["41", "7.5", "8.5", "25.9"], ["42", "8", "9", "26.3"], ["43", "9", "10", "27.1"], ["44", "9.5", "10.5", "27.5"], ["45", "10.5", "11.5", "28.4"], ["46", "11", "12", "28.8"], ["47", "12", "13", "29.6"]],
    women: [["35", "2.5", "5", "22.0"], ["36", "3.5", "6", "22.9"], ["37", "4", "6.5", "23.3"], ["38", "5", "7.5", "24.2"], ["39", "6", "8.5", "25.0"], ["40", "6.5", "9", "25.4"], ["41", "7.5", "10", "26.3"], ["42", "8", "10.5", "26.7"]]
  };
  function sizeTable(gender) {
    return `<div class="table-wrap"><table class="table">
      <thead><tr><th>EU</th><th>UK</th><th>US</th><th>Foot length (cm)</th></tr></thead>
      <tbody>${SIZE_CHART[gender].map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></div>`;
  }

  /* ---------- cascading gallery ---------- */
  function gallery(host, limit) {
    const items = (window.GALLERY || []).slice(0, limit || 99);
    const tile = (g, i) => {
      const [art, colour] = (g.art || "oxford:cognac").split(":");
      const fallback = `<div class="cascade__art">${window.ART.svg(art, colour)}</div>`;
      return `<figure class="cascade__item cascade__item--${g.shape || "square"}" data-g="${i}" tabindex="0">
        ${g.src ? `<img src="${esc(g.src)}" alt="${esc(g.caption)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'cascade__art',innerHTML:window.ART.svg('${art}','${colour}')}))">` : fallback}
        <figcaption>${esc(g.caption)}</figcaption>
      </figure>`;
    };
    host.innerHTML = `<div class="cascade">${items.map(tile).join("")}</div>`;
    const open = i => {
      const g = items[i];
      let lb = $("#lightbox");
      if (!lb) {
        document.body.insertAdjacentHTML("beforeend", `<div class="lightbox" id="lightbox" role="dialog" aria-modal="true"><button class="icon-btn lightbox__close" aria-label="Close">${ICON.close}</button><figure></figure></div>`);
        lb = $("#lightbox");
        lb.addEventListener("click", e => { if (!e.target.closest("img, a")) lb.classList.remove("is-open"); });
        document.addEventListener("keydown", e => { if (e.key === "Escape") lb.classList.remove("is-open"); });
      }
      const [art, colour] = (g.art || "oxford:cognac").split(":");
      $("figure", lb).innerHTML = (g.src ? `<img src="${esc(g.src)}" alt="${esc(g.caption)}">` : `<div class="cascade__art">${window.ART.svg(art, colour)}</div>`) +
        `<figcaption>${esc(g.caption)}${g.credit ? ` <span>Photo: ${g.creditUrl ? `<a href="${esc(g.creditUrl)}" target="_blank" rel="noopener">${esc(g.credit)}</a>` : esc(g.credit)}</span>` : ""}</figcaption>`;
      lb.classList.add("is-open");
    };
    $$(".cascade__item", host).forEach(el => {
      el.addEventListener("click", () => open(Number(el.dataset.g)));
      el.addEventListener("keydown", e => { if (e.key === "Enter") open(Number(el.dataset.g)); });
    });
  }

  /* ---------- public API ---------- */
  window.SBZ = {
    $, $$, esc, store, byId, catOf, sizesOf, deptLabel, describe, money, media, card, bindCards,
    priceHtml, badgeHtml, lineHtml, bindLines, shipBar, lineKey, searchProducts,
    Cart, Wish, ICON, logo, toast, openDrawer, initReveal, freeShipLeft, sizeTable, gallery,
    get currency() { return currency; }
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
    renderFooter();
    initReveal();
  });
})();
