import { useCallback, useEffect, useRef, useState } from "react";
import { cachedFetch, getCached, invalidate, subscribeApiCache } from "./apiCache.js";

// React hook em cima do apiCache.
// Uso típico:
//   const { data, loading, error, refresh } = useCachedApi(
//     `customers:${auth.token}`,
//     () => apiRequest("/customers", { headers: { Authorization: `Bearer ${auth.token}` } }),
//     { ttlMs: 60_000, enabled: Boolean(auth.token) }
//   );
export function useCachedApi(key, loader, { ttlMs = 60_000, enabled = true } = {}) {
  const [data, setData] = useState(() => (enabled && key ? getCached(key) : undefined));
  const [loading, setLoading] = useState(() => enabled && key && getCached(key) === undefined);
  const [error, setError] = useState(null);

  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(
    async ({ force = false } = {}) => {
      if (!enabled || !key) return;
      setLoading(true);
      setError(null);
      try {
        const value = await cachedFetch(key, () => loaderRef.current(), { ttlMs, force });
        setData(value);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [enabled, key, ttlMs],
  );

  useEffect(() => {
    if (!enabled || !key) return undefined;
    const cached = getCached(key);
    if (cached !== undefined) {
      setData(cached);
      setLoading(false);
      return undefined;
    }
    run();
    return undefined;
  }, [enabled, key, run]);

  useEffect(() => {
    if (!key) return undefined;
    return subscribeApiCache((event, evtKey) => {
      if (evtKey === key || evtKey === "*" || (evtKey && key.startsWith(evtKey))) {
        if (event === "invalidate" || event === "clear") {
          run();
        } else if (event === "set") {
          const next = getCached(key);
          if (next !== undefined) setData(next);
        }
      }
    });
  }, [key, run]);

  const refresh = useCallback(() => run({ force: true }), [run]);
  const drop = useCallback(() => invalidate(key), [key]);

  return { data, loading, error, refresh, drop };
}
