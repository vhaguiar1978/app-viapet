const prefetchedKeys = new Set();

export function shouldLimitBackgroundPrefetch() {
  if (typeof navigator === "undefined") return false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const effectiveType = String(connection?.effectiveType || "").toLowerCase();
  return Boolean(connection?.saveData) || effectiveType === "slow-2g" || effectiveType === "2g" || effectiveType === "3g";
}

const routePrefetchers = [
  {
    match: (path) => path === "/dashboard" || path === "/admin" || path.startsWith("/admin/"),
    load: () => import("../features/dashboard/DashboardPageView.jsx"),
  },
  {
    match: (path) => path.startsWith("/mensagens"),
    load: () => import("../features/messages/MessagesRoutePage.jsx"),
  },
  {
    match: (path) => path.startsWith("/financeiro"),
    // Prefetch apenas as views mais usadas; cada view agora vive em seu
    // próprio chunk, então não precisamos puxar o monolito inteiro.
    load: () => Promise.all([
      import("../features/finance/views/FinanceSummaryView.jsx"),
      import("../features/finance/views/FinanceSalesView.jsx"),
      import("../features/finance/views/FinancePurchasesView.jsx"),
    ]),
  },
  {
    match: (path) => path.startsWith("/configuracao"),
    load: (path) => Promise.all([
      import("../features/settings/SettingsShell.jsx"),
      import("../features/settings/SettingsPages.jsx"),
      path.startsWith("/configuracao/dados")
        ? import("../features/settings/SettingsDataPage.jsx")
        : Promise.resolve(),
    ]),
  },
  {
    match: (path) => path.startsWith("/venda"),
    load: () => import("../features/sales/SalesPageView.jsx"),
  },
];

function normalizePath(path) {
  return String(path || "").trim();
}

export function prefetchRoute(path) {
  const normalizedPath = normalizePath(path);
  if (!normalizedPath) return;

  const prefetcher = routePrefetchers.find((item) => item.match(normalizedPath));
  if (!prefetcher) return;
  if (prefetchedKeys.has(normalizedPath)) return;

  prefetchedKeys.add(normalizedPath);
  Promise.resolve(prefetcher.load(normalizedPath)).catch(() => {
    prefetchedKeys.delete(normalizedPath);
  });
}

export function prefetchRoutes(paths = []) {
  for (const path of paths) {
    prefetchRoute(path);
  }
}

export function scheduleLikelyRoutePrefetch(paths = []) {
  if (typeof window === "undefined") return;
  const uniquePaths = [...new Set((Array.isArray(paths) ? paths : []).filter(Boolean))];
  if (!uniquePaths.length) return;

  let nextIndex = 0;
  const maxPrefetches = shouldLimitBackgroundPrefetch() ? 1 : uniquePaths.length;
  const scheduleNext = () => {
    if (nextIndex >= maxPrefetches) return;
    const runOne = () => {
      if (document.visibilityState === "hidden") {
        window.setTimeout(scheduleNext, 1500);
        return;
      }
      prefetchRoute(uniquePaths[nextIndex]);
      nextIndex += 1;
      scheduleNext();
    };
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(runOne, { timeout: 1800 + nextIndex * 350 });
      return;
    }
    window.setTimeout(runOne, 300 + nextIndex * 180);
  };
  scheduleNext();
}
