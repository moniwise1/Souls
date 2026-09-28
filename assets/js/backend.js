/* ==========================================================================
   Souls by Zamani — data layer shared by the shop and the admin
   --------------------------------------------------------------------------
   • Live mode:  when SITE.supabase.url and anonKey are set in config.js,
                 everything is read from / written to your Supabase database.
   • Demo mode:  otherwise, the admin keeps its data in this browser only
                 (localStorage), seeded from assets/js/data.js, so you can try
                 every screen before connecting a database.
   ========================================================================== */

(function () {
  const S = window.SITE || {};
  const SB = S.supabase || {};
  const LIVE = !!(SB.url && SB.anonKey);
  const DEMO_KEY = "sbz_admin_db";
  const SDK = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";

  /* ---------------------------------------------------------- roles ---- */
  const PERMISSIONS = [
    ["dashboard", "See the dashboard"],
    ["orders.view", "View orders"],
    ["orders.manage", "Update orders & delivery status"],
    ["products.view", "View products (incl. drafts)"],
    ["products.manage", "Add, edit & delete products and photos"],
    ["categories.manage", "Manage categories"],
    ["customers.view", "View customers"],
    ["customers.manage", "Add, edit & import customers"],
    ["payments.view", "View payments"],
    ["payments.manage", "Record payments & refunds"],
    ["promos.manage", "Manage discount codes"],
    ["staff.manage", "Manage staff & roles"],
    ["settings.manage", "Change store settings"],
    ["audit.view", "View activity log"]
  ];
  const ROLES = [
    { key: "owner", label: "Owner", description: "Full control, including staff, roles and settings. Cannot be removed.", permissions: ["*"], locked: true },
    { key: "admin", label: "Administrator", description: "Everything except changing the owner.", permissions: PERMISSIONS.map(p => p[0]), locked: true },
    { key: "manager", label: "Store manager", description: "Runs the shop day to day: products, orders, customers and discounts.", permissions: ["dashboard", "orders.view", "orders.manage", "products.view", "products.manage", "categories.manage", "customers.view", "customers.manage", "payments.view", "promos.manage", "audit.view"], locked: true },
    { key: "editor", label: "Catalogue editor", description: "Adds and edits products, photos and categories.", permissions: ["dashboard", "products.view", "products.manage", "categories.manage"], locked: true },
    { key: "support", label: "Customer support", description: "Handles orders and customers.", permissions: ["dashboard", "orders.view", "orders.manage", "customers.view", "customers.manage"], locked: true },
    { key: "accountant", label: "Accountant", description: "Sees orders and payments, records payments.", permissions: ["dashboard", "orders.view", "payments.view", "payments.manage", "customers.view", "audit.view"], locked: true },
    { key: "viewer", label: "Viewer", description: "Read-only access to everything except staff.", permissions: ["dashboard", "orders.view", "products.view", "customers.view", "payments.view"], locked: true }
  ];
  const can = (role, perm) => !!role && (role.permissions.includes("*") || role.permissions.includes(perm));

  /* ------------------------------------------------ shape conversion ---- */
  // Database row  ->  the product object the shop pages use
  function toShop(row) {
    return {
      id: row.id, sku: row.sku, name: row.name, gender: row.gender, dept: row.dept, category: row.category,
      price: row.price, compareAt: row.compare_at || undefined, colours: row.colours || [],
      material: row.material || "", description: row.description || "", badges: row.badges || [],
      gallery: row.gallery && Object.keys(row.gallery).length ? row.gallery : undefined,
      stock: row.stock, madeToOrder: row.made_to_order, added: row.sort || Date.parse(row.created_at) / 1e5 || 0,
      art: row.art || undefined, status: row.status
    };
  }
  // Static catalogue product (data.js)  ->  database row
  function fromStatic(p, i) {
    const gallery = {};
    if (p.photos) Object.entries(p.photos).forEach(([c, dir]) => {
      gallery[c] = [1, 2, 3].map(v => `assets/img/products/${dir}/${c}-${v}.webp`);
    });
    const cat = (window.CATEGORIES || {})[p.category] || {};
    return {
      id: p.id, sku: p.sku, name: p.name, category: p.category, gender: p.gender, dept: p.dept,
      price: p.price, compare_at: p.compareAt || null, colours: p.colours,
      sizes: p.dept === "shoes" ? (window.SIZES || {})[p.gender] || [] : ["One size"],
      material: p.material || "", description: "", badges: p.badges || [], gallery,
      stock: 0, made_to_order: true, status: "active", sort: p.added || i, art: p.art || null,
      created_at: new Date(Date.now() - (200 - i) * 864e5).toISOString(), updated_at: new Date().toISOString(),
      _cat_art: cat.art
    };
  }

  /* ------------------------------------------------------ demo store ---- */
  function readDemo() {
    try { const raw = localStorage.getItem(DEMO_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function writeDemo(db) {
    try { localStorage.setItem(DEMO_KEY, JSON.stringify(db)); return true; }
    catch (e) { throw new Error("Browser storage is full. Use smaller photos, or connect Supabase for real storage."); }
  }
  function seedDemo() {
    const cats = Object.entries(window.CATEGORIES || {}).map(([key, c], i) => ({ key, label: c.label, gender: c.gender, dept: c.dept, grp: c.group, art: c.art, sort: i }));
    const products = (window.PRODUCTS || []).map(fromStatic);
    const settings = {
      store: { name: S.name, tagline: S.tagline, email: S.email, phone: S.phone, whatsapp: S.whatsapp, address: S.address, hours: S.hours, paystackPublicKey: S.paystackPublicKey || "" },
      shipping: S.shipping, bank: S.bank, currencies: S.currencies
    };
    const promos = Object.entries(S.promoCodes || {}).map(([code, pct]) => ({ code, percent_off: pct, active: true, expires_at: null, max_uses: null, uses: 0, created_at: new Date().toISOString() }));
    const db = { v: 1, categories: cats, products, customers: [], orders: [], payments: [], promo_codes: promos, roles: ROLES, staff: [], settings, audit_log: [] };
    writeDemo(db);
    return db;
  }
  const demoDb = () => readDemo() || seedDemo();
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

  /* -------------------------------------------------- supabase client ---- */
  let clientPromise;
  function client() {
    if (!LIVE) return Promise.reject(new Error("Supabase is not connected"));
    if (!clientPromise) {
      clientPromise = new Promise((resolve, reject) => {
        const done = () => resolve(window.supabase.createClient(SB.url, SB.anonKey));
        if (window.supabase && window.supabase.createClient) return done();
        const s = document.createElement("script");
        s.src = SDK; s.onload = done; s.onerror = () => reject(new Error("Could not load the Supabase library. Check your connection."));
        document.head.appendChild(s);
      });
    }
    return clientPromise;
  }
  async function q(promise) {
    const { data, error } = await promise;
    if (error) throw new Error(error.message);
    return data;
  }

  /* -------------------------------------------- storefront catalogue ---- */
  // Replaces the built-in catalogue with the one from the database (live) or
  // from the admin demo on this device. Mutates the globals in place so every
  // script keeps working with the same objects.
  async function loadCatalogue() {
    let cats, rows, settings;
    try {
      if (LIVE) {
        const sb = await client();
        [cats, rows, settings] = await Promise.all([
          q(sb.from("categories").select("*").order("sort")),
          q(sb.from("products").select("*").eq("status", "active").order("sort", { ascending: false })),
          q(sb.from("settings").select("key,value"))
        ]);
        settings = Object.fromEntries(settings.map(r => [r.key, r.value]));
      } else {
        const db = readDemo();
        if (!db) return false;
        cats = db.categories; rows = db.products.filter(p => p.status === "active"); settings = db.settings;
      }
    } catch (e) {
      console.warn("Using built-in catalogue:", e.message);
      return false;
    }
    if (!rows || !rows.length) return false;
    const C = window.CATEGORIES;
    Object.keys(C).forEach(k => delete C[k]);
    cats.forEach(c => { C[c.key] = { label: c.label, gender: c.gender, dept: c.dept, group: c.grp, art: c.art }; });
    const P = window.PRODUCTS;
    P.splice(0, P.length, ...rows.filter(r => C[r.category]).map(toShop));
    if (settings) {
      if (settings.store) Object.assign(S, Object.fromEntries(Object.entries(settings.store).filter(([, v]) => v !== "" && v != null)));
      if (settings.shipping) S.shipping = settings.shipping;
      if (settings.bank) S.bank = settings.bank;
      if (!LIVE) {
        const db = readDemo();
        if (db) S.promoCodes = Object.fromEntries(db.promo_codes.filter(p => p.active).map(p => [p.code, p.percent_off]));
      }
    }
    return true;
  }

  /* ------------------------------------------------ checkout (shop) ---- */
  async function checkPromo(code) {
    code = (code || "").toUpperCase();
    if (!code) return 0;
    if (LIVE) {
      const sb = await client();
      const pct = await q(sb.rpc("check_promo", { p_code: code }));
      return pct || 0;
    }
    return (S.promoCodes || {})[code] || 0;
  }

  // Records a placed order. Live: server re-prices it and returns the real
  // total. Demo: saved into the demo database so it shows in the admin.
  async function placeOrder(order) {
    if (LIVE) {
      const sb = await client();
      const res = await q(sb.rpc("place_order", { payload: {
        items: order.items.map(i => ({ id: i.id, colour: i.colour, size: i.size, qty: i.qty })),
        customer: order.customer, promo: order.promo, ship: order.shipId, shipLabel: order.ship, pay: order.pay
      } }));
      return res;
    }
    const db = readDemo();
    if (!db) return null;
    const c = order.customer;
    let cust = db.customers.find(x => x.email && x.email === (c.email || "").toLowerCase());
    const fields = { email: (c.email || "").toLowerCase(), phone: c.phone, first_name: c.first, last_name: c.last, address: c.address, city: c.city, state: c.state, country: c.country };
    if (cust) Object.assign(cust, fields);
    else { cust = { id: uid(), notes: "", tags: [], marketing: false, created_at: new Date().toISOString(), ...fields }; db.customers.push(cust); }
    db.orders.unshift({
      id: order.id, customer_id: cust.id, items: order.items, subtotal: order.subtotal, discount: order.discount,
      promo_code: order.promo || null, shipping_method: order.ship, shipping_cost: order.shipCost, total: order.total,
      currency: "NGN", payment_method: order.pay, payment_status: order.pay === "card" && order.paymentRef ? "paid" : "unpaid",
      status: "new", address: c, notes: c.notes || "", internal_notes: "", created_at: order.date, updated_at: order.date
    });
    if (order.pay === "card" && order.paymentRef) {
      db.payments.unshift({ id: uid(), order_id: order.id, provider: "paystack", reference: order.paymentRef, amount: order.total, status: "success", verified: false, created_at: order.date });
    }
    writeDemo(db);
    return { id: order.id, total: order.total };
  }

  window.Backend = {
    LIVE, PERMISSIONS, ROLES, can, toShop, fromStatic, client, q, uid,
    readDemo, writeDemo, seedDemo, demoDb, loadCatalogue, placeOrder, checkPromo,
    resetDemo() { try { localStorage.removeItem(DEMO_KEY); } catch (e) { /* ignore */ } }
  };
})();
