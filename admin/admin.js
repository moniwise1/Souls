/* ==========================================================================
   Souls by Zamani — admin backend
   Dashboard · Orders · Products · Categories · Customers · Payments ·
   Discounts · Staff & roles · Settings · Activity log
   Works live against Supabase (see ADMIN.md) or in demo mode in the browser.
   ========================================================================== */
(function () {
  const B = window.Backend;
  const LIVE = B.LIVE;
  const COLOURS = window.COLOURS;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const naira = n => "₦" + Math.round(Number(n) || 0).toLocaleString("en-NG");
  const date = d => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
  const dateTime = d => d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const imgSrc = u => !u ? "" : /^(https?:|data:|\/)/.test(u) ? u : "../" + u;
  const clone = o => JSON.parse(JSON.stringify(o));

  const I = {
    dashboard: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
    orders: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
    products: '<path d="M2 17h20l-2-5-6-1-4-5H4z"/><path d="M2 17v2h20v-2"/>',
    categories: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
    customers: '<circle cx="9" cy="8" r="4"/><path d="M1 21a8 8 0 0 1 16 0M17 3a4 4 0 0 1 0 8M23 21a8 8 0 0 0-5-7.4"/>',
    payments: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    discounts: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.5"/>',
    staff: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.8 1.2V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-2.8-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.2 15H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9.9 3.2V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 2.8 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.8H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
    store: '<path d="M3 9 5 3h14l2 6M3 9h18v12H3zM9 21v-6h6v6"/>'
  };
  const icon = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;
  const SOLE = "M30 3 C45 3 53 15 53 31 C53 43 48 51 45 58 C43 64 44 71 44 79 C44 90 38 97 30 97 C22 97 16 90 16 79 C16 71 17 64 15 58 C12 51 7 43 7 31 C7 15 15 3 30 3 Z";
  const mark = (fill, s) => `<svg viewBox="0 0 60 100"><path d="${SOLE}" fill="${fill}"/><path d="${SOLE}" fill="none" stroke="${s}" stroke-width="1.4" stroke-dasharray="2.4 2.2" transform="translate(4.2 7) scale(.86)"/><text x="30" y="50" text-anchor="middle" font-family="Cormorant Garamond,Georgia,serif" font-size="42" font-weight="600" fill="${s === "#d7b56d" ? "#fbf8f3" : "#1e1611"}">S</text></svg>`;

  /* ================================================================ API === */
  const KEYS = { products: "id", categories: "key", customers: "id", orders: "id", payments: "id", promo_codes: "code", roles: "key", staff: "user_id" };
  const ORDER = { products: ["sort", false], categories: ["sort", true], customers: ["created_at", false], orders: ["created_at", false], payments: ["created_at", false], promo_codes: ["created_at", false], roles: ["created_at", true], staff: ["created_at", true], audit_log: ["created_at", false] };

  const demo = {
    db: () => B.demoDb(),
    async list(t) { return clone(this.db()[t] || []); },
    async save(t, row) {
      const db = this.db(), k = KEYS[t], list = db[t];
      if (!row[k]) row[k] = B.uid();
      const i = list.findIndex(r => r[k] === row[k]);
      const now = new Date().toISOString();
      if (i >= 0) list[i] = { ...list[i], ...row, updated_at: now };
      else list.unshift({ created_at: now, ...row });
      B.writeDemo(db);
      return clone(list[i >= 0 ? i : 0]);
    },
    async remove(t, key) { const db = this.db(); db[t] = db[t].filter(r => r[KEYS[t]] !== key); B.writeDemo(db); },
    async settings() { return clone(this.db().settings); },
    async setSetting(key, value) { const db = this.db(); db.settings[key] = value; B.writeDemo(db); },
    async log(action, entity, id, details) {
      const db = this.db();
      db.audit_log.unshift({ id: Date.now(), actor_email: session.email, action, entity, entity_id: id, details, created_at: new Date().toISOString() });
      db.audit_log = db.audit_log.slice(0, 500);
      B.writeDemo(db);
    },
    async upload(file) { return resizeImage(file, 900, "data"); }
  };

  const live = {
    async list(t) {
      const sb = await B.client(); const [col, asc] = ORDER[t] || ["created_at", false];
      return B.q(sb.from(t).select("*").order(col, { ascending: asc }).range(0, 1999));
    },
    async save(t, row) {
      const sb = await B.client();
      const clean = { ...row }; delete clean._cat_art;
      return B.q(sb.from(t).upsert(clean, { onConflict: KEYS[t] }).select().single());
    },
    async remove(t, key) { const sb = await B.client(); await B.q(sb.from(t).delete().eq(KEYS[t], key)); },
    async settings() { const sb = await B.client(); const rows = await B.q(sb.from("settings").select("*")); return Object.fromEntries(rows.map(r => [r.key, r.value])); },
    async setSetting(key, value) { const sb = await B.client(); await B.q(sb.from("settings").upsert({ key, value })); },
    async log(action, entity, id, details) { try { const sb = await B.client(); await sb.rpc("log_action", { p_action: action, p_entity: entity, p_entity_id: String(id || ""), p_details: details || null }); } catch (e) { /* non-fatal */ } },
    async upload(file, path) {
      const blob = await resizeImage(file, 1400, "blob");
      const sb = await B.client();
      const name = `${path}-${Date.now()}.webp`;
      await B.q(sb.storage.from("product-images").upload(name, blob, { contentType: "image/webp", upsert: true }));
      return sb.storage.from("product-images").getPublicUrl(name).data.publicUrl;
    }
  };
  const API = LIVE ? live : demo;

  function resizeImage(file, max, as) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        if (as === "data") resolve(c.toDataURL("image/webp", 0.82));
        else c.toBlob(b => b ? resolve(b) : reject(new Error("Could not process image")), "image/webp", 0.86);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => reject(new Error("That file isn't an image we can read."));
      img.src = URL.createObjectURL(file);
    });
  }

  /* =============================================================== auth === */
  // Live: Supabase Auth (email + password, email invitations, password reset,
  // optional two-step verification). Demo: a local preview with sample data.
  const session = { user: null, email: "", name: "", role: null, staff: null };
  const DEMO_SESSION = "sbz_admin_demo_role";
  let authLink = null; // "invite" | "recovery" when the page was opened from an email link

  // Read an email link (#access_token=…&type=invite) before the router sees it.
  (function readAuthLink() {
    const h = new URLSearchParams(location.hash.replace(/^#/, ""));
    if (h.get("access_token") || h.get("error_description")) {
      authLink = h.get("type") || (h.get("error_description") ? "error:" + h.get("error_description") : null);
    }
  })();

  async function restoreSession() {
    if (!LIVE) {
      const r = sessionStorage.getItem(DEMO_SESSION);
      if (r) await startDemo(r);
      return !!session.role;
    }
    const sb = await B.client();
    const { data } = await sb.auth.getSession();       // also consumes tokens from email links
    if (authLink) history.replaceState(null, "", location.pathname + location.search);
    if (!data.session) return false;
    session.user = data.session.user; session.email = data.session.user.email;
    return true;
  }

  async function startDemo(roleKey) {
    const roles = await demo.list("roles");
    const role = roles.find(r => r.key === roleKey) || roles[0];
    Object.assign(session, { user: { id: "demo" }, email: "zamani@soulsbyzamani.com", name: "Zamani (preview)", role });
    sessionStorage.setItem(DEMO_SESSION, role.key);
  }

  async function loadStaff() {
    const sb = await B.client();
    const staff = await B.q(sb.from("staff").select("*").eq("user_id", session.user.id).maybeSingle());
    session.staff = staff;
    if (!staff || !staff.active || !staff.role) { session.role = null; return; }
    session.role = await B.q(sb.from("roles").select("*").eq("key", staff.role).single());
    session.name = staff.name || session.email;
    sb.rpc("touch_me").then(() => {}, () => {});
  }

  const can = p => B.can(session.role, p);

  const authBox = (inner) => `
    <div class="auth"><div class="auth__box">
      <div class="auth__logo">${mark("#8b4a22", "#d7b56d")}<div><strong>SOULS</strong><span>by Zamani · Admin</span></div></div>
      ${inner}
    </div></div>`;
  const note = msg => msg ? `<div class="notice ${msg.bad ? "notice--bad" : "notice--info"}">${esc(msg.text)}</div>` : "";

  function renderLogin(mode, msg) {
    mode = mode || "signin";
    if (!LIVE) {
      $("#app").innerHTML = authBox(`
        <h2>Sign in</h2>
        <div class="notice">Team sign-in isn't switched on yet. It starts working once the store's secure database is connected (see <b>ADMIN.md</b>, about 15 minutes).</div>
        <form id="auth-form">
          <div class="field"><label>Email</label><input class="input" type="email" disabled placeholder="you@example.com"></div>
          <div class="field"><label>Password</label><input class="input" type="password" disabled placeholder="••••••••"></div>
          <button class="btn btn--primary" type="button" disabled>Sign in</button>
        </form>
        <p class="auth__alt"><button type="button" id="preview">Preview the admin with sample data</button><br><a href="../index.html">← Back to the shop</a></p>`);
      $("#preview").onclick = async () => { await startDemo("owner"); await demo.log("opened preview", "staff", session.email, {}); boot(); };
      return;
    }
    const views = {
      signin: `<h2>Sign in</h2>${note(msg)}
        <form id="auth-form">
          <div class="field"><label>Email</label><input class="input" name="email" type="email" autocomplete="username" required autofocus></div>
          <div class="field"><label>Password</label><input class="input" name="password" type="password" autocomplete="current-password" required></div>
          <button class="btn btn--primary" type="submit">Sign in</button>
        </form>
        <p class="auth__alt"><button type="button" data-mode="reset">Forgot your password?</button></p>
        <p class="auth__alt" id="setup-link" hidden><button type="button" data-mode="setup">First time? Set up the owner account</button></p>`,
      reset: `<h2>Reset your password</h2>${note(msg)}<p>Enter your email and we'll send you a link to choose a new password.</p>
        <form id="auth-form"><div class="field"><label>Email</label><input class="input" name="email" type="email" required autofocus></div>
        <button class="btn btn--primary" type="submit">Send reset link</button></form>
        <p class="auth__alt"><button type="button" data-mode="signin">Back to sign in</button></p>`,
      setup: `<h2>Set up the owner account</h2>${note(msg)}<p>This is a one-time step for the store owner. After this, new team members join by invitation only.</p>
        <form id="auth-form">
          <div class="field"><label>Your name</label><input class="input" name="name" required></div>
          <div class="field"><label>Email</label><input class="input" name="email" type="email" autocomplete="username" required></div>
          <div class="field"><label>Password (at least 10 characters)</label><input class="input" name="password" type="password" minlength="10" autocomplete="new-password" required></div>
          <button class="btn btn--primary" type="submit">Create owner account</button></form>
        <p class="auth__alt"><button type="button" data-mode="signin">Back to sign in</button></p>`
    };
    $("#app").innerHTML = authBox(views[mode]);
    $$("[data-mode]").forEach(b => b.onclick = () => renderLogin(b.dataset.mode));
    if (mode === "signin") B.client().then(sb => sb.rpc("store_has_owner")).then(r => { if (r && r.data === false) $("#setup-link").hidden = false; }).catch(() => {});
    $("#auth-form").addEventListener("submit", async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target).entries());
      const btn = $("button[type=submit]", e.target); btn.disabled = true;
      try {
        const sb = await B.client();
        if (mode === "signin") {
          const { data, error } = await sb.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
          if (error) throw new Error(error.message === "Invalid login credentials" ? "That email and password don't match." : error.message);
          session.user = data.user; session.email = data.user.email;
          return afterSignIn();
        }
        if (mode === "reset") {
          const { error } = await sb.auth.resetPasswordForEmail(f.email.trim(), { redirectTo: location.href.split("#")[0] });
          if (error) throw error;
          return renderLogin("signin", { text: "If that email belongs to a team member, a reset link is on its way." });
        }
        if (mode === "setup") {
          const { data, error } = await sb.auth.signUp({ email: f.email.trim(), password: f.password, options: { data: { name: f.name }, emailRedirectTo: location.href.split("#")[0] } });
          if (error) throw error;
          if (!data.session) return renderLogin("signin", { text: "Check your email to confirm your address, then sign in here." });
          session.user = data.user; session.email = data.user.email;
          await B.q(sb.rpc("claim_owner"));
          await B.q(sb.rpc("update_my_profile", { p_name: f.name }));
          return afterSignIn();
        }
      } catch (err) { renderLogin(mode, { text: err.message, bad: true }); }
    });
  }

  // After a password is accepted: ask for the two-step code if the user has one.
  async function afterSignIn() {
    const sb = await B.client();
    const { data } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data && data.nextLevel === "aal2" && data.currentLevel !== "aal2") return renderTwoStep();
    await loadStaff();
    boot();
  }

  async function renderTwoStep(msg) {
    const sb = await B.client();
    const { data } = await sb.auth.mfa.listFactors();
    const factor = (data && data.totp || []).find(f => f.status === "verified");
    $("#app").innerHTML = authBox(`<h2>Two-step verification</h2>${note(msg)}<p>Open your authenticator app and enter the 6-digit code for Souls by Zamani.</p>
      <form id="auth-form"><div class="field"><label>Code</label><input class="input" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required autofocus></div>
      <button class="btn btn--primary" type="submit">Verify</button></form>
      <p class="auth__alt"><button type="button" id="out">Use a different account</button></p>`);
    $("#out").onclick = signOut;
    $("#auth-form").onsubmit = async e => {
      e.preventDefault();
      const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: factor.id, code: new FormData(e.target).get("code") });
      if (error) return renderTwoStep({ text: "That code didn't work. Try the newest one.", bad: true });
      await loadStaff(); boot();
    };
  }

  // Opened from an invitation or reset email: choose a password.
  function renderSetPassword(kind) {
    $("#app").innerHTML = authBox(`<h2>${kind === "invite" ? "Welcome to the team" : "Choose a new password"}</h2>
      ${kind === "invite" ? `<p>You've been invited to the Souls by Zamani admin as <b>${esc(session.email)}</b>. Choose a password to finish setting up your account.</p>` : ""}
      <form id="auth-form">
        <div class="field"><label>New password (at least 10 characters)</label><input class="input" name="p1" type="password" minlength="10" autocomplete="new-password" required autofocus></div>
        <div class="field"><label>Repeat password</label><input class="input" name="p2" type="password" minlength="10" autocomplete="new-password" required></div>
        <button class="btn btn--primary" type="submit">Save password</button></form>`);
    $("#auth-form").onsubmit = async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target).entries());
      if (f.p1 !== f.p2) return toast("The passwords don't match.", true);
      const sb = await B.client();
      const { error } = await sb.auth.updateUser({ password: f.p1 });
      if (error) return toast(error.message, true);
      authLink = null; toast("Password saved.");
      afterSignIn();
    };
  }

  function renderNoAccess() {
    $("#app").innerHTML = authBox(`<h2>No access yet</h2>
      <p>You're signed in as <b>${esc(session.email)}</b>, but this account doesn't have access to the admin, or it has been switched off.</p>
      <div class="notice notice--info">Ask the store owner to invite you from <b>Team &amp; roles</b>.</div>
      <p class="auth__alt"><button type="button" id="out">Sign out</button></p>`);
    $("#out").onclick = signOut;
  }

  async function signOut() {
    if (LIVE) { const sb = await B.client(); await sb.auth.signOut(); }
    sessionStorage.removeItem(DEMO_SESSION);
    Object.assign(session, { user: null, role: null, staff: null, email: "", name: "" });
    history.replaceState(null, "", location.pathname);
    renderLogin();
  }

  /* ============================================================= layout === */
  const SCREENS = [
    { key: "dashboard", label: "Dashboard", perm: "dashboard", group: "Overview" },
    { key: "orders", label: "Orders", perm: "orders.view", group: "Sales" },
    { key: "payments", label: "Payments", perm: "payments.view", group: "Sales" },
    { key: "customers", label: "Customers", perm: "customers.view", group: "Sales" },
    { key: "discounts", label: "Discount codes", perm: "promos.manage", group: "Sales" },
    { key: "products", label: "Products", perm: "products.view", group: "Catalogue" },
    { key: "categories", label: "Categories", perm: "categories.manage", group: "Catalogue" },
    { key: "staff", label: "Team & roles", perm: "staff.manage", group: "Admin" },
    { key: "settings", label: "Store settings", perm: "settings.manage", group: "Admin" },
    { key: "activity", label: "Activity log", perm: "audit.view", group: "Admin" },
    { key: "account", label: "My account", perm: null, group: "Admin", hidden: true }
  ];
  const allowedScreen = s => !s.perm || can(s.perm);

  function shell() {
    const allowed = SCREENS.filter(s => !s.hidden && allowedScreen(s));
    let group = "";
    $("#app").innerHTML = `
      <div class="shell">
        <aside class="side" id="side">
          <a class="side__brand" href="#/dashboard">${mark("#b8913f", "#1e1611")}<div><strong>SOULS</strong><span>by Zamani · Admin</span></div></a>
          <nav class="nav">
            ${allowed.map(s => { const g = s.group !== group ? `<div class="nav__label">${s.group}</div>` : ""; group = s.group; return `${g}<a href="#/${s.key}" data-nav="${s.key}">${icon(s.key)} ${s.label}${s.key === "orders" ? '<span class="count" id="new-orders" hidden></span>' : ""}</a>`; }).join("")}
            <div class="nav__label">Shop</div>
            <a href="../index.html" target="_blank" rel="noopener">${icon("store")} View store</a>
          </nav>
          <div class="side__foot">
            <strong>${esc(session.name || session.email)}</strong>
            <span class="role">${esc(session.role.label)}${session.staff && session.staff.title ? " · " + esc(session.staff.title) : ""}</span>
            <a class="btn btn--sm" href="#/account" style="margin-bottom:6px">My account</a>
            <button class="btn btn--sm" id="signout">Sign out</button>
          </div>
        </aside>
        <div class="main">
          ${LIVE ? "" : `<div class="demo-bar"><b>Preview with sample data</b> Changes stay in this browser. Team sign-in starts when the database is connected (ADMIN.md). <label>Preview as <select id="switch-role">${B.ROLES.map(r => `<option value="${r.key}"${r.key === session.role.key ? " selected" : ""}>${esc(r.label)}</option>`).join("")}</select></label> <button id="reset-demo">Reset sample data</button> <button id="exit-demo">Exit preview</button></div>`}
          <header class="top">
            <button class="btn btn--ghost top__burger" id="burger" aria-label="Menu">${icon("menu")}</button>
            <h1 id="title"></h1>
            <div id="actions" style="display:flex;gap:8px;flex-wrap:wrap"></div>
          </header>
          <div class="content" id="content"></div>
        </div>
      </div>`;
    $("#signout").onclick = signOut;
    $("#burger").onclick = () => $("#side").classList.toggle("is-open");
    if (!LIVE) {
      $("#switch-role").onchange = async e => { await startDemo(e.target.value); boot(); };
      $("#exit-demo").onclick = signOut;
      $("#reset-demo").onclick = () => { if (confirm("Reset all demo data back to the original catalogue? This removes demo orders and changes.")) { B.resetDemo(); B.seedDemo(); route(); toast("Demo data reset."); } };
    }
  }

  function setPage(title, actions) {
    $("#title").textContent = title;
    $("#actions").innerHTML = actions || "";
    document.title = title + " | Souls Admin";
    $("#side").classList.remove("is-open");
  }

  async function route() {
    const key = (location.hash.replace(/^#\//, "").split("?")[0]) || "dashboard";
    const screen = SCREENS.find(s => s.key === key && allowedScreen(s)) || SCREENS.find(s => !s.hidden && allowedScreen(s));
    if (!screen) { $("#content").innerHTML = `<div class="empty">Your role has no screens yet.</div>`; return; }
    $$("[data-nav]").forEach(a => a.classList.toggle("is-on", a.dataset.nav === screen.key));
    $("#content").innerHTML = `<div class="empty">Loading…</div>`;
    try { await VIEWS[screen.key](); }
    catch (e) { console.error(e); $("#content").innerHTML = `<div class="notice notice--bad">Couldn't load this page: ${esc(e.message)}</div>`; }
    updateBadge();
  }

  async function updateBadge() {
    if (!can("orders.view")) return;
    try { const n = (await API.list("orders")).filter(o => o.status === "new").length; const el = $("#new-orders"); if (el) { el.textContent = n; el.hidden = !n; } } catch (e) { /* ignore */ }
  }

  /* ======================================================== ui helpers === */
  let toastTimer;
  function toast(msg, bad) {
    const t = $("#toast"); t.textContent = msg; t.classList.toggle("is-bad", !!bad); t.classList.add("is-on");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("is-on"), 3500);
  }
  function drawer(title, body, foot) {
    closeDrawer();
    document.body.insertAdjacentHTML("beforeend", `<div class="overlay" id="ov"></div><aside class="drawer" id="drawer" role="dialog" aria-modal="true"><div class="drawer__head"><h2>${title}</h2><button class="btn btn--ghost" data-close aria-label="Close">✕</button></div><div class="drawer__body">${body}</div>${foot ? `<div class="drawer__foot">${foot}</div>` : ""}</aside>`);
    $("#ov").onclick = closeDrawer;
    $("#drawer [data-close]").onclick = closeDrawer;
    return $("#drawer");
  }
  function closeDrawer() { $("#ov") && $("#ov").remove(); $("#drawer") && $("#drawer").remove(); }
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });

  const pill = (text, kind) => `<span class="pill ${kind ? "pill--" + kind : ""}">${esc(String(text).replace(/_/g, " "))}</span>`;
  const STATUS_KIND = { new: "info", confirmed: "info", in_production: "warn", ready: "warn", shipped: "info", delivered: "ok", cancelled: "bad", returned: "bad", paid: "ok", unpaid: "warn", pending: "warn", refunded: "bad", failed: "bad", success: "ok", active: "ok", draft: "warn", archived: "" };
  const statusPill = s => pill(s, STATUS_KIND[s]);
  const colourDot = k => `<span class="sw" style="background:${(COLOURS[k] || {}).hex || "#ccc"}" title="${esc((COLOURS[k] || { name: k }).name)}"></span>`;
  const formData = form => Object.fromEntries(new FormData(form).entries());

  function csvDownload(name, rows) {
    if (!rows.length) return toast("Nothing to export.");
    const cols = Object.keys(rows[0]);
    const cell = v => { const s = typeof v === "object" && v !== null ? JSON.stringify(v) : String(v == null ? "" : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const csv = [cols.join(","), ...rows.map(r => cols.map(c => cell(r[c])).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = name; a.click();
  }
  function csvParse(text) {
    const rows = []; let row = [], cur = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === ",") { row.push(cur); cur = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
      else cur += ch;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    const [head, ...body] = rows.filter(r => r.some(c => c.trim()));
    return body.map(r => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] || "").trim()])));
  }
  function pickFile(accept) {
    return new Promise(resolve => {
      const inp = document.createElement("input"); inp.type = "file"; inp.accept = accept;
      inp.onchange = () => resolve(inp.files[0]); inp.click();
    });
  }

  /* ============================================================= views === */
  const VIEWS = {};

  /* ----------------------------------------------------- dashboard ---- */
  VIEWS.dashboard = async () => {
    setPage("Dashboard");
    const [orders, products, customers, payments] = await Promise.all([
      can("orders.view") ? API.list("orders") : [], can("products.view") ? API.list("products") : [],
      can("customers.view") ? API.list("customers") : [], can("payments.view") ? API.list("payments") : []
    ]);
    const now = Date.now(), d30 = now - 30 * 864e5;
    const recent = orders.filter(o => Date.parse(o.created_at) >= d30 && o.status !== "cancelled");
    const paid = orders.filter(o => o.payment_status === "paid");
    const revenue30 = paid.filter(o => Date.parse(o.created_at) >= d30).reduce((n, o) => n + o.total, 0);
    const days = [...Array(30).keys()].map(i => { const d = new Date(now - (29 - i) * 864e5); d.setHours(0, 0, 0, 0); return d; });
    const perDay = days.map(d => orders.filter(o => o.status !== "cancelled" && new Date(o.created_at).toDateString() === d.toDateString()).reduce((n, o) => n + o.total, 0));
    const max = Math.max(1, ...perDay);
    const byStatus = {}; orders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
    const sold = {}; orders.filter(o => o.status !== "cancelled").forEach(o => o.items.forEach(i => { sold[i.name] = (sold[i.name] || 0) + i.qty; }));
    const top = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const topMax = Math.max(1, ...top.map(t => t[1]));
    const awaiting = orders.filter(o => o.payment_status !== "paid" && !["cancelled", "returned"].includes(o.status));

    $("#content").innerHTML = `
      <div class="kpis">
        ${can("orders.view") ? `<div class="card kpi"><span>Sales, last 30 days</span><strong>${naira(recent.reduce((n, o) => n + o.total, 0))}</strong><small>${recent.length} orders</small></div>` : ""}
        ${can("payments.view") ? `<div class="card kpi"><span>Paid, last 30 days</span><strong>${naira(revenue30)}</strong><small>${payments.length} payments recorded</small></div>` : ""}
        ${can("orders.view") ? `<div class="card kpi"><span>Average order</span><strong>${naira(recent.length ? recent.reduce((n, o) => n + o.total, 0) / recent.length : 0)}</strong><small>last 30 days</small></div>` : ""}
        ${can("orders.view") ? `<div class="card kpi"><span>Awaiting payment</span><strong>${awaiting.length}</strong><small>${naira(awaiting.reduce((n, o) => n + o.total, 0))} outstanding</small></div>` : ""}
        ${can("customers.view") ? `<div class="card kpi"><span>Customers</span><strong>${customers.length}</strong><small>${customers.filter(c => Date.parse(c.created_at) >= d30).length} new this month</small></div>` : ""}
        ${can("products.view") ? `<div class="card kpi"><span>Products</span><strong>${products.filter(p => p.status === "active").length}</strong><small>${products.filter(p => p.status === "draft").length} drafts · ${products.filter(p => !p.gallery || !Object.keys(p.gallery).length).length} without photos</small></div>` : ""}
      </div>
      ${can("orders.view") ? `
      <div class="grid2">
        <div class="card"><div class="card__head"><h3>Sales, last 30 days</h3><span class="muted small">${naira(perDay.reduce((a, b) => a + b, 0))}</span></div>
          <div class="card__body"><div class="chart">${perDay.map((v, i) => `<div style="height:${Math.max(1, v / max * 100)}%" data-tip="${days[i].toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: ${naira(v)}"></div>`).join("")}</div>
          <div class="chart-axis"><span>${date(days[0])}</span><span>Today</span></div></div></div>
        <div class="card"><div class="card__head"><h3>Orders by status</h3></div><div class="card__body">
          ${Object.keys(byStatus).length ? `<div class="bars">${Object.entries(byStatus).map(([s, n]) => `<div><span>${statusPill(s)}</span><i><b style="width:${n / orders.length * 100}%"></b></i><span>${n}</span></div>`).join("")}</div>` : `<p class="muted">No orders yet. They'll appear here as soon as customers check out.</p>`}
        </div></div>
      </div>
      <div class="grid2">
        <div class="card"><div class="card__head"><h3>Recent orders</h3><a class="btn btn--sm" href="#/orders">All orders</a></div>
          ${orders.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Order</th><th>Customer</th><th class="hide-sm">Date</th><th>Total</th><th>Status</th></tr></thead><tbody>
          ${orders.slice(0, 8).map(o => `<tr data-order="${esc(o.id)}"><td><b>${esc(o.id)}</b></td><td>${esc(((o.address || {}).first || "") + " " + ((o.address || {}).last || ""))}</td><td class="hide-sm">${date(o.created_at)}</td><td>${naira(o.total)}</td><td>${statusPill(o.status)} ${statusPill(o.payment_status)}</td></tr>`).join("")}
          </tbody></table></div>` : `<div class="empty">No orders yet.</div>`}
        </div>
        <div class="card"><div class="card__head"><h3>Best sellers</h3></div><div class="card__body">
          ${top.length ? `<div class="bars">${top.map(([n, q]) => `<div><span title="${esc(n)}" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(n)}</span><i><b style="width:${q / topMax * 100}%"></b></i><span>${q}</span></div>`).join("")}</div>` : `<p class="muted">Best sellers appear once orders come in.</p>`}
        </div></div>
      </div>` : `<div class="card card__body">Welcome, ${esc(session.name)}. Use the menu to get started.</div>`}`;
    $$("[data-order]").forEach(r => r.onclick = () => openOrder(r.dataset.order));
  };

  /* -------------------------------------------------------- orders ---- */
  const ORDER_STATUSES = ["new", "confirmed", "in_production", "ready", "shipped", "delivered", "cancelled", "returned"];
  const PAY_STATUSES = ["unpaid", "pending", "paid", "refunded", "failed"];
  const PAY_LABEL = { card: "Card (Paystack)", transfer: "Bank transfer", pod: "Pay on delivery", whatsapp: "WhatsApp" };

  VIEWS.orders = async () => {
    setPage("Orders", `<button class="btn" id="exp">${icon("download")} Export CSV</button>`);
    const orders = await API.list("orders");
    const state = { q: "", status: "", pay: "" };
    $("#content").innerHTML = `
      <div class="toolbar">
        <input class="input search grow" id="q" placeholder="Search order number, name, phone or email">
        <select class="select" id="fs"><option value="">All statuses</option>${ORDER_STATUSES.map(s => `<option value="${s}">${s.replace(/_/g, " ")}</option>`).join("")}</select>
        <select class="select" id="fp"><option value="">All payments</option>${PAY_STATUSES.map(s => `<option>${s}</option>`).join("")}</select>
      </div>
      <div class="card"><div class="table-wrap" id="tbl"></div></div>`;
    const draw = () => {
      const q = state.q.toLowerCase();
      const list = orders.filter(o => (!state.status || o.status === state.status) && (!state.pay || o.payment_status === state.pay) &&
        (!q || [o.id, JSON.stringify(o.address)].join(" ").toLowerCase().includes(q)));
      $("#tbl").innerHTML = list.length ? `<table class="t"><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th class="hide-sm">Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>
        ${list.map(o => { const a = o.address || {}; return `<tr data-order="${esc(o.id)}"><td><b>${esc(o.id)}</b></td><td class="nowrap">${dateTime(o.created_at)}</td><td>${esc((a.first || "") + " " + (a.last || ""))}<div class="small muted">${esc(a.phone || "")}</div></td><td class="hide-sm">${o.items.reduce((n, i) => n + i.qty, 0)}</td><td>${naira(o.total)}</td><td>${statusPill(o.payment_status)}<div class="small muted">${esc(PAY_LABEL[o.payment_method] || o.payment_method)}</div></td><td>${statusPill(o.status)}</td></tr>`; }).join("")}
        </tbody></table>` : `<div class="empty">${orders.length ? "No orders match these filters." : "No orders yet. When customers check out, their orders appear here."}</div>`;
      $$("[data-order]").forEach(r => r.onclick = () => openOrder(r.dataset.order, draw, orders));
    };
    $("#q").oninput = e => { state.q = e.target.value; draw(); };
    $("#fs").onchange = e => { state.status = e.target.value; draw(); };
    $("#fp").onchange = e => { state.pay = e.target.value; draw(); };
    $("#exp").onclick = () => csvDownload("orders.csv", orders.map(o => ({ id: o.id, date: o.created_at, customer: `${(o.address || {}).first || ""} ${(o.address || {}).last || ""}`, phone: (o.address || {}).phone, items: o.items.map(i => `${i.qty}x ${i.name} (${i.colour}/${i.size})`).join("; "), subtotal: o.subtotal, discount: o.discount, shipping: o.shipping_cost, total: o.total, payment_method: o.payment_method, payment_status: o.payment_status, status: o.status })));
    const pre = new URLSearchParams(location.hash.split("?")[1] || "").get("id");
    draw();
    if (pre) openOrder(pre, draw, orders);
  };

  async function openOrder(id, redraw, cache) {
    const orders = cache || await API.list("orders");
    const o = orders.find(x => x.id === id);
    if (!o) return toast("Order not found", true);
    const a = o.address || {};
    const pays = can("payments.view") ? (await API.list("payments")).filter(p => p.order_id === o.id) : [];
    const paidSoFar = pays.filter(p => p.status === "success").reduce((n, p) => n + p.amount, 0);
    const editable = can("orders.manage");
    const d = drawer(`Order ${esc(o.id)}`, `
      <div class="section"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${statusPill(o.status)} ${statusPill(o.payment_status)} <span class="muted small">Placed ${dateTime(o.created_at)}</span></div>
        <div class="lines">${o.items.map(i => `<div class="line"><div><b>${esc(i.name)}</b><div class="small muted">${esc((COLOURS[i.colour] || { name: i.colour }).name)}${i.size && i.size !== "One size" ? " · EU " + esc(i.size) : ""}</div></div><div>× ${i.qty}</div><div class="right">${naira(i.price * i.qty)}</div></div>`).join("")}</div>
        <div class="totals"><div><span class="muted">Subtotal</span><span>${naira(o.subtotal)}</span></div>
          ${o.discount ? `<div><span class="muted">Discount ${esc(o.promo_code || "")}</span><span>−${naira(o.discount)}</span></div>` : ""}
          <div><span class="muted">${esc(o.shipping_method)}</span><span>${o.shipping_cost ? naira(o.shipping_cost) : "Free"}</span></div>
          <div class="grand"><span>Total</span><span>${naira(o.total)}</span></div>
          ${pays.length ? `<div><span class="muted">Paid so far</span><span>${naira(paidSoFar)}</span></div>` : ""}</div>
      </div>
      <div class="section"><h3>Customer &amp; delivery</h3>
        <dl class="kv"><dt>Name</dt><dd>${esc(a.first)} ${esc(a.last)}</dd><dt>Phone</dt><dd>${esc(a.phone)} ${a.phone ? `· <a href="https://wa.me/${esc(String(a.phone).replace(/\D/g, "").replace(/^0/, "234"))}" target="_blank" rel="noopener">WhatsApp</a>` : ""}</dd>
        <dt>Email</dt><dd>${esc(a.email || "")}</dd><dt>Address</dt><dd>${esc([a.address, a.city, a.state, a.country].filter(Boolean).join(", "))}</dd>
        <dt>Payment method</dt><dd>${esc(PAY_LABEL[o.payment_method] || o.payment_method)}</dd>${o.notes ? `<dt>Customer note</dt><dd>${esc(o.notes)}</dd>` : ""}</dl>
      </div>
      <form class="section" id="of"><h3>Manage order</h3>
        <div class="fields">
          <div class="field"><label>Order status</label><select class="select" name="status"${editable ? "" : " disabled"}>${ORDER_STATUSES.map(s => `<option value="${s}"${s === o.status ? " selected" : ""}>${s.replace(/_/g, " ")}</option>`).join("")}</select></div>
          <div class="field"><label>Payment status</label><select class="select" name="payment_status"${editable || can("payments.manage") ? "" : " disabled"}>${PAY_STATUSES.map(s => `<option${s === o.payment_status ? " selected" : ""}>${s}</option>`).join("")}</select></div>
          <div class="field field--full"><label>Internal notes (staff only)</label><textarea class="input" name="internal_notes"${editable ? "" : " disabled"}>${esc(o.internal_notes || "")}</textarea></div>
        </div>
      </form>
      ${can("payments.view") ? `<div class="section"><h3>Payments</h3>${pays.length ? `<table class="t"><tbody>${pays.map(p => `<tr class="no-hover"><td>${dateTime(p.created_at)}</td><td>${esc(p.provider)}</td><td>${esc(p.reference || "")}</td><td>${naira(p.amount)}</td><td>${statusPill(p.status)} ${p.verified ? pill("verified", "ok") : ""}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">No payments recorded yet.</p>`}
        ${can("payments.manage") ? `<form id="payf" class="fields" style="margin-top:12px"><div class="field"><label>Amount (₦)</label><input class="input" name="amount" type="number" min="1" value="${Math.max(0, o.total - paidSoFar)}"></div><div class="field"><label>Method</label><select class="select" name="provider"><option value="transfer">Bank transfer</option><option value="cash">Cash</option><option value="pos">POS</option><option value="paystack">Paystack</option></select></div><div class="field field--full"><label>Reference / note</label><input class="input" name="reference" placeholder="e.g. bank transfer narration"></div><div class="field--full"><button class="btn btn--gold" type="submit">Record payment</button></div></form>` : ""}</div>` : ""}`,
      `<button class="btn" id="print">Print invoice</button><span class="spacer"></span>${editable || can("payments.manage") ? `<button class="btn btn--primary" id="save">Save changes</button>` : ""}`);
    const saveBtn = $("#save", d);
    if (saveBtn) saveBtn.onclick = async () => {
      const f = formData($("#of", d));
      const patch = { ...o, ...f };
      await API.save("orders", patch); Object.assign(o, f);
      await API.log("updated order", "order", o.id, f);
      toast("Order updated."); closeDrawer(); redraw ? redraw() : route();
    };
    const pf = $("#payf", d);
    if (pf) pf.onsubmit = async e => {
      e.preventDefault();
      const f = formData(pf); const amount = Number(f.amount);
      if (!amount) return toast("Enter an amount.", true);
      await API.save("payments", { id: B.uid(), order_id: o.id, provider: f.provider, reference: f.reference, amount, status: "success", verified: false, ...(LIVE ? { recorded_by: session.user.id } : {}) });
      if (paidSoFar + amount >= o.total) { o.payment_status = "paid"; if (o.status === "new") o.status = "confirmed"; await API.save("orders", o); }
      await API.log("recorded payment", "order", o.id, { amount, provider: f.provider });
      toast("Payment recorded."); openOrder(o.id, redraw, orders); redraw && redraw();
    };
    $("#print", d).onclick = () => printInvoice(o);
  }

  async function printInvoice(o) {
    const s = await API.settings(); const st = s.store || {}; const a = o.address || {};
    const w = window.open("", "_blank");
    w.document.write(`<!doctype html><title>Invoice ${esc(o.id)}</title><style>body{font-family:Arial,sans-serif;max-width:720px;margin:30px auto;color:#1e1611}h1{font-family:Georgia,serif;letter-spacing:.2em}table{width:100%;border-collapse:collapse;margin:20px 0}td,th{padding:8px;border-bottom:1px solid #ddd;text-align:left}.r{text-align:right}</style>
      <h1>SOULS <small style="font-style:italic;letter-spacing:0;color:#8b4a22">by Zamani</small></h1><p>${esc(st.address || "")}<br>${esc(st.phone || "")} · ${esc(st.email || "")}</p>
      <h2>Invoice ${esc(o.id)}</h2><p>Date: ${date(o.created_at)}<br>Bill to: ${esc(a.first)} ${esc(a.last)}, ${esc([a.address, a.city, a.state, a.country].filter(Boolean).join(", "))}<br>${esc(a.phone || "")}</p>
      <table><tr><th>Item</th><th>Qty</th><th class="r">Amount</th></tr>${o.items.map(i => `<tr><td>${esc(i.name)} (${esc(i.colour)}${i.size !== "One size" ? ", EU " + esc(i.size) : ""})</td><td>${i.qty}</td><td class="r">${naira(i.price * i.qty)}</td></tr>`).join("")}
      <tr><td colspan="2">Subtotal</td><td class="r">${naira(o.subtotal)}</td></tr>${o.discount ? `<tr><td colspan="2">Discount</td><td class="r">−${naira(o.discount)}</td></tr>` : ""}<tr><td colspan="2">${esc(o.shipping_method)}</td><td class="r">${naira(o.shipping_cost)}</td></tr><tr><th colspan="2">Total</th><th class="r">${naira(o.total)}</th></tr></table>
      <p>Payment: ${esc(PAY_LABEL[o.payment_method] || o.payment_method)} · ${esc(o.payment_status)}</p><p>Thank you for choosing handmade.</p><script>print()<\/script>`);
    w.document.close();
  }

  /* ------------------------------------------------------ products ---- */
  VIEWS.products = async () => {
    const edit = can("products.manage");
    setPage("Products", `${edit ? `<button class="btn" id="imp">${icon("upload")} Import CSV</button>` : ""}<button class="btn" id="exp">${icon("download")} Export CSV</button>${edit ? `<button class="btn btn--primary" id="add">${icon("plus")} Add product</button>` : ""}`);
    const [products, cats] = await Promise.all([API.list("products"), API.list("categories")]);
    const catLabel = k => { const c = cats.find(x => x.key === k); return c ? `${c.dept === "shoes" ? (c.gender === "men" ? "Men's " : "Women's ") : ""}${c.label}` : k; };
    const state = { q: "", cat: "", status: "" };
    $("#content").innerHTML = `
      <div class="toolbar">
        <input class="input search grow" id="q" placeholder="Search products or SKU">
        <select class="select" id="fc"><option value="">All categories</option>${catOptions(cats, "")}</select>
        <select class="select" id="fs"><option value="">Any status</option><option>active</option><option>draft</option><option>archived</option></select>
      </div>
      <div class="card"><div class="table-wrap" id="tbl"></div></div>`;
    const draw = () => {
      const q = state.q.toLowerCase();
      const list = products.filter(p => (!state.cat || p.category === state.cat) && (!state.status || p.status === state.status) && (!q || (p.name + " " + (p.sku || "")).toLowerCase().includes(q)));
      $("#tbl").innerHTML = list.length ? `<table class="t"><thead><tr><th></th><th>Product</th><th class="hide-sm">Category</th><th>Price</th><th class="hide-sm">Colours</th><th class="hide-sm">Stock</th><th>Status</th></tr></thead><tbody>
        ${list.map(p => `<tr data-id="${esc(p.id)}"><td><div class="thumb">${thumb(p)}</div></td><td><b>${esc(p.name)}</b><div class="small muted">${esc(p.sku || "")}</div></td><td class="hide-sm">${esc(catLabel(p.category))}</td><td class="nowrap">${naira(p.price)}${p.compare_at ? `<div class="small muted"><s>${naira(p.compare_at)}</s></div>` : ""}</td><td class="hide-sm">${(p.colours || []).map(colourDot).join(" ")}</td><td class="hide-sm">${p.made_to_order ? '<span class="small muted">Made to order</span>' : p.stock}</td><td>${statusPill(p.status)}</td></tr>`).join("")}
        </tbody></table>` : `<div class="empty">No products found.</div>`;
      $$("[data-id]").forEach(r => r.onclick = () => edit ? productForm(products.find(p => p.id === r.dataset.id), cats) : null);
    };
    $("#q").oninput = e => { state.q = e.target.value; draw(); };
    $("#fc").onchange = e => { state.cat = e.target.value; draw(); };
    $("#fs").onchange = e => { state.status = e.target.value; draw(); };
    if (edit) $("#add").onclick = () => productForm(null, cats);
    $("#exp").onclick = () => csvDownload("products.csv", products.map(p => ({ id: p.id, sku: p.sku, name: p.name, category: p.category, price: p.price, compare_at: p.compare_at || "", colours: (p.colours || []).join("|"), sizes: (p.sizes || []).join("|"), material: p.material, badges: (p.badges || []).join("|"), stock: p.stock, status: p.status, description: p.description })));
    if (edit) $("#imp").onclick = async () => {
      const file = await pickFile(".csv,text/csv"); if (!file) return;
      const rows = csvParse(await file.text()); let n = 0;
      for (const r of rows) {
        const c = cats.find(x => x.key === r.category);
        if (!r.name || !c) continue;
        const ex = products.find(p => p.id === (r.id || slug(r.name)));
        const row = { ...(ex || {}), id: r.id || slug(r.name), sku: r.sku || (ex && ex.sku) || "SBZ-" + Date.now().toString().slice(-5) + n, name: r.name, category: c.key, gender: c.gender, dept: c.dept,
          price: Number(r.price) || 0, compare_at: Number(r.compare_at) || null, colours: (r.colours || "").split("|").filter(Boolean),
          sizes: r.sizes ? r.sizes.split("|") : defaultSizes(c), material: r.material || "", badges: (r.badges || "").split("|").filter(Boolean),
          stock: Number(r.stock) || 0, status: r.status || "active", description: r.description || "", gallery: (ex && ex.gallery) || {}, made_to_order: ex ? ex.made_to_order : true, sort: ex ? ex.sort : Date.now() / 1e5 };
        await API.save("products", row); n++;
      }
      await API.log("imported products", "product", "", { count: n });
      toast(`Imported ${n} product${n === 1 ? "" : "s"}.`); route();
    };
    draw();
  };

  function thumb(p) {
    const g = p.gallery || {}; const first = Object.values(g)[0];
    if (first && first[0]) return `<img src="${esc(imgSrc(first[0]))}" alt="" loading="lazy">`;
    const cat = (window.CATEGORIES || {})[p.category] || {};
    return window.ART.svg(p.art || p._cat_art || cat.art || "oxford", (p.colours || [])[0] || "cognac");
  }
  function catOptions(cats, sel) {
    const groups = {};
    cats.forEach(c => { const g = c.dept === "shoes" ? (c.gender === "men" ? "Men's shoes" : "Women's shoes") : c.dept === "bags" ? "Bags" : "Accessories"; (groups[g] = groups[g] || []).push(c); });
    return Object.entries(groups).map(([g, list]) => `<optgroup label="${g}">${list.map(c => `<option value="${esc(c.key)}"${c.key === sel ? " selected" : ""}>${esc(c.label)}</option>`).join("")}</optgroup>`).join("");
  }
  const defaultSizes = c => c.dept === "shoes" ? (window.SIZES[c.gender] || []).slice() : ["One size"];

  function productForm(p, cats) {
    const isNew = !p;
    p = p ? clone(p) : { id: "", sku: "SBZ-" + String(Date.now()).slice(-5), name: "", category: cats[0] && cats[0].key, price: 0, compare_at: null, colours: [], sizes: [], material: "", description: "", badges: [], gallery: {}, stock: 0, made_to_order: true, status: "draft" };
    if (!p.gallery) p.gallery = {};
    const d = drawer(isNew ? "Add product" : `Edit: ${esc(p.name)}`, `
      <form id="pf">
        <div class="section"><h3>Details</h3><div class="fields">
          <div class="field field--full"><label>Product name *</label><input class="input" name="name" value="${esc(p.name)}" required placeholder="e.g. The Adeyemi Oxford"></div>
          <div class="field"><label>Category *</label><select class="select" name="category" id="pcat">${catOptions(cats, p.category)}</select><span class="hint" id="catinfo"></span></div>
          <div class="field"><label>Status</label><select class="select" name="status">${["active", "draft", "archived"].map(s => `<option${s === p.status ? " selected" : ""}>${s}</option>`).join("")}</select><span class="hint">Only "active" products show in the shop.</span></div>
          <div class="field"><label>Price (₦) *</label><input class="input" name="price" type="number" min="0" step="500" value="${p.price || ""}" required></div>
          <div class="field"><label>Compare-at price (₦)</label><input class="input" name="compare_at" type="number" min="0" step="500" value="${p.compare_at || ""}"><span class="hint">Set higher than the price to show it on sale.</span></div>
          <div class="field"><label>SKU</label><input class="input" name="sku" value="${esc(p.sku || "")}"></div>
          <div class="field"><label>Web address</label><input class="input" name="id" value="${esc(p.id)}" placeholder="auto from name"${isNew ? "" : " readonly"}></div>
          <div class="field field--full"><label>Material</label><input class="input" name="material" value="${esc(p.material || "")}" placeholder="e.g. Full-grain calf leather, leather sole"></div>
          <div class="field field--full"><label>Description</label><textarea class="input" name="description" placeholder="Leave empty to use the standard handmade description.">${esc(p.description || "")}</textarea></div>
        </div></div>
        <div class="section"><h3>Colours</h3><div class="checks">${Object.entries(COLOURS).map(([k, c]) => `<label class="check"><input type="checkbox" name="colours" value="${k}"${(p.colours || []).includes(k) ? " checked" : ""}> <span class="sw" style="background:${c.hex}"></span> ${esc(c.name)}</label>`).join("")}</div></div>
        <div class="section"><h3>Sizes</h3><div class="checks" id="sizes"></div></div>
        <div class="section"><h3>Photos</h3><p class="hint">Add photos for each colour. The first photo is the main one. Tip: photos on a plain background look best.</p><div id="photos"></div></div>
        <div class="section"><h3>Labels &amp; stock</h3><div class="fields">
          <div class="field field--full"><div class="checks">${["new", "bestseller", "handmade"].map(b => `<label class="check"><input type="checkbox" name="badges" value="${b}"${(p.badges || []).includes(b) ? " checked" : ""}> ${b === "handmade" ? "Artisan special" : b[0].toUpperCase() + b.slice(1)}</label>`).join("")}</div></div>
          <div class="field"><label class="check" style="border:0;padding:0"><input type="checkbox" name="made_to_order" value="1"${p.made_to_order ? " checked" : ""}> Made to order (no stock limit)</label></div>
          <div class="field"><label>Stock on hand</label><input class="input" name="stock" type="number" min="0" value="${p.stock || 0}"></div>
        </div></div>
      </form>`,
      `${isNew ? "" : `<button class="btn btn--danger" id="del">Delete</button><button class="btn" id="dup">Duplicate</button>`}<span class="spacer"></span><button class="btn" data-close>Cancel</button><button class="btn btn--primary" id="save">${isNew ? "Add product" : "Save product"}</button>`);
    $("#drawer .drawer__foot [data-close]").onclick = closeDrawer;
    const form = $("#pf", d);
    const catOf = () => cats.find(c => c.key === $("#pcat", d).value) || {};
    const drawSizes = keep => {
      const c = catOf(); const all = c.dept === "shoes" ? window.SIZES[c.gender] : ["One size"];
      const chosen = keep && p.sizes && p.sizes.length ? p.sizes : all;
      $("#sizes", d).innerHTML = all.map(s => `<label class="check"><input type="checkbox" name="sizes" value="${s}"${chosen.includes(s) ? " checked" : ""}> ${c.dept === "shoes" ? "EU " : ""}${s}</label>`).join("");
      $("#catinfo", d).textContent = c.key ? `${c.gender === "men" ? "Men" : "Women"} · ${c.dept}` : "";
    };
    $("#pcat", d).onchange = () => drawSizes(false);
    drawSizes(true);
    const colours = () => $$("input[name=colours]:checked", d).map(i => i.value);
    const drawPhotos = () => {
      const list = colours();
      $("#photos", d).innerHTML = list.length ? list.map(c => `
        <div class="photo-colour" data-colour="${c}"><header>${colourDot(c)} ${esc(COLOURS[c].name)}</header><div class="photos">
          ${(p.gallery[c] || []).map((u, i) => `<div class="photo"><img src="${esc(imgSrc(u))}" alt="">${i === 0 ? '<span class="first">Main</span>' : ""}<button type="button" data-rm="${i}" title="Remove">×</button></div>`).join("")}
          <label class="drop">${icon("upload")}<span>Add photos</span><input type="file" accept="image/*" multiple hidden></label>
        </div></div>`).join("") : `<p class="muted">Choose at least one colour above to add photos.</p>`;
      $$(".photo-colour", d).forEach(box => {
        const c = box.dataset.colour;
        $$("[data-rm]", box).forEach(b => b.onclick = () => { p.gallery[c].splice(Number(b.dataset.rm), 1); drawPhotos(); });
        const input = $("input[type=file]", box), drop = $(".drop", box);
        const add = async files => {
          drop.innerHTML = "Uploading…";
          try {
            for (const f of files) {
              const url = await API.upload(f, `${slug(form.elements.name.value || "product")}/${c}`);
              (p.gallery[c] = p.gallery[c] || []).push(url);
            }
          } catch (e) { toast(e.message, true); }
          drawPhotos();
        };
        input.onchange = () => add(Array.from(input.files));
        drop.ondragover = e => { e.preventDefault(); drop.classList.add("is-over"); };
        drop.ondragleave = () => drop.classList.remove("is-over");
        drop.ondrop = e => { e.preventDefault(); add(Array.from(e.dataTransfer.files)); };
      });
    };
    $$("input[name=colours]", d).forEach(i => i.onchange = drawPhotos);
    drawPhotos();

    const collect = () => {
      const f = formData(form); const c = catOf();
      const gallery = {}; colours().forEach(k => { if (p.gallery[k] && p.gallery[k].length) gallery[k] = p.gallery[k]; });
      return { ...p, id: p.id || slug(f.id || f.name), sku: f.sku, name: f.name.trim(), category: c.key, gender: c.gender, dept: c.dept,
        price: Number(f.price) || 0, compare_at: Number(f.compare_at) || null, colours: colours(), sizes: $$("input[name=sizes]:checked", d).map(i => i.value),
        material: f.material, description: f.description, badges: $$("input[name=badges]:checked", d).map(i => i.value),
        made_to_order: !!form.elements.made_to_order.checked, stock: Number(f.stock) || 0, status: f.status, gallery, sort: p.sort || Math.round(Date.now() / 1e5) };
    };
    $("#save", d).onclick = async () => {
      const row = collect();
      if (!row.name) return toast("Give the product a name.", true);
      if (!row.price) return toast("Set a price.", true);
      if (!row.colours.length) return toast("Choose at least one colour.", true);
      try {
        if (isNew && (await API.list("products")).some(x => x.id === row.id)) row.id += "-" + Date.now().toString(36).slice(-3);
        await API.save("products", row);
        await API.log(isNew ? "added product" : "updated product", "product", row.id, { name: row.name, price: row.price, status: row.status });
        toast(isNew ? "Product added." : "Product saved."); closeDrawer(); route();
      } catch (e) { toast(e.message, true); }
    };
    if (!isNew) {
      $("#del", d).onclick = async () => {
        if (!confirm(`Delete "${p.name}"? This can't be undone. Tip: set it to "archived" instead to hide it.`)) return;
        await API.remove("products", p.id); await API.log("deleted product", "product", p.id, { name: p.name });
        toast("Product deleted."); closeDrawer(); route();
      };
      $("#dup", d).onclick = async () => {
        const row = collect(); row.id = row.id + "-copy-" + Date.now().toString(36).slice(-3); row.name += " (copy)"; row.status = "draft"; row.sku = (row.sku || "SBZ") + "-C";
        await API.save("products", row); await API.log("duplicated product", "product", row.id, { from: p.id });
        toast("Copy created as a draft."); closeDrawer(); route();
      };
    }
  }

  /* ---------------------------------------------------- categories ---- */
  const ARTS = ["oxford", "brogue", "monk", "loafer", "driver", "espadrille", "chelsea", "chukka", "combat", "sneaker", "runner", "sandal", "slide", "palm", "mule", "clog", "clogstrap", "fisherman", "doublestrap", "crossslide", "pump", "block", "kitten", "slingback", "heelsandal", "wedge", "flat", "maryjane", "heelmule", "ankleboot", "kneeboot", "tote", "handbag", "shoulder", "crossbody", "clutch", "mini", "bucket", "backpack", "belt", "wallet", "cardholder", "charm", "pouch", "strap"];
  VIEWS.categories = async () => {
    setPage("Categories", `<button class="btn btn--primary" id="add">${icon("plus")} Add category</button>`);
    const [cats, products] = await Promise.all([API.list("categories"), API.list("products")]);
    const count = k => products.filter(p => p.category === k).length;
    const sections = [["Men's shoes", c => c.gender === "men" && c.dept === "shoes"], ["Women's shoes", c => c.gender === "women" && c.dept === "shoes"], ["Bags", c => c.dept === "bags"], ["Accessories", c => c.dept === "accessories"]];
    $("#content").innerHTML = sections.map(([title, fn]) => {
      const list = cats.filter(fn);
      return `<div class="card" style="margin-bottom:16px"><div class="card__head"><h3>${title}</h3><span class="muted small">${list.length} categories</span></div>
        <div class="table-wrap"><table class="t"><thead><tr><th></th><th>Name</th><th class="hide-sm">Menu group</th><th>Products</th></tr></thead><tbody>
        ${list.map(c => `<tr data-key="${esc(c.key)}"><td><div class="thumb">${window.ART.svg(c.art, "cognac")}</div></td><td><b>${esc(c.label)}</b><div class="small muted">${esc(c.key)}</div></td><td class="hide-sm">${esc(c.grp)}</td><td>${count(c.key)}</td></tr>`).join("") || `<tr class="no-hover"><td colspan="4" class="muted">None yet.</td></tr>`}
        </tbody></table></div></div>`;
    }).join("");
    $$("[data-key]").forEach(r => r.onclick = () => categoryForm(cats.find(c => c.key === r.dataset.key), count(r.dataset.key)));
    $("#add").onclick = () => categoryForm(null, 0);
  };
  function categoryForm(c, n) {
    const isNew = !c;
    c = c || { key: "", label: "", gender: "women", dept: "shoes", grp: "", art: "oxford", sort: Date.now() % 100000 };
    const d = drawer(isNew ? "Add category" : `Edit: ${esc(c.label)}`, `
      <form class="section" id="cf"><div class="fields">
        <div class="field field--full"><label>Name *</label><input class="input" name="label" value="${esc(c.label)}" required placeholder="e.g. Loafers"></div>
        <div class="field"><label>For</label><select class="select" name="gender"><option value="men"${c.gender === "men" ? " selected" : ""}>Men</option><option value="women"${c.gender === "women" ? " selected" : ""}>Women</option></select></div>
        <div class="field"><label>Department</label><select class="select" name="dept">${["shoes", "bags", "accessories"].map(x => `<option${x === c.dept ? " selected" : ""}>${x}</option>`).join("")}</select></div>
        <div class="field"><label>Menu group</label><input class="input" name="grp" value="${esc(c.grp)}" placeholder="e.g. Formal, Boots, Heels"></div>
        <div class="field"><label>Web address</label><input class="input" name="key" value="${esc(c.key)}" placeholder="auto from name"${isNew ? "" : " readonly"}></div>
        <div class="field field--full"><label>Drawing (used when a product has no photo)</label><select class="select" name="art" id="cart">${ARTS.map(a => `<option${a === c.art ? " selected" : ""}>${a}</option>`).join("")}</select><div class="thumb" id="cprev" style="width:120px;height:80px;margin-top:6px"></div></div>
      </div></form>`,
      `${isNew ? "" : `<button class="btn btn--danger" id="del">Delete</button>`}<span class="spacer"></span><button class="btn btn--primary" id="save">Save category</button>`);
    const prev = () => { $("#cprev", d).innerHTML = window.ART.svg($("#cart", d).value, "cognac"); };
    $("#cart", d).onchange = prev; prev();
    $("#save", d).onclick = async () => {
      const f = formData($("#cf", d));
      if (!f.label.trim()) return toast("Name the category.", true);
      if (f.dept !== "shoes" && f.gender === "men") return toast("Bags and accessories are for women only.", true);
      const row = { ...c, ...f, key: c.key || slug(f.key || (f.gender === "men" ? "men-" : "") + f.label) };
      await API.save("categories", row); await API.log(isNew ? "added category" : "updated category", "category", row.key, { label: row.label });
      toast("Category saved."); closeDrawer(); route();
    };
    if (!isNew) $("#del", d).onclick = async () => {
      if (n) return toast(`Move or delete its ${n} product${n === 1 ? "" : "s"} first.`, true);
      if (!confirm(`Delete the "${c.label}" category?`)) return;
      await API.remove("categories", c.key); await API.log("deleted category", "category", c.key, {});
      toast("Category deleted."); closeDrawer(); route();
    };
  }

  /* ----------------------------------------------------- customers ---- */
  VIEWS.customers = async () => {
    const edit = can("customers.manage");
    setPage("Customers", `${edit ? `<button class="btn" id="imp">${icon("upload")} Import CSV</button>` : ""}<button class="btn" id="exp">${icon("download")} Export CSV</button>${edit ? `<button class="btn btn--primary" id="add">${icon("plus")} Add customer</button>` : ""}`);
    const [customers, orders] = await Promise.all([API.list("customers"), can("orders.view") ? API.list("orders") : []]);
    const stats = id => { const os = orders.filter(o => o.customer_id === id && o.status !== "cancelled"); return { n: os.length, spent: os.reduce((s, o) => s + o.total, 0), last: os[0] && os[0].created_at }; };
    let q = "";
    $("#content").innerHTML = `<div class="toolbar"><input class="input search grow" id="q" placeholder="Search name, email, phone or city"></div><div class="card"><div class="table-wrap" id="tbl"></div></div>`;
    const draw = () => {
      const list = customers.filter(c => !q || [c.first_name, c.last_name, c.email, c.phone, c.city].join(" ").toLowerCase().includes(q));
      $("#tbl").innerHTML = list.length ? `<table class="t"><thead><tr><th>Name</th><th class="hide-sm">Email</th><th>Phone</th><th class="hide-sm">Location</th><th>Orders</th><th>Spent</th></tr></thead><tbody>
        ${list.map(c => { const s = stats(c.id); return `<tr data-id="${esc(c.id)}"><td><b>${esc(c.first_name)} ${esc(c.last_name)}</b>${(c.tags || []).map(t => " " + pill(t)).join("")}</td><td class="hide-sm">${esc(c.email)}</td><td>${esc(c.phone)}</td><td class="hide-sm">${esc([c.city, c.state].filter(Boolean).join(", "))}</td><td>${s.n}</td><td>${naira(s.spent)}</td></tr>`; }).join("")}
        </tbody></table>` : `<div class="empty">${customers.length ? "No customers match." : "No customers yet. They're added automatically when someone orders, or you can add or import them."}</div>`;
      $$("[data-id]").forEach(r => r.onclick = () => customerForm(customers.find(c => c.id === r.dataset.id), orders.filter(o => o.customer_id === r.dataset.id), edit));
    };
    $("#q").oninput = e => { q = e.target.value.toLowerCase(); draw(); };
    $("#exp").onclick = () => csvDownload("customers.csv", customers.map(c => ({ first_name: c.first_name, last_name: c.last_name, email: c.email, phone: c.phone, address: c.address, city: c.city, state: c.state, country: c.country, tags: (c.tags || []).join("|"), marketing: c.marketing, orders: stats(c.id).n, spent: stats(c.id).spent, created_at: c.created_at })));
    if (edit) {
      $("#add").onclick = () => customerForm(null, [], true);
      $("#imp").onclick = async () => {
        const file = await pickFile(".csv,text/csv"); if (!file) return;
        const rows = csvParse(await file.text()); let n = 0;
        for (const r of rows) {
          if (!r.email && !r.phone) continue;
          const ex = customers.find(c => (r.email && c.email === r.email.toLowerCase()) || (r.phone && c.phone === r.phone));
          await API.save("customers", { ...(ex || { id: B.uid(), created_at: new Date().toISOString() }), first_name: r.first_name || r.name || "", last_name: r.last_name || "", email: (r.email || "").toLowerCase() || null, phone: r.phone || "", address: r.address || "", city: r.city || "", state: r.state || "", country: r.country || "Nigeria", tags: (r.tags || "").split("|").filter(Boolean), marketing: /^(true|yes|1)$/i.test(r.marketing || ""), notes: r.notes || (ex && ex.notes) || "" });
          n++;
        }
        await API.log("imported customers", "customer", "", { count: n });
        toast(`Imported ${n} customer${n === 1 ? "" : "s"}.`); route();
      };
    }
    draw();
  };
  function customerForm(c, orders, edit) {
    const isNew = !c;
    c = c || { id: B.uid(), first_name: "", last_name: "", email: "", phone: "", address: "", city: "", state: "", country: "Nigeria", notes: "", tags: [], marketing: false };
    const dis = edit ? "" : " disabled";
    const d = drawer(isNew ? "Add customer" : esc(`${c.first_name} ${c.last_name}`), `
      ${!isNew ? `<div class="section"><h3>Orders</h3>${orders.length ? `<table class="t"><tbody>${orders.map(o => `<tr data-order="${esc(o.id)}"><td><b>${esc(o.id)}</b></td><td>${date(o.created_at)}</td><td>${naira(o.total)}</td><td>${statusPill(o.status)}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">No orders yet.</p>`}</div>` : ""}
      <form class="section" id="cuf"><h3>Details</h3><div class="fields">
        <div class="field"><label>First name</label><input class="input" name="first_name" value="${esc(c.first_name)}"${dis}></div>
        <div class="field"><label>Last name</label><input class="input" name="last_name" value="${esc(c.last_name)}"${dis}></div>
        <div class="field"><label>Email</label><input class="input" name="email" type="email" value="${esc(c.email || "")}"${dis}></div>
        <div class="field"><label>Phone / WhatsApp</label><input class="input" name="phone" value="${esc(c.phone)}"${dis}></div>
        <div class="field field--full"><label>Address</label><input class="input" name="address" value="${esc(c.address)}"${dis}></div>
        <div class="field"><label>City</label><input class="input" name="city" value="${esc(c.city)}"${dis}></div>
        <div class="field"><label>State</label><input class="input" name="state" value="${esc(c.state)}"${dis}></div>
        <div class="field"><label>Country</label><input class="input" name="country" value="${esc(c.country)}"${dis}></div>
        <div class="field"><label>Tags</label><input class="input" name="tags" value="${esc((c.tags || []).join(", "))}" placeholder="VIP, wholesale"${dis}></div>
        <div class="field field--full"><label>Notes (sizes, preferences)</label><textarea class="input" name="notes"${dis}>${esc(c.notes || "")}</textarea></div>
        <div class="field field--full"><label class="check" style="border:0;padding:0"><input type="checkbox" name="marketing" value="1"${c.marketing ? " checked" : ""}${dis}> Agreed to receive marketing messages</label></div>
      </div></form>`,
      edit ? `${isNew ? "" : `<button class="btn btn--danger" id="del">Delete</button>`}<span class="spacer"></span><button class="btn btn--primary" id="save">Save customer</button>` : "");
    $$("[data-order]", d).forEach(r => r.onclick = () => { closeDrawer(); location.hash = "#/orders?id=" + r.dataset.order; });
    if (!edit) return;
    $("#save", d).onclick = async () => {
      const f = formData($("#cuf", d));
      const row = { ...c, ...f, email: (f.email || "").toLowerCase() || null, tags: f.tags.split(",").map(t => t.trim()).filter(Boolean), marketing: !!$("#cuf", d).elements.marketing.checked };
      try { await API.save("customers", row); await API.log(isNew ? "added customer" : "updated customer", "customer", row.id, { name: `${row.first_name} ${row.last_name}` }); toast("Customer saved."); closeDrawer(); route(); }
      catch (e) { toast(e.message, true); }
    };
    if (!isNew) $("#del", d).onclick = async () => {
      if (!confirm("Delete this customer? Their past orders are kept.")) return;
      await API.remove("customers", c.id); await API.log("deleted customer", "customer", c.id, {}); toast("Customer deleted."); closeDrawer(); route();
    };
  }

  /* ------------------------------------------------------ payments ---- */
  VIEWS.payments = async () => {
    setPage("Payments", `<button class="btn" id="exp">${icon("download")} Export CSV</button>`);
    const [pays, orders] = await Promise.all([API.list("payments"), API.list("orders")]);
    const total = pays.filter(p => p.status === "success").reduce((n, p) => n + p.amount, 0);
    const byProvider = {}; pays.filter(p => p.status === "success").forEach(p => { byProvider[p.provider] = (byProvider[p.provider] || 0) + p.amount; });
    const unpaid = orders.filter(o => o.payment_status !== "paid" && !["cancelled", "returned"].includes(o.status));
    $("#content").innerHTML = `
      <div class="kpis"><div class="card kpi"><span>Total received</span><strong>${naira(total)}</strong><small>${pays.length} payments</small></div>
        ${Object.entries(byProvider).map(([k, v]) => `<div class="card kpi"><span>${esc(k)}</span><strong>${naira(v)}</strong></div>`).join("")}
        <div class="card kpi"><span>Awaiting payment</span><strong>${naira(unpaid.reduce((n, o) => n + o.total, 0))}</strong><small>${unpaid.length} orders</small></div></div>
      ${!LIVE || true ? `<div class="notice notice--info">Card payments are confirmed automatically once the Paystack webhook is set up (see ADMIN.md). Record bank transfers, cash and POS from the order screen.</div>` : ""}
      <div class="card"><div class="table-wrap">${pays.length ? `<table class="t"><thead><tr><th>Date</th><th>Order</th><th>Method</th><th class="hide-sm">Reference</th><th>Amount</th><th>Status</th></tr></thead><tbody>
        ${pays.map(p => `<tr data-order="${esc(p.order_id || "")}"><td class="nowrap">${dateTime(p.created_at)}</td><td><b>${esc(p.order_id || "")}</b></td><td>${esc(p.provider)}</td><td class="hide-sm">${esc(p.reference || "")}</td><td>${naira(p.amount)}</td><td>${statusPill(p.status)} ${p.verified ? pill("verified", "ok") : ""}</td></tr>`).join("")}
        </tbody></table>` : `<div class="empty">No payments yet.</div>`}</div></div>`;
    $$("[data-order]").forEach(r => r.onclick = () => r.dataset.order && can("orders.view") && (location.hash = "#/orders?id=" + r.dataset.order));
    $("#exp").onclick = () => csvDownload("payments.csv", pays.map(p => ({ date: p.created_at, order: p.order_id, method: p.provider, reference: p.reference, amount: p.amount, status: p.status, verified: p.verified })));
  };

  /* ----------------------------------------------------- discounts ---- */
  VIEWS.discounts = async () => {
    setPage("Discount codes", `<button class="btn btn--primary" id="add">${icon("plus")} New code</button>`);
    const codes = await API.list("promo_codes");
    $("#content").innerHTML = `<div class="card"><div class="table-wrap">${codes.length ? `<table class="t"><thead><tr><th>Code</th><th>Discount</th><th>Used</th><th class="hide-sm">Expires</th><th>Status</th></tr></thead><tbody>
      ${codes.map(c => `<tr data-code="${esc(c.code)}"><td><b>${esc(c.code)}</b></td><td>${c.percent_off}% off</td><td>${c.uses || 0}${c.max_uses ? " / " + c.max_uses : ""}</td><td class="hide-sm">${c.expires_at ? date(c.expires_at) : "Never"}</td><td>${c.active ? pill("active", "ok") : pill("off")}</td></tr>`).join("")}
      </tbody></table>` : `<div class="empty">No discount codes yet.</div>`}</div></div>`;
    const form = c => {
      const isNew = !c; c = c || { code: "", percent_off: 10, active: true, expires_at: null, max_uses: null, uses: 0 };
      const d = drawer(isNew ? "New discount code" : `Code ${esc(c.code)}`, `<form class="section" id="df"><div class="fields">
        <div class="field"><label>Code</label><input class="input" name="code" value="${esc(c.code)}" style="text-transform:uppercase"${isNew ? "" : " readonly"} required></div>
        <div class="field"><label>Percent off</label><input class="input" name="percent_off" type="number" min="1" max="90" value="${c.percent_off}"></div>
        <div class="field"><label>Expires on</label><input class="input" name="expires_at" type="date" value="${c.expires_at ? c.expires_at.slice(0, 10) : ""}"></div>
        <div class="field"><label>Maximum uses</label><input class="input" name="max_uses" type="number" min="1" value="${c.max_uses || ""}" placeholder="Unlimited"></div>
        <div class="field field--full"><label class="check" style="border:0;padding:0"><input type="checkbox" name="active" value="1"${c.active ? " checked" : ""}> Active</label></div></div></form>`,
        `${isNew ? "" : `<button class="btn btn--danger" id="del">Delete</button>`}<span class="spacer"></span><button class="btn btn--primary" id="save">Save code</button>`);
      $("#save", d).onclick = async () => {
        const f = formData($("#df", d)); const code = f.code.trim().toUpperCase().replace(/\s+/g, "");
        if (!code) return toast("Enter a code.", true);
        const row = { ...c, code, percent_off: Math.min(90, Math.max(1, Number(f.percent_off) || 10)), expires_at: f.expires_at ? new Date(f.expires_at + "T23:59:59").toISOString() : null, max_uses: Number(f.max_uses) || null, active: !!$("#df", d).elements.active.checked };
        await API.save("promo_codes", row); await API.log(isNew ? "created discount" : "updated discount", "promo", code, { percent_off: row.percent_off });
        toast("Discount saved."); closeDrawer(); route();
      };
      if (!isNew) $("#del", d).onclick = async () => { if (confirm("Delete this code?")) { await API.remove("promo_codes", c.code); await API.log("deleted discount", "promo", c.code, {}); closeDrawer(); route(); } };
    };
    $("#add").onclick = () => form(null);
    $$("[data-code]").forEach(r => r.onclick = () => form(codes.find(c => c.code === r.dataset.code)));
  };

  /* ------------------------------------------------- team & roles ---- */
  const JOB_TITLES = ["Shoemaker", "Workshop lead", "Store manager", "Sales associate", "Customer care", "Accountant", "Photographer", "Social media", "Delivery coordinator"];
  const staffStatus = s => !s.active ? pill("suspended", "bad") : s.last_seen ? pill("active", "ok") : pill("invited", "warn");

  VIEWS.staff = async () => {
    setPage("Team & roles", `<button class="btn" id="addrole">${icon("plus")} New role</button><button class="btn btn--primary" id="invite">${icon("plus")} Invite team member</button>`);
    const [staff, roles] = await Promise.all([API.list("staff"), API.list("roles")]);
    const isOwner = session.role.key === "owner";
    const roleLabel = k => (roles.find(r => r.key === k) || { label: k || "—" }).label;
    const roleOpts = sel => roles.filter(r => r.key !== "owner" || isOwner).map(r => `<option value="${r.key}"${r.key === sel ? " selected" : ""}>${esc(r.label)}</option>`).join("");
    const me = s => (LIVE ? s.user_id === session.user.id : s.email === session.email);
    $("#content").innerHTML = `
      <div class="card" style="margin-bottom:16px"><div class="card__head"><h3>Team members</h3><span class="muted small">${staff.filter(s => s.active).length} active</span></div>
        <div class="table-wrap"><table class="t"><thead><tr><th>Name</th><th class="hide-sm">Job title</th><th>Role</th><th>Status</th><th class="hide-sm">Last active</th><th></th></tr></thead><tbody>
        ${staff.map(s => `<tr data-uid="${esc(s.user_id)}"><td><b>${esc(s.name || s.email)}</b>${me(s) ? " " + pill("you", "info") : ""}<div class="small muted">${esc(s.email)}</div></td><td class="hide-sm">${esc(s.title || "")}</td><td>${esc(roleLabel(s.role))}</td><td>${staffStatus(s)}</td><td class="hide-sm">${s.last_seen ? dateTime(s.last_seen) : "—"}</td><td class="right">${s.role === "owner" || me(s) ? "" : `<button class="btn btn--sm">Manage</button>`}</td></tr>`).join("") || `<tr class="no-hover"><td colspan="6" class="muted">No team members yet. Invite your first one.</td></tr>`}
        </tbody></table></div></div>
      <div class="card"><div class="card__head"><h3>Roles &amp; permissions</h3><span class="muted small">Tick what each role can do. The owner always has full access.</span></div>
        <div class="table-wrap"><table class="t matrix"><thead><tr><th>Permission</th>${roles.map(r => `<th title="${esc(r.description)}">${esc(r.label)}${r.locked ? "" : ` <button class="btn btn--ghost btn--sm" data-delrole="${esc(r.key)}" title="Delete role">✕</button>`}</th>`).join("")}</tr></thead><tbody>
        ${B.PERMISSIONS.map(([k, label]) => `<tr class="no-hover"><td>${esc(label)}</td>${roles.map(r => `<td><input type="checkbox" data-perm="${k}" data-rk="${esc(r.key)}"${B.can(r, k) ? " checked" : ""}${r.key === "owner" ? " disabled" : ""}></td>`).join("")}</tr>`).join("")}
        </tbody></table></div>
        <div class="card__body" style="text-align:right"><button class="btn btn--primary" id="saveperm">Save permissions</button></div></div>`;

    // Invite ---------------------------------------------------------------
    $("#invite").onclick = () => {
      const d = drawer("Invite team member", `
        <form class="section" id="inv"><div class="fields">
          <div class="field"><label>Full name *</label><input class="input" name="name" required></div>
          <div class="field"><label>Email *</label><input class="input" name="email" type="email" required></div>
          <div class="field"><label>Job title</label><input class="input" name="title" list="titles" placeholder="e.g. Shoemaker"><datalist id="titles">${JOB_TITLES.map(t => `<option value="${t}">`).join("")}</datalist></div>
          <div class="field"><label>Role (what they can do) *</label><select class="select" name="role" id="inv-role">${roleOpts("support").replace(/<option value="owner"[^>]*>[^<]*<\/option>/, "")}</select></div>
          <div class="field field--full"><div class="notice notice--info" id="inv-desc"></div></div>
        </div>
        <p class="hint">They'll receive an email invitation to join the Souls by Zamani admin. The link lets them choose their own password. They can only see and do what their role allows, and you can change this at any time.</p></form>`,
        `<span class="spacer"></span><button class="btn" data-close>Cancel</button><button class="btn btn--primary" id="send">Send invitation</button>`);
      $("#drawer .drawer__foot [data-close]").onclick = closeDrawer;
      const desc = () => { const r = roles.find(x => x.key === $("#inv-role", d).value); $("#inv-desc", d).textContent = r ? `${r.label}: ${r.description || ""}` : ""; };
      $("#inv-role", d).onchange = desc; desc();
      $("#send", d).onclick = async () => {
        const f = formData($("#inv", d));
        if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email)) return toast("Enter their name and a valid email.", true);
        if (staff.some(s => s.email.toLowerCase() === f.email.trim().toLowerCase())) return toast("That person is already on the team.", true);
        const btn = $("#send", d); btn.disabled = true; btn.textContent = "Sending…";
        try {
          if (LIVE) await B.callFunction("invite-staff", { action: "invite", email: f.email.trim().toLowerCase(), name: f.name.trim(), title: f.title.trim(), role: f.role, redirectTo: location.href.split("#")[0] });
          else await API.save("staff", { user_id: B.uid(), email: f.email.trim().toLowerCase(), name: f.name.trim(), title: f.title.trim(), role: f.role, active: true, invited_at: new Date().toISOString(), last_seen: null });
          await API.log("invited team member", "staff", f.email, { role: f.role, title: f.title });
          toast(LIVE ? `Invitation sent to ${f.email}.` : "Added. (In the live admin they receive an email invitation.)");
          closeDrawer(); route();
        } catch (e) { btn.disabled = false; btn.textContent = "Send invitation"; toast(e.message, true); }
      };
    };

    // Manage a member ------------------------------------------------------
    $$("[data-uid]").forEach(row => {
      const s = staff.find(x => x.user_id === row.dataset.uid);
      if (s.role === "owner" || me(s)) { row.classList.add("no-hover"); return; }
      row.onclick = () => {
        const d = drawer(esc(s.name || s.email), `
          <div class="section"><dl class="kv"><dt>Email</dt><dd>${esc(s.email)}</dd><dt>Status</dt><dd>${staffStatus(s)}</dd><dt>Invited</dt><dd>${s.invited_at ? dateTime(s.invited_at) : "—"}</dd><dt>Last active</dt><dd>${s.last_seen ? dateTime(s.last_seen) : "Not signed in yet"}</dd></dl></div>
          <form class="section" id="mf"><div class="fields">
            <div class="field"><label>Name</label><input class="input" name="name" value="${esc(s.name || "")}"></div>
            <div class="field"><label>Job title</label><input class="input" name="title" value="${esc(s.title || "")}" list="titles2"><datalist id="titles2">${JOB_TITLES.map(t => `<option value="${t}">`).join("")}</datalist></div>
            <div class="field field--full"><label>Role</label><select class="select" name="role">${roleOpts(s.role)}</select></div>
          </div></form>`,
          `<button class="btn btn--danger" id="rm">Remove</button><button class="btn" id="sus">${s.active ? "Suspend access" : "Restore access"}</button>${LIVE && !s.last_seen ? `<button class="btn" id="resend">Resend invitation</button>` : ""}<span class="spacer"></span><button class="btn btn--primary" id="save">Save</button>`);
        $("#save", d).onclick = async () => {
          const f = formData($("#mf", d));
          await API.save("staff", { ...s, name: f.name, title: f.title, role: f.role });
          await API.log("updated team member", "staff", s.email, { role: f.role, title: f.title });
          toast("Saved. Their access changes straight away."); closeDrawer(); route();
        };
        $("#sus", d).onclick = async () => {
          await API.save("staff", { ...s, active: !s.active });
          await API.log(s.active ? "suspended team member" : "restored team member", "staff", s.email, {});
          toast(s.active ? "Access suspended." : "Access restored."); closeDrawer(); route();
        };
        const rs = $("#resend", d);
        if (rs) rs.onclick = async () => {
          try { await B.callFunction("invite-staff", { action: "resend", email: s.email, redirectTo: location.href.split("#")[0] }); toast("Invitation sent again."); }
          catch (e) { toast(e.message, true); }
        };
        $("#rm", d).onclick = async () => {
          if (!confirm(`Remove ${s.name || s.email} from the team? Their login is deleted.`)) return;
          try {
            if (LIVE) await B.callFunction("invite-staff", { action: "remove", user_id: s.user_id });
            else await API.remove("staff", s.user_id);
            await API.log("removed team member", "staff", s.email, {});
            toast("Removed."); closeDrawer(); route();
          } catch (e) { toast(e.message, true); }
        };
      };
    });

    // Roles ----------------------------------------------------------------
    $("#saveperm").onclick = async () => {
      for (const r of roles.filter(r => r.key !== "owner")) {
        const perms = $$(`[data-rk="${r.key}"]:checked`).map(i => i.dataset.perm);
        if (perms.join() !== (r.permissions || []).join()) await API.save("roles", { ...r, permissions: perms });
      }
      await API.log("updated permissions", "roles", "", {});
      toast("Permissions saved.");
    };
    $$("[data-delrole]").forEach(b => b.onclick = async () => {
      const key = b.dataset.delrole;
      if (staff.some(s => s.role === key)) return toast("Move team members off this role first.", true);
      if (!confirm("Delete this role?")) return;
      await API.remove("roles", key); await API.log("deleted role", "roles", key, {}); route();
    });
    $("#addrole").onclick = () => {
      const d = drawer("New role", `<form class="section" id="rf"><div class="fields"><div class="field field--full"><label>Role name</label><input class="input" name="label" placeholder="e.g. Workshop lead" required></div><div class="field field--full"><label>What is this role for?</label><input class="input" name="description"></div><div class="field field--full"><label>Start from</label><select class="select" name="base">${roles.filter(r => r.key !== "owner").map(r => `<option value="${r.key}">${esc(r.label)}</option>`).join("")}</select><span class="hint">You can fine-tune permissions in the table afterwards.</span></div></div></form>`, `<span class="spacer"></span><button class="btn btn--primary" id="save">Create role</button>`);
      $("#save", d).onclick = async () => {
        const f = formData($("#rf", d)); if (!f.label.trim()) return toast("Name the role.", true);
        const base = roles.find(r => r.key === f.base);
        await API.save("roles", { key: slug(f.label), label: f.label.trim(), description: f.description, permissions: base ? base.permissions.slice() : ["dashboard"], locked: false });
        await API.log("created role", "roles", slug(f.label), {}); toast("Role created."); closeDrawer(); route();
      };
    };
  };

  /* ---------------------------------------------------- my account ---- */
  VIEWS.account = async () => {
    setPage("My account");
    if (!LIVE) {
      $("#content").innerHTML = `<div class="notice">Password, profile and two-step verification settings are available once team sign-in is switched on (see ADMIN.md).</div>`;
      return;
    }
    const sb = await B.client();
    const { data: fx } = await sb.auth.mfa.listFactors();
    const factor = (fx && fx.totp || []).find(f => f.status === "verified");
    $("#content").innerHTML = `
      <form class="section" id="pf"><h3>Profile</h3><div class="fields">
        <div class="field"><label>Name</label><input class="input" name="name" value="${esc(session.name || "")}"></div>
        <div class="field"><label>Email</label><input class="input" value="${esc(session.email)}" disabled></div>
        <div class="field"><label>Role</label><input class="input" value="${esc(session.role.label)}" disabled></div>
        <div class="field"><label>Job title</label><input class="input" value="${esc((session.staff || {}).title || "")}" disabled></div>
      </div><p><button class="btn btn--primary" type="submit">Save profile</button></p></form>
      <form class="section" id="pw"><h3>Change password</h3><div class="fields">
        <div class="field"><label>New password (at least 10 characters)</label><input class="input" name="p1" type="password" minlength="10" autocomplete="new-password" required></div>
        <div class="field"><label>Repeat new password</label><input class="input" name="p2" type="password" minlength="10" autocomplete="new-password" required></div>
      </div><p><button class="btn btn--primary" type="submit">Change password</button></p></form>
      <div class="section" id="mfa"><h3>Two-step verification</h3>
        ${factor ? `<p>${pill("on", "ok")} Your account asks for a code from your authenticator app when you sign in.</p><button class="btn btn--danger" id="mfa-off">Turn off</button>`
                 : `<p class="muted">Add a second step to your sign-in using an authenticator app (Google Authenticator, Microsoft Authenticator or similar). Strongly recommended for the owner and administrators.</p><button class="btn btn--gold" id="mfa-on">Turn on two-step verification</button>`}
        <div id="mfa-setup"></div></div>`;
    $("#pf").onsubmit = async e => {
      e.preventDefault(); const name = new FormData(e.target).get("name");
      try { await B.q(sb.rpc("update_my_profile", { p_name: name })); session.name = name; toast("Profile saved."); } catch (err) { toast(err.message, true); }
    };
    $("#pw").onsubmit = async e => {
      e.preventDefault(); const f = formData(e.target);
      if (f.p1 !== f.p2) return toast("The passwords don't match.", true);
      const { error } = await sb.auth.updateUser({ password: f.p1 });
      if (error) return toast(error.message, true);
      e.target.reset(); await API.log("changed password", "staff", session.email, {}); toast("Password changed.");
    };
    const off = $("#mfa-off");
    if (off) off.onclick = async () => {
      if (!confirm("Turn off two-step verification?")) return;
      const { error } = await sb.auth.mfa.unenroll({ factorId: factor.id });
      if (error) return toast(error.message, true);
      toast("Two-step verification turned off."); route();
    };
    const on = $("#mfa-on");
    if (on) on.onclick = async () => {
      const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "Souls admin " + Date.now().toString(36) });
      if (error) return toast(error.message, true);
      $("#mfa-setup").innerHTML = `<div class="fields" style="margin-top:14px">
        <div class="field"><span>1. Scan this with your authenticator app</span><img src="${data.totp.qr_code}" alt="QR code" style="width:180px;height:180px;background:#fff;border:1px solid var(--line);border-radius:8px"><span class="hint">Can't scan? Enter this key: <b>${esc(data.totp.secret)}</b></span></div>
        <form class="field" id="mfa-verify"><span>2. Enter the 6-digit code it shows</span><input class="input" name="code" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" required><button class="btn btn--primary" type="submit" style="margin-top:8px">Verify and turn on</button></form></div>`;
      $("#mfa-verify").onsubmit = async e => {
        e.preventDefault();
        const { error: err } = await sb.auth.mfa.challengeAndVerify({ factorId: data.id, code: new FormData(e.target).get("code") });
        if (err) return toast("That code didn't work. Try the newest one.", true);
        await API.log("turned on two-step verification", "staff", session.email, {});
        toast("Two-step verification is on."); route();
      };
    };
  };

  /* ------------------------------------------------------ settings ---- */
  VIEWS.settings = async () => {
    setPage("Store settings", `<button class="btn btn--primary" id="save">Save settings</button>`);
    const s = await API.settings();
    const st = s.store || {}, bank = s.bank || {}, ship = s.shipping || { options: [] };
    $("#content").innerHTML = `
      <form id="setf">
        <div class="section"><h3>Store details</h3><p class="hint">Shown on the website (footer, contact page, WhatsApp buttons and invoices).</p><div class="fields">
          <div class="field"><label>Store name</label><input class="input" name="name" value="${esc(st.name || "")}"></div>
          <div class="field"><label>Tagline</label><input class="input" name="tagline" value="${esc(st.tagline || "")}"></div>
          <div class="field"><label>Email</label><input class="input" name="email" value="${esc(st.email || "")}"></div>
          <div class="field"><label>Phone</label><input class="input" name="phone" value="${esc(st.phone || "")}"></div>
          <div class="field"><label>WhatsApp number</label><input class="input" name="whatsapp" value="${esc(st.whatsapp || "")}" placeholder="2348012345678"><span class="hint">International format, digits only.</span></div>
          <div class="field"><label>Opening hours</label><input class="input" name="hours" value="${esc(st.hours || "")}"></div>
          <div class="field field--full"><label>Address</label><input class="input" name="address" value="${esc(st.address || "")}"></div>
          <div class="field field--full"><label>Paystack public key</label><input class="input" name="paystackPublicKey" value="${esc(st.paystackPublicKey || "")}" placeholder="pk_live_…"><span class="hint">Turns on card, bank and USSD payments at checkout. Only the public key goes here; never paste the secret key.</span></div>
        </div></div>
        <div class="section"><h3>Bank transfer details</h3><div class="fields">
          <div class="field"><label>Bank</label><input class="input" name="bankName" value="${esc(bank.bankName || "")}"></div>
          <div class="field"><label>Account name</label><input class="input" name="accountName" value="${esc(bank.accountName || "")}"></div>
          <div class="field"><label>Account number</label><input class="input" name="accountNumber" value="${esc(bank.accountNumber || "")}"></div>
        </div></div>
        <div class="section"><h3>Delivery</h3><div class="fields"><div class="field"><label>Free delivery in Nigeria over (₦)</label><input class="input" name="freeOver" type="number" value="${ship.freeOver || 0}"></div></div>
          <table class="t" style="margin-top:12px"><thead><tr><th>Option shown at checkout</th><th>Price (₦)</th><th>Excluded from free delivery</th></tr></thead><tbody>
          ${ship.options.map((o, i) => `<tr class="no-hover"><td><input class="input" style="width:100%" name="ship_label_${i}" value="${esc(o.label)}"></td><td><input class="input" name="ship_price_${i}" type="number" value="${o.price}" style="width:120px"></td><td><input type="checkbox" name="ship_nofree_${i}"${o.noFree ? " checked" : ""}></td></tr>`).join("")}
          </tbody></table></div>
      </form>`;
    $("#save").onclick = async () => {
      const f = formData($("#setf"));
      const store = Object.fromEntries(["name", "tagline", "email", "phone", "whatsapp", "hours", "address", "paystackPublicKey"].map(k => [k, f[k] || ""]));
      store.whatsapp = store.whatsapp.replace(/\D/g, "");
      const shipping = { freeOver: Number(f.freeOver) || 0, options: ship.options.map((o, i) => ({ ...o, label: f["ship_label_" + i], price: Number(f["ship_price_" + i]) || 0, noFree: !!f["ship_nofree_" + i] })) };
      await API.setSetting("store", store);
      await API.setSetting("bank", { bankName: f.bankName, accountName: f.accountName, accountNumber: f.accountNumber });
      await API.setSetting("shipping", shipping);
      await API.log("updated settings", "settings", "", {});
      toast("Settings saved. The website uses them straight away.");
    };
  };

  /* ------------------------------------------------------ activity ---- */
  VIEWS.activity = async () => {
    setPage("Activity log");
    const log = await API.list("audit_log");
    $("#content").innerHTML = `<div class="card"><div class="table-wrap">${log.length ? `<table class="t"><thead><tr><th>When</th><th>Who</th><th>What</th><th class="hide-sm">Details</th></tr></thead><tbody>
      ${log.map(l => `<tr class="no-hover"><td class="nowrap">${dateTime(l.created_at)}</td><td>${esc(l.actor_email || "")}</td><td>${esc(l.action)} <b>${esc(l.entity_id || "")}</b></td><td class="hide-sm small muted">${esc(l.details ? JSON.stringify(l.details) : "")}</td></tr>`).join("")}
      </tbody></table>` : `<div class="empty">Nothing recorded yet. Changes made in the admin appear here.</div>`}</div></div>`;
  };

  /* ================================================================ boot === */
  function boot() {
    if (!session.role) {
      if (LIVE && session.user) return renderNoAccess();
      const err = authLink && authLink.startsWith("error:") ? { text: authLink.slice(6).replace(/\+/g, " "), bad: true } : null;
      return renderLogin("signin", err);
    }
    shell();
    route();
  }
  window.addEventListener("hashchange", () => { if (session.role) route(); });

  (async () => {
    try {
      await restoreSession();
      if (LIVE && session.user) {
        if (authLink === "invite" || authLink === "recovery") { await loadStaff().catch(() => {}); return renderSetPassword(authLink); }
        return afterSignIn();
      }
    } catch (e) { console.error(e); return renderLogin("signin", { text: e.message, bad: true }); }
    boot();
  })();
})();
