/* Product detail page */
document.addEventListener("DOMContentLoaded", () => {
  const { $, $$, esc, byId, catOf, sizesOf, deptLabel, describe, money, media, card, bindCards, priceHtml, Cart, Wish, ICON, store, sizeTable, initReveal } = window.SBZ;
  const S = window.SITE;
  const params = new URLSearchParams(location.search);
  const p = byId(params.get("id"));
  const root = $("#pdp-root");

  if (!p) {
    root.innerHTML = `<div class="empty" style="padding:120px 0"><h1>We couldn't find that piece</h1><p class="muted">It may have sold out or moved.</p><a class="btn btn--dark" href="shop.html">Continue shopping</a></div>`;
    $("#related-wrap").hidden = true;
    return;
  }

  const c = catOf(p);
  const sizes = sizesOf(p);
  let colour = p.colours.includes(params.get("colour")) ? params.get("colour") : p.colours[0];
  let size = sizes.length === 1 ? sizes[0] : null;
  let view = 0; // gallery index

  document.title = `${p.name} | ${c.label} | Souls by Zamani`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = describe(p).slice(0, 155);

  // Gallery views: with photos, use them; otherwise main illustration, detail zoom, and other colours
  function views() {
    if (p.photos) {
      const v = [0, 1, 2].map(i => ({ html: media(p, colour, { index: i }) }));
      p.colours.filter(k => k !== colour).forEach(k => v.push({ html: media(p, k), colour: k }));
      return v;
    }
    if (p.images && p.images.length) return p.images.map((_, i) => ({ html: media(p, colour, { index: i }) }));
    const v = [{ html: media(p, colour) }, { html: media(p, colour, { zoom: true }) }];
    p.colours.filter(k => k !== colour).forEach(k => v.push({ html: media(p, k), colour: k }));
    return v;
  }

  const shoeDetails = [
    p.material,
    "Hand-lasted construction",
    p.gender === "men" ? "Leather lining and cushioned leather insole" : "Soft leather lining with padded footbed",
    ["sneaker"].includes(c.art) ? "Stitched rubber cupsole" : ["chukka"].includes(c.art) ? "Natural crepe sole" : ["combat"].includes(c.art) ? "Heavy-duty lug sole" : ["espadrille", "wedge"].includes(c.art) ? "Hand-braided jute sole" : "Leather sole with rubber heel tip",
    "Made in Lagos, Nigeria"
  ];
  const bagDetails = [
    p.material,
    "Hand-painted, burnished edges",
    "Solid brass hardware",
    "Cotton-twill lining with inner slip pocket",
    "Includes a cotton dust bag",
    "Made in Lagos, Nigeria"
  ];

  function render() {
    const vs = views();
    const saving = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
    const waMsg = encodeURIComponent(`Hello Souls by Zamani, I'm interested in the ${p.name} (${window.COLOURS[colour].name}${size && size !== "One size" ? ", EU " + size : ""}). ${location.href}`);
    root.innerHTML = `
      <div class="pdp">
        <div class="gallery">
          <div class="gallery__thumbs">${vs.map((v, i) => `<button class="${i === view ? "is-on" : ""}" data-view="${i}" aria-label="View image ${i + 1}">${v.html}</button>`).join("")}</div>
          <div class="gallery__main" id="gallery-main" title="Click to zoom">${vs[Math.min(view, vs.length - 1)].html}</div>
        </div>

        <div class="pdp__info">
          <nav class="crumbs crumbs--left" aria-label="Breadcrumb">
            <a href="index.html">Home</a>
            <span><a href="shop.html?${p.dept === "shoes" ? "gender=" + p.gender + "&dept=shoes" : "dept=" + p.dept}">${deptLabel(p)}</a></span>
            <span><a href="shop.html?cat=${p.category}">${esc(c.label)}</a></span>
          </nav>
          <span class="eyebrow">${esc(c.label)}${p.badges.includes("handmade") ? " · Artisan special" : ""}</span>
          <h1 class="pdp__title">${esc(p.name)}</h1>
          <p class="pdp__price">${priceHtml(p)}${saving ? `<span class="pdp__save">Save ${saving}%</span>` : ""}</p>
          <p class="pdp__tax">Item ${p.sku}. Delivery worked out at checkout.${p.photos ? "<br>Photo shows the style. Each pair is handmade to order, so leather tone and finish may vary slightly." : ""}</p>

          <div class="opt">
            <div class="opt__label"><b>Colour</b><span>${esc(window.COLOURS[colour].name)}</span></div>
            <div class="colour-opts">${p.colours.map(k => `<button class="swatch${k === colour ? " is-on" : ""}" style="--sw:${window.COLOURS[k].hex}" data-colour="${k}" aria-label="${window.COLOURS[k].name}" title="${window.COLOURS[k].name}"></button>`).join("")}</div>
          </div>

          ${sizes.length > 1 ? `
          <div class="opt">
            <div class="opt__label"><b>Size (EU)</b><a href="#" data-size-guide>${ICON.ruler} Size guide</a></div>
            <div class="size-opts" id="size-opts">${sizes.map(s => `<button class="${s === size ? "is-on" : ""}" data-size="${s}">${s}</button>`).join("")}</div>
            <p class="size-error" id="size-error" hidden>Please choose a size.</p>
          </div>` : ""}

          <div class="pdp__actions">
            <button class="btn btn--dark btn--block" id="add-btn">Add to bag · ${money(p.price)}</button>
            <button class="pdp__wish${Wish.has(p.id) ? " is-on" : ""}" data-wish="${p.id}" aria-label="Save to wishlist">${ICON.heart}</button>
          </div>
          <a class="btn btn--wa btn--block" href="https://wa.me/${S.whatsapp}?text=${waMsg}" target="_blank" rel="noopener">${ICON.whatsapp} Ask about this on WhatsApp</a>

          <div class="pdp__meta">
            <div>${ICON.hand}<span><strong>Handmade to order.</strong> Ready to ship in 5–10 working days.</span></div>
            <div>${ICON.truck}<span>Free Nigeria delivery on orders over ${money(S.shipping.freeOver)}. We ship worldwide.</span></div>
            <div>${ICON.return}<span>Free 14-day size exchanges.</span></div>
          </div>

          <details class="acc" open><summary>Description</summary><div class="acc__body"><p>${esc(describe(p))}</p></div></details>
          <details class="acc"><summary>Details &amp; materials</summary><div class="acc__body"><ul>${(p.dept === "shoes" ? shoeDetails : bagDetails).map(d => `<li>${esc(d)}</li>`).join("")}</ul></div></details>
          ${p.dept === "shoes" ? `<details class="acc"><summary>Size &amp; fit</summary><div class="acc__body"><p>True to size. ${["pump", "slingback", "kitten"].includes(c.art) ? "Pointed toe styles suit a regular to slim foot; if you have a wide foot, go half a size up." : "For wide feet, choose one size up or ask us about a bespoke fit."}</p><p><a href="#" data-size-guide style="text-decoration:underline">Open the size guide</a></p></div></details>` : ""}
          <details class="acc"><summary>Delivery &amp; returns</summary><div class="acc__body"><ul>
            ${S.shipping.options.map(o => `<li>${esc(o.label)}: ${o.price ? money(o.price) : "Free"}</li>`).join("")}
          </ul><p style="margin-top:10px">Unworn items can be returned or exchanged within 14 days. Bespoke and personalised pieces are final sale. <a href="help.html#returns" style="text-decoration:underline">Full policy</a></p></div></details>
          <details class="acc"><summary>Leather care</summary><div class="acc__body"><p>Wipe with a soft dry cloth after wear. Condition every few months with a neutral leather cream, and keep ${p.dept === "shoes" ? "cedar shoe trees inside" : "the bag stuffed and in its dust bag"} when stored. Keep away from direct heat. <a href="help.html#care" style="text-decoration:underline">Care guide</a></p></div></details>

          <div style="margin-top:34px">
            <div class="reviews-empty">
              <div>
                <h3>Reviews</h3>
                <p>No reviews yet. Bought this piece? We'd love to hear how it wears. Send us your thoughts and a photo.</p>
              </div>
              <a class="btn btn--line" href="https://wa.me/${S.whatsapp}?text=${encodeURIComponent("Review for " + p.name + ": ")}" target="_blank" rel="noopener">Write a review</a>
            </div>
          </div>
        </div>
      </div>`;
    bind();
  }

  function bind() {
    $$("[data-view]", root).forEach(b => b.addEventListener("click", () => {
      const vs = views();
      const v = vs[Number(b.dataset.view)];
      if (v.colour) { colour = v.colour; view = 0; render(); return; }
      view = Number(b.dataset.view);
      $("#gallery-main").innerHTML = v.html;
      $$("[data-view]", root).forEach(x => x.classList.toggle("is-on", x === b));
    }));
    $("#gallery-main").addEventListener("click", e => e.currentTarget.classList.toggle("is-zoom"));
    $$("[data-colour]", root).forEach(b => b.addEventListener("click", () => {
      colour = b.dataset.colour; view = 0;
      history.replaceState(null, "", `?id=${p.id}&colour=${colour}`);
      render();
    }));
    $$("[data-size]", root).forEach(b => b.addEventListener("click", () => {
      size = b.dataset.size;
      $$("[data-size]", root).forEach(x => x.classList.toggle("is-on", x === b));
      $("#size-opts").classList.remove("is-error");
      $("#size-error").hidden = true;
    }));
    $("#add-btn").addEventListener("click", () => {
      if (!size) {
        $("#size-opts").classList.add("is-error");
        $("#size-error").hidden = false;
        $("#size-opts").scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      Cart.add(p.id, colour, size, 1);
    });
    $("[data-wish]", root).addEventListener("click", () => Wish.toggle(p.id));
    $$("[data-size-guide]", root).forEach(a => a.addEventListener("click", e => {
      e.preventDefault();
      $("#size-modal-table").innerHTML = `<h3>${p.gender === "men" ? "Men" : "Women"}</h3>` + sizeTable(p.gender);
      $("#size-modal").classList.add("is-open");
    }));
  }

  $("#size-modal").addEventListener("click", e => {
    if (e.target.id === "size-modal" || e.target.closest("[data-modal-close]")) $("#size-modal").classList.remove("is-open");
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") $("#size-modal").classList.remove("is-open"); });

  render();

  // Related: same category first, then same department & gender
  const P = window.PRODUCTS;
  const related = [
    ...P.filter(x => x.id !== p.id && x.category === p.category),
    ...P.filter(x => x.id !== p.id && x.category !== p.category && x.gender === p.gender && x.dept === p.dept && catOf(x).group === c.group),
    ...P.filter(x => x.id !== p.id && x.gender === p.gender && x.dept !== p.dept)
  ].filter((x, i, a) => a.indexOf(x) === i).slice(0, 4);
  $("#related").innerHTML = related.map(card).join("");
  bindCards($("#related"));

  // Recently viewed
  let recent = store.get("recent", []).filter(id => id !== p.id && byId(id));
  if (recent.length) {
    $("#recent-wrap").hidden = false;
    $("#recent").innerHTML = recent.slice(0, 4).map(id => card(byId(id))).join("");
    bindCards($("#recent"));
  }
  store.set("recent", [p.id, ...recent].slice(0, 12));

  initReveal();
});
