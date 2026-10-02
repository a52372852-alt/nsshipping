/* Generated with a build-specific allowlist. Never cache uploaded files or user data. */
const VERSION = __VERSION__;
const ASSETS = __ASSETS__;
const SHELLS = ["/", "/my-shipping"];
const CACHE_PREFIX = "ns-shipping-public-shell-";
const CACHE_NAME = CACHE_PREFIX + VERSION;
const allowed = new Set(ASSETS.map((a) => a.url));

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      // Download into a separate version. Activation happens only after every file succeeds.
      for (let i = 0; i < ASSETS.length; i += 4) {
        await Promise.all(ASSETS.slice(i, i + 4).map(async (asset) => {
          const response = await fetch(asset.url, { cache: "reload", credentials: "same-origin" });
          if (!response.ok || response.redirected) throw new Error("Cache download failed");
          const bytes = await response.clone().arrayBuffer();
          if (SHELLS.includes(asset.url)) {
            if (!new TextDecoder().decode(bytes).includes(`name="ns-shell-version" content="${VERSION}"`)) throw new Error("Mixed deployment versions");
          } else {
            const digest = await crypto.subtle.digest("SHA-256", bytes);
            const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
            if (hex !== asset.sha256) throw new Error("Mixed asset versions");
          }
          await cache.put(asset.url, response);
        }));
      }
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Keep one previous complete build for open tabs using its lazy-loaded chunks.
    const names = (await caches.keys()).filter((n) => n.startsWith(CACHE_PREFIX) && n !== CACHE_NAME);
    await Promise.all(names.slice(0, -1).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.search) return;
  const route = url.pathname === "/my-shipping/" ? "/my-shipping" : url.pathname;
  if (request.mode === "navigate" && SHELLS.includes(route)) {
    event.respondWith((async () => {
      try { const cached = await (await caches.open(CACHE_NAME)).match(route); if (cached) return cached; } catch { /* Network fallback. */ }
      return fetch(request);
    })());
  } else if (allowed.has(url.pathname) && !SHELLS.includes(url.pathname)) {
    event.respondWith((async () => {
      try { const cached = await (await caches.open(CACHE_NAME)).match(url.pathname); if (cached) return cached; } catch { /* Network fallback. */ }
      return fetch(request);
    })());
  } else if (url.pathname.startsWith("/_next/static/")) {
    // Only previously precached build assets; never write runtime requests into storage.
    event.respondWith((async () => {
      for (const name of (await caches.keys()).filter((n) => n.startsWith(CACHE_PREFIX))) {
        const hit = await (await caches.open(name)).match(url.pathname);
        if (hit) return hit;
      }
      return fetch(request);
    })());
  }
});
