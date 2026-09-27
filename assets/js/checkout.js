/* Checkout & order confirmation */
document.addEventListener("DOMContentLoaded", () => {
  const { $, $$, esc, Cart, byId, money, media, store, ICON, currency } = window.SBZ;
  const S = window.SITE;
  const root = $("#checkout-root");

  const STATES = ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"];

  const params = new URLSearchParams(location.search);
  if (params.get("order")) return renderConfirmation(params.get("order"));

  const items = Cart.items();
  if (!items.length) {
    root.innerHTML = `<div class="empty" style="padding:80px 0 120px"><h2>Your bag is empty</h2><a href="shop.html" class="btn btn--dark">Start shopping</a></div>`;
    return;
  }

  const draft = store.get("checkout", {});
  let promo = store.get("promo", "");
  let shipId = draft.ship || "lagos";
  let pay = draft.pay || (S.paystackPublicKey ? "card" : "transfer");

  const payMethods = [
    S.paystackPublicKey && { id: "card", label: "Card, bank or USSD (Paystack)", note: "Pay securely now. Charged in Naira." },
    { id: "transfer", label: "Bank transfer", note: "We'll show our account details after you place the order." },
    { id: "pod", label: "Pay on delivery", note: "Lagos deliveries only. Cash or transfer to the rider." },
    { id: "whatsapp", label: "Order on WhatsApp", note: "Send your order to us on WhatsApp and we'll confirm payment and delivery with you." }
  ].filter(Boolean);

  function totals() {
    const sub = Cart.subtotal();
    const pct = S.promoCodes[promo] || 0;
    const discount = Math.round(sub * pct / 100);
    const opt = S.shipping.options.find(o => o.id === shipId) || S.shipping.options[0];
    const freeApplies = !opt.noFree && sub - discount >= S.shipping.freeOver;
    const ship = freeApplies ? 0 : opt.price;
    return { sub, pct, discount, ship, opt, total: sub - discount + ship };
  }

  function field(id, label, type, opts) {
    opts = opts || {};
    const v = draft[id] || "";
    const cls = `field${opts.full ? " field--full" : ""}`;
    if (type === "select") return `<div class="${cls}"><label for="f-${id}">${label}</label><select id="f-${id}" name="${id}"${opts.required ? " required" : ""}>${opts.options.map(o => `<option${o === v ? " selected" : ""}>${esc(o)}</option>`).join("")}</select></div>`;
    if (type === "textarea") return `<div class="${cls}"><label for="f-${id}">${label}</label><textarea id="f-${id}" name="${id}" placeholder="${opts.placeholder || ""}">${esc(v)}</textarea></div>`;
    return `<div class="${cls}"><label for="f-${id}">${label}</label><input id="f-${id}" name="${id}" type="${type}" value="${esc(v)}"${opts.required ? " required" : ""}${opts.auto ? ` autocomplete="${opts.auto}"` : ""}${opts.placeholder ? ` placeholder="${opts.placeholder}"` : ""}></div>`;
  }

  function summaryHtml() {
    const t = totals();
    return `
      <h3>Your order</h3>
      <div class="mini-lines">${Cart.items().map(l => {
        const p = byId(l.id);
        return `<div class="line">
          <div class="line__img">${media(p, l.colour)}<span class="q">${l.qty}</span></div>
          <div class="line__info"><span class="line__name">${esc(p.name)}</span><p class="line__meta">${esc(window.COLOURS[l.colour].name)}${l.size !== "One size" ? " · EU " + esc(l.size) : ""}</p></div>
          <p class="line__price">${money(p.price * l.qty)}</p>
        </div>`;
      }).join("")}</div>
      <form class="promo-form" id="promo-form">
        <input id="promo-input" placeholder="Discount code" value="${esc(promo)}" aria-label="Discount code">
        <button class="btn btn--line" type="submit">Apply</button>
      </form>
      <p class="promo-msg ${promo ? (t.pct ? "ok" : "err") : ""}" id="promo-msg">${promo ? (t.pct ? `Code ${esc(promo)} applied: ${t.pct}% off` : "That code isn't valid") : ""}</p>
      <div class="sum-row"><span>Subtotal</span><span>${money(t.sub)}</span></div>
      ${t.discount ? `<div class="sum-row"><span>Discount (${t.pct}%)</span><span>−${money(t.discount)}</span></div>` : ""}
      <div class="sum-row"><span>Delivery</span><span>${t.ship ? money(t.ship) : "Free"}</span></div>
      <div class="sum-row sum-row--total"><strong>Total</strong><strong>${money(t.total)}</strong></div>
      ${currency !== "NGN" ? `<p class="muted small">Approximate. Your order is charged in Naira: ₦${t.total.toLocaleString("en-NG")}</p>` : ""}
      <button class="btn btn--dark btn--block" id="place-btn" type="submit" form="checkout-form">${pay === "whatsapp" ? "Send order on WhatsApp" : pay === "card" ? "Pay " + money(t.total) : "Place order"}</button>
      <p class="secure">${ICON.shield} Your details are only used to deliver your order</p>`;
  }

  function render() {
    const t = totals();
    root.innerHTML = `
      <div class="checkout">
        <form id="checkout-form" novalidate>
          <div class="co-step">
            <h3><span>1</span> Contact</h3>
            <div class="fields">
              ${field("email", "Email", "email", { required: true, auto: "email" })}
              ${field("phone", "Phone / WhatsApp", "tel", { required: true, auto: "tel", placeholder: "080..." })}
            </div>
          </div>
          <div class="co-step">
            <h3><span>2</span> Delivery address</h3>
            <div class="fields">
              ${field("first", "First name", "text", { required: true, auto: "given-name" })}
              ${field("last", "Last name", "text", { required: true, auto: "family-name" })}
              ${field("address", "Street address", "text", { required: true, full: true, auto: "street-address" })}
              ${field("city", "City / Town", "text", { required: true, auto: "address-level2" })}
              ${field("state", "State", "select", { required: true, options: ["", ...STATES, "Outside Nigeria"] })}
              ${field("country", "Country", "text", { required: true, auto: "country-name" })}
              ${field("notes", "Order notes (optional)", "textarea", { full: true, placeholder: "Landmarks, delivery times, or gift message" })}
            </div>
          </div>
          <div class="co-step">
            <h3><span>3</span> Delivery method</h3>
            ${S.shipping.options.map(o => {
              const free = !o.noFree && o.price && t.sub - t.discount >= S.shipping.freeOver;
              return `<label class="radio-card"><input type="radio" name="ship" value="${o.id}"${o.id === shipId ? " checked" : ""}><div><strong>${esc(o.label)}</strong></div><span>${free || !o.price ? "Free" : money(o.price)}</span></label>`;
            }).join("")}
          </div>
          <div class="co-step">
            <h3><span>4</span> Payment</h3>
            ${payMethods.map(m => `<label class="radio-card"><input type="radio" name="pay" value="${m.id}"${m.id === pay ? " checked" : ""}><div><strong>${m.label}</strong><small>${m.note}</small></div></label>`).join("")}
          </div>
        </form>
        <aside class="summary" id="summary">${summaryHtml()}</aside>
      </div>`;
    if (!draft.country) $("#f-country").value = "Nigeria";
    bind();
  }

  function saveDraft() {
    const f = $("#checkout-form");
    const d = Object.fromEntries(new FormData(f).entries());
    Object.assign(draft, d);
    store.set("checkout", draft);
  }

  function refreshSummary() { $("#summary").innerHTML = summaryHtml(); bindSummary(); }

  function bindSummary() {
    $("#promo-form").addEventListener("submit", e => {
      e.preventDefault();
      promo = $("#promo-input").value.trim().toUpperCase();
      store.set("promo", promo);
      render();
    });
  }

  function bind() {
    const f = $("#checkout-form");
    f.addEventListener("input", saveDraft);
    f.addEventListener("change", e => {
      saveDraft();
      if (e.target.name === "ship") { shipId = e.target.value; refreshSummary(); }
      if (e.target.name === "pay") { pay = e.target.value; refreshSummary(); }
      if (e.target.name === "state") {
        const st = e.target.value;
        if (st === "Outside Nigeria") { shipId = "intl"; if ($("#f-country").value === "Nigeria") $("#f-country").value = ""; }
        else if (st === "Lagos") shipId = shipId === "intl" ? "lagos" : shipId;
        else if (st && shipId === "lagos") shipId = "nigeria";
        draft.ship = shipId; saveDraft(); render();
      }
    });
    f.addEventListener("submit", e => { e.preventDefault(); placeOrder(); });
    bindSummary();
  }

  function validate() {
    let ok = true;
    $$("#checkout-form [required]").forEach(el => {
      const bad = !el.value.trim() || (el.type === "email" && !/^\S+@\S+\.\S+$/.test(el.value));
      el.closest(".field").classList.toggle("is-error", bad);
      if (bad && ok) { el.focus(); ok = false; }
    });
    if (ok && pay === "pod" && shipId !== "lagos" && shipId !== "pickup") {
      alert("Pay on delivery is only available for Lagos delivery or workshop pick-up. Please choose another payment method.");
      ok = false;
    }
    return ok;
  }

  function buildOrder() {
    const t = totals();
    const d = Object.fromEntries(new FormData($("#checkout-form")).entries());
    return {
      id: "SBZ" + Date.now().toString(36).toUpperCase().slice(-6),
      date: new Date().toISOString(),
      items: Cart.items().map(l => ({ ...l, name: byId(l.id).name, price: byId(l.id).price })),
      customer: d,
      ship: t.opt.label, shipCost: t.ship,
      subtotal: t.sub, discount: t.discount, promo: t.pct ? promo : "",
      total: t.total, pay, status: pay === "card" ? "paid" : "pending"
    };
  }

  function waText(o) {
    const lines = o.items.map(i => `• ${i.name} (${window.COLOURS[i.colour].name}${i.size !== "One size" ? ", EU " + i.size : ""}) x${i.qty}: ₦${(i.price * i.qty).toLocaleString("en-NG")}`);
    return [
      `Hello Souls by Zamani! I'd like to place order ${o.id}:`,
      ...lines,
      o.discount ? `Discount (${o.promo}): -₦${o.discount.toLocaleString("en-NG")}` : "",
      `Delivery: ${o.ship}${o.shipCost ? " (₦" + o.shipCost.toLocaleString("en-NG") + ")" : ""}`,
      `TOTAL: ₦${o.total.toLocaleString("en-NG")}`,
      "",
      `Name: ${o.customer.first} ${o.customer.last}`,
      `Phone: ${o.customer.phone}`,
      `Address: ${o.customer.address}, ${o.customer.city}, ${o.customer.state}, ${o.customer.country}`,
      o.customer.notes ? `Notes: ${o.customer.notes}` : "",
      `Payment: ${({ card: "Card (paid)", transfer: "Bank transfer", pod: "Pay on delivery", whatsapp: "To confirm on WhatsApp" })[o.pay]}`
    ].filter(Boolean).join("\n");
  }

  function finish(o) {
    const orders = store.get("orders", []);
    orders.unshift(o);
    store.set("orders", orders.slice(0, 20));
    Cart.clear();
    store.set("promo", "");
    if (o.pay === "whatsapp") window.open(`https://wa.me/${S.whatsapp}?text=${encodeURIComponent(waText(o))}`, "_blank");
    location.href = `checkout.html?order=${o.id}`;
  }

  function placeOrder() {
    if (!validate()) return;
    const o = buildOrder();
    if (pay === "card") return payWithPaystack(o);
    finish(o);
  }

  function payWithPaystack(o) {
    const go = () => {
      const handler = window.PaystackPop.setup({
        key: S.paystackPublicKey,
        email: o.customer.email,
        amount: o.total * 100, // kobo
        currency: "NGN",
        ref: o.id + "-" + Math.floor(Math.random() * 1e6),
        metadata: { custom_fields: [{ display_name: "Order", variable_name: "order", value: o.id }, { display_name: "Phone", variable_name: "phone", value: o.customer.phone }] },
        callback: resp => { o.paymentRef = resp.reference; finish(o); },
        onClose: () => window.SBZ.toast("Payment window closed. Your bag is saved.")
      });
      handler.openIframe();
    };
    if (window.PaystackPop) return go();
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.onload = go;
    s.onerror = () => alert("We couldn't load the payment window. Please check your connection or choose bank transfer.");
    document.head.appendChild(s);
  }

  function renderConfirmation(id) {
    const o = store.get("orders", []).find(x => x.id === id);
    if (!o) {
      root.innerHTML = `<div class="confirm"><h2>Order not found</h2><p class="muted">If you placed an order, check your WhatsApp or email for confirmation, or <a href="contact.html" style="text-decoration:underline">contact us</a>.</p></div>`;
      return;
    }
    const naira = n => "₦" + n.toLocaleString("en-NG");
    root.innerHTML = `
      <div class="confirm">
        <div class="confirm__tick">✓</div>
        <span class="eyebrow">Order ${esc(o.id)}</span>
        <h1 style="font-size:clamp(2rem,5vw,3.2rem)">Thank you, ${esc(o.customer.first)}.</h1>
        <p class="muted">${o.pay === "card" ? "Your payment was received and your order is now in the workshop queue." :
          o.pay === "transfer" ? "Your order is reserved. Please complete your bank transfer below. We start making your order once payment is confirmed." :
          o.pay === "pod" ? "Your order is confirmed. Please have payment ready when the rider arrives." :
          "We've opened WhatsApp with your order details. Send the message and we'll confirm payment and delivery with you."}
          We'll send updates to ${esc(o.customer.phone)}.</p>
        ${o.pay === "transfer" ? `<div class="bank">
          <p><strong>Transfer ${naira(o.total)} to:</strong></p>
          <dl><dt>Bank</dt><dd>${esc(S.bank.bankName)}</dd><dt>Account name</dt><dd>${esc(S.bank.accountName)}</dd><dt>Account number</dt><dd>${esc(S.bank.accountNumber)}</dd><dt>Reference</dt><dd>${esc(o.id)}</dd></dl>
          <p class="small muted" style="margin:12px 0 0">After paying, send your receipt on WhatsApp so we can confirm it quickly.</p>
        </div>` : ""}
        ${o.pay !== "card" ? `<a class="btn btn--wa" target="_blank" rel="noopener" href="https://wa.me/${S.whatsapp}?text=${encodeURIComponent(waText(o))}">${ICON.whatsapp} ${o.pay === "whatsapp" ? "Open WhatsApp again" : "Send order on WhatsApp"}</a>` : ""}
        <div class="summary">
          <h3>Order summary</h3>
          ${o.items.map(i => `<div class="sum-row"><span>${esc(i.name)} · ${esc(window.COLOURS[i.colour].name)}${i.size !== "One size" ? " · EU " + esc(i.size) : ""} × ${i.qty}</span><span>${naira(i.price * i.qty)}</span></div>`).join("")}
          ${o.discount ? `<div class="sum-row"><span>Discount</span><span>−${naira(o.discount)}</span></div>` : ""}
          <div class="sum-row"><span>${esc(o.ship)}</span><span>${o.shipCost ? naira(o.shipCost) : "Free"}</span></div>
          <div class="sum-row sum-row--total"><strong>Total</strong><strong>${naira(o.total)}</strong></div>
          <p class="small muted" style="margin-top:14px">Delivering to ${esc(o.customer.first)} ${esc(o.customer.last)}, ${esc(o.customer.address)}, ${esc(o.customer.city)}, ${esc(o.customer.state)}, ${esc(o.customer.country)}</p>
        </div>
        <a href="shop.html" class="btn btn--dark">Continue shopping</a>
      </div>`;
  }

  render();
});
