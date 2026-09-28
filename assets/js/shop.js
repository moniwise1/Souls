/* Shop / listing page */
document.addEventListener("sbz:ready", () => {
  const { $, $$, esc, card, bindCards, money, searchProducts, initReveal } = window.SBZ;
  const P = window.PRODUCTS;
  const CATS = window.CATEGORIES;
  const PAGE = 24;

  const FLAGS = { new: "New arrivals", sale: "Sale", bestseller: "Bestsellers", handmade: "Artisan specials" };
  const SCOPES = [
    { label: "Everything", q: {} },
    { label: "Men's shoes", q: { gender: "men" } },
    { label: "Women's shoes", q: { gender: "women", dept: "shoes" } },
    { label: "Bags", q: { dept: "bags" } },
    { label: "Accessories", q: { dept: "accessories" } }
  ];

  // ---- state from URL ----
  const url = new URLSearchParams(location.search);
  const list = k => (url.get(k) || "").split(",").filter(Boolean);
  const state = {
    gender: url.get("gender") || "",
    dept: url.get("dept") || "",
    cats: list("cat"),
    q: url.get("q") || "",
    flags: list("filter"),
    sizes: list("size"),
    colours: list("colour"),
    min: url.get("min") || "",
    max: url.get("max") || "",
    sort: url.get("sort") || "featured",
    shown: PAGE
  };
  // A single category implies its gender & department
  if (state.cats.length === 1 && CATS[state.cats[0]]) {
    const c = CATS[state.cats[0]];
    state.gender = state.gender || c.gender;
    state.dept = state.dept || c.dept;
  }

  function writeURL() {
    const u = new URLSearchParams();
    if (state.gender) u.set("gender", state.gender);
    if (state.dept) u.set("dept", state.dept);
    if (state.cats.length) u.set("cat", state.cats.join(","));
    if (state.q) u.set("q", state.q);
    if (state.flags.length) u.set("filter", state.flags.join(","));
    if (state.sizes.length) u.set("size", state.sizes.join(","));
    if (state.colours.length) u.set("colour", state.colours.join(","));
    if (state.min) u.set("min", state.min);
    if (state.max) u.set("max", state.max);
    if (state.sort !== "featured") u.set("sort", state.sort);
    const qs = u.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
  }

  // ---- filtering ----
  const inScope = p => (!state.gender || p.gender === state.gender) && (!state.dept || p.dept === state.dept);
  function scopeProducts() {
    let base = state.q ? searchProducts(state.q) : P.slice();
    return base.filter(inScope);
  }
  function applyFilters(base, skip) {
    return base.filter(p =>
      (skip === "cats" || !state.cats.length || state.cats.includes(p.category)) &&
      (!state.flags.length || state.flags.every(f => f === "sale" ? p.compareAt : p.badges.includes(f))) &&
      (skip === "sizes" || !state.sizes.length || p.dept !== "shoes" || state.sizes.some(s => window.SIZES[p.gender].includes(s))) &&
      (skip === "colours" || !state.colours.length || state.colours.some(c => p.colours.includes(c))) &&
      (!state.min || p.price >= Number(state.min)) &&
      (!state.max || p.price <= Number(state.max))
    );
  }
  function sortList(arr) {
    const a = arr.slice();
    const featuredScore = p => (p.badges.includes("bestseller") ? 3 : 0) + (p.badges.includes("new") ? 2 : 0) + (p.compareAt ? 1 : 0);
    switch (state.sort) {
      case "new": return a.sort((x, y) => y.added - x.added);
      case "price-asc": return a.sort((x, y) => x.price - y.price);
      case "price-desc": return a.sort((x, y) => y.price - x.price);
      case "name": return a.sort((x, y) => x.name.localeCompare(y.name));
      default: return a.sort((x, y) => featuredScore(y) - featuredScore(x) || x.added - y.added);
    }
  }

  // ---- heading ----
  function renderHead() {
    let title = "Shop all", sub = "Handmade shoes for men and women, and bags and leather accessories for women.";
    const crumbs = [`<a href="index.html">Home</a>`, `<span><a href="shop.html">Shop</a></span>`];
    if (state.gender === "men") { title = "Men's Shoes"; sub = "Oxfords to palm slippers: formal, casual and everything in between, all made by hand."; }
    if (state.gender === "women" && state.dept === "shoes") { title = "Women's Shoes"; sub = "Heels you can dance in, flats you'll live in, boots and sneakers built to last."; }
    else if (state.gender === "women" && !state.dept) { title = "Women"; sub = "Shoes, bags and leather accessories, all made by hand."; }
    if (state.dept === "bags") { title = "Bags"; sub = "Totes, top-handles, crossbodies and clutches in hand-picked leather."; }
    if (state.dept === "accessories") { title = "Accessories"; sub = "Belts, wallets, card holders and charms, finished by hand."; }
    if (title !== "Shop all") crumbs.push(`<span>${title}</span>`);
    if (state.cats.length === 1 && CATS[state.cats[0]]) {
      const c = CATS[state.cats[0]];
      title = (c.dept === "shoes" ? (c.gender === "men" ? "Men's " : "Women's ") : "") + c.label;
      crumbs.push(`<span>${c.label}</span>`);
    }
    if (state.flags.length === 1) { title = FLAGS[state.flags[0]] + (title === "Shop all" ? "" : ": " + title); }
    if (state.q) { title = `Results for “${esc(state.q)}”`; sub = ""; }
    $("#shop-title").innerHTML = title;
    $("#shop-sub").textContent = sub;
    $("#crumbs").innerHTML = crumbs.join("");
    document.title = title.replace(/<[^>]+>/g, "") + " | Souls by Zamani";

    // category chips within this scope
    const cats = Object.entries(CATS).filter(([, c]) => (!state.gender || c.gender === state.gender) && (!state.dept || c.dept === state.dept));
    $("#shop-cats").innerHTML = (state.gender || state.dept) && !state.q
      ? cats.map(([k, c]) => `<button class="chip${state.cats.includes(k) ? " is-on" : ""}" data-chip="${k}">${c.label}</button>`).join("")
      : "";
  }

  // ---- filter sidebar ----
  function renderFilters() {
    const base = scopeProducts();
    const forCats = applyFilters(base, "cats");
    const catCounts = {};
    forCats.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });
    const cats = Object.keys(CATS).filter(k => catCounts[k] || state.cats.includes(k));

    const genders = new Set(base.filter(p => p.dept === "shoes").map(p => p.gender));
    const sizes = [...new Set([...(genders.has("women") ? window.SIZES.women : []), ...(genders.has("men") ? window.SIZES.men : [])])].sort((a, b) => a - b);

    const colours = [...new Set(applyFilters(base, "colours").flatMap(p => p.colours))];
    const activeScope = SCOPES.findIndex(s => (s.q.gender || "") === state.gender && (s.q.dept || "") === state.dept);

    $("#filter-body").innerHTML = `
      <div class="fgroup">
        <h4>Department</h4>
        ${SCOPES.map((s, i) => `<label class="fcheck"><input type="radio" name="scope" value="${i}"${i === activeScope ? " checked" : ""}> ${s.label}</label>`).join("")}
      </div>
      <div class="fgroup">
        <h4>Category</h4>
        ${cats.map(k => `<label class="fcheck"><input type="checkbox" data-cat="${k}"${state.cats.includes(k) ? " checked" : ""}> ${CATS[k].dept === "shoes" && !state.gender ? (CATS[k].gender === "men" ? "Men's " : "Women's ") : ""}${CATS[k].label}<small>${catCounts[k] || 0}</small></label>`).join("") || `<p class="muted small">No categories match.</p>`}
      </div>
      ${sizes.length ? `<div class="fgroup">
        <h4>Size (EU)</h4>
        <div class="fsizes">${sizes.map(s => `<button data-size="${s}" class="${state.sizes.includes(s) ? "is-on" : ""}">${s}</button>`).join("")}</div>
      </div>` : ""}
      <div class="fgroup">
        <h4>Colour</h4>
        <div class="fcolours">${colours.map(c => `<button class="swatch${state.colours.includes(c) ? " is-on" : ""}" style="--sw:${window.COLOURS[c].hex}" data-colour="${c}" title="${window.COLOURS[c].name}" aria-label="${window.COLOURS[c].name}"></button>`).join("")}</div>
      </div>
      <div class="fgroup">
        <h4>Price (₦)</h4>
        <div class="price-inputs">
          <input type="number" min="0" step="1000" placeholder="Min" id="pmin" value="${esc(state.min)}">
          <span>–</span>
          <input type="number" min="0" step="1000" placeholder="Max" id="pmax" value="${esc(state.max)}">
        </div>
      </div>
      <div class="fgroup">
        <h4>Highlights</h4>
        ${Object.entries(FLAGS).map(([k, l]) => `<label class="fcheck"><input type="checkbox" data-flag="${k}"${state.flags.includes(k) ? " checked" : ""}> ${l}</label>`).join("")}
      </div>`;
  }

  function renderActive() {
    const chips = [];
    state.cats.forEach(k => chips.push([`cat:${k}`, CATS[k] ? CATS[k].label : k]));
    state.flags.forEach(k => chips.push([`flag:${k}`, FLAGS[k] || k]));
    state.sizes.forEach(k => chips.push([`size:${k}`, "EU " + k]));
    state.colours.forEach(k => chips.push([`colour:${k}`, window.COLOURS[k] ? window.COLOURS[k].name : k]));
    if (state.min) chips.push(["min", "From " + money(Number(state.min))]);
    if (state.max) chips.push(["max", "Up to " + money(Number(state.max))]);
    if (state.q) chips.push(["q", `“${esc(state.q)}”`]);
    $("#active-filters").innerHTML = chips.length
      ? chips.map(([k, l]) => `<button class="chip" data-remove="${k}">${l} <span aria-hidden="true">×</span></button>`).join("") + `<button class="clear-link" data-clear>Clear all</button>`
      : "";
  }

  function renderGrid() {
    const results = sortList(applyFilters(scopeProducts()));
    $("#shop-count").textContent = `${results.length} style${results.length === 1 ? "" : "s"}`;
    $("#apply-btn").textContent = `Show ${results.length} result${results.length === 1 ? "" : "s"}`;
    const grid = $("#shop-grid");
    if (!results.length) {
      grid.innerHTML = `<div class="no-results"><h3>Nothing matches just yet</h3><p class="muted">Try removing a filter, or ask us to make it for you.</p><a href="bespoke.html" class="btn btn--dark">Request a custom piece</a></div>`;
      $("#load-more").innerHTML = "";
      return;
    }
    grid.innerHTML = results.slice(0, state.shown).map(card).join("");
    bindCards(grid);
    $("#load-more").innerHTML = results.length > state.shown
      ? `<p>Showing ${state.shown} of ${results.length}</p><button class="btn btn--line" id="more-btn">Load more</button>`
      : "";
    const more = $("#more-btn");
    if (more) more.onclick = () => { state.shown += PAGE; renderGrid(); };
  }

  function render() {
    state.shown = PAGE;
    writeURL();
    renderHead();
    renderFilters();
    renderActive();
    renderGrid();
  }

  // ---- events ----
  const toggle = (arr, v) => arr.includes(v) ? arr.filter(x => x !== v) : arr.concat(v);
  $("#filters").addEventListener("change", e => {
    const t = e.target;
    if (t.name === "scope") {
      const s = SCOPES[Number(t.value)].q;
      state.gender = s.gender || ""; state.dept = s.dept || ""; state.cats = []; state.sizes = [];
    }
    if (t.dataset.cat) state.cats = toggle(state.cats, t.dataset.cat);
    if (t.dataset.flag) state.flags = toggle(state.flags, t.dataset.flag);
    if (t.id === "pmin") state.min = t.value;
    if (t.id === "pmax") state.max = t.value;
    render();
  });
  $("#filters").addEventListener("click", e => {
    const s = e.target.closest("[data-size]");
    if (s) { state.sizes = toggle(state.sizes, s.dataset.size); render(); }
    const c = e.target.closest("[data-colour]");
    if (c) { state.colours = toggle(state.colours, c.dataset.colour); render(); }
    if (e.target.closest("[data-filters-close]")) closeFilters();
  });
  $("#shop-cats").addEventListener("click", e => {
    const c = e.target.closest("[data-chip]");
    if (!c) return;
    state.cats = state.cats.length === 1 && state.cats[0] === c.dataset.chip ? [] : [c.dataset.chip];
    render();
  });
  $("#active-filters").addEventListener("click", e => {
    if (e.target.closest("[data-clear]")) {
      Object.assign(state, { cats: [], flags: [], sizes: [], colours: [], min: "", max: "", q: "" });
      return render();
    }
    const r = e.target.closest("[data-remove]");
    if (!r) return;
    const [k, v] = r.dataset.remove.split(":");
    if (k === "cat") state.cats = state.cats.filter(x => x !== v);
    if (k === "flag") state.flags = state.flags.filter(x => x !== v);
    if (k === "size") state.sizes = state.sizes.filter(x => x !== v);
    if (k === "colour") state.colours = state.colours.filter(x => x !== v);
    if (k === "min") state.min = "";
    if (k === "max") state.max = "";
    if (k === "q") state.q = "";
    render();
  });
  $("#sort").value = state.sort;
  $("#sort").addEventListener("change", e => { state.sort = e.target.value; render(); });

  const overlay = () => $(".overlay");
  function closeFilters() { $("#filters").classList.remove("is-open"); overlay().classList.remove("is-open"); document.body.classList.remove("is-locked"); }
  $("#filter-open").addEventListener("click", () => { $("#filters").classList.add("is-open"); overlay().classList.add("is-open"); document.body.classList.add("is-locked"); });
  overlay().addEventListener("click", closeFilters);

  render();
  initReveal();
});
