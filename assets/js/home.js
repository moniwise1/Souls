/* Home page */
document.addEventListener("DOMContentLoaded", () => {
  const { $, $$, card, bindCards, ICON, initReveal } = window.SBZ;
  const P = window.PRODUCTS;
  const CATS = window.CATEGORIES;

  $("#stat-styles").textContent = P.length + "+";
  $("#stat-cats").textContent = Object.keys(CATS).length;

  // Hero: rotate through pairs of pieces
  const pairs = [
    [["oxford", "cognac"], ["pump", "red"]],
    [["chelsea", "black"], ["tote", "cognac"]],
    [["loafer", "oxblood"], ["slingback", "cream"]],
    [["palm", "burgundy"], ["clutch", "emerald"]],
    [["sneaker", "white"], ["heelsandal", "gold"]]
  ];
  let i = 0;
  const a = $("#hero-a"), b = $("#hero-b");
  function showPair() {
    const [x, y] = pairs[i % pairs.length];
    [a, b].forEach(el => { el.style.opacity = 0; el.style.transform = "translateY(12px)"; });
    setTimeout(() => {
      a.innerHTML = window.ART.svg(x[0], x[1]);
      b.innerHTML = window.ART.svg(y[0], y[1]);
      [a, b].forEach(el => { el.style.opacity = 1; el.style.transform = "none"; });
    }, i === 0 ? 0 : 500);
    i++;
  }
  showPair();
  setInterval(showPair, 4500);

  // Department tiles
  const tiles = [
    { title: "Men's Shoes", href: "shop.html?gender=men", art: ["brogue", "cognac"], n: P.filter(p => p.gender === "men").length },
    { title: "Women's Shoes", href: "shop.html?gender=women&dept=shoes", art: ["pump", "nude"], n: P.filter(p => p.gender === "women" && p.dept === "shoes").length },
    { title: "Bags", href: "shop.html?dept=bags", art: ["handbag", "burgundy"], n: P.filter(p => p.dept === "bags").length },
    { title: "Accessories", href: "shop.html?dept=accessories", art: ["belt", "tan"], n: P.filter(p => p.dept === "accessories").length }
  ];
  $("#tiles").innerHTML = tiles.map(t => `
    <a class="tile" href="${t.href}">
      <div class="tile__art">${window.ART.svg(t.art[0], t.art[1])}</div>
      <h3>${t.title}</h3>
      <span>${t.n} styles ${ICON.arrow}</span>
    </a>`).join("");

  // Style scroller
  function renderStyles(tab) {
    const list = Object.entries(CATS).filter(([, c]) =>
      tab === "men" ? c.gender === "men" : tab === "women" ? c.gender === "women" && c.dept === "shoes" : c.dept !== "shoes");
    $("#style-scroller").innerHTML = list.map(([k, c]) => {
      const sample = P.find(p => p.category === k);
      return `<a class="mini-cat" href="shop.html?cat=${k}">
        <div class="mini-cat__art">${window.ART.svg(c.art, sample ? sample.colours[0] : "cognac")}</div>
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
    if (kind === "new") list = P.filter(p => p.badges.includes("new"));
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

  $("#promo-a").innerHTML = window.ART.svg("palm", "black");
  $("#promo-b").innerHTML = window.ART.svg("clutch", "gold");
  $("#story-art").insertAdjacentHTML("afterbegin", window.ART.svg("brogue", "oxblood"));

  window.SBZ.gallery($("#home-gallery"), 6);

  initReveal();
});
