// Builds supabase/seed.sql from the catalogue in assets/js/data.js.
// Run: node tools/make-seed.js
global.window = { SITE: {} };
require("../assets/js/config.js");
require("../assets/js/data.js");
global.localStorage = { getItem: () => null, setItem() {} };
require("../assets/js/backend.js");
const fs = require("fs");
const w = global.window;
const lit = v => v == null ? "null" : typeof v === "number" ? String(v) : typeof v === "boolean" ? String(v)
  : "'" + String(v).replace(/'/g, "''") + "'";
const arr = a => "array[" + (a || []).map(lit).join(",") + "]::text[]";
const json = o => lit(JSON.stringify(o)) + "::jsonb";
let out = "-- Souls by Zamani — starter catalogue. Run after schema.sql (SQL Editor → paste → Run).\n\n";
Object.entries(w.CATEGORIES).forEach(([k, c], i) => {
  out += `insert into public.categories (key,label,gender,dept,grp,art,sort) values (${[k, c.label, c.gender, c.dept, c.group, c.art].map(lit).join(",")},${i}) on conflict (key) do update set label=excluded.label, grp=excluded.grp, art=excluded.art, sort=excluded.sort;\n`;
});
out += "\n";
w.PRODUCTS.map(w.Backend.fromStatic).forEach(r => {
  out += `insert into public.products (id,sku,name,category,gender,dept,price,compare_at,colours,sizes,material,description,badges,gallery,stock,made_to_order,status,sort,art) values (${[r.id, r.sku, r.name, r.category, r.gender, r.dept, r.price, r.compare_at].map(lit).join(",")},${arr(r.colours)},${arr(r.sizes)},${lit(r.material)},'',${arr(r.badges)},${json(r.gallery)},0,true,'active',${r.sort},${lit(r.art)}) on conflict (id) do nothing;\n`;
});
const st = w.SITE;
out += `\ninsert into public.settings (key,value) values ('store', ${json({ name: st.name, tagline: st.tagline, email: st.email, phone: st.phone, whatsapp: st.whatsapp, address: st.address, hours: st.hours, paystackPublicKey: st.paystackPublicKey })}), ('bank', ${json(st.bank)}), ('currencies', ${json(st.currencies)}) on conflict (key) do nothing;\n`;
fs.writeFileSync(__dirname + "/../supabase/seed.sql", out);
console.log("wrote supabase/seed.sql:", w.PRODUCTS.length, "products,", Object.keys(w.CATEGORIES).length, "categories");
