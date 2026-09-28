/* Content pages: wishlist, about, bespoke, contact, help */
document.addEventListener("sbz:ready", () => {
  const { $, $$, esc, card, bindCards, money, sizeTable, Wish, initReveal } = window.SBZ;
  const S = window.SITE;

  // Illustrations placed with data-art="style:colour"
  $$("[data-art]").forEach(el => {
    const [art, colour] = el.dataset.art.split(":");
    el.innerHTML = window.ART.svg(art, colour);
  });

  // Wishlist
  const wg = $("#wish-grid");
  if (wg) {
    const render = () => {
      const items = Wish.items();
      wg.innerHTML = items.length
        ? items.map(card).join("")
        : `<div class="no-results"><h3>Nothing saved yet</h3><p class="muted">Tap the heart on any piece to save it here.</p><a class="btn btn--dark" href="shop.html">Start browsing</a></div>`;
      bindCards(wg);
    };
    render();
    document.addEventListener("wish:change", render);
  }

  // Contact details card
  const cc = $("#contact-card");
  if (cc) {
    cc.innerHTML = `
      <div><h4>WhatsApp</h4><p><a href="https://wa.me/${S.whatsapp}" target="_blank" rel="noopener" style="text-decoration:underline">Chat with us</a>. The fastest way to reach us.</p></div>
      <div><h4>Email</h4><p><a href="mailto:${S.email}">${esc(S.email)}</a></p></div>
      <div><h4>Phone</h4><p><a href="tel:${S.phone.replace(/\s/g, "")}">${esc(S.phone)}</a></p></div>
      <div><h4>Workshop</h4><p>${esc(S.address)}<br>Visits by appointment</p></div>
      <div><h4>Hours</h4><p>${esc(S.hours)}</p></div>`;
  }

  // Forms that send via WhatsApp or email (no server needed)
  $$("#contact-form, #bespoke-form").forEach(form => {
    let via = "email";
    $$("[data-via]", form).forEach(b => b.addEventListener("click", () => { via = b.dataset.via; }));
    form.addEventListener("submit", e => {
      e.preventDefault();
      let ok = true;
      $$("[required]", form).forEach(el => {
        const bad = !el.value.trim() || (el.type === "email" && el.value && !/^\S+@\S+\.\S+$/.test(el.value));
        el.closest(".field").classList.toggle("is-error", bad);
        if (bad && ok) { el.focus(); ok = false; }
      });
      if (!ok) return;
      const data = [...new FormData(form).entries()].filter(([, v]) => String(v).trim());
      const title = form.id === "bespoke-form" ? "Bespoke request" : "Website enquiry";
      const text = `${title}\n\n` + data.map(([k, v]) => `${k}: ${v}`).join("\n");
      if (via === "whatsapp") window.open(`https://wa.me/${S.whatsapp}?text=${encodeURIComponent(text)}`, "_blank");
      else location.href = `mailto:${S.email}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`;
      form.insertAdjacentHTML("beforebegin", `<div class="form-done field--full" style="margin-bottom:20px">Thank you! Your message is ready to send in ${via === "whatsapp" ? "WhatsApp" : "your email app"}. We reply within one working day.</div>`);
    });
  });

  // Help page tables
  if ($("#ship-table")) {
    $("#ship-table").innerHTML = `<div class="table-wrap"><table class="table"><thead><tr><th>Option</th><th>Cost</th></tr></thead><tbody>${S.shipping.options.map(o => `<tr><td>${esc(o.label)}</td><td>${o.price ? money(o.price) : "Free"}</td></tr>`).join("")}</tbody></table></div>`;
    $("#free-ship-note").innerHTML = `<strong>Free delivery within Nigeria</strong> on orders over ${money(S.shipping.freeOver)}.`;
    $("#size-men").innerHTML = sizeTable("men");
    $("#size-women").innerHTML = sizeTable("women");
  }

  if ($("#bespoke-gallery")) window.SBZ.gallery($("#bespoke-gallery"));

  initReveal();
});
