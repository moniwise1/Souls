/* Home page */
document.addEventListener("sbz:ready", () => {
  const { $, $$, card, bindCards, ICON, initReveal } = window.SBZ;
  const P = window.PRODUCTS;
  const CATS = window.CATEGORIES;

  $("#stat-styles").textContent = P.length + "+";
  $("#stat-cats").textContent = Object.keys(CATS).length;

  const ph = (dir, c) => `assets/img/catalog/${dir}/${c}.webp`;

  // Hero: "Shop the look". Model photos with tappable dots on each item.
  const LOOKS = window.LOOKS || [];
  const art = $(".hero__art");
  if (LOOKS.length && art) {
    const { money, media, esc } = window.SBZ;
    art.className = "looks";
    art.removeAttribute("aria-hidden");
    art.innerHTML = `
      <div class="looks__stage">
        ${LOOKS.map((l, i) => `<figure class="look${i === 0 ? " is-on" : ""}" data-look="${i}">
          <img src="${l.img}" alt="${esc(l.title)}: ${esc(l.caption)}"${i ? ' loading="lazy"' : ""}>
          ${l.spots.map((s, j) => `<button class="spot" style="left:${s.x}%;top:${s.y}%" data-spot="${j}" aria-label="Shop ${esc(s.label)}"><span>${esc(s.label)}</span></button>`).join("")}
        </figure>`).join("")}
        <aside class="look-panel" aria-live="polite"></aside>
      </div>
      <div class="looks__bar">
        <div><strong id="look-title"></strong><span id="look-cap"></span></div>
        <div class="looks__nav">
          <button data-step="-1" aria-label="Previous look">‹</button>
          ${LOOKS.map((_, i) => `<button class="looks__dot${i === 0 ? " is-on" : ""}" data-go="${i}" aria-label="Look ${i + 1}"></button>`).join("")}
          <button data-step="1" aria-label="Next look">›</button>
        </div>
      </div>`;
    let cur = 0, timer;
    const panel = $(".look-panel", art);
    const show = i => {
      cur = (i + LOOKS.length) % LOOKS.length;
      $$(".look", art).forEach((f, k) => f.classList.toggle("is-on", k === cur));
      $$(".looks__dot", art).forEach((d, k) => d.classList.toggle("is-on", k === cur));
      $("#look-title").textContent = LOOKS[cur].title;
      $("#look-cap").textContent = LOOKS[cur].caption;
      closePanel();
    };
    const auto = () => { clearInterval(timer); timer = setInterval(() => show(cur + 1), 6000); };
    const openPanel = spots => {
      clearInterval(timer);
      panel.innerHTML = `<button class="look-panel__close" aria-label="Close">×</button>
        <span class="eyebrow">Shop the look</span><h3>${esc(LOOKS[cur].title)}</h3>
        ${spots.map(s => {
          const items = P.filter(p => p.category === s.cat).slice(0, spots.length > 1 ? 2 : 4);
          const cat = CATS[s.cat] || { label: s.label };
          return `<div class="look-panel__group"><p>${esc(s.label)}</p>
            ${items.map(p => { const c = ["cognac", "tan", "camel", "chocolate"].find(k => p.colours.includes(k)) || p.colours[0]; return `<a class="look-item" href="product.html?id=${p.id}&colour=${c}"><span class="look-item__img">${media(p, c)}</span><span><b>${esc(p.name)}</b><small>${money(p.price)} · ${p.colours.length} colour${p.colours.length === 1 ? "" : "s"}</small></span></a>`; }).join("")}
            <a class="link" href="shop.html?cat=${s.cat}">All ${esc(cat.label)} ${ICON.arrow}</a></div>`;
        }).join("")}`;
      panel.classList.add("is-open");
      $(".look-panel__close", panel).onclick = e => { e.stopPropagation(); closePanel(); auto(); };
    };
    function closePanel() { panel.classList.remove("is-open"); }
    art.addEventListener("click", e => {
      const spot = e.target.closest("[data-spot]");
      if (spot) { e.stopPropagation(); return openPanel([LOOKS[cur].spots[Number(spot.dataset.spot)]]); }
      if (e.target.closest("[data-step]")) return (show(cur + Number(e.target.closest("[data-step]").dataset.step)), auto());
      if (e.target.closest("[data-go]")) return (show(Number(e.target.closest("[data-go]").dataset.go)), auto());
      if (e.target.closest(".look") && !panel.classList.contains("is-open")) openPanel(LOOKS[cur].spots);
    });
    show(0); auto();
  }

  // Department tiles
  const tiles = [
    { title: "Men's Shoes", href: "shop.html?gender=men", photo: ph("oxfords", "cognac"), n: P.filter(p => p.gender === "men").length },
    { title: "Women's Shoes", href: "shop.html?gender=women&dept=shoes", photo: ph("pumps", "nude"), n: P.filter(p => p.gender === "women" && p.dept === "shoes").length },
    { title: "Bags", href: "shop.html?dept=bags", photo: ph("handbags", "burgundy"), n: P.filter(p => p.dept === "bags").length },
    { title: "Accessories", href: "shop.html?dept=accessories", photo: ph("belts", "tan"), n: P.filter(p => p.dept === "accessories").length }
  ];
  $("#tiles").innerHTML = tiles.map(t => `
    <a class="tile" href="${t.href}">
      <div class="tile__art">${t.photo ? `<img src="${t.photo}" alt="">` : window.ART.svg(t.art[0], t.art[1])}</div>
      <h3>${t.title}</h3>
      <span>${t.n} styles ${ICON.arrow}</span>
    </a>`).join("");

  // Style scroller
  function renderStyles(tab) {
    const list = Object.entries(CATS).filter(([, c]) =>
      tab === "men" ? c.gender === "men" : tab === "women" ? c.gender === "women" && c.dept === "shoes" : c.dept !== "shoes");
    $("#style-scroller").innerHTML = list.map(([k, c]) => {
      const sample = P.find(p => p.category === k && (p.gallery || p.photos)) || P.find(p => p.category === k);
      return `<a class="mini-cat" href="shop.html?cat=${k}">
        <div class="mini-cat__art">${sample && (sample.gallery || sample.photos) ? window.SBZ.media(sample) : window.ART.svg(sample && sample.art || c.art, sample ? sample.colours[0] : "cognac")}</div>
        <span>${c.label}</span>
      </a>`;
    }).join("");
  }
  renderStyles("men");
  $$("#style-tabs .tab").forEach(t => t.addEventListener("click", () => {
    $$("#style-tabs .tab").forEach(x => x.classList.toggle("is-on", x === t));
    renderStyles(t.dataset.tab);
  }));

  // The edit
  function renderEdit(kind) {
    let list;
    if (kind === "new") list = P.filter(p => p.badges.includes("new")).sort((a, b) => b.added - a.added);
    else if (kind === "sale") list = P.filter(p => p.compareAt);
    else list = P.filter(p => p.badges.includes(kind));
    // Mix men and women so both are always represented
    const men = list.filter(p => p.gender === "men"), women = list.filter(p => p.gender === "women");
    const mixed = [];
    while (mixed.length < 8 && (men.length || women.length)) {
      if (women.length) mixed.push(women.shift());
      if (men.length && mixed.length < 8) mixed.push(men.shift());
    }
    $("#edit-grid").innerHTML = mixed.map(card).join("");
    bindCards($("#edit-grid"));
  }
  renderEdit("new");
  $$("#edit-tabs .tab").forEach(t => t.addEventListener("click", () => {
    $$("#edit-tabs .tab").forEach(x => x.classList.toggle("is-on", x === t));
    renderEdit(t.dataset.edit);
  }));

  $("#promo-a").innerHTML = `<img src="${ph("palm-slippers", "black")}" alt="">`;
  $("#promo-b").innerHTML = `<img src="${ph("clutches", "gold")}" alt="">`;
  $("#story-art").insertAdjacentHTML("afterbegin", `<img src="${ph("brogues", "oxblood")}" alt="">`);

  window.SBZ.gallery($("#home-gallery"), 6);

  initReveal();
});
