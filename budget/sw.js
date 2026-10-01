// Budget Partner service worker: works offline and shows daily reminders.
const SHELL = "bp-shell-v1";
const META = "bp-meta";
const ASSETS = [
  "./", "index.html", "app.css", "config.js", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png",
  "js/app.js", "js/util.js", "js/store.js", "js/auth.js", "js/charts.js", "js/export.js", "js/ai.js", "js/reminders.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== META).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// App files: serve from cache straight away, refresh the cache in the background.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || !url.href.startsWith(self.registration.scope)) return;
  e.respondWith(
    caches.open(SHELL).then(async (cache) => {
      const key = e.request.mode === "navigate" ? "index.html" : e.request;
      const hit = await cache.match(key, { ignoreSearch: true });
      const net = fetch(e.request)
        .then((res) => { if (res.ok && e.request.mode !== "navigate") cache.put(e.request, res.clone()); return res; })
        .catch(() => hit);
      return hit || net;
    })
  );
});

// Daily reminder while the app is closed (installed app, browsers with periodic background sync).
async function remindIfDue() {
  const cache = await caches.open(META);
  const url = new URL("__meta", self.registration.scope).href;
  const res = await cache.match(url);
  if (!res) return;
  const meta = await res.json();
  if (!meta.on) return;
  const now = new Date();
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [h, m] = (meta.time || "20:00").split(":").map(Number);
  if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;
  if (meta.checkedIn === day || meta.notified === day) return;
  await self.registration.showNotification(meta.title || "Time for your daily money check-in", {
    body: meta.body || "Log what you spent today.",
    icon: "icon-192.png", badge: "icon-192.png", tag: "daily-checkin", renotify: true, data: { url: "./#home" }
  });
  meta.notified = day;
  await cache.put(url, new Response(JSON.stringify(meta), { headers: { "Content-Type": "application/json" } }));
}
self.addEventListener("periodicsync", (e) => {
  if (e.tag === "daily-checkin") e.waitUntil(remindIfDue());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = new URL(e.notification.data?.url || "./", self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if (c.url.startsWith(self.registration.scope)) return c.focus().then((w) => w.navigate?.(target));
      return self.clients.openWindow(target);
    })
  );
});
