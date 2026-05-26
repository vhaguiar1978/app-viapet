// Cache leve de respostas de API — pensado pra evitar refetch das listas
// (customers, pets, services, products, etc.) ao navegar entre telas.
//
// Funciona como um "react-query light":
// - Cache em memória (Map) com TTL configurável por chave.
// - Deduplicação de requisições em voo (in-flight) — mesma chave dispara só 1 fetch.
// - Invalidação manual (invalidate / invalidateAll) para depois de mutations.
// - Eventos para que consumidores reajam a atualizações.

const cache = new Map();
const inflight = new Map();
const listeners = new Set();

const DEFAULT_TTL_MS = 60_000;

function emit(eventName, key) {
  for (const fn of listeners) {
    try { fn(eventName, key); } catch { /* ignore */ }
  }
}

export function subscribeApiCache(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

export function setCached(key, value, { ttlMs = DEFAULT_TTL_MS } = {}) {
  cache.set(key, {
    value,
    expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0,
  });
  emit("set", key);
}

export function invalidate(key) {
  cache.delete(key);
  inflight.delete(key);
  emit("invalidate", key);
}

export function invalidateAll(prefix = "") {
  if (!prefix) {
    cache.clear();
    inflight.clear();
    emit("clear", "*");
    return;
  }
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
  for (const key of [...inflight.keys()]) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
  emit("clear", prefix);
}

// Fetch with cache + in-flight dedup.
// loader: () => Promise<T>
// options: { ttlMs?: number, force?: boolean }
export async function cachedFetch(key, loader, { ttlMs = DEFAULT_TTL_MS, force = false } = {}) {
  if (!force) {
    const cached = getCached(key);
    if (cached !== undefined) return cached;
    const pending = inflight.get(key);
    if (pending) return pending;
  }

  const promise = Promise.resolve()
    .then(() => loader())
    .then((value) => {
      setCached(key, value, { ttlMs });
      inflight.delete(key);
      return value;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}
