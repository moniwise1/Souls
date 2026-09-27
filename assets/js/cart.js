/* Bag page */
document.addEventListener("DOMContentLoaded", () => {
  const { $, esc, Cart, money, lineHtml, bindLines, shipBar, card, bindCards, ICON } = window.SBZ;
  const root = $("#cart-root");

  function render() {
    const items = Cart.items();
    if (!items.length) {
      root.innerHTML = `<div class="empty" style="padding:80px 0 120px">
        <div class="empty__icon">${ICON.bag}</div>
        <h2>Your bag is empty</h2>
        <p class="muted">Take a look around. There's something handmade for everyone.</p>
        <a href="shop.html?gender=men" class="btn btn--dark">Shop men</a>
        <a href="shop.html?gender=women" class="btn btn--line">Shop women</a>
      </div>`;
      return;
    }
    const ids = items.map(l => l.id);
    const picks = window.PRODUCTS.filter(p => !ids.includes(p.id) && p.dept !== "shoes").slice(0, 3);
    root.innerHTML = `
      <div class="cart-page">
        <div>
          ${shipBar()}
          <div id="cart-lines">${items.map(l => lineHtml(l)).join("")}</div>
          <div style="margin-top:50px">
            <h3>Finish the look</h3>
            <div class="grid grid--3" id="cart-picks">${picks.map(card).join("")}</div>
          </div>
        </div>
        <aside class="summary">
          <h3>Order summary</h3>
          <div class="sum-row"><span>Subtotal (${Cart.count()} item${Cart.count() === 1 ? "" : "s"})</span><span>${money(Cart.subtotal())}</span></div>
          <div class="sum-row"><span>Delivery</span><span class="muted">At checkout</span></div>
          <div class="sum-row sum-row--total"><strong>Estimated total</strong><strong>${money(Cart.subtotal())}</strong></div>
          <a href="checkout.html" class="btn btn--dark btn--block">Checkout securely</a>
          <a href="shop.html" class="btn btn--line btn--block">Continue shopping</a>
          <p class="secure">${ICON.shield} Handmade quality, guaranteed for 12 months</p>
        </aside>
      </div>`;
    bindLines($("#cart-lines"));
    bindCards($("#cart-picks"));
  }

  document.addEventListener("cart:change", render);
  render();
});
